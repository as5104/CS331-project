-- 1. COURSES

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  credits integer not null default 3,
  semester integer,
  department text,
  description text,

  -- FK to faculty table (instructor)
  instructor_id uuid references public.faculty(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint courses_code_unique unique (code)
);

create index if not exists idx_courses_department on public.courses (department);
create index if not exists idx_courses_instructor on public.courses (instructor_id);
create index if not exists idx_courses_semester on public.courses (semester);


-- 2. COURSE ENROLLMENTS

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,

  grade text,
  grade_points numeric(4,2),
  attendance_pct numeric(5,2) default 0,

  enrolled_at timestamptz not null default now(),

  constraint enrollment_unique unique (student_id, course_id)
);

create index if not exists idx_enrollments_student on public.course_enrollments (student_id);
create index if not exists idx_enrollments_course on public.course_enrollments (course_id);

-- 3. ASSIGNMENTS

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  deadline timestamptz not null,
  total_marks integer not null default 100,

  created_by uuid references public.faculty(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assignments_course on public.assignments (course_id);
create index if not exists idx_assignments_deadline on public.assignments (deadline);
create index if not exists idx_assignments_created_by on public.assignments (created_by);

-- 4. ASSIGNMENT SUBMISSIONS

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'under_review', 'revision_requested', 'graded')),
  file_url text,                   -- Supabase Storage path
  marks integer,
  feedback text,

  submitted_at timestamptz,
  reviewed_by uuid references public.faculty(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint submission_unique unique (assignment_id, student_id)
);

create index if not exists idx_submissions_assignment on public.assignment_submissions (assignment_id);
create index if not exists idx_submissions_student on public.assignment_submissions (student_id);
create index if not exists idx_submissions_status on public.assignment_submissions (status);
create index if not exists idx_submissions_reviewer on public.assignment_submissions (reviewed_by);

-- 5. ATTENDANCE RECORDS

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,

  status text not null default 'present'
    check (status in ('present', 'absent', 'excused', 'late')),

  marked_by uuid references public.faculty(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint attendance_unique unique (course_id, student_id, date)
);

create index if not exists idx_attendance_course on public.attendance_records (course_id);
create index if not exists idx_attendance_student on public.attendance_records (student_id);
create index if not exists idx_attendance_date on public.attendance_records (date);

-- 6. LEAVE REQUESTS

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,

  type text not null check (type in ('medical', 'personal', 'academic', 'other')),
  from_date date not null,
  to_date date not null,
  reason text not null,
  document_url text,               -- Supabase Storage path for supporting docs

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  reviewed_by uuid references public.admins(id) on delete set null,
  reviewed_at timestamptz,
  review_remarks text,

  created_at timestamptz not null default now(),

  constraint leave_date_order check (to_date >= from_date)
);

create index if not exists idx_leave_student on public.leave_requests (student_id);
create index if not exists idx_leave_status on public.leave_requests (status);
create index if not exists idx_leave_dates on public.leave_requests (from_date, to_date);

-- 7. RE-EVALUATION REQUESTS

create table if not exists public.re_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,

  exam_type text not null,
  reason text not null,
  original_grade text,
  new_grade text,

  status text not null default 'pending'
    check (status in ('pending', 'eligible', 'under_review', 'completed', 'rejected')),

  reviewer_id uuid references public.faculty(id) on delete set null,
  reviewed_at timestamptz,
  review_remarks text,

  created_at timestamptz not null default now()
);

create index if not exists idx_reeval_student on public.re_evaluations (student_id);
create index if not exists idx_reeval_course on public.re_evaluations (course_id);
create index if not exists idx_reeval_status on public.re_evaluations (status);

-- 8. NOTIFICATIONS

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  message text not null,
  type text not null default 'info'
    check (type in ('info', 'success', 'warning', 'error')),
  read boolean not null default false,

  -- Optional link to the entity that triggered the notification
  related_type text,
  related_id uuid,

  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_notifications_read on public.notifications (user_id, read);
create index if not exists idx_notifications_created on public.notifications (created_at desc);

-- 9. ANNOUNCEMENTS

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,

  target text not null default 'all'
    check (target in ('all', 'students', 'faculty', 'department')),
  target_department text,          -- non-null when target = 'department'

  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),

  author_id uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now()
);

create index if not exists idx_announcements_target on public.announcements (target);
create index if not exists idx_announcements_published on public.announcements (published_at desc);

-- 10. EVENT LOGS

create table if not exists public.event_logs (
  id bigserial primary key,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,

  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_event_logs_type on public.event_logs (event_type);
create index if not exists idx_event_logs_actor on public.event_logs (actor_id);
create index if not exists idx_event_logs_created on public.event_logs (created_at desc);


-- ROW LEVEL SECURITY (RLS)

alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.re_evaluations enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.event_logs enable row level security;


-- COURSES
-- Everyone can read courses
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'courses_select_all') then
    create policy courses_select_all on public.courses for select using (true);
  end if;
end $$;

-- Admins can insert/update/delete courses
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'courses_admin_insert') then
    create policy courses_admin_insert on public.courses for insert
      with check (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'courses_admin_update') then
    create policy courses_admin_update on public.courses for update
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'courses_admin_delete') then
    create policy courses_admin_delete on public.courses for delete
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- COURSE ENROLLMENTS
-- Students see their own enrollments
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'enrollments_student_select') then
    create policy enrollments_student_select on public.course_enrollments for select
      using (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Faculty see enrollments for their courses
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'enrollments_faculty_select') then
    create policy enrollments_faculty_select on public.course_enrollments for select
      using (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Admins can CRUD enrollments
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'enrollments_admin_all') then
    create policy enrollments_admin_all on public.course_enrollments for all
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- ASSIGNMENTS
-- Students see assignments for courses they are enrolled in
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'assignments_student_select') then
    create policy assignments_student_select on public.assignments for select
      using (
        course_id in (
          select ce.course_id from public.course_enrollments ce
          join public.students s on ce.student_id = s.id
          where s.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Faculty see & manage assignments for their courses
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'assignments_faculty_select') then
    create policy assignments_faculty_select on public.assignments for select
      using (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'assignments_faculty_insert') then
    create policy assignments_faculty_insert on public.assignments for insert
      with check (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'assignments_faculty_update') then
    create policy assignments_faculty_update on public.assignments for update
      using (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Admins see all assignments
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'assignments_admin_all') then
    create policy assignments_admin_all on public.assignments for all
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- ASSIGNMENT SUBMISSIONS
-- Students see & insert their own submissions
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_student_select') then
    create policy submissions_student_select on public.assignment_submissions for select
      using (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_student_insert') then
    create policy submissions_student_insert on public.assignment_submissions for insert
      with check (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_student_update') then
    create policy submissions_student_update on public.assignment_submissions for update
      using (
        student_id in (select id from public.students where auth_user_id = auth.uid())
        and status in ('pending', 'revision_requested')
      );
  end if;
end $$;

-- Faculty see & grade submissions for their courses
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_faculty_select') then
    create policy submissions_faculty_select on public.assignment_submissions for select
      using (
        assignment_id in (
          select a.id from public.assignments a
          join public.courses c on a.course_id = c.id
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_faculty_update') then
    create policy submissions_faculty_update on public.assignment_submissions for update
      using (
        assignment_id in (
          select a.id from public.assignments a
          join public.courses c on a.course_id = c.id
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Admins see all submissions
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'submissions_admin_all') then
    create policy submissions_admin_all on public.assignment_submissions for all
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- ATTENDANCE RECORDS
-- Students see their own attendance
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'attendance_student_select') then
    create policy attendance_student_select on public.attendance_records for select
      using (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Faculty mark & view attendance for their courses
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'attendance_faculty_select') then
    create policy attendance_faculty_select on public.attendance_records for select
      using (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'attendance_faculty_insert') then
    create policy attendance_faculty_insert on public.attendance_records for insert
      with check (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'attendance_faculty_update') then
    create policy attendance_faculty_update on public.attendance_records for update
      using (
        course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Admins see all attendance
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'attendance_admin_all') then
    create policy attendance_admin_all on public.attendance_records for all
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- LEAVE REQUESTS
-- Students see & create their own leave requests
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'leave_student_select') then
    create policy leave_student_select on public.leave_requests for select
      using (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'leave_student_insert') then
    create policy leave_student_insert on public.leave_requests for insert
      with check (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Faculty can READ leave requests for students in their courses (to update attendance accordingly)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'leave_faculty_select') then
    create policy leave_faculty_select on public.leave_requests for select
      using (
        student_id in (
          select ce.student_id from public.course_enrollments ce
          join public.courses c on ce.course_id = c.id
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Admins have full access to leave requests (approve / reject / view all)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'leave_admin_all') then
    create policy leave_admin_all on public.leave_requests for all
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- RE-EVALUATIONS
-- Students see & create their own re-evaluation requests
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'reeval_student_select') then
    create policy reeval_student_select on public.re_evaluations for select
      using (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'reeval_student_insert') then
    create policy reeval_student_insert on public.re_evaluations for insert
      with check (
        student_id in (select id from public.students where auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Assigned reviewer (faculty) can see & update
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'reeval_faculty_select') then
    create policy reeval_faculty_select on public.re_evaluations for select
      using (
        reviewer_id in (select id from public.faculty where auth_user_id = auth.uid())
        or course_id in (
          select c.id from public.courses c
          join public.faculty f on c.instructor_id = f.id
          where f.auth_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'reeval_faculty_update') then
    create policy reeval_faculty_update on public.re_evaluations for update
      using (
        reviewer_id in (select id from public.faculty where auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Admins manage all re-evaluations
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'reeval_admin_all') then
    create policy reeval_admin_all on public.re_evaluations for all
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- NOTIFICATIONS
-- Users see only their own notifications
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'notifications_user_select') then
    create policy notifications_user_select on public.notifications for select
      using (user_id = auth.uid());
  end if;
end $$;

-- Users can mark their own notifications as read
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'notifications_user_update') then
    create policy notifications_user_update on public.notifications for update
      using (user_id = auth.uid());
  end if;
end $$;

-- Service role (server-side) inserts notifications; admins can also insert
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'notifications_admin_insert') then
    create policy notifications_admin_insert on public.notifications for insert
      with check (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- ANNOUNCEMENTS
-- Everyone can read announcements (filtered by target in app logic)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'announcements_select_all') then
    create policy announcements_select_all on public.announcements for select using (true);
  end if;
end $$;

-- Only admins can create/edit/delete announcements
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'announcements_admin_insert') then
    create policy announcements_admin_insert on public.announcements for insert
      with check (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'announcements_admin_update') then
    create policy announcements_admin_update on public.announcements for update
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'announcements_admin_delete') then
    create policy announcements_admin_delete on public.announcements for delete
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;


-- EVENT LOGS
-- Only admins can read event logs (analytics/audit)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'event_logs_admin_select') then
    create policy event_logs_admin_select on public.event_logs for select
      using (
        exists (select 1 from public.admins where auth_user_id = auth.uid())
      );
  end if;
end $$;

-- Insert is typically done by service role (server-side functions)
-- but we also allow any authenticated user to insert (their own actions)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'event_logs_auth_insert') then
    create policy event_logs_auth_insert on public.event_logs for insert
      with check (auth.uid() is not null);
  end if;
end $$;
