-- Patient owner read access to journeys (portal bootstrap)

create policy "journeys_select_patient_owner"
  on public.journeys for select
  to authenticated
  using (public.is_patient_owner(patient_id));
