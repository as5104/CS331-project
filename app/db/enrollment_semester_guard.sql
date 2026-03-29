-- Enforce semester + department compatibility at DB level:
-- 1) student.semester must match courses.semester
-- 2) student.department must match course department scope

create or replace function public.enforce_enrollment_semester_match()
returns trigger
language plpgsql
as $$
declare
    student_sem integer;
    course_sem integer;
    student_dep text;
    course_dep text;
begin
    select s.semester, nullif(trim(s.department), '')
    into student_sem, student_dep
    from public.students s
    where s.id = new.student_id;

    select
        c.semester,
        coalesce(nullif(trim(c.department), ''), nullif(trim(d.name), ''))
    into course_sem, course_dep
    from public.courses c
    left join public.departments d on d.id = c.department_id
    where c.id = new.course_id;

    if student_sem is null then
        raise exception 'Student semester is null for student_id=%', new.student_id;
    end if;

    if course_sem is null then
        raise exception 'Course semester is null for course_id=%', new.course_id;
    end if;

    if student_sem <> course_sem then
        raise exception 'Semester mismatch: student semester % does not match course semester %', student_sem, course_sem;
    end if;

    if student_dep is null then
        raise exception 'Student department is null for student_id=%', new.student_id;
    end if;

    if course_dep is null then
        raise exception 'Course department is null for course_id=%', new.course_id;
    end if;

    if lower(trim(student_dep)) <> lower(trim(course_dep)) then
        raise exception 'Department mismatch: student department % does not match course department %', student_dep, course_dep;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_enrollment_semester_match on public.course_enrollments;

create trigger trg_enrollment_semester_match
before insert or update on public.course_enrollments
for each row
execute function public.enforce_enrollment_semester_match();