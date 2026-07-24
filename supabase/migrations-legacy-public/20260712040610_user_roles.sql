-- TASK-003: associação N:N pessoa-papel (ADR-006) + função de checagem de papel.

create table public.user_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_id smallint not null references public.roles (id) on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  primary key (profile_id, role_id)
);

comment on table public.user_roles is 'Concede um papel a uma pessoa (ADR-006). Concessão/revogação é auditada em public.audit_logs (ver 20260712040620).';

create index user_roles_role_id_idx on public.user_roles (role_id);

-- Função central de checagem de papel, usada nas policies de RLS.
-- security definer: evita recursão de RLS ao consultar user_roles/roles
-- de dentro de uma policy sobre a própria user_roles (padrão recomendado
-- pela Supabase para funções auxiliares de autorização).
create or replace function public.has_role(_role_slug text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.profile_id = auth.uid()
      and r.slug = _role_slug
  );
$$;

comment on function public.has_role(text) is 'Checa se o usuário autenticado possui o papel informado (por slug). Usado nas policies de RLS — não confiar em checagem equivalente feita só no cliente.';
