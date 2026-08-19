-- ============================================================================
-- FORMAÇÃO PASSA A DERIVAR DE DOCUMENTO VERIFICADO
-- ============================================================================
--
-- O QUE MUDA
--   Os cinco conceitos do grupo FORMACAO deixam de ser `cruzamento: humano`
--   e passam a `automatico`. Nada mais: nome, descrição, eixo, ordem,
--   `evidence_source`, `motor_participation` e `required` seguem intactos.
--
-- POR QUE
--   A formação já é verificada pela equipe na etapa "Documentos e formação":
--   o documento é lido, conferido e recebe selo, com autoria e data
--   (`professional_education_entries.verification_status = 'verificado'`).
--   Esse É o julgamento humano — e ele acontece UMA vez, sobre o diploma.
--
--   Com `cruzamento: humano`, o mesmo fato era julgado de novo pelo Curador,
--   por Case, um profissional por vez. Não é uma segunda leitura: é a mesma
--   leitura repetida. Numa Rede de dezenas, é a etapa que deixa de ser
--   cumprida — e a paciente recebe "ainda não foi possível confirmar" sobre
--   um médico cujo diploma a equipe tinha na mão.
--
--   O próprio Catálogo já dizia de onde esse dado vem: os cinco conceitos são
--   `evidence_source = 'oficial_primaria'`. Documento, nunca digitação.
--
-- O QUE ISTO NÃO AUTORIZA
--   Não faz o sistema afirmar sozinho. A derivação PROPÕE; quem confirma
--   continua sendo pessoa, na tela do Mapa (decisão de 2026-08-19). E o
--   princípio permanece intacto: sem evidência corrente, o resultado é LACUNA
--   com motivo — jamais estado inventado (P-04 / I-8).
--
--   Nenhum outro conceito é tocado. EXPERIENCIA, HISTORICO e VIABILIDADE
--   seguem humanos: ali o julgamento não é sobre um documento existir, e
--   reclassificá-los exigiria decisão própria.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   Nenhum DML sobre estados já gravados. Linhas de
--   `professional_subcriterion_map` criadas à mão continuam válidas, com a
--   autoria que têm. Esta migration muda a CLASSIFICAÇÃO do conceito, não o
--   que já foi declarado sobre ninguém.
--
-- ROLLBACK
--   update curadoria.method_subcriteria
--      set cruzamento = 'humano'
--    where "group" = 'FORMACAO';
--   -- e regerar src/modules/curadoria/catalogo-gerado.ts
-- ============================================================================

-- O Catálogo é norma: o banco recusa mudança sem justificativa registrada na
-- MESMA transação. Não é formalidade — é o que faz toda alteração de conceito
-- carregar o motivo junto, legível por quem for auditar depois.
select set_config(
  'curadoria.catalog_change_rationale',
  'Decisao de 2026-08-19: formacao verificada pela equipe passa a derivar de documento. '
  'O julgamento humano acontece uma vez, sobre o diploma (professional_education_entries), '
  'e nao se repete por Case. A derivacao PROPOE; a confirmacao segue humana na tela do Mapa.',
  true
);

update curadoria.method_subcriteria
   set cruzamento = 'automatico',
       updated_at = now()
 where "group" = 'FORMACAO'
   and cruzamento = 'humano';

-- Prova de fechamento: os cinco, e apenas os cinco, mudaram de lado.
do $$
declare
  automaticos int;
  humanos_restantes int;
begin
  select count(*) into automaticos
    from curadoria.method_subcriteria
   where "group" = 'FORMACAO' and cruzamento = 'automatico';

  if automaticos <> 5 then
    raise exception 'FORMACAO deveria ter 5 conceitos automaticos, tem %', automaticos;
  end if;

  -- Os outros grupos de julgamento humano seguem intocados.
  select count(*) into humanos_restantes
    from curadoria.method_subcriteria
   where "group" in ('EXPERIENCIA', 'HISTORICO', 'VIABILIDADE')
     and cruzamento = 'humano';

  if humanos_restantes < 1 then
    raise exception 'EXPERIENCIA/HISTORICO/VIABILIDADE nao deveriam ter sido tocados';
  end if;
end $$;
