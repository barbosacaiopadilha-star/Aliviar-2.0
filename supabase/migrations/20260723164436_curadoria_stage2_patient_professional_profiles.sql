-- patient_profiles
create table curadoria.patient_profiles (
  profile_id uuid primary key references curadoria.profiles (id) on delete cascade,
  phone text, city text, state text,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_state_uf_format check (state is null or state ~ '^[A-Z]{2}$')
);
create trigger set_patient_profiles_updated_at before update on curadoria.patient_profiles for each row execute function curadoria.set_updated_at();
alter table curadoria.patient_profiles enable row level security;
grant select, insert, update on curadoria.patient_profiles to authenticated;
grant all on curadoria.patient_profiles to service_role;
create policy "patient_profiles_select_own_or_admin" on curadoria.patient_profiles for select to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador'));
create policy "patient_profiles_insert_own" on curadoria.patient_profiles for insert to authenticated with check (profile_id = auth.uid() and curadoria.has_role('paciente'));
create policy "patient_profiles_update_own" on curadoria.patient_profiles for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid() and curadoria.has_role('paciente'));
create policy "patient_profiles_insert_admin" on curadoria.patient_profiles for insert to authenticated with check (curadoria.has_role('administrador'));
create policy "patient_profiles_update_admin" on curadoria.patient_profiles for update to authenticated using (curadoria.has_role('administrador')) with check (curadoria.has_role('administrador'));

-- professional_profiles (com campos de competência do ACE embutidos)
create table curadoria.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references curadoria.profiles (id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  publication_status text not null default 'nao_publicado' check (publication_status in ('publicado','nao_publicado')),
  display_name text not null,
  professional_identifier text not null,
  crm text, crm_uf text, professional_summary text, institution_name text,
  experience_level text check (experience_level in ('geral','experiente','altamente_experiente')),
  intake_approach text check (intake_approach in ('conexao_direta','aprofundamento_previo','avaliacao_inicial','ambos')),
  offers_continuous_care boolean,
  availability_window text check (availability_window in ('flexible','limited','unavailable_soon')),
  created_by uuid not null references curadoria.profiles (id),
  updated_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_display_name_not_blank check (btrim(display_name) <> ''),
  constraint professional_identifier_not_blank check (btrim(professional_identifier) <> ''),
  constraint professional_crm_uf_format check (crm_uf is null or crm_uf ~ '^[A-Z]{2}$')
);
create unique index professional_profiles_profile_id_key on curadoria.professional_profiles (profile_id) where profile_id is not null;
create index professional_profiles_status_idx on curadoria.professional_profiles (status);
create index professional_profiles_publication_status_idx on curadoria.professional_profiles (publication_status);
create trigger set_professional_profiles_updated_at before update on curadoria.professional_profiles for each row execute function curadoria.set_updated_at();
alter table curadoria.professional_profiles enable row level security;
grant select, insert, update on curadoria.professional_profiles to authenticated;
grant all on curadoria.professional_profiles to service_role;
create policy "professional_profiles_select_admin_or_own" on curadoria.professional_profiles for select to authenticated using (curadoria.has_role('administrador') or profile_id = auth.uid());
create policy "professional_profiles_insert_admin_only" on curadoria.professional_profiles for insert to authenticated with check (curadoria.has_role('administrador') and created_by = auth.uid());
create policy "professional_profiles_update_admin_only" on curadoria.professional_profiles for update to authenticated using (curadoria.has_role('administrador')) with check (curadoria.has_role('administrador') and updated_by = auth.uid());

-- professional_competency_areas
create table curadoria.professional_competency_areas (
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  domain text not null check (domain in ('saude_emocional_mental','saude_fisica','nao_determinado')),
  focus text not null check (focus in ('avaliacao','intervencao','acompanhamento_continuo','esclarecimento')),
  created_at timestamptz not null default now(),
  primary key (professional_profile_id, domain, focus)
);
create index professional_competency_areas_domain_idx on curadoria.professional_competency_areas (domain);
alter table curadoria.professional_competency_areas enable row level security;
grant select, insert, update, delete on curadoria.professional_competency_areas to authenticated;
grant all on curadoria.professional_competency_areas to service_role;
create policy "professional_competency_areas_select_admin_or_own" on curadoria.professional_competency_areas for select to authenticated using (curadoria.has_role('administrador') or exists (select 1 from curadoria.professional_profiles pp where pp.id = professional_competency_areas.professional_profile_id and pp.profile_id = auth.uid()));
create policy "professional_competency_areas_write_admin_only" on curadoria.professional_competency_areas for all to authenticated using (curadoria.has_role('administrador')) with check (curadoria.has_role('administrador'));

-- professional_documents (+ bucket privado + storage policy escopado)
create table curadoria.professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  content_type text,
  file_size bigint,
  uploaded_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  constraint professional_documents_file_name_not_blank check (btrim(file_name) <> '')
);
create index professional_documents_professional_profile_id_idx on curadoria.professional_documents (professional_profile_id);
alter table curadoria.professional_documents enable row level security;
grant select, insert, delete on curadoria.professional_documents to authenticated;
grant all on curadoria.professional_documents to service_role;
create policy "professional_documents_select_admin_or_own" on curadoria.professional_documents for select to authenticated using (curadoria.has_role('administrador') or exists (select 1 from curadoria.professional_profiles pp where pp.id = professional_documents.professional_profile_id and pp.profile_id = auth.uid()));
create policy "professional_documents_insert_admin_only" on curadoria.professional_documents for insert to authenticated with check (curadoria.has_role('administrador') and uploaded_by = auth.uid());
create policy "professional_documents_delete_admin_only" on curadoria.professional_documents for delete to authenticated using (curadoria.has_role('administrador'));
insert into storage.buckets (id, name, public) values ('professional-documents','professional-documents',false) on conflict (id) do nothing;
create policy "curadoria_professional_documents_storage_admin_only" on storage.objects for all to authenticated using (bucket_id = 'professional-documents' and curadoria.has_role('administrador')) with check (bucket_id = 'professional-documents' and curadoria.has_role('administrador'));