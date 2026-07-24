-- Conclusão de runs ACE disparados por UPLOAD (fluxo do paciente após envio de documento).

create policy "ace_analysis_runs_staff_update"
  on public.ace_analysis_runs for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "ace_analysis_runs_patient_update_upload"
  on public.ace_analysis_runs for update
  to authenticated
  using (
    public.is_patient_owner(patient_id)
    and triggered_by = 'UPLOAD'
  )
  with check (
    public.is_patient_owner(patient_id)
    and triggered_by = 'UPLOAD'
  );
