create or replace function curadoria.is_curator_for_crm_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1
    from curadoria.crm_cases c
    where c.id = _case_id
      and c.responsible_curator_id = auth.uid()
  );
$$;

create or replace function curadoria.can_access_crm_contact(_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1
    from curadoria.crm_contacts c
    where c.id = _contact_id
      and (
        curadoria.has_role('administrador')
        or (curadoria.has_role('concierge') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (
          curadoria.has_role('curador_medico')
          and exists (
            select 1
            from curadoria.crm_cases k
            where k.contact_id = c.id
              and k.responsible_curator_id = auth.uid()
              and k.pipeline_stage in (
                'sent_to_curator',
                'curation_in_progress',
                'report_ready',
                'report_delivered',
                'doctor_selected',
                'scheduling_support',
                'completed'
              )
          )
        )
      )
  );
$$;

revoke execute on function curadoria.is_curator_for_crm_case(uuid) from anon, authenticated;
revoke execute on function curadoria.can_access_crm_contact(uuid) from anon, authenticated;