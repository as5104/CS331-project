import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const OTP_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MINUTES = 15;
const OTP_MAX_ATTEMPTS = 6;
const OTP_COOLDOWN_SECONDS = 45;
const OTP_MAX_REQUESTS_PER_HOUR = 8;
const OTP_MAX_REQUESTS_PER_DAY = 24;

let cachedAdmin = null;
let cachedAuthClient = null;
const fallbackIpBuckets = new Map();

function nowIso() {
  return new Date().toISOString();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const parsed = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return new Set(parsed);
}

function resolveCorsOrigin(req) {
  const requestOrigin = req.headers.origin || '';
  if (!requestOrigin) return null;

  const allowed = getAllowedOrigins();
  if (allowed.size === 0) {
    // Safe local defaults for dev if ALLOWED_ORIGINS is not configured.
    if (requestOrigin === 'http://localhost:5173' || requestOrigin === 'http://127.0.0.1:5173') {
      return requestOrigin;
    }
    return null;
  }
  return allowed.has(requestOrigin) ? requestOrigin : null;
}

export function setCorsHeaders(req, res) {
  const corsOrigin = resolveCorsOrigin(req);
  if (corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function handleOptions(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    if (req.headers.origin && !resolveCorsOrigin(req)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return true;
    }
    res.status(200).end();
    return true;
  }
  return false;
}

export function ensureOriginAllowed(req, res, options = {}) {
  const requireOrigin = options.requireOrigin === true;
  const origin = req.headers.origin || '';

  if (!origin) {
    if (!requireOrigin) return true;
    res.status(403).json({ error: 'Origin header is required' });
    return false;
  }

  if (resolveCorsOrigin(req)) return true;
  res.status(403).json({ error: 'Origin not allowed' });
  return false;
}

export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordChecks(password) {
  const value = typeof password === 'string' ? password : '';
  return {
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_[\]\\/~`+=;']/.test(value),
    hasMinLength: value.length >= 8,
  };
}

export function isStrongPassword(password) {
  const checks = passwordChecks(password);
  return Object.values(checks).every(Boolean);
}

export function createSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  cachedAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}

function createAuthClient() {
  if (cachedAuthClient) return cachedAuthClient;
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = anonKey || serviceKey;
  if (!url || !key) throw new Error('Missing Supabase URL/key for password verification.');
  cachedAuthClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAuthClient;
}

export async function getAuthUserFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const accessToken = authHeader.slice('Bearer '.length).trim();
  if (!accessToken) return null;

  const supabaseAdmin = createSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}

function getHashSecret() {
  const secret = process.env.RECOVERY_OTP_SECRET;
  if (!secret) {
    throw new Error('Missing RECOVERY_OTP_SECRET');
  }
  return secret;
}

function hmacSha256(value) {
  return crypto.createHmac('sha256', getHashSecret()).update(value).digest('hex');
}

function safeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function logSecurityEvent(event) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    await supabaseAdmin.from('security_audit_log').insert([{
      event_type: event.eventType,
      auth_user_id: event.authUserId ?? null,
      actor_email: event.actorEmail ?? null,
      target_email: event.targetEmail ?? null,
      purpose: event.purpose ?? null,
      ip_address: event.ipAddress ?? null,
      metadata: event.metadata ?? {},
      created_at: nowIso(),
    }]);
  } catch {
    // Non-blocking: audit logs should never break auth flows.
  }
}

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return (
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    null
  );
}

export async function verifyUserPassword(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const suppliedPassword = String(password || '');
  if (!normalizedEmail || !suppliedPassword) return false;

  try {
    const authClient = createAuthClient();
    const { error } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: suppliedPassword,
    });
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

async function findRoleEmailByAuthUserId(authUserId) {
  const supabaseAdmin = createSupabaseAdmin();
  const tableChecks = [
    { table: 'students', role: 'student' },
    { table: 'faculty', role: 'faculty' },
    { table: 'admins', role: 'admin' },
  ];

  for (const item of tableChecks) {
    const { data } = await supabaseAdmin
      .from(item.table)
      .select('email')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (data?.email) {
      return { email: normalizeEmail(data.email), role: item.role };
    }
  }

  return null;
}

export async function ensureAccountSecurityRecord({ authUserId, fallbackEmail, fallbackRole }) {
  const supabaseAdmin = createSupabaseAdmin();
  const { data: existing } = await supabaseAdmin
    .from('account_security')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existing) return existing;

  const resolved = await findRoleEmailByAuthUserId(authUserId);
  const userEmail = resolved?.email || normalizeEmail(fallbackEmail || '');
  const role = resolved?.role || fallbackRole || null;

  const insertPayload = {
    auth_user_id: authUserId,
    user_email: userEmail || null,
    role,
    recovery_email: null,
    recovery_email_verified: false,
    recovery_email_verified_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const { data, error } = await supabaseAdmin
    .from('account_security')
    .upsert(insertPayload, { onConflict: 'auth_user_id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSecurityByGeneratedEmail(generatedEmail) {
  const supabaseAdmin = createSupabaseAdmin();
  const normalized = normalizeEmail(generatedEmail);
  if (!normalized) return null;

  const { data: existing } = await supabaseAdmin
    .from('account_security')
    .select('*')
    .eq('user_email', normalized)
    .maybeSingle();

  if (existing) return existing;

  const tableChecks = [
    { table: 'students', role: 'student' },
    { table: 'faculty', role: 'faculty' },
    { table: 'admins', role: 'admin' },
  ];

  for (const item of tableChecks) {
    const { data } = await supabaseAdmin
      .from(item.table)
      .select('auth_user_id, email')
      .eq('email', normalized)
      .maybeSingle();
    if (data?.auth_user_id) {
      return ensureAccountSecurityRecord({
        authUserId: data.auth_user_id,
        fallbackEmail: data.email,
        fallbackRole: item.role,
      });
    }
  }

  return null;
}

export async function enforceOtpRateLimit({ authUserId, purpose }) {
  const supabaseAdmin = createSupabaseAdmin();
  const now = Date.now();
  const cooldownCutoff = new Date(now - OTP_COOLDOWN_SECONDS * 1000).toISOString();
  const hourCutoff = new Date(now - 60 * 60 * 1000).toISOString();

  const { data: latest } = await supabaseAdmin
    .from('security_otp_challenges')
    .select('created_at')
    .eq('auth_user_id', authUserId)
    .eq('purpose', purpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.created_at && latest.created_at >= cooldownCutoff) {
    const err = new Error(`Please wait ${OTP_COOLDOWN_SECONDS} seconds before requesting another OTP.`);
    err.statusCode = 429;
    throw err;
  }

  const { count } = await supabaseAdmin
    .from('security_otp_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('auth_user_id', authUserId)
    .eq('purpose', purpose)
    .gte('created_at', hourCutoff);

  if ((count || 0) >= OTP_MAX_REQUESTS_PER_HOUR) {
    const err = new Error('Too many OTP requests. Please try again later.');
    err.statusCode = 429;
    throw err;
  }
}

export async function enforceOtpDailyLimit({ authUserId, purpose, maxPerDay = OTP_MAX_REQUESTS_PER_DAY }) {
  const supabaseAdmin = createSupabaseAdmin();
  const dayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from('security_otp_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('auth_user_id', authUserId)
    .eq('purpose', purpose)
    .gte('created_at', dayCutoff);

  if ((count || 0) >= maxPerDay) {
    const err = new Error('Daily OTP limit reached. Please try again later.');
    err.statusCode = 429;
    throw err;
  }
}

export async function createOtpChallenge({ authUserId, targetEmail, purpose }) {
  const supabaseAdmin = createSupabaseAdmin();
  const code = generateOtpCode();
  const codeHash = hmacSha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('security_otp_challenges')
    .insert([{
      auth_user_id: authUserId,
      target_email: normalizeEmail(targetEmail),
      purpose,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: OTP_MAX_ATTEMPTS,
      consumed_at: null,
      created_at: nowIso(),
    }])
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return { challenge: data, code };
}

export async function invalidateChallenge(challengeId) {
  const supabaseAdmin = createSupabaseAdmin();
  await supabaseAdmin
    .from('security_otp_challenges')
    .update({ consumed_at: nowIso() })
    .eq('id', challengeId)
    .is('consumed_at', null);
}

export async function verifyOtpChallenge({ authUserId, purpose, otpCode, targetEmail = null }) {
  const supabaseAdmin = createSupabaseAdmin();
  const query = supabaseAdmin
    .from('security_otp_challenges')
    .select('*')
    .eq('auth_user_id', authUserId)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (targetEmail) query.eq('target_email', normalizeEmail(targetEmail));

  const { data: challenge } = await query.maybeSingle();
  if (!challenge) return { ok: false, reason: 'not_found' };

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await invalidateChallenge(challenge.id);
    return { ok: false, reason: 'expired' };
  }

  if (challenge.attempts >= challenge.max_attempts) {
    await invalidateChallenge(challenge.id);
    return { ok: false, reason: 'max_attempts' };
  }

  const submittedHash = hmacSha256(String(otpCode));
  const isMatch = safeEqualHex(submittedHash, challenge.code_hash);
  if (!isMatch) {
    const nextAttempts = (challenge.attempts || 0) + 1;
    const payload = {
      attempts: nextAttempts,
      last_attempt_at: nowIso(),
      consumed_at: nextAttempts >= challenge.max_attempts ? nowIso() : null,
    };
    await supabaseAdmin.from('security_otp_challenges').update(payload).eq('id', challenge.id);
    return { ok: false, reason: 'invalid' };
  }

  await supabaseAdmin
    .from('security_otp_challenges')
    .update({
      consumed_at: nowIso(),
      last_attempt_at: nowIso(),
    })
    .eq('id', challenge.id);

  return { ok: true, challenge };
}

export async function createPasswordResetSession({ authUserId, purpose = 'password_reset' }) {
  if (!['password_reset', 'password_change'].includes(purpose)) {
    throw new Error('Invalid reset session purpose');
  }

  const supabaseAdmin = createSupabaseAdmin();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hmacSha256(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  await supabaseAdmin
    .from('security_password_reset_sessions')
    .update({ consumed_at: nowIso() })
    .eq('auth_user_id', authUserId)
    .eq('purpose', purpose)
    .is('consumed_at', null);

  const { error } = await supabaseAdmin
    .from('security_password_reset_sessions')
    .insert([{
      auth_user_id: authUserId,
      purpose,
      token_hash: tokenHash,
      expires_at: expiresAt,
      consumed_at: null,
      created_at: nowIso(),
    }]);

  if (error) throw new Error(error.message);
  return { token, expiresAt, purpose };
}

export async function consumePasswordResetSession(resetToken, expectedPurpose = 'password_reset') {
  if (!['password_reset', 'password_change'].includes(expectedPurpose)) {
    throw new Error('Invalid expected reset session purpose');
  }

  const supabaseAdmin = createSupabaseAdmin();
  const tokenHash = hmacSha256(resetToken);
  const { data: session } = await supabaseAdmin
    .from('security_password_reset_sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('purpose', expectedPurpose)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('security_password_reset_sessions').update({ consumed_at: nowIso() }).eq('id', session.id);
    return null;
  }

  await supabaseAdmin
    .from('security_password_reset_sessions')
    .update({ consumed_at: nowIso() })
    .eq('id', session.id);

  return session;
}

export async function revokeAllUserSessions({ authUserId, accessToken = null, email = null, passwordForSignout = null }) {
  if (!authUserId) return { revoked: false, reason: 'missing_user' };

  const supabaseAdmin = createSupabaseAdmin();
  let tokenToUse = typeof accessToken === 'string' ? accessToken.trim() : '';
  let resolvedEmail = normalizeEmail(email || '');

  if (!resolvedEmail && passwordForSignout) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(authUserId);
      if (!error && data?.user?.email) {
        resolvedEmail = normalizeEmail(data.user.email);
      }
    } catch {
      resolvedEmail = '';
    }
  }

  if (!tokenToUse && resolvedEmail && passwordForSignout) {
    try {
      const authClient = createAuthClient();
      const { data, error } = await authClient.auth.signInWithPassword({
        email: resolvedEmail,
        password: String(passwordForSignout),
      });
      if (!error && data?.session?.access_token) {
        tokenToUse = data.session.access_token;
      }
    } catch {
      tokenToUse = '';
    }
  }

  if (!tokenToUse) {
    return { revoked: false, reason: 'token_unavailable' };
  }

  const { error } = await supabaseAdmin.auth.admin.signOut(tokenToUse, 'global');
  if (error) {
    return { revoked: false, reason: error.message || 'signout_failed' };
  }
  return { revoked: true };
}

export async function markRecoveryEmailVerified(authUserId, recoveryEmail) {
  const supabaseAdmin = createSupabaseAdmin();
  const normalized = normalizeEmail(recoveryEmail);
  const { data, error } = await supabaseAdmin
    .from('account_security')
    .update({
      recovery_email: normalized,
      recovery_email_verified: true,
      recovery_email_verified_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq('auth_user_id', authUserId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function sendOtpEmail({ to, otp, purpose }) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.SECURITY_FROM_EMAIL;
  const fromName = process.env.SECURITY_FROM_NAME || 'UniAdmin Security';
  const normalizedTo = normalizeEmail(to);

  if (!apiKey || !from) {
    throw new Error('Email sender is not configured. Set BREVO_API_KEY and SECURITY_FROM_EMAIL.');
  }

  const purposeMeta = purpose === 'verify_recovery_email'
    ? {
      label: 'Verify your recovery email',
      subject: 'Recovery Email Verification',
    }
    : purpose === 'password_change'
      ? {
        label: 'Approve your UniAdmin password change',
        subject: 'Password Change',
      }
      : {
        label: 'Reset your UniAdmin password',
        subject: 'Password Reset',
      };

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
    <h2 style="margin-top:0;color:#111827;">${purposeMeta.label}</h2>
    <p style="color:#374151;line-height:1.5;">Use this one-time password (OTP) to continue:</p>
    <div style="font-size:32px;letter-spacing:8px;font-weight:700;margin:18px 0;color:#0f172a;">${otp}</div>
    <p style="color:#374151;line-height:1.5;">This OTP expires in ${OTP_TTL_MINUTES} minutes and can be used only once.</p>
    <p style="color:#6b7280;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
  </div>
  `;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: from,
        name: fromName,
      },
      to: [{ email: normalizedTo }],
      subject: `UniAdmin OTP: ${purposeMeta.subject}`,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send OTP email.');
  }
}

export async function consumeAllPasswordResetOtps(authUserId) {
  return consumeOtpChallengesByPurpose(authUserId, 'password_reset');
}

export async function consumeAllPasswordChangeOtps(authUserId) {
  return consumeOtpChallengesByPurpose(authUserId, 'password_change');
}

async function consumeOtpChallengesByPurpose(authUserId, purpose) {
  const supabaseAdmin = createSupabaseAdmin();
  await supabaseAdmin
    .from('security_otp_challenges')
    .update({ consumed_at: nowIso() })
    .eq('auth_user_id', authUserId)
    .eq('purpose', purpose)
    .is('consumed_at', null);
}

export function maskEmail(email) {
  const normalized = normalizeEmail(email);
  const [name = '', domain = ''] = normalized.split('@');
  if (!name || !domain) return normalized;
  if (name.length <= 2) return `${name[0] || '*'}*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.max(2, name.length - 2))}${name[name.length - 1]}@${domain}`;
}

export async function isIpRateLimited({ ipAddress, eventType, windowMinutes, maxEvents }) {
  if (!ipAddress) return false;
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('security_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('event_type', eventType)
      .gte('created_at', cutoff);
    return (count || 0) >= maxEvents;
  } catch {
    return fallbackIsIpRateLimited({ ipAddress, eventType, windowMinutes, maxEvents });
  }
}

function fallbackIsIpRateLimited({ ipAddress, eventType, windowMinutes, maxEvents }) {
  const key = `${eventType}:${ipAddress}`;
  const now = Date.now();
  const cutoff = now - windowMinutes * 60 * 1000;

  const existing = fallbackIpBuckets.get(key) || [];
  const filtered = existing.filter((timestamp) => timestamp >= cutoff);
  const limited = filtered.length >= maxEvents;
  filtered.push(now);
  fallbackIpBuckets.set(key, filtered);

  if (fallbackIpBuckets.size > 2000) {
    for (const [bucketKey, timestamps] of fallbackIpBuckets.entries()) {
      const recent = timestamps.filter((timestamp) => timestamp >= cutoff);
      if (recent.length === 0) fallbackIpBuckets.delete(bucketKey);
      else fallbackIpBuckets.set(bucketKey, recent);
    }
  }

  return limited;
}

export function getCookieValue(req, name) {
  const cookieHeader = req.headers.cookie || '';
  if (!cookieHeader) return null;
  const segments = cookieHeader.split(';').map((v) => v.trim());
  const found = segments.find((v) => v.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.slice(name.length + 1));
}

export function setHttpOnlyCookie(res, name, value, maxAgeSeconds, path = '/api/password-reset-complete') {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'SameSite=Strict',
    `Path=${path}`,
    `Max-Age=${Math.max(1, maxAgeSeconds)}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearHttpOnlyCookie(res, name, path = '/api/password-reset-complete') {
  const parts = [
    `${name}=`,
    'HttpOnly',
    'SameSite=Strict',
    `Path=${path}`,
    'Max-Age=0',
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
