-- PORTAL DO PACIENTE: documentos do próprio paciente — diferente de
-- professional_documents (20260712070010, gestão exclusivamente
-- administrativa), aqui o paciente já gerencia os próprios arquivos
-- (mesmo espírito de autosserviço já existente em patient_profiles: o
-- paciente lê/escreve o que é seu). Administrador mantém visão de leitura
-- (apoio/operação), nunca escreve em nome do paciente aqui.

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  content_type text,
  file_size bigint,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint patient_documents_file_name_not_blank check (btrim(file_name) <> '')
);

comment on table public.patient_documents is 'Metadados de documentos enviados pelo próprio paciente (SPRINT PORTAL DO PACIENTE). O arquivo em si vive no bucket de storage "patient-documents", em uma pasta por profile_id.';

create index patient_documents_profile_id_idx on public.patient_documents (profile_id);

alter table public.patient_documents enable row level security;

grant select, insert, delete on public.patient_documents to authenticated;
grant all on public.patient_documents to service_role;

create policy "patient_documents_select_own_or_admin" on public.patient_documents
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'));

create policy "patient_documents_insert_own" on public.patient_documents
  for insert
  to authenticated
  with check (profile_id = auth.uid() and uploaded_by = auth.uid());

create policy "patient_documents_delete_own_or_admin" on public.patient_documents
  for delete
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'));

-- Bucket privado, organizado em uma pasta por profile_id
-- ({profile_id}/{arquivo}) — a policy de storage abaixo usa
-- storage.foldername(name) para checar que o primeiro segmento do caminho
-- é o próprio auth.uid(), sem precisar de tabela auxiliar.
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

create policy "patient_documents_storage_own_or_admin" on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'patient-documents'
    and (public.has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text)
  )
  with check (
    bucket_id = 'patient-documents'
    and (public.has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text)
  );
