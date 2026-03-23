import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  consumePasswordResetSession,
  createSupabaseAdmin,
  isStrongPassword,
  consumeAllPasswordResetOtps,
  revokeAllUserSessions,
  getClientIp,
  logSecurityEvent,
  getCookieValue,
  clearHttpOnlyCookie,
} from './_security.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);
  if (!ensureOriginAllowed(req, res, { requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const resetTokenFromCookie = getCookieValue(req, 'password_reset_session');
    const resetToken = resetTokenFromCookie;
    const newPassword = String(req.body?.newPassword || '');

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid reset session.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.',
      });
    }

    const session = await consumePasswordResetSession(resetToken, 'password_reset');
    if (!session?.auth_user_id) {
      clearHttpOnlyCookie(res, 'password_reset_session');
      return res.status(400).json({ error: 'Invalid or expired reset session.' });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(session.auth_user_id, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(500).json({ error: updateError.message || 'Failed to reset password.' });
    }

    const revokeResult = await revokeAllUserSessions({
      authUserId: session.auth_user_id,
      passwordForSignout: newPassword,
    });

    clearHttpOnlyCookie(res, 'password_reset_session');
    await consumeAllPasswordResetOtps(session.auth_user_id);
    await logSecurityEvent({
      eventType: 'password_reset_completed',
      authUserId: session.auth_user_id,
      actorEmail: null,
      targetEmail: null,
      purpose: 'password_reset',
      ipAddress: getClientIp(req),
      metadata: {
        userAgent: req.headers['user-agent'] || null,
        sessionsRevoked: revokeResult.revoked,
        revokeReason: revokeResult.reason || null,
      },
    });

    if (!revokeResult.revoked) {
      return res.status(200).json({
        success: true,
        sessionRevoked: false,
        message: 'Password updated, but active session revocation could not be confirmed. Please sign in again and contact support if needed.',
      });
    }

    return res.status(200).json({
      success: true,
      sessionRevoked: true,
      message: 'Password updated successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
