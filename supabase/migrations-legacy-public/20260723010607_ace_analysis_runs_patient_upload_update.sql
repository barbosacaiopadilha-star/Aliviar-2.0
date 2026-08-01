-- RECUPERADA DO LEDGER DE PRODUÇÃO (R2.1).
--
-- Esta migration foi aplicada em produção e seu arquivo não existia mais no
-- repositório. O SQL abaixo é o conteúdo exato registrado em
-- supabase_migrations.schema_migrations.statements — o que de fato rodou.
--
-- Nada foi modernizado, reescrito ou tornado idempotente: é o artefato
-- histórico, restaurado para que o repositório volte a descrever o banco.
--
-- Opera no schema `public`, da arquitetura anterior à Curadoria. Por isso
-- vive aqui, junto das demais legadas, e NÃO em supabase/migrations/ — onde
-- quebraria o `db reset`, que não recria o schema `public`.
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
