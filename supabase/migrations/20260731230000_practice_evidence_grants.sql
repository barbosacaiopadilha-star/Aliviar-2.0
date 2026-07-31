-- GRANTS DA BASE DE EVIDÊNCIAS — privilégios mínimos, papel a papel.
--
-- A migration anterior criou a tabela com RLS, mas RLS filtra linhas de quem
-- JÁ tem privilégio de tabela — sem GRANT, ninguém chega nem ao filtro.
-- Mesmo desenho das demais superfícies da Curadoria (precedente:
-- canonical_function_grants_hardening, reconhecimento_grants_hardening).
--
-- `authenticated` recebe SELECT e INSERT — a RLS decide quem de fato lê
-- (administrador, curador_medico) e quem insere (administrador).
-- UPDATE e DELETE não são concedidos a ninguém além do service_role, e mesmo
-- para ele os triggers append-only recusam — duas camadas, de propósito.
-- `anon` não recebe nada.

grant select, insert on curadoria.practice_evidence to authenticated;
grant all on curadoria.practice_evidence to service_role;

revoke all on curadoria.practice_evidence from anon;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   revoke select, insert on curadoria.practice_evidence from authenticated;
--   revoke all on curadoria.practice_evidence from service_role;
