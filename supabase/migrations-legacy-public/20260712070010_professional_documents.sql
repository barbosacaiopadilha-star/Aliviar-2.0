-- SPRINT OPERACIONAL 1: metadados de documentos do profissional (diploma,
-- certificado, comprovante) + bucket de storage privado. Gestão é
-- exclusivamente administrativa nesta sprint (mesmo padrão de
-- professional_profiles: "a equipe Aliviar seleciona, cria, valida,
-- atualiza" — 20260712050010) — não há upload por autocadastro do
-- profissional. O profissional só enxerga a lista de metadados dos
-- próprios documentos (leitura), nunca escreve nem acessa o arquivo
-- diretamente via storage nesta sprint.

create table public.professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references public.professional_profiles (id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  content_type text,
  file_size bigint,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint professional_documents_file_name_not_blank check (btrim(file_name) <> '')
);

comment on table public.professional_documents is 'Metadados de documentos administrativos do profissional (SPRINT OPERACIONAL 1). O arquivo em si vive no bucket de storage "professional-documents"; upload/remoção são exclusivamente administrativos nesta sprint.';

create index professional_documents_professional_profile_id_idx on public.professional_documents (professional_profile_id);

alter table public.professional_documents enable row level security;

grant select, insert, delete on public.professional_documents to authenticated;
grant all on public.professional_documents to service_role;

-- Leitura: administrador vê todos; profissional (quando já houver conta
-- vinculada) só vê os próprios documentos, mesmo padrão de
-- professional_profiles_select_admin_or_own.
create policy "professional_documents_select_admin_or_own" on public.professional_documents
  for select
  to authenticated
  using (
    public.has_role('administrador')
    or exists (
      select 1 from public.professional_profiles pp
      where pp.id = professional_documents.professional_profile_id
        and pp.profile_id = auth.uid()
    )
  );

-- Escrita: só administrador, e sempre se registrando como uploaded_by.
create policy "professional_documents_insert_admin_only" on public.professional_documents
  for insert
  to authenticated
  with check (public.has_role('administrador') and uploaded_by = auth.uid());

create policy "professional_documents_delete_admin_only" on public.professional_documents
  for delete
  to authenticated
  using (public.has_role('administrador'));

-- Bucket privado de storage — nenhum acesso público, nenhuma URL assinada
-- de longa duração nesta sprint.
insert into storage.buckets (id, name, public)
values ('professional-documents', 'professional-documents', false)
on conflict (id) do nothing;

-- Storage: só administrador lê/escreve/remove objetos deste bucket nesta
-- sprint — o profissional não acessa o arquivo diretamente ainda (só os
-- metadados, via professional_documents acima).
create policy "professional_documents_storage_admin_only" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'professional-documents' and public.has_role('administrador'))
  with check (bucket_id = 'professional-documents' and public.has_role('administrador'));
