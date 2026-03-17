import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  normalizeEmail,
  isValidEmail,
  getSecurityByGeneratedEmail,
  enforceOtpRateLimit,
  enforceOtpDailyLimit,
  createOtpChallenge,
  invalidateChallenge,
  sendOtpEmail,
  sleep,
  getClientIp,
  logSecurityEvent,
  isIpRateLimited,
} from './_security.js';

const GENERIC_RESPONSE = {
  success: true,
  message: 'If this account is eligible, an OTP has been sent to the registered recovery email.',
};

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);
  if (!ensureOriginAllowed(req, res, { requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startedAt = Date.now();
  const respondGeneric = async () => {
    const minWindowMs = 900 + Math.floor(Math.random() * 120);
    const elapsed = Date.now() - startedAt;
    if (elapsed < minWindowMs) {
      await sleep(minWindowMs - elapsed);
    }
    return res.status(200).json(GENERIC_RESPONSE);
  };

  const generatedEmail = normalizeEmail(req.body?.email);
  const ipAddress = getClientIp(req);

  try {
    const ipLimited = await isIpRateLimited({
      ipAddress,
      eventType: 'password_reset_request_received',
      windowMinutes: 15,
      maxEvents: 20,
    });
    if (ipLimited) {
      await logSecurityEvent({
        eventType: 'password_reset_request_ip_limited',
        authUserId: null,
        actorEmail: generatedEmail || null,
        targetEmail: null,
        purpose: 'password_reset',
        ipAddress,
        metadata: { userAgent: req.headers['user-agent'] || null },
      });
      return respondGeneric();
    }

    await logSecurityEvent({
      eventType: 'password_reset_request_received',
      authUserId: null,
      actorEmail: generatedEmail || null,
      targetEmail: null,
      purpose: 'password_reset',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    if (!generatedEmail || !isValidEmail(generatedEmail)) {
      return respondGeneric();
    }

    const security = await getSecurityByGeneratedEmail(generatedEmail);
    if (!security || !security.recovery_email || !security.recovery_email_verified) {
      return respondGeneric();
    }

    await enforceOtpRateLimit({
      authUserId: security.auth_user_id,
      purpose: 'password_reset',
    });
    await enforceOtpDailyLimit({
      authUserId: security.auth_user_id,
      purpose: 'password_reset',
    });

    const { challenge, code } = await createOtpChallenge({
      authUserId: security.auth_user_id,
      targetEmail: security.recovery_email,
      purpose: 'password_reset',
    });

    try {
      await sendOtpEmail({
        to: security.recovery_email,
        otp: code,
        purpose: 'password_reset',
      });
    } catch (sendError) {
      await invalidateChallenge(challenge.id);
      await logSecurityEvent({
        eventType: 'password_reset_otp_send_failed',
        authUserId: security.auth_user_id,
        actorEmail: generatedEmail,
        targetEmail: security.recovery_email,
        purpose: 'password_reset',
        ipAddress,
        metadata: { reason: sendError?.message || 'email_send_failed' },
      });
      return respondGeneric();
    }

    await logSecurityEvent({
      eventType: 'password_reset_otp_requested',
      authUserId: security.auth_user_id,
      actorEmail: generatedEmail,
      targetEmail: security.recovery_email,
      purpose: 'password_reset',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    return respondGeneric();
  } catch {
    return respondGeneric();
  }
}
