-- Superseded by: rls_stabilize_students_and_enrollments.sql
-- Keep this file for history only. Do not run after stabilization.

alter table public.students enable row level security;
alter table public.course_enrollments enable row level security;

-- Helper to resolve current student's row ID without triggering RLS recursion.
create or replace function public.current_student_row_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.students s
  where s.auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_student_row_id() from public;
grant execute on function public.current_student_row_id() to authenticated;

-- Recreate enrollments student SELECT policy without querying students through RLS.
drop policy if exists enrollments_student_select on public.course_enrollments;
create policy enrollments_student_select on public.course_enrollments for select
using (student_id = public.current_student_row_id());

-- Remove all existing SELECT policies on students (including broken/legacy ones).
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'students'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.students', p.policyname);
  end loop;
end $$;

-- Students can read their own profile.
create policy students_self_select on public.students for select
using (auth_user_id = auth.uid());

-- Admins can read all students.
create policy students_admin_select on public.students for select
using (
  exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
  )
);

-- Faculty can read students visible under section-aware assignment rules.
create policy students_faculty_select on public.students for select
using (
  id in (
    select ce.student_id
    from public.course_enrollments ce
    join public.faculty f on f.auth_user_id = auth.uid()
    where
      ce.section_faculty_id = f.id
      or (
        ce.section_faculty_id is null
        and exists (
          select 1
          from public.courses c
          where c.id = ce.course_id
            and c.instructor_id = f.id
        )
      )
      or (
        ce.section_faculty_id is null
        and exists (
          select 1
          from public.course_faculty cf
          where cf.course_id = ce.course_id
            and cf.faculty_id = f.id
        )
      )
  )
);
