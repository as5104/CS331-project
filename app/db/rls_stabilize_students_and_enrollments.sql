-- RLS stabilization for students + course_enrollments

alter table public.students enable row level security;
alter table public.course_enrollments enable row level security;

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

create or replace function public.current_faculty_row_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select f.id
  from public.faculty f
  where f.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.current_student_row_id() from public;
grant execute on function public.current_student_row_id() to authenticated;
revoke all on function public.current_faculty_row_id() from public;
grant execute on function public.current_faculty_row_id() to authenticated;
revoke all on function public.is_current_admin() from public;
grant execute on function public.is_current_admin() to authenticated;

-- Reset SELECT policies on course_enrollments.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'course_enrollments'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.course_enrollments', p.policyname);
  end loop;
end $$;

create policy enrollments_student_select on public.course_enrollments for select
using (student_id = public.current_student_row_id());

create policy enrollments_faculty_select_assigned_scope on public.course_enrollments for select
using (
  public.current_faculty_row_id() is not null
  and (
    section_faculty_id = public.current_faculty_row_id()
    or (
      section_faculty_id is null
      and (
        exists (
          select 1
          from public.courses c
          where c.id = course_enrollments.course_id
            and c.instructor_id = public.current_faculty_row_id()
        )
        or exists (
          select 1
          from public.course_faculty cf
          where cf.course_id = course_enrollments.course_id
            and cf.faculty_id = public.current_faculty_row_id()
        )
      )
    )
  )
);

create policy enrollments_admin_select on public.course_enrollments for select
using (public.is_current_admin());

-- Reset SELECT policies on students.
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

create policy students_self_select on public.students for select
using (auth_user_id = auth.uid());

create policy students_admin_select on public.students for select
using (public.is_current_admin());

create policy students_faculty_select on public.students for select
using (
  id in (
    select ce.student_id
    from public.course_enrollments ce
    where
      ce.section_faculty_id = public.current_faculty_row_id()
      or (
        ce.section_faculty_id is null
        and (
          exists (
            select 1
            from public.courses c
            where c.id = ce.course_id
              and c.instructor_id = public.current_faculty_row_id()
          )
          or exists (
            select 1
            from public.course_faculty cf
            where cf.course_id = ce.course_id
              and cf.faculty_id = public.current_faculty_row_id()
          )
        )
      )
  )
);