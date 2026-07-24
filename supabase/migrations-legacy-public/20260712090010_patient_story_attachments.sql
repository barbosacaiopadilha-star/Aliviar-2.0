-- ÉPICO 1 / SPRINT 1: liga documentos já enviados pelo paciente
-- (patient_documents, SPRINT PORTAL DO PACIENTE) a uma história específica
-- — nunca um novo mecanismo de upload, reaproveita o que já existe.

create table public.patient_story_attachments (
  story_id uuid not null references public.patient_stories (id) on delete cascade,
  document_id uuid not null references public.patient_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, document_id)
);

comment on table public.patient_story_attachments is 'Junção história↔documento (ÉPICO 1/SPRINT 1) — o arquivo em si e seus metadados continuam em patient_documents; esta tabela só registra o vínculo.';

create index patient_story_attachments_document_id_idx on public.patient_story_attachments (document_id);

alter table public.patient_story_attachments enable row level security;

grant select, insert, delete on public.patient_story_attachments to authenticated;
grant all on public.patient_story_attachments to service_role;

-- Só o dono de ambos os lados (história e documento) pode ligar/desligar;
-- administrador só lê (oversight).
create policy "patient_story_attachments_select_own_or_admin" on public.patient_story_attachments
  for select
  to authenticated
  using (
    public.has_role('administrador')
    or exists (
      select 1 from public.patient_stories ps
      where ps.id = patient_story_attachments.story_id and ps.profile_id = auth.uid()
    )
  );

create policy "patient_story_attachments_insert_own" on public.patient_story_attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.patient_stories ps
      where ps.id = patient_story_attachments.story_id and ps.profile_id = auth.uid()
    )
    and exists (
      select 1 from public.patient_documents pd
      where pd.id = patient_story_attachments.document_id and pd.profile_id = auth.uid()
    )
  );

create policy "patient_story_attachments_delete_own" on public.patient_story_attachments
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.patient_stories ps
      where ps.id = patient_story_attachments.story_id and ps.profile_id = auth.uid()
    )
  );
