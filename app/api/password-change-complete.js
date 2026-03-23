import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  getAuthUserFromRequest,
  consumePasswordResetSession,
  createSupabaseAdmin,
  isStrongPassword,
  consumeAllPasswordChangeOtps,
  revokeAllUserSessions,
  getClientIp,
  logSecurityEvent,
  getCookieValue,
  clearHttpOnlyCookie,
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

    const changeToken = getCookieValue(req, 'password_change_session');
    const authHeader = req.headers.authorization || '';
    const currentAccessToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : '';
    const newPassword = String(req.body?.newPassword || '');

    if (!changeToken) {
      return res.status(400).json({ error: 'Invalid password change session.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.',
      });
    }

    const session = await consumePasswordResetSession(changeToken, 'password_change');
    if (!session?.auth_user_id) {
      clearHttpOnlyCookie(res, 'password_change_session', '/api/password-change-complete');
      return res.status(400).json({ error: 'Invalid or expired password change session.' });
    }

    if (session.auth_user_id !== authUser.id) {
      clearHttpOnlyCookie(res, 'password_change_session', '/api/password-change-complete');
      return res.status(403).json({ error: 'Session mismatch. Please try again.' });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(session.auth_user_id, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(500).json({ error: updateError.message || 'Failed to change password.' });
    }

    const revokeResult = await revokeAllUserSessions({
      authUserId: session.auth_user_id,
      accessToken: currentAccessToken,
      email: authUser.email || null,
      passwordForSignout: newPassword,
    });

    clearHttpOnlyCookie(res, 'password_change_session', '/api/password-change-complete');
    await consumeAllPasswordChangeOtps(session.auth_user_id);
    await logSecurityEvent({
      eventType: 'password_change_completed',
      authUserId: session.auth_user_id,
      actorEmail: authUser.email || null,
      targetEmail: null,
      purpose: 'password_change',
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
      message: 'Password changed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
