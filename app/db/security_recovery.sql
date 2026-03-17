create extension if not exists pgcrypto;

create table if not exists public.account_security (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  user_email text unique,
  role text check (role in ('student', 'faculty', 'admin')),
  recovery_email text,
  recovery_email_verified boolean not null default false,
  recovery_email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_account_security_user_email
  on public.account_security (user_email);

create table if not exists public.security_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  target_email text not null,
  purpose text not null check (purpose in ('verify_recovery_email', 'password_reset', 'password_change')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 6,
  last_attempt_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_otp_auth_purpose_created
  on public.security_otp_challenges (auth_user_id, purpose, created_at desc);

create index if not exists idx_security_otp_target_email
  on public.security_otp_challenges (target_email);

do $$
begin
  alter table public.security_otp_challenges
    drop constraint if exists security_otp_challenges_purpose_check;

  alter table public.security_otp_challenges
    add constraint security_otp_challenges_purpose_check
    check (purpose in ('verify_recovery_email', 'password_reset', 'password_change'));
exception
  when duplicate_object then
    null;
end $$;

create table if not exists public.security_password_reset_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null default 'password_reset' check (purpose in ('password_reset', 'password_change')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_auth_created
  on public.security_password_reset_sessions (auth_user_id, created_at desc);

alter table public.security_password_reset_sessions
  add column if not exists purpose text;

update public.security_password_reset_sessions
set purpose = 'password_reset'
where purpose is null;

alter table public.security_password_reset_sessions
  alter column purpose set default 'password_reset';

alter table public.security_password_reset_sessions
  alter column purpose set not null;

do $$
begin
  alter table public.security_password_reset_sessions
    drop constraint if exists security_password_reset_sessions_purpose_check;

  alter table public.security_password_reset_sessions
    add constraint security_password_reset_sessions_purpose_check
    check (purpose in ('password_reset', 'password_change'));
exception
  when duplicate_object then
    null;
end $$;

create index if not exists idx_password_reset_auth_purpose_created
  on public.security_password_reset_sessions (auth_user_id, purpose, created_at desc);

create table if not exists public.security_audit_log (
  id bigserial primary key,
  event_type text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  target_email text,
  purpose text,
  ip_address text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_audit_created
  on public.security_audit_log (created_at desc);

create index if not exists idx_security_audit_ip_event_created
  on public.security_audit_log (ip_address, event_type, created_at desc);

alter table public.account_security enable row level security;
alter table public.security_otp_challenges enable row level security;
alter table public.security_password_reset_sessions enable row level security;
alter table public.security_audit_log enable row level security;