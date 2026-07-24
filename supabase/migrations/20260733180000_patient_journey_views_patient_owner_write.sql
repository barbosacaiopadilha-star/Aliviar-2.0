-- Paciente autenticado pode atualizar a própria projeção (ex.: após upload de documento).
-- SELECT já existia via patient_journey_views_select_patient_owner; INSERT/UPDATE faltavam.

create policy "patient_journey_views_insert_patient_owner"
  on public.patient_journey_views for insert
  to authenticated
  with check (public.is_patient_owner(patient_id));

create policy "patient_journey_views_update_patient_owner"
  on public.patient_journey_views for update
  to authenticated
  using (public.is_patient_owner(patient_id))
  with check (public.is_patient_owner(patient_id));
