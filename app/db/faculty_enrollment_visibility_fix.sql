-- Run this after core_schema.sql + batch_enrollment_schema.sql.

-- NOTE:
-- 1) Backfill section in this file is still useful for legacy data.
-- 2) RLS policy section is superseded by rls_stabilize_students_and_enrollments.sql.
--    Run the stabilization script last as the canonical policy state.

-- 1) Backfill auth_user_id for legacy rows so RLS can match auth.uid().
update public.students s
set auth_user_id = u.id
from auth.users u
where s.auth_user_id is null
  and lower(s.email) = lower(u.email);

update public.faculty f
set auth_user_id = u.id
from auth.users u
where f.auth_user_id is null
  and lower(f.email) = lower(u.email);

update public.admins a
set auth_user_id = u.id
from auth.users u
where a.auth_user_id is null
  and lower(a.email) = lower(u.email);

-- 2) Normalize faculty enrollment read policy to match section-level ownership.
drop policy if exists enrollments_faculty_select on public.course_enrollments;
drop policy if exists enrollments_faculty_select_all_assigned on public.course_enrollments;

create policy enrollments_faculty_select_assigned_scope
on public.course_enrollments
for select
using (
    exists (
        select 1
        from public.faculty f
        where f.auth_user_id = auth.uid()
          and (
              -- Explicit student -> faculty assignment (section faculty)
              course_enrollments.section_faculty_id = f.id

              -- Unassigned section: primary instructor can still see.
              or (
                  course_enrollments.section_faculty_id is null
                  and exists (
                      select 1
                      from public.courses c
                      where c.id = course_enrollments.course_id
                        and c.instructor_id = f.id
                  )
              )

              -- Unassigned section fallback for co-faculty:
              -- visible when no section faculty is set on that enrollment row.
              or (
                  course_enrollments.section_faculty_id is null
                  and exists (
                      select 1
                      from public.course_faculty cf
                      where cf.course_id = course_enrollments.course_id
                        and cf.faculty_id = f.id
                  )
              )
          )
    )
);

-- 3) Keep students-table visibility consistent with the same faculty ownership rules.
drop policy if exists students_faculty_select on public.students;

create policy students_faculty_select
on public.students
for select
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
