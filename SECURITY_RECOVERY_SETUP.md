# Recovery Email + OTP Password Reset Setup

## 1) Run DB schema
Run this SQL file in Supabase SQL Editor:

- `app/db/security_recovery.sql`

## 2) Configure environment variables
Set these in local `.env.local` and in deployment secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (recommended for server-side password re-auth checks)
- `RECOVERY_OTP_SECRET` (random long secret, at least 32 chars)
- `BREVO_API_KEY` (for sending OTP emails)
- `SECURITY_FROM_EMAIL` (verified sender, e.g. `security@yourdomain.com`)
- `SECURITY_FROM_NAME` (optional display name, defaults to `UniAdmin Security`)
- `ALLOWED_ORIGINS` (comma-separated, e.g. `https://your-app.com,http://localhost:5173`)

## 3) Local run
Start API + frontend:

- `npm run dev:all`

or separate:

- `npm run dev:api`
- `npm run dev`

## 4) New API endpoints

- `GET /api/recovery-email-status` (auth required)
- `POST /api/recovery-email-request-otp` (auth required)
- `POST /api/recovery-email-verify-otp` (auth required)
- `POST /api/password-reset-request-otp`
- `POST /api/password-reset-verify-otp`
- `POST /api/password-reset-complete`

## 5) Security notes

- OTP is never stored in plaintext; only HMAC hash is stored.
- OTP expiry is 10 minutes with max attempt limits.
- Recovery email add/change requires current-password verification.
- Password reset session token is short-lived and one-time use.
- Reset session is stored in a secure HttpOnly cookie (not exposed to frontend JS).
- Password reset request endpoint uses a generic response to reduce account enumeration risk.