import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  getAuthUserFromRequest,
  ensureAccountSecurityRecord,
  enforceOtpRateLimit,
  enforceOtpDailyLimit,
  createOtpChallenge,
  invalidateChallenge,
  sendOtpEmail,
  getClientIp,
  logSecurityEvent,
  verifyUserPassword,
  isIpRateLimited,
  normalizeEmail,
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
      eventType: 'password_change_request_received',
      windowMinutes: 15,
      maxEvents: 20,
    });
    if (ipLimited) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    await logSecurityEvent({
      eventType: 'password_change_request_received',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: null,
      purpose: 'password_change',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    const currentPassword = String(req.body?.currentPassword || '');
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    const security = await ensureAccountSecurityRecord({
      authUserId: authUser.id,
      fallbackEmail: authUser.email,
      fallbackRole: authUser.user_metadata?.role || null,
    });

    if (!security?.recovery_email || !security?.recovery_email_verified) {
      return res.status(400).json({ error: 'Verify your recovery email before changing password.' });
    }

    const universityEmail = normalizeEmail(authUser.email || security.user_email || '');
    const validPassword = await verifyUserPassword(universityEmail, currentPassword);
    if (!validPassword) {
      await logSecurityEvent({
        eventType: 'password_change_current_password_invalid',
        authUserId: authUser.id,
        actorEmail: authUser.email,
        targetEmail: security.recovery_email,
        purpose: 'password_change',
        ipAddress,
        metadata: { userAgent: req.headers['user-agent'] || null },
      });
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    await enforceOtpRateLimit({
      authUserId: authUser.id,
      purpose: 'password_change',
    });
    await enforceOtpDailyLimit({
      authUserId: authUser.id,
      purpose: 'password_change',
    });

    const { challenge, code } = await createOtpChallenge({
      authUserId: authUser.id,
      targetEmail: security.recovery_email,
      purpose: 'password_change',
    });

    try {
      await sendOtpEmail({
        to: security.recovery_email,
        otp: code,
        purpose: 'password_change',
      });
    } catch (sendError) {
      await invalidateChallenge(challenge.id);
      throw sendError;
    }

    await logSecurityEvent({
      eventType: 'password_change_otp_requested',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: security.recovery_email,
      purpose: 'password_change',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your verified recovery email.',
    });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({ error: error?.message || 'Internal server error' });
  }
}
