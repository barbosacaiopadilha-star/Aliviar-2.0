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
REVOKE ALL ON FUNCTION public.on_journey_insert_create_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.on_journey_status_change_create_event() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_journey_insert_create_event() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.on_journey_status_change_create_event() TO postgres, service_role;
