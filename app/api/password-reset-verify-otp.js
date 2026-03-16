import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  normalizeEmail,
  isValidEmail,
  getSecurityByGeneratedEmail,
  verifyOtpChallenge,
  createPasswordResetSession,
  getClientIp,
  logSecurityEvent,
  setHttpOnlyCookie,
  isIpRateLimited,
} from './_security.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);
  if (!ensureOriginAllowed(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const generatedEmail = normalizeEmail(req.body?.email);
    const otpCode = String(req.body?.otpCode || '').trim();
    const ipAddress = getClientIp(req);

    const ipLimited = await isIpRateLimited({
      ipAddress,
      eventType: 'password_reset_verify_received',
      windowMinutes: 15,
      maxEvents: 40,
    });
    if (ipLimited) {
      return res.status(429).json({ error: 'Too many attempts. Please try later.' });
    }

    await logSecurityEvent({
      eventType: 'password_reset_verify_received',
      authUserId: null,
      actorEmail: generatedEmail || null,
      targetEmail: null,
      purpose: 'password_reset',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    if (!generatedEmail || !isValidEmail(generatedEmail) || !/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({ error: 'Invalid email or OTP.' });
    }

    const security = await getSecurityByGeneratedEmail(generatedEmail);
    if (!security || !security.recovery_email || !security.recovery_email_verified) {
      return res.status(400).json({ error: 'Invalid email or OTP.' });
    }

    const verification = await verifyOtpChallenge({
      authUserId: security.auth_user_id,
      purpose: 'password_reset',
      otpCode,
      targetEmail: security.recovery_email,
    });

    if (!verification.ok) {
      await logSecurityEvent({
        eventType: 'password_reset_otp_invalid',
        authUserId: security.auth_user_id,
        actorEmail: generatedEmail,
        targetEmail: security.recovery_email,
        purpose: 'password_reset',
        ipAddress,
        metadata: { reason: verification.reason },
      });
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const session = await createPasswordResetSession(security.auth_user_id);
    setHttpOnlyCookie(res, 'password_reset_session', session.token, 15 * 60);

    await logSecurityEvent({
      eventType: 'password_reset_otp_verified',
      authUserId: security.auth_user_id,
      actorEmail: generatedEmail,
      targetEmail: security.recovery_email,
      purpose: 'password_reset',
      ipAddress,
      metadata: { expiresAt: session.expiresAt },
    });

    return res.status(200).json({
      success: true,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
