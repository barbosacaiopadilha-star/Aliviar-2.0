-- ============================================================================
-- ITEM 1.8-R1 — LEITOR CONTROLADO DE `derivation_proposals`
--
-- Contrato lavrado: docs/curadoria/CONTRATO_1_8_R1.md §21 (DT-01, 2026-08-07).
-- Base documental: 78e261c. Não altera a migration 20260807120000.
--
-- POR QUE UMA FUNÇÃO, E NÃO UM GRANT
--   A prova de banco real da A1.1 encontrou o invariante do Item 2.1
--   funcionando: `service_role` não tem SELECT em `derivation_proposals`, por
--   construção. Conceder o SELECT relaxaria um contrato certificado por dois
--   oráculos. A decisão lavrada é a oposta: A AUTORIDADE PERTENCE À FUNÇÃO,
--   NUNCA AO PAPEL SOBRE A TABELA. A tabela segue inacessível a todo papel de
--   aplicação; nasce uma capability de auditoria, read-only, de projeção
--   mínima, executável por `service_role` e por mais ninguém.
--
-- O QUE ELA É (§21.2)
--   capability de auditoria — não é repository, não é writer, não é RPC de
--   negócio. Entrada é a identidade do alvo; saída é 0..1 linha com as ONZE
--   colunas lavradas (§21.3). Mais de uma proposta para o alvo é violação de
--   invariante e LEVANTA `PROPOSTA_AMBIGUA` — recusa explícita, nunca escolha
--   silenciosa (mesmo padrão do 2.2C-R1).
--
-- O QUE ELA NÃO FAZ (§21.8)
--   Não lista arbitrariamente, não aceita predicado aberto, não pagina, não
--   projeta `*`, não escreve (o `STABLE` faz o MOTOR recusar escrita em
--   execução — o read-only é do PostgreSQL, não da disciplina). Os nove verbos
--   de consumo do §18.3 permanecem proibidos a todos.
--
-- ROLLBACK — objeto a objeto:
--   drop function curadoria.ler_proposta_para_proveniencia(uuid, text);
--   (os grants morrem com a função; nada mais foi criado)
-- ============================================================================

create or replace function curadoria.ler_proposta_para_proveniencia(
  p_case_id uuid,
  p_subcriterion_code text
)
returns table (
  id uuid,
  case_id uuid,
  subcriterion_code text,
  rule_id text,
  rule_version integer,
  origin_record text,
  origin_version text,
  origin_author uuid,
  origin_declared_at timestamptz,
  suggested_value text,
  emitted_at timestamptz
)
language plpgsql
security definer
stable
strict
set search_path = curadoria, pg_temp
as $$
declare
  quantas integer;
begin
  -- Cardinalidade 0..1 (§21.2). Zero é fato de domínio — o elo se decide na
  -- cadeia, não aqui. Mais de uma é invariante violado, e a capability RECUSA
  -- em vez de escolher: escolher seria decidir, e leitura não decide.
  select count(*) into quantas
  from curadoria.derivation_proposals p
  where p.case_id = p_case_id
    and p.subcriterion_code = p_subcriterion_code;

  if quantas > 1 then
    raise exception
      'PROPOSTA_AMBIGUA: % propostas para o alvo (%, %). A leitura de proveniencia nao escolhe entre elas (1.8-R1 §21.2).',
      quantas, p_case_id, p_subcriterion_code
      using errcode = 'internal_error';
  end if;

  -- Projeção NOMINAL (§21.3): exatamente as onze colunas lavradas, nomeadas
  -- uma a uma. Ficam fora, de propósito: professional_profile_id (sempre nulo
  -- no alvo Case), target_field, catalog_version, consequence_degree e state.
  -- Alargar a projeção é mudança de contrato e exige lavratura.
  return query
  select
    p.id,
    p.case_id,
    p.subcriterion_code,
    p.rule_id,
    p.rule_version,
    p.origin_record,
    p.origin_version,
    p.origin_author,
    p.origin_declared_at,
    p.suggested_value,
    p.emitted_at
  from curadoria.derivation_proposals p
  where p.case_id = p_case_id
    and p.subcriterion_code = p_subcriterion_code;
end;
$$;

comment on function curadoria.ler_proposta_para_proveniencia(uuid, text) is
  'CONTRATO_1_8_R1 §21 — capability de AUDITORIA: le a proposta persistida de um alvo (case, conceito) para reconstruir proveniencia (§11.4). SECURITY DEFINER porque a autoridade e da funcao, nunca do papel sobre a tabela: service_role continua SEM select em derivation_proposals, e este e um aceite positivo permanente do R1. STABLE = o motor recusa escrita em execucao. STRICT = entrada nula devolve vazio, nenhum curinga. 0..1 linha; mais de uma LEVANTA PROPOSTA_AMBIGUA. Projecao nominal de onze colunas — alarga-la exige lavratura. EXECUTE exclusivo de service_role.';

-- ---------------------------------------------------------------------------
-- GRANTS (§21.5) — o default de EXECUTE é PUBLIC, e a revogação vem na mesma
-- migration. `anon` e `authenticated` ficam sem nada por consequência (herdam
-- de PUBLIC e não recebem grant próprio). `service_role` é o único chamador.
--
-- E, simultaneamente, INALTERADO: nenhum grant de tabela nasce aqui. O aceite
-- `has_table_privilege('service_role','curadoria.derivation_proposals','select') = false`
-- permanece verdadeiro — os dois aceites coexistem (§21.9).
-- ---------------------------------------------------------------------------
revoke execute on function curadoria.ler_proposta_para_proveniencia(uuid, text) from public;
revoke execute on function curadoria.ler_proposta_para_proveniencia(uuid, text) from anon, authenticated;
grant execute on function curadoria.ler_proposta_para_proveniencia(uuid, text) to service_role;
