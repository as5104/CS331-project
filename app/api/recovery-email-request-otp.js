import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  getAuthUserFromRequest,
  normalizeEmail,
  isValidEmail,
  ensureAccountSecurityRecord,
  enforceOtpRateLimit,
  createOtpChallenge,
  invalidateChallenge,
  sendOtpEmail,
  getClientIp,
  logSecurityEvent,
  verifyUserPassword,
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
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });
    const ipAddress = getClientIp(req);

    const ipLimited = await isIpRateLimited({
      ipAddress,
      eventType: 'recovery_email_request_received',
      windowMinutes: 15,
      maxEvents: 20,
    });
    if (ipLimited) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    await logSecurityEvent({
      eventType: 'recovery_email_request_received',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: null,
      purpose: 'verify_recovery_email',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    const recoveryEmail = normalizeEmail(req.body?.recoveryEmail);
    const currentPassword = String(req.body?.currentPassword || '');
    if (!recoveryEmail || !isValidEmail(recoveryEmail)) {
      return res.status(400).json({ error: 'Enter a valid recovery email address.' });
    }
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    const universityEmail = normalizeEmail(authUser.email || '');
    if (recoveryEmail === universityEmail) {
      return res.status(400).json({ error: 'Recovery email must be different from your university email.' });
    }

    const validPassword = await verifyUserPassword(universityEmail, currentPassword);
    if (!validPassword) {
      await logSecurityEvent({
        eventType: 'recovery_email_current_password_invalid',
        authUserId: authUser.id,
        actorEmail: authUser.email,
        targetEmail: recoveryEmail || null,
        purpose: 'verify_recovery_email',
        ipAddress,
        metadata: { userAgent: req.headers['user-agent'] || null },
      });
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    await ensureAccountSecurityRecord({
      authUserId: authUser.id,
      fallbackEmail: authUser.email,
      fallbackRole: authUser.user_metadata?.role || null,
    });

    await enforceOtpRateLimit({
      authUserId: authUser.id,
      purpose: 'verify_recovery_email',
    });

    const { challenge, code } = await createOtpChallenge({
      authUserId: authUser.id,
      targetEmail: recoveryEmail,
      purpose: 'verify_recovery_email',
    });

    try {
      await sendOtpEmail({
        to: recoveryEmail,
        otp: code,
        purpose: 'verify_recovery_email',
      });
    } catch (sendError) {
      await invalidateChallenge(challenge.id);
      throw sendError;
    }

    await logSecurityEvent({
      eventType: 'recovery_email_otp_requested',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: recoveryEmail,
      purpose: 'verify_recovery_email',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    return res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your recovery email.',
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({ error: error?.message || 'Internal server error' });
  }
}
