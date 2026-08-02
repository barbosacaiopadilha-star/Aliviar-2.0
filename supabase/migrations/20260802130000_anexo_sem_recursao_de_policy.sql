-- ============================================================================
-- ANEXAR DOCUMENTO À HISTÓRIA — quebrando a recursão de policy
-- (Release de Reconstrução, ETAPA 9)
--
-- Defeito capturado no E2E do fluxo completo: ao anexar um documento à própria
-- história, a paciente recebia "Não foi possível anexar o documento."
-- A causa real, que só apareceu porque a ETAPA 2 passou a preservar o erro
-- de origem:
--
--   ERRO 42P17 — infinite recursion detected in policy for relation
--                "patient_story_attachments"
--
-- O ciclo:
--   INSERT em patient_story_attachments
--     → WITH CHECK consulta patient_documents
--       → policy patient_documents_select_assigned_curator consulta
--         patient_story_attachments
--         → policy de SELECT de patient_story_attachments … e volta ao começo.
--
-- Duas tabelas se protegendo uma pela outra, em círculo. O documento até era
-- criado (o upload em si funcionava), mas o vínculo com a história nunca —
-- ou seja, o anexo sumia sem que ninguém soubesse por quê.
--
-- A correção é a mesma técnica que `is_case_curator_for_story` já usava:
-- encapsular a consulta que fecha o ciclo numa função SECURITY DEFINER, que
-- avalia a pertença SEM reentrar na RLS da tabela de anexos. A regra de
-- negócio não muda em nada: o Curador designado continua vendo os documentos
-- anexados às histórias dos Cases dele, e mais ninguém.
-- ============================================================================

create or replace function curadoria.documento_esta_em_case_do_curador(_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, public
as $$
  select exists (
    select 1
      from curadoria.patient_story_attachments psa
     where psa.document_id = _document_id
       and curadoria.is_case_curator_for_story(psa.story_id)
  );
$$;

comment on function curadoria.documento_esta_em_case_do_curador(uuid) is
  'Responde se o documento esta anexado a alguma historia de Case conduzido por quem pergunta. SECURITY DEFINER de proposito: le patient_story_attachments sem reentrar na RLS dela, que e o que produzia recursao infinita (42P17) ao anexar um documento. Devolve apenas booleano — nao expoe linha alguma.';

revoke all on function curadoria.documento_esta_em_case_do_curador(uuid) from public;
grant execute on function curadoria.documento_esta_em_case_do_curador(uuid) to authenticated;

drop policy if exists "patient_documents_select_assigned_curator" on curadoria.patient_documents;

create policy "patient_documents_select_assigned_curator"
  on curadoria.patient_documents for select to authenticated
  using (curadoria.documento_esta_em_case_do_curador(id));
