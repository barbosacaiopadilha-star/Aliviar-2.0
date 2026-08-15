-- =============================================================================
-- P-2 · INVENTÁRIO PRÉ/PÓS-PUBLICAÇÃO DO CORTE 7 — somente SELECT.
--
-- Duas fases, escolhidas por variável psql:
--
--   psql ... -v fase=pre  -f inventario-pre-publicacao.sql   (ledger 121)
--   psql ... -v fase=pos  -f inventario-pre-publicacao.sql   (ledger 127)
--
-- FASE PRE — compatível com o schema 121: ⛔ NÃO toca `ciclo_de_vida` nem
-- qualquer objeto das migrations 122–127. Lê só UUID, os dois eixos legados e
-- as duas flags técnicas (todas comprovadamente presentes em 121), e produz a
-- classificação PREVISTA com a migration responsável e a justificativa.
--
-- FASE POS — sobre o ledger 127: lê o ciclo real e compara com a MESMA regra
-- de previsão recalculada dos eixos legados — divergência tem de ser ZERO, e
-- nada aqui fabrica trilha, motivo, autoria ou timestamp (é SELECT).
--
-- ⛔ Nenhum dado pessoal: sem nome, CRM, contato, e-mail ou conteúdo clínico.
-- ⛔ Este arquivo não escreve nada, em nenhum banco, em nenhuma fase.
--
-- Saída futura (somente quando autorizada, NUNCA nesta missão): gravar CSV +
-- resumo Markdown + MANIFEST sha256 vinculado ao dump irmão em
--   C:\Users\barbo\Backups\curadoria-2-0\<timestamp>\pre-publicacao\
-- ⛔ fora do repositório e fora do OneDrive; jamais em `.backups/` do projeto.
-- =============================================================================

\set ON_ERROR_STOP on

\if :{?fase}
\else
  \set fase invalida
\endif

select (:'fase' = 'pre') as ehpre, (:'fase' = 'pos') as ehpos \gset
\if :ehpre
\elif :ehpos
\else
  -- A recusa é um ERRO SQL de verdade: `\echo` sozinho terminava com exit 0 e
  -- um operador scriptado seguiria adiante achando que inventariou. O bloco DO
  -- só levanta a exceção — não lê nem escreve nada — e, com ON_ERROR_STOP, o
  -- psql termina com código diferente de zero.
  \echo RECUSADO: passe -v fase=pre ou -v fase=pos
  do $$ begin
    raise exception 'RECUSADO: passe -v fase=pre ou -v fase=pos'
      using errcode = 'P0001';
  end $$;
\endif

-- -----------------------------------------------------------------------------
-- FASE PRE · previsão a partir SOMENTE do que existe em 121
-- -----------------------------------------------------------------------------
\if :ehpre

-- A previsão espelha, com os MESMOS predicados, o que as migrations 123/125
-- farão — medido na fonte delas. Demo/fixture são exclusão absoluta (125);
-- ativo∧publicado nulo → PUBLICADO_ATIVO (123); nao_publicado nulo →
-- PREPARACAO (123); inativo∧publicado permanece NULL (ambíguo, revisão).
select
  p.id::text                              as uuid,
  p.status                                as legado_status,
  p.publication_status                    as legado_publicacao,
  p.is_demo,
  p.is_test_fixture,
  case
    when p.is_demo or p.is_test_fixture                                   then 'PREPARACAO'
    when p.status = 'ativo' and p.publication_status = 'publicado'        then 'PUBLICADO_ATIVO'
    when p.publication_status = 'nao_publicado'                           then 'PREPARACAO'
    else '(PERMANECE NULL)'
  end                                     as classificacao_prevista,
  case
    when p.is_demo or p.is_test_fixture                                   then '125'
    when p.status = 'ativo' and p.publication_status = 'publicado'        then '123'
    when p.publication_status = 'nao_publicado'                           then '123'
    else '(nenhuma — legado ambíguo)'
  end                                     as migration_que_afeta,
  case
    when p.is_demo or p.is_test_fixture                                   then 'exclusão absoluta: demo/fixture'
    when p.status = 'ativo' and p.publication_status = 'publicado'        then 'backfill 123: ativo e publicado'
    when p.publication_status = 'nao_publicado'                           then 'backfill 123: nao_publicado'
    else 'ambíguo (inativo ∧ publicado) — inelegível, revisão'
  end                                     as justificativa
from curadoria.professional_profiles p
order by 1;

-- Agregados da mesma execução (sem dado pessoal):
select status, publication_status, is_demo, is_test_fixture, count(*)
  from curadoria.professional_profiles
 group by 1, 2, 3, 4
 order by 5 desc;

select count(*) filter (where is_demo)         as demo,
       count(*) filter (where is_test_fixture) as fixture,
       count(*)                                as total
  from curadoria.professional_profiles;

\endif

-- -----------------------------------------------------------------------------
-- FASE POS · o real contra a previsão recalculada — divergência tem de ser 0
-- -----------------------------------------------------------------------------
\if :ehpos

select
  count(*) as divergencias_da_previsao
from curadoria.professional_profiles p
where coalesce(p.ciclo_de_vida::text, '(PERMANECE NULL)') is distinct from
      case
        when p.is_demo or p.is_test_fixture                                   then 'PREPARACAO'
        when p.ciclo_de_vida is not null and p.ciclo_de_vida <> 'PREPARACAO'
             and not (p.status = 'ativo' and p.publication_status = 'publicado')
             and p.ciclo_de_vida <> 'PUBLICADO_ATIVO'                         then p.ciclo_de_vida::text
        when p.status = 'ativo' and p.publication_status = 'publicado'        then 'PUBLICADO_ATIVO'
        when p.publication_status = 'nao_publicado'
             and p.ciclo_de_vida is null                                      then '(PERMANECE NULL)'
        when p.publication_status = 'nao_publicado'                           then p.ciclo_de_vida::text
        else '(PERMANECE NULL)'
      end;

-- O detector de desvio dos dois eixos — o mesmo que originou o Corte 7. Depois
-- da publicação e da ressincronização, tem de ser ZERO.
select count(*) as desvio_ciclo_vs_legado
  from curadoria.professional_profiles
 where (ciclo_de_vida = 'PUBLICADO_ATIVO') is distinct from
       (status = 'ativo' and publication_status = 'publicado');

-- Contagem total para conferir contra o inventário prévio — nenhuma linha pode
-- ter sumido.
select coalesce(ciclo_de_vida::text, '(NULL)') as ciclo, count(*)
  from curadoria.professional_profiles
 group by 1
 order by 2 desc;

\endif
