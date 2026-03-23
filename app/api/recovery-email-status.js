import {
  handleOptions,
  setCorsHeaders,
  ensureOriginAllowed,
  getAuthUserFromRequest,
  ensureAccountSecurityRecord,
} from './_security.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);
  if (!ensureOriginAllowed(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

    const security = await ensureAccountSecurityRecord({
      authUserId: authUser.id,
      fallbackEmail: authUser.email,
      fallbackRole: authUser.user_metadata?.role || null,
    });

    return res.status(200).json({
      recoveryEmail: security.recovery_email || null,
      recoveryEmailVerified: !!security.recovery_email_verified,
      recoveryEmailVerifiedAt: security.recovery_email_verified_at || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
