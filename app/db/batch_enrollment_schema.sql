-- 1. COURSE_FACULTY junction table (many-to-many: courses <-> faculty)

create table if not exists public.course_faculty (
    id          uuid primary key default gen_random_uuid(),
    course_id   uuid not null references public.courses(id) on delete cascade,
    faculty_id  uuid not null references public.faculty(id) on delete cascade,
    created_at  timestamptz not null default now(),

    constraint course_faculty_unique unique (course_id, faculty_id)
);

create index if not exists idx_course_faculty_course  on public.course_faculty (course_id);
create index if not exists idx_course_faculty_faculty on public.course_faculty (faculty_id);

-- RLS
alter table public.course_faculty enable row level security;

do $$ begin
    if not exists (select 1 from pg_policies where policyname = 'course_faculty_select_all') then
        create policy course_faculty_select_all on public.course_faculty for select using (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'course_faculty_insert_admin') then
        create policy course_faculty_insert_admin on public.course_faculty for insert with check (true);
    end if;
    if not exists (select 1 from pg_policies where policyname = 'course_faculty_delete_admin') then
        create policy course_faculty_delete_admin on public.course_faculty for delete using (true);
    end if;
end $$;


-- 2. Add section columns to course_enrollments

alter table public.course_enrollments
    add column if not exists section text,
    add column if not exists section_faculty_id uuid references public.faculty(id) on delete set null;

create index if not exists idx_enrollments_section on public.course_enrollments (section);
create index if not exists idx_enrollments_section_faculty on public.course_enrollments (section_faculty_id);

-- 3. Update RLS policy for course_enrollments
-- Allow faculty to read enrollments if they are the primary instructor OR the section faculty OR assigned via course_faculty
do $$ begin
    if not exists (select 1 from pg_policies where policyname = 'enrollments_faculty_select_all_assigned') then
        create policy enrollments_faculty_select_all_assigned on public.course_enrollments for select
        using (
            -- Assigned explicitly to this section
            section_faculty_id in (select id from public.faculty where auth_user_id = auth.uid())
            OR
            -- Or assigned to the course generally (covers both primary and co-faculty)
            course_id in (
                select cf.course_id from public.course_faculty cf
                join public.faculty f on cf.faculty_id = f.id
                where f.auth_user_id = auth.uid()
            )
            OR
            -- Or primary instructor
            course_id in (
                select c.id from public.courses c
                join public.faculty f on c.instructor_id = f.id
                where f.auth_user_id = auth.uid()
            )
        );
    end if;
end $$;