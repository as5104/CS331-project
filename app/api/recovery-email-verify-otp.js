import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  getAuthUserFromRequest,
  verifyOtpChallenge,
  markRecoveryEmailVerified,
  maskEmail,
  getClientIp,
  logSecurityEvent,
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

    const verification = await verifyOtpChallenge({
      authUserId: authUser.id,
      purpose: 'verify_recovery_email',
      otpCode,
    });

    if (!verification.ok || !verification.challenge?.target_email) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const updated = await markRecoveryEmailVerified(authUser.id, verification.challenge.target_email);

    await logSecurityEvent({
      eventType: 'recovery_email_verified',
      authUserId: authUser.id,
      actorEmail: authUser.email,
      targetEmail: updated.recovery_email,
      purpose: 'verify_recovery_email',
      ipAddress: getClientIp(req),
      metadata: { userAgent: req.headers['user-agent'] || null },
    });

    return res.status(200).json({
      success: true,
      recoveryEmail: updated.recovery_email,
      recoveryEmailMasked: maskEmail(updated.recovery_email),
      recoveryEmailVerified: !!updated.recovery_email_verified,
      recoveryEmailVerifiedAt: updated.recovery_email_verified_at,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
