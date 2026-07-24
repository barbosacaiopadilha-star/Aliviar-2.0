-- Broaden patient RLS on domain_snapshots for journey-scoped bootstrap rows

drop policy if exists "domain_snapshots_select_patient" on public.domain_snapshots;
drop policy if exists "domain_snapshots_insert_patient" on public.domain_snapshots;
drop policy if exists "domain_snapshots_update_patient" on public.domain_snapshots;

create policy "domain_snapshots_select_patient"
  on public.domain_snapshots for select
  to authenticated
  using (
    public.is_patient_owner(patient_id)
    or journey_id in (
      select j.id from public.journeys j
      where public.is_patient_owner(j.patient_id)
    )
  );

create policy "domain_snapshots_insert_patient"
  on public.domain_snapshots for insert
  to authenticated
  with check (
    (patient_id is not null and public.is_patient_owner(patient_id))
    or (journey_id is not null and journey_id in (
      select j.id from public.journeys j
      where public.is_patient_owner(j.patient_id)
    ))
  );

create policy "domain_snapshots_update_patient"
  on public.domain_snapshots for update
  to authenticated
  using (
    public.is_patient_owner(patient_id)
    or journey_id in (
      select j.id from public.journeys j
      where public.is_patient_owner(j.patient_id)
    )
  )
  with check (
    (patient_id is null or public.is_patient_owner(patient_id))
    and (journey_id is null or journey_id in (
      select j.id from public.journeys j
      where public.is_patient_owner(j.patient_id)
    ))
  );
