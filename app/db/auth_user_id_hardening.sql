-- Auth User ID hardening
-- Run after backfill when remaining nulls are 0.

alter table public.students alter column auth_user_id set not null;
alter table public.faculty alter column auth_user_id set not null;
alter table public.admins alter column auth_user_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_auth_user_id_unique'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_auth_user_id_unique unique (auth_user_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'faculty_auth_user_id_unique'
      and conrelid = 'public.faculty'::regclass
  ) then
    alter table public.faculty
      add constraint faculty_auth_user_id_unique unique (auth_user_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'admins_auth_user_id_unique'
      and conrelid = 'public.admins'::regclass
  ) then
    alter table public.admins
      add constraint admins_auth_user_id_unique unique (auth_user_id);
  end if;
end $$;
