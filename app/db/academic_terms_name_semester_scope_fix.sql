-- Fix academic_terms uniqueness model for:
-- same term name + different actual semester number.

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

-- Keep legacy courses.semester synced from selected term record.
update public.courses c
set semester = t.sequence
from public.academic_terms t
where c.term_id = t.id
  and (c.semester is distinct from t.sequence);