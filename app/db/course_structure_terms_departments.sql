-- Course Structure Upgrade:
-- Introduces admin-managed departments + academic terms (semester labels),
-- while keeping legacy courses.department + courses.semester populated for compatibility.

create table if not exists public.departments (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    code text unique,
    created_at timestamptz not null default now()
);

create table if not exists public.academic_terms (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    sequence integer,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

-- Allow same term name for different actual semester numbers
-- (e.g., Winter Semester + 1, Winter Semester + 3).
do $$
begin
    if exists (
        select 1
        from information_schema.table_constraints
        where table_schema = 'public'
          and table_name = 'academic_terms'
          and constraint_name = 'academic_terms_name_key'
    ) then
        alter table public.academic_terms drop constraint academic_terms_name_key;
    end if;
end $$;

create unique index if not exists idx_academic_terms_name_sequence_unique
on public.academic_terms ((lower(trim(name))), sequence);

alter table public.courses
    add column if not exists department_id uuid references public.departments(id) on delete set null,
    add column if not exists term_id uuid references public.academic_terms(id) on delete set null;

create index if not exists idx_courses_department_id on public.courses(department_id);
create index if not exists idx_courses_term_id on public.courses(term_id);

-- Backfill departments from existing course rows.
insert into public.departments (name)
select distinct trim(c.department)
from public.courses c
where c.department is not null
  and trim(c.department) <> ''
on conflict (name) do nothing;

update public.courses c
set department_id = d.id
from public.departments d
where c.department_id is null
  and c.department is not null
  and lower(trim(c.department)) = lower(trim(d.name));

-- Backfill terms from existing numeric semester values.
insert into public.academic_terms (name, sequence)
select distinct
    'Semester ' || c.semester::text as name,
    c.semester as sequence
from public.courses c
where c.semester is not null
on conflict do nothing;

update public.courses c
set term_id = t.id
from public.academic_terms t
where c.term_id is null
  and c.semester is not null
  and t.sequence = c.semester;

-- Seed defaults if no terms exist yet.
insert into public.academic_terms (name, sequence, is_active)
select x.name, x.sequence, true
from (
    values
        ('Winter Semester', 1),
        ('Monsoon Semester', 2)
) as x(name, sequence)
where not exists (select 1 from public.academic_terms)
on conflict do nothing;

alter table public.departments enable row level security;
alter table public.academic_terms enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'departments'
          and policyname = 'departments_select_authenticated'
    ) then
        create policy departments_select_authenticated
        on public.departments for select
        using (auth.uid() is not null);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'academic_terms'
          and policyname = 'academic_terms_select_authenticated'
    ) then
        create policy academic_terms_select_authenticated
        on public.academic_terms for select
        using (auth.uid() is not null);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'departments'
          and policyname = 'departments_admin_all'
    ) then
        create policy departments_admin_all
        on public.departments for all
        using (
            exists (select 1 from public.admins a where a.auth_user_id = auth.uid())
        )
        with check (
            exists (select 1 from public.admins a where a.auth_user_id = auth.uid())
        );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'academic_terms'
          and policyname = 'academic_terms_admin_all'
    ) then
        create policy academic_terms_admin_all
        on public.academic_terms for all
        using (
            exists (select 1 from public.admins a where a.auth_user_id = auth.uid())
        )
        with check (
            exists (select 1 from public.admins a where a.auth_user_id = auth.uid())
        );
    end if;
end $$;
