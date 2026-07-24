-- ÉPICO 1 / SPRINT 2: o Curador Médico atribuído a um Caso precisa ler a
-- História original e os anexos vinculados a ela — nunca de outro Caso, e
-- nunca a tabela inteira. Policies ADITIVAS (nunca substituem as já
-- existentes de patient_stories/patient_documents/patient_story_attachments
-- das sprints anteriores) — RLS é permissiva, as políticas coexistem.

create or replace function public.is_case_curator_for_story(_story_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.cases c
    where c.source_story_id = _story_id
      and c.assigned_curator_id = auth.uid()
  );
$$;

comment on function public.is_case_curator_for_story(uuid) is 'Checa se o usuário autenticado é o curador médico atribuído ao Caso originado desta História — base das policies de leitura estendida do Curador Médico (ÉPICO 1/SPRINT 2).';

create policy "patient_stories_select_assigned_curator" on public.patient_stories
  for select
  to authenticated
  using (public.is_case_curator_for_story(id));

create policy "patient_story_attachments_select_assigned_curator" on public.patient_story_attachments
  for select
  to authenticated
  using (public.is_case_curator_for_story(story_id));

create policy "patient_documents_select_assigned_curator" on public.patient_documents
  for select
  to authenticated
  using (
    exists (
      select 1 from public.patient_story_attachments psa
      where psa.document_id = patient_documents.id
        and public.is_case_curator_for_story(psa.story_id)
    )
  );

-- Storage: o Curador Médico também precisa baixar o arquivo em si, não só
-- os metadados — mesma regra aplicada ao objeto de storage.
create policy "patient_documents_storage_assigned_curator" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'patient-documents'
    and exists (
      select 1 from public.patient_documents pd
      join public.patient_story_attachments psa on psa.document_id = pd.id
      where pd.file_path = storage.objects.name
        and public.is_case_curator_for_story(psa.story_id)
    )
  );
