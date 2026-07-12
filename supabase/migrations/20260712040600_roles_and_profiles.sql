-- TASK-003: fundação de identidade — catálogo de papéis (ADR-006) e perfis.
-- Papéis são modelados como catálogo + associação N:N (ver 20260712040610),
-- não como enum fixo, para permitir novos papéis por dado, sem migration
-- estrutural (ADR-006 em docs/DECISIONS.md).

-- Função utilitária: mantém updated_at em qualquer tabela que a use.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Catálogo de papéis.
create table public.roles (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.roles is 'Catálogo de papéis do sistema (ADR-006). Novos papéis são adicionados por dado (INSERT via migration), nunca por enum.';

create trigger set_roles_updated_at
  before update on public.roles
  for each row
  execute function public.set_updated_at();

-- Papéis iniciais do MVP (ADR-004, ADR-006), nesta ordem de prioridade.
insert into public.roles (slug, name) values
  ('administrador', 'Administrador'),
  ('profissional', 'Profissional'),
  ('paciente', 'Paciente');

-- Perfil base, 1:1 com auth.users. Sem coluna fixa de papel (ADR-006).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint display_name_not_blank check (display_name is null or btrim(display_name) <> '')
);

comment on table public.profiles is 'Identidade base de uma pessoa (ADR-006). Papel é definido via public.user_roles, não aqui. deleted_at é soft delete: desativa o perfil sem apagar histórico relacionado (auditoria, conexões futuras) nem a conta de auth.';

create index profiles_deleted_at_idx on public.profiles (deleted_at) where deleted_at is not null;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
