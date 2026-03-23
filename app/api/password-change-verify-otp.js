import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  getAuthUserFromRequest,
  ensureAccountSecurityRecord,
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
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

    const otpCode = String(req.body?.otpCode || '').trim();
    if (!/^\d{6}$/.test(otpCode)) {
      return res.status(400).json({ error: 'OTP must be 6 digits.' });
    }

    const ipAddress = getClientIp(req);
    const ipLimited = await isIpRateLimited({
      ipAddress,
      eventType: 'password_change_verify_received',
      windowMinutes: 15,
      maxEvents: 40,
    });
    if (ipLimited) {
      return res.status(429).json({ error: 'Too many attempts. Please try later.' });
    }

    const security = await ensureAccountSecurityRecord({
      authUserId: authUser.id,
      fallbackEmail: authUser.email,
      fallbackRole: authUser.user_metadata?.role || null,
    });
    if (!security?.recovery_email || !security?.recovery_email_verified) {
      return res.status(400).json({ error: 'Recovery email is not verified.' });
    }

    await logSecurityEvent({
      eventType: 'password_change_verify_received',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: security.recovery_email,
      purpose: 'password_change',
      ipAddress,
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    const verification = await verifyOtpChallenge({
      authUserId: authUser.id,
      purpose: 'password_change',
      otpCode,
      targetEmail: security.recovery_email,
    });

    if (!verification.ok) {
      await logSecurityEvent({
        eventType: 'password_change_otp_invalid',
        authUserId: authUser.id,
        actorEmail: authUser.email,
        targetEmail: security.recovery_email,
        purpose: 'password_change',
        ipAddress,
        metadata: { reason: verification.reason },
      });
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const session = await createPasswordResetSession({
      authUserId: authUser.id,
      purpose: 'password_change',
    });
    setHttpOnlyCookie(
      res,
      'password_change_session',
      session.token,
      15 * 60,
      '/api/password-change-complete',
    );

    await logSecurityEvent({
      eventType: 'password_change_otp_verified',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: security.recovery_email,
      purpose: 'password_change',
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
