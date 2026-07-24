-- SPRINT PRODUTO 2: perfil do paciente (dados não-clínicos). Histórias,
-- documentos de saúde e Casos pertencem aos módulos próprios (ACE/story),
-- nunca a este cadastro (docs/PRODUCT_ARCHITECTURE.md, seção 11).
--
-- Sem data de nascimento: verificado antes desta migration que nenhum
-- documento aprovado já previa esse campo — só será adicionado quando
-- houver essa decisão explícita de produto.
--
-- "nome" não é duplicado aqui: já vive em public.profiles.display_name.
-- "preferências de comunicação" não ganham coluna própria: vivem dentro de
-- public.user_settings.preferences (jsonb genérico já existente), com forma
-- tipada no app (src/modules/profiles/types.ts) — evita migração estrutural
-- para uma preferência de UI.

create table public.patient_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  city text,
  state text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_state_uf_format check (state is null or state ~ '^[A-Z]{2}$')
);

comment on table public.patient_profiles is 'Dados complementares não-clínicos do paciente (SPRINT PRODUTO 2). Nome vive em public.profiles.display_name; preferências de comunicação vivem em public.user_settings.preferences. Nunca contém dado clínico, história ou Caso — esses pertencem aos módulos story/ace.';

create trigger set_patient_profiles_updated_at
  before update on public.patient_profiles
  for each row
  execute function public.set_updated_at();

alter table public.patient_profiles enable row level security;

-- GRANT de base (Supabase não concede automaticamente — ver nota já
-- registrada em 20260712040650_rls_policies.sql).
grant select, insert, update on public.patient_profiles to authenticated;
grant all on public.patient_profiles to service_role;

-- Paciente só lê/escreve o próprio perfil. Administrador lê para suporte
-- operacional — nunca escreve em nome do paciente nesta sprint (não
-- solicitado; evita inventar uma capacidade além do necessário).
create policy "patient_profiles_select_own_or_admin" on public.patient_profiles
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'));

-- Exige também o papel "paciente" (não só posse do próprio id) — evita que
-- uma conta de outro papel (profissional/administrador) acabe com uma
-- linha aqui por acesso direto à API, contornando a aplicação.
create policy "patient_profiles_insert_own" on public.patient_profiles
  for insert
  to authenticated
  with check (profile_id = auth.uid() and public.has_role('paciente'));

create policy "patient_profiles_update_own" on public.patient_profiles
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and public.has_role('paciente'));

-- Sem policy de DELETE: desativação é sempre via status = 'inativo', nunca
-- exclusão de linha (mesma convenção de public.profiles.deleted_at).
