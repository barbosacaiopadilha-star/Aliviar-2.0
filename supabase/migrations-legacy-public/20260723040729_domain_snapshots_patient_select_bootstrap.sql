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
drop policy if exists "domain_snapshots_select_patient" on public.domain_snapshots;

create policy "domain_snapshots_select_patient"
  on public.domain_snapshots for select
  to authenticated
  using (
    public.is_patient_owner(patient_id)
    or journey_id in (
      select j.id from public.journeys j
      where public.is_patient_owner(j.patient_id)
    )
    or (
      patient_id is null
      and journey_id is null
      and public.current_patient_id() is not null
    )
  );
