-- ============================================================================
-- PACOTE 2.2B-R1 — MENOR PRIVILÉGIO NAS LEITURAS DO CICLO DE VIDA
-- ============================================================================
--
-- FINALIDADE
--   A Verificação Independente do Item 2.2B encontrou que as duas funções de
--   leitura do ciclo de vida executam por `PUBLIC` — e portanto por `anon`.
--
--   A migration do 2.2B (20260806100000) fez `revoke all ... from anon,
--   authenticated`, e isso **não bastou**: `anon` e `authenticated` nunca
--   tiveram grant PRÓPRIO. O que elas têm é o EXECUTE que o `create function`
--   concede a `PUBLIC` por padrão, e que `revoke ... from <papel>` não alcança.
--
--   Estado do catálogo ANTES desta migration, verificado em 2026-08-06:
--
--     proacl = {=X/postgres,postgres=X/postgres}
--              ^^^^^^^^^^^ o grantee vazio é PUBLIC
--
--     has_function_privilege(...,'EXECUTE') = true para anon, authenticated,
--     service_role, authenticator e postgres — TODOS por herança de PUBLIC.
--
--   É o mesmo defeito que a migration 20260727040000 corrigiu nas funções da
--   âncora canônica, e o mesmo que a 20260803170000 corrigiu nas funções de
--   governança. Esta o corrige nas duas leituras do ciclo de vida.
--
-- O QUE ESTA MIGRATION FAZ — e nada além disso
--   `revoke execute ... from public` nas duas funções. Uma linha cada.
--
-- O QUE ELA NÃO FAZ
--   Não altera o corpo das funções · não as torna `SECURITY DEFINER` · não
--   muda proprietário · não acrescenta `SET search_path` · não toca trigger,
--   índice, tabela, grafo, autoridade ou RLS · não cria policy · **não
--   concede privilégio a ninguém**. Nenhum uso operacional é inaugurado: o
--   pacote corrige privilégio, não abre porta.
--
--   As duas funções permanecem `SECURITY INVOKER` (`prosecdef = false`), que é
--   o que garante que ler por elas nunca alcança mais do que o chamador já
--   alcançaria — e é por isso que transformá-las em `SECURITY DEFINER` para
--   "compensar" o revoke seria o oposto da correção.
--
-- IDEMPOTÊNCIA
--   `revoke` sobre privilégio ausente é no-op silencioso no PostgreSQL.
--   Reaplicar não produz erro nem efeito. Não há objeto a criar.
--
-- ---------------------------------------------------------------------------
-- ROLLBACK — restaura o estado ANTERIOR do privilégio, e nada mais:
-- ---------------------------------------------------------------------------
--
--   grant execute on function curadoria.derivation_rule_state(text, integer) to public;
--   grant execute on function curadoria.derivation_rule_current_version(text) to public;
--
--   ATENÇÃO — a diferença que o rollback NÃO pode apagar:
--
--     · RESTAURAR O ESTADO ANTERIOR PARA TESTE é o que estas duas linhas
--       fazem. Elas devolvem exatamente o `=X/postgres` que existia em
--       `1a9ad28`, para que a mutação de controle possa provar que os
--       oráculos de segurança caem sem o revoke.
--
--     · RECOMENDAR EXPOSIÇÃO PÚBLICA é outra coisa, e esta migration
--       **recomenda o contrário**. `PUBLIC` inclui `anon` — quem não fez
--       login. Executar o rollback fora de um teste controlado devolve a
--       leitura do ciclo de vida a quem não se identificou.
--
--   O rollback NÃO restaura grant a `anon`, `authenticated` ou `service_role`:
--   nenhum dos três teve grant próprio em momento algum, e inventá-lo aqui
--   seria conceder o que a base nunca concedeu.
--
--   Nenhuma estrutura do 2.2B é tocada pelo rollback — nem tabela, nem
--   trigger, nem índice, nem CHECK, nem RLS.
--
--   Executado e conferido em 2026-08-06, sem `db reset`.
-- ============================================================================

-- As assinaturas foram confirmadas no catálogo antes de escrever estas linhas
-- (`p.oid::regprocedure`): sobrecarga errada faria o revoke acertar o nada e
-- passar em silêncio.
revoke execute on function curadoria.derivation_rule_state(text, integer) from public;
revoke execute on function curadoria.derivation_rule_current_version(text) from public;

comment on function curadoria.derivation_rule_state(text, integer) is
  'ADR-069 — o ESTADO CORRENTE de uma versao: o destino da ultima transicao, pela ordem monotonica de seq. Leitura canonica e unica. Nao le derivation_rules.state, que e o estado INICIAL. Devolve null se a versao nao existe. 2.2B-R1: EXECUTE revogado de PUBLIC — a estrutura e inerte, e nenhum papel de aplicacao a alcanca. SECURITY INVOKER: ler por ela nunca alcanca mais do que o chamador ja alcancaria.';

comment on function curadoria.derivation_rule_current_version(text) is
  'ADR-069 — qual VERSAO de uma regra esta vigente agora, ou null. Deriva das transicoes: entrada em VIGENTE que e a ultima da sua versao. A unicidade e garantida pelo CONJUNTO trigger de cadeia (ordinal correto) + indice unico parcial (arbitro da colisao) — nunca por um deles sozinho. 2.2B-R1: EXECUTE revogado de PUBLIC. SECURITY INVOKER.';
