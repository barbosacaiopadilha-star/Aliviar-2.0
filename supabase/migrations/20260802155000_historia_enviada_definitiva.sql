-- ============================================================================
-- BLOCO C / ETAPA 2 — HISTÓRIA ENVIADA É DEFINITIVA (gate C1)
-- ============================================================================
--
-- FINALIDADE
--   A história enviada é o primeiro fato da jornada da paciente — é dela que
--   nascem o Case e a Curadoria inteira. O trigger vigente
--   (`track_patient_story_revision`, stage 3) protege só o campo `data`: a
--   própria paciente, por PostgREST com sessão legítima, ainda conseguia
--   regredir `status` de 'enviada' para 'rascunho' (e, uma vez em rascunho,
--   editar tudo), além de reescrever `submitted_at` e `current_step` sem que
--   nada recusasse. Esta migration fecha os buracos: 'enviada' é estado
--   TERMINAL (ADR-048; correção é uma nova história — ADR-051), e o conteúdo
--   da história enviada congela por inteiro (`data`, `current_step`,
--   `submitted_at`, `profile_id`, `created_by`, `created_at`).
--
--   Nenhuma mudança de superfície: `saveStoryDraft` já devolve erro real
--   quando o banco recusa ("Não foi possível salvar agora."), e o pré-check
--   de status em `src/modules/story/repository.ts` continua explicando
--   primeiro. A recusa nova é a garantia, não a mensagem.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.patient_stories` existente (stage 3), status restrito por
--     CHECK a ('rascunho','enviada') — não há estado pós-'enviada' legítimo.
--   - Trigger `track_patient_story_revision_trigger` vigente e preservado
--     (revision/submitted_at/proteção de `data` continuam com ele; este
--     trigger é aditivo e dispara ANTES por ordem alfabética de nome).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada ou reavaliada.
--   - As 27 histórias 'enviada' locais permanecem como estão: a proteção é de
--     TRANSIÇÃO futura (UPDATE), nunca de estado parado.
--   - INSERTs não são examinados: fixtures que criam histórias já 'enviada'
--     (estado histórico preparado) continuam válidas.
--   - DELETE não é examinado: a limpeza por inventário da suíte remove
--     histórias sintéticas por DELETE, e cascatas de conta/perfil continuam
--     passando.
--
-- PROVA DE FECHAMENTO
--   - Gate C1 (tests/remediacao/imutabilidade.integration.test.ts): a própria
--     paciente, com sessão real, tenta 'enviada' -> 'rascunho' e o banco
--     recusa; o status permanece 'enviada'.
--   - Suíte adjacente segue verde: patient-stories, historia-unica-por-
--     paciente, resolucao-de-historia, consolidacao-rascunhos-duplicados
--     (nenhuma delas faz UPDATE em história enviada).
--
-- ROLLBACK
--   drop trigger if exists assert_submitted_story_immutable_trigger
--     on curadoria.patient_stories;
--   drop function if exists curadoria.assert_submitted_story_immutable();
-- ============================================================================

create or replace function curadoria.assert_submitted_story_immutable()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if old.status = 'enviada' then
    if new.status is distinct from old.status then
      raise exception
        'História enviada é definitiva: ela não volta a rascunho. Corrigir algo é contar uma nova história.'
        using errcode = '23514';
    end if;

    if new.data is distinct from old.data
       or new.current_step is distinct from old.current_step
       or new.submitted_at is distinct from old.submitted_at
       or new.profile_id is distinct from old.profile_id
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at then
      raise exception
        'Esta história já foi enviada e não pode mais ser editada.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

comment on function curadoria.assert_submitted_story_immutable() is
  'Bloco C/C1 (ADR-048/051): história com status enviada é terminal — o status não regride e o conteúdo (data, current_step, submitted_at, autoria, carimbos) congela. Complementa track_patient_story_revision, que só protegia data. Correção legítima é uma nova história, nunca a reescrita da enviada.';

revoke execute on function curadoria.assert_submitted_story_immutable() from public;

drop trigger if exists assert_submitted_story_immutable_trigger
  on curadoria.patient_stories;
create trigger assert_submitted_story_immutable_trigger
  before update on curadoria.patient_stories
  for each row execute function curadoria.assert_submitted_story_immutable();
