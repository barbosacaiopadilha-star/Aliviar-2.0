-- ============================================================================
-- APOSENTA A GERAÇÃO 1 — o schema `public` deixa de carregar produto
-- ============================================================================
--
-- O QUE SAI
--   As 26 tabelas, 15 funções e 8 enums da primeira geração do produto
--   (motor ACE + jornadas), todos no schema `public`. O schema em si FICA —
--   é infraestrutura do Supabase, nunca dele se tira o chão.
--
-- POR QUE
--   O app inteiro vive no schema `curadoria` (`DB_SCHEMA`) desde a
--   reconstrução. Nenhuma linha de `src/` lê o `public`: os dados são de
--   23–24/07/2026 e 100% sintéticos (E2E/homologação/DEMO). E três tabelas
--   homônimas (`patient_documents`, `profiles`, `patient_notifications`)
--   existiam nos DOIS schemas: um `DB_SCHEMA` errado não quebraria o app —
--   o faria ler em silêncio o passado. Fase A1 da análise de arquitetura
--   (2026-08-21), autorizada pelo Fundador.
--
-- SEGURO DE VIDA
--   Backup lógico completo (dados + DDL de catálogo com corpos de função,
--   triggers e policies) gravado ANTES desta migration em
--   `OneDrive\Desktop\curadoria-2-0-backups\schema-public-geracao1-2026-08-21`.
--
-- POR QUE `if exists` EM TUDO
--   O banco local nunca teve estes objetos — as 132 migrations do ledger
--   atual não os criam; eles são anteriores ao reset do ledger e só existem
--   na produção. No local esta migration é um no-op honesto; na produção,
--   o corte. É o que reconverge os dois ambientes.
--
-- O QUE NÃO É TOCADO
--   `curadoria.*` inteiro — inclusive `ace_executions`, `ace_execution_events`
--   e `ace_artifacts`, o histórico protegido pela DP-2. (`ace_analysis_runs`,
--   abaixo, é outra tabela: a da geração 1, no `public`.)
-- ============================================================================

-- Tabelas — CASCADE derruba junto índices, triggers, policies e FKs internas.
drop table if exists public.journey_commitments cascade;
drop table if exists public.journey_events cascade;
drop table if exists public.patient_journey_views cascade;
drop table if exists public.patient_journey_feedback cascade;
drop table if exists public.curator_journey_feedback cascade;
drop table if exists public.journeys cascade;
drop table if exists public.patient_documents cascade;
drop table if exists public.patient_notification_preferences cascade;
drop table if exists public.patient_notifications cascade;
drop table if exists public.patient_portal_flows cascade;
drop table if exists public.ace_analysis_runs cascade;
drop table if exists public.curator_case_workspaces cascade;
drop table if exists public.curator_checklists cascade;
drop table if exists public.curator_favorites cascade;
drop table if exists public.curator_private_notes cascade;
drop table if exists public.curator_templates cascade;
drop table if exists public.operational_assignment_events cascade;
drop table if exists public.operational_incident_events cascade;
drop table if exists public.operational_incidents cascade;
drop table if exists public.operational_audit_events cascade;
drop table if exists public.domain_snapshots cascade;
drop table if exists public.feature_flags cascade;
drop table if exists public.system_configuration cascade;
drop table if exists public.patients cascade;
drop table if exists public.profiles cascade;

-- Funções da geração 1 — todas as do schema `public`, pela assinatura real.
-- Um laço pelo catálogo em vez de 15 drops nominais: assinatura escrita à mão
-- erra; a lida do catálogo não. No local, o laço não encontra nada.
do $aposenta$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('drop function if exists %s cascade', f.assinatura);
  end loop;
end
$aposenta$;

-- Enums que ficariam órfãos.
drop type if exists public.commitment_status;
drop type if exists public.journey_event_category;
drop type if exists public.journey_event_source;
drop type if exists public.journey_priority;
drop type if exists public.journey_status;
drop type if exists public.patient_document_status;
drop type if exists public.patient_status;
drop type if exists public.user_role;
