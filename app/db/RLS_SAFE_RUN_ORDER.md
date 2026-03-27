# RLS Safe Run Order (Students + Enrollments)

Use this order to avoid recursion and keep Admin/Faculty/Student visibility stable:

1. Run `course_structure_terms_departments.sql` (adds departments + academic terms model).
2. For existing DBs, run `academic_terms_name_semester_scope_fix.sql` (allows same term name with different actual semester numbers).
3. Run `enrollment_semester_guard.sql` (enforces student semester + department match course on enrollments).
4. Run `faculty_enrollment_visibility_fix.sql` only if you need legacy `auth_user_id` backfill.
5. Run `auth_user_id_hardening.sql` only after backfill is clean (0 nulls).
6. Run `rls_stabilize_students_and_enrollments.sql` last.

Notes:
- `rls_stabilize_students_and_enrollments.sql` is the canonical final policy state.
- `students_rls_recursion_fix.sql` and `admin_students_visibility_fix.sql` are kept for history and should not be re-run after stabilization.
- Avoid re-running older partial policy files after stabilization, or recursion can return.