-- SPRINT PRODUTO 2: fundação administrativa do perfil profissional.
--
-- Princípio obrigatório desta sprint: os profissionais da Rede Aliviar não
-- se cadastram livremente. A equipe Aliviar seleciona, cria, valida,
-- atualiza, ativa e desativa os perfis profissionais — nunca um formulário
-- público. profile_id é opcional (nullable): um registro profissional pode
-- existir como cadastro administrativo antes de haver uma conta de login
-- vinculada — provisionar essa conta (convite, e-mail) não é escopo desta
-- sprint.
--
-- Não implementa ainda: busca pública, compatibilidade ACE, catálogo de
-- competências, agenda, preço, pagamento, conexão paciente-profissional,
-- autocadastro médico. `publication_status` existe como campo/gate futuro
-- para quando esses módulos existirem — nenhum código lê esse campo ainda
-- para liberar visibilidade em lugar nenhum.

create table public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  publication_status text not null default 'nao_publicado' check (publication_status in ('publicado', 'nao_publicado')),
  display_name text not null,
  professional_identifier text not null,
  crm text,
  crm_uf text,
  professional_summary text,
  institution_name text,
  created_by uuid not null references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_display_name_not_blank check (btrim(display_name) <> ''),
  constraint professional_identifier_not_blank check (btrim(professional_identifier) <> ''),
  constraint professional_crm_uf_format check (crm_uf is null or crm_uf ~ '^[A-Z]{2}$')
);

comment on table public.professional_profiles is 'Registro administrativo do profissional da Rede Aliviar (SPRINT PRODUTO 2) — criado e mantido exclusivamente por administrador, nunca por autocadastro. profile_id é opcional: pode existir antes de haver conta de login vinculada. status = presença ativa na Rede; publication_status = visibilidade futura em busca/curadoria, ainda sem nenhum efeito nesta sprint.';

create unique index professional_profiles_profile_id_key on public.professional_profiles (profile_id) where profile_id is not null;
create index professional_profiles_status_idx on public.professional_profiles (status);
create index professional_profiles_publication_status_idx on public.professional_profiles (publication_status);

create trigger set_professional_profiles_updated_at
  before update on public.professional_profiles
  for each row
  execute function public.set_updated_at();

alter table public.professional_profiles enable row level security;

grant select, insert, update on public.professional_profiles to authenticated;
grant all on public.professional_profiles to service_role;

-- Leitura: administrador vê todos os registros; um profissional (quando já
-- houver conta vinculada) só vê o próprio. Paciente não tem nenhuma policy
-- de leitura aqui — não há diretório público de profissional nesta sprint.
create policy "professional_profiles_select_admin_or_own" on public.professional_profiles
  for select
  to authenticated
  using (public.has_role('administrador') or profile_id = auth.uid());

-- Escrita: só administrador, e sempre atribuindo a si mesmo como autor da
-- ação (created_by/updated_by) — reforça "criado por"/"atualizado por" no
-- próprio banco, não apenas na aplicação.
create policy "professional_profiles_insert_admin_only" on public.professional_profiles
  for insert
  to authenticated
  with check (public.has_role('administrador') and created_by = auth.uid());

create policy "professional_profiles_update_admin_only" on public.professional_profiles
  for update
  to authenticated
  using (public.has_role('administrador'))
  with check (public.has_role('administrador') and updated_by = auth.uid());

-- Sem policy de DELETE: desativação é sempre via status = 'inativo'.
