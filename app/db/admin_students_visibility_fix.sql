-- Superseded by: rls_stabilize_students_and_enrollments.sql
-- Keep this file for history only. Do not run after stabilization.

-- Ensure admins can view all students in User Management.

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'students'
          and policyname = 'students_admin_select'
    ) then
        create policy students_admin_select on public.students for select
        using (
            exists (
                select 1
                from public.admins a
                where a.auth_user_id = auth.uid()
            )
        );
    end if;
end $$;
