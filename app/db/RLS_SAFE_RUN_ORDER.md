# RLS Safe Run Order (Students + Enrollments)

Use this order to avoid recursion and keep Admin/Faculty/Student visibility stable:

1. Run `faculty_enrollment_visibility_fix.sql` only if you need legacy `auth_user_id` backfill.
2. Run `auth_user_id_hardening.sql` only after backfill is clean (0 nulls).
3. Run `rls_stabilize_students_and_enrollments.sql` last.

Notes:
- `rls_stabilize_students_and_enrollments.sql` is the canonical final policy state.
- `students_rls_recursion_fix.sql` and `admin_students_visibility_fix.sql` are kept for history and should not be re-run after stabilization.
- Avoid re-running older partial policy files after stabilization, or recursion can return.