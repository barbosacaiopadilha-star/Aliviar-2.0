-- DOMAIN CONVERGENCE — B4 (contract). Passo final e destrutivo.
--
-- Remove a estrutura legada de `crm_cases`, provada desnecessária:
--   B1: fixtures apagadas (export guardado)
--   B2: FKs dos 4 dependentes reapontadas para curadoria.cases; RLS de
--       contato reescrita sem crm_cases; lead deixou de criar Case
--   B3: aplicação convergida — 0 leitores, 0 escritores
--   Janela: 0 linhas, 0 DML de aplicação (pg_stat_statements), sentinela
--       de escrita silenciosa durante ciclo completo + 140 testes
--
-- Restauração extraordinária: supabase/rollback-b4-crm-cases.sql
--
-- NÃO toca: curadoria.cases, seus dados, o histórico de responsabilidade,
-- a RLS do Case canônico, a máquina de estados, nem a auditoria.

do $$
declare
  _linhas int;
  _fks int;
  _consumidores int;
begin
  if to_regclass('curadoria.crm_cases') is null then
    raise notice 'crm_cases já não existe — nada a fazer.';
    return;
  end if;

  -- Pré-condição 1: tabela vazia. Uma única linha aqui significa que alguém
  -- voltou a usá-la — abortar é obrigatório.
  select count(*) into _linhas from curadoria.crm_cases;
  if _linhas <> 0 then
    raise exception 'ABORTADO: crm_cases tem % linha(s). O B4 exige tabela vazia.', _linhas;
  end if;

  -- Pré-condição 2: ninguém aponta para ela.
  select count(*) into _fks from pg_constraint
  where contype = 'f' and confrelid = 'curadoria.crm_cases'::regclass;
  if _fks <> 0 then
    raise exception 'ABORTADO: % FK(s) ainda apontam para crm_cases.', _fks;
  end if;

  -- Pré-condição 3: nenhuma policy de outra tabela depende dela ou da função.
  select count(*) into _consumidores from pg_policies
  where schemaname = 'curadoria' and tablename <> 'crm_cases'
    and (coalesce(qual,'') || coalesce(with_check,'')) ~* '(crm_cases|is_curator_for_crm_case)';
  if _consumidores <> 0 then
    raise exception 'ABORTADO: % policy(ies) de outras tabelas ainda dependem da estrutura legada.', _consumidores;
  end if;
end $$;

-- Remoções explícitas, na ordem de dependência. Sem CASCADE.

-- 1) Policies exclusivas da tabela (3).
drop policy if exists crm_cases_insert on curadoria.crm_cases;
drop policy if exists crm_cases_select on curadoria.crm_cases;
drop policy if exists crm_cases_update on curadoria.crm_cases;

-- 2) Trigger exclusivo (a função set_updated_at é COMPARTILHADA — permanece).
drop trigger if exists set_crm_cases_updated_at on curadoria.crm_cases;

-- 3) Função exclusiva: só existia para a policy de SELECT de crm_cases.
--    Zero consumidores ativos (verificado acima e na busca global do B3).
drop function if exists curadoria.is_curator_for_crm_case(uuid);

-- 4) A tabela. Índices e constraints próprios (pkey, 4 índices, 2 checks,
--    3 FKs de saída) caem junto por serem parte dela — não é CASCADE sobre
--    objetos externos: nenhum objeto externo depende dela (provado acima).
drop table curadoria.crm_cases;

comment on table curadoria.cases is
  'O Case. Fonte única e canônica da jornada do paciente, do primeiro contato ao encerramento — Atendimento, Curadoria e Concierge compartilham ESTE registro. O Lead (curadoria.crm_contacts) é independente e não é Case: o Case nasce apenas pela abertura autorizada do Atendente (open_case_from_lead). A tabela paralela crm_cases foi removida na Convergência de Domínio (2026-07-25).';
