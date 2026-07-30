-- SELEÇÃO SEM BANDA — M2 do plano de remediação (executa a ADR-042)
--
-- A ADR-042 aposentou o orçamento de pontos como fonte de verdade; a M1
-- religou a etapa de seleção ao Motor de Compatibilidade. Restava a última
-- veia: `curated_selection_options.band` era NOT NULL, obrigando toda seleção
-- nova a carregar um dado do motor aposentado (a banda derivada do
-- `internal_score`).
--
-- Esta migration é ADITIVA e NÃO DESTRUTIVA:
--
--   * `band` passa a ser anulável — seleções novas gravam NULL (a aplicação
--     simplesmente não envia o campo);
--   * os valores existentes são HISTÓRICOS: nenhuma linha é convertida,
--     apagada, preenchida ou reescrita;
--   * o CHECK original permanece — ele valida os valores históricos e aceita
--     NULL por semântica de SQL;
--   * novas gravações NÃO devem produzir `band`; o único escritor
--     (`saveSelection`) deixou de enviar o campo nesta mesma entrega.
--
-- Remoção física da coluna: SOMENTE em migration futura, após confirmação de
-- zero leitores operacionais (hoje a hidratação ainda a lê como campo
-- histórico opcional) — critério da ADR-036 ("zero escritores ativos, zero
-- leitores operacionais ativos").

alter table curadoria.curated_selection_options
  alter column band drop not null;

comment on column curadoria.curated_selection_options.band is
  'HISTORICO (M2, ADR-042). Banda do motor aposentado, gravada por selecoes anteriores a virada. Selecoes novas gravam NULL. Nao converter, nao preencher, nao reescrever. Remocao fisica exige zero leitores operacionais.';

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   update curadoria.curated_selection_options set band = 'MODERADA' where band is null;
--   alter table curadoria.curated_selection_options alter column band set not null;
--
-- (O UPDATE do rollback inventaria banda para seleções novas — só faz sentido
-- se a aplicação voltar a exigi-la.)
