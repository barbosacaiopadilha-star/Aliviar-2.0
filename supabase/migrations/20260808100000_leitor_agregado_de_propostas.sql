-- ============================================================================
-- ITEM 1.11 — LEITOR AGREGADO DE PROPOSTAS (Painel de Discordância)
--
-- Contrato lavrado: docs/curadoria/CONTRATO_1_11_PAINEL_DE_DISCORDANCIA.md
-- (§3, §4, §11). Base: ca49293 (Item 1.8 encerrado em 44866a3).
--
-- O QUE ISTO É
--   A segunda capability sobre `derivation_proposals` — e a única AGREGADA.
--   Ela responde UMA pergunta: quantas propostas existem em cada desfecho, por
--   conceito e por versão exata da regra. Nada de linha individual, nada de
--   pessoa, nada de Case: a dimensão pessoal NÃO EXISTE na saída, e é isso —
--   não uma policy — que torna o ranking impossível por desenho (§7).
--
-- POR QUE ZERO ARGUMENTOS
--   Sem predicado, sem filtro, sem paginação: nada que um chamador possa
--   estreitar até reconstituir uma linha individual (§3). `STRICT` não se
--   aplica a assinatura vazia — registrado para não parecer omissão.
--
-- O QUE ELA NÃO RESPONDE
--   quem · qual profissional · qual paciente · qual Case · qual conteúdo ·
--   qual justificativa · qual registro de origem. A taxa (§5) é conta do
--   MODELO PURO do painel — numerador RECUSADA, denominador
--   CONFIRMADA+RECUSADA — e nunca desce ao banco.
--
-- FATOS HISTÓRICOS (§6)
--   Nenhum filtro por vigência da regra: suspensão ou revogação posterior NÃO
--   apaga as contagens das propostas já emitidas. Ato histórico ≠ estado
--   corrente da regra.
--
-- ROLLBACK — objeto a objeto:
--   drop function curadoria.contar_propostas_por_desfecho();
--   (os grants morrem com a função; nenhum dado é tocado; a capability
--    individual e a tabela permanecem exatamente como estão)
-- ============================================================================

create or replace function curadoria.contar_propostas_por_desfecho()
returns table (
  subcriterion_code text,
  rule_id text,
  rule_version integer,
  state text,
  contagem bigint
)
language sql
security definer
stable
set search_path = curadoria, pg_temp
as $$
  -- Um único SELECT … GROUP BY, referências qualificadas, zero SQL dinâmico.
  -- Granularidade EXATA do contrato: conceito × regra × versão × desfecho.
  -- Sem propostas, conjunto VAZIO — nenhuma linha zero é fabricada; o vazio
  -- honesto é responsabilidade do modelo do painel (§8).
  select
    p.subcriterion_code,
    p.rule_id,
    p.rule_version,
    p.state,
    count(*) as contagem
  from curadoria.derivation_proposals p
  group by p.subcriterion_code, p.rule_id, p.rule_version, p.state
$$;

comment on function curadoria.contar_propostas_por_desfecho() is
  'CONTRATO_1_11 §3 — leitor AGREGADO do Painel de Discordancia: contagens por conceito x regra x versao x desfecho, e nada alem. Zero argumentos (nenhum predicado estreitavel ate linha individual); SECURITY DEFINER porque a autoridade e da funcao — service_role continua SEM select em derivation_proposals; STABLE = o motor recusa escrita. A dimensao pessoal NAO EXISTE na saida: anti-ranking por desenho (§7). A taxa e conta do modelo puro (§5); historico preservado apos suspensao/revogacao da regra (§6). EXECUTE exclusivo de service_role.';

-- ---------------------------------------------------------------------------
-- GRANTS (§3) — o default de EXECUTE é PUBLIC; a revogação vem na mesma
-- migration. `anon`/`authenticated` ficam sem nada. `service_role` é o único
-- chamador — e continua SEM SELECT na tabela: os dois aceites coexistem.
-- ---------------------------------------------------------------------------
revoke execute on function curadoria.contar_propostas_por_desfecho() from public;
revoke execute on function curadoria.contar_propostas_por_desfecho() from anon, authenticated;
grant execute on function curadoria.contar_propostas_por_desfecho() to service_role;
