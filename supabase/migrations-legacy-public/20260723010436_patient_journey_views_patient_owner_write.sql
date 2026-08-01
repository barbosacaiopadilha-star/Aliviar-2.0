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
