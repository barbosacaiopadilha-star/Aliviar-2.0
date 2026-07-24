-- TASK-003: RLS em todas as tabelas da fundação. A aplicação nunca é a
-- fronteira de autorização (docs/ENGINEERING_PLAN.md, seção 8) — toda regra
-- abaixo é reforçada no banco, não apenas checada no cliente.
--
-- Convenção geral: nenhuma tabela tem DELETE liberado para authenticated;
-- exclusão de dado real acontece via soft delete (profiles.deleted_at) ou
-- via papel de administrador quando fizer sentido (user_roles). Onde não há
-- policy para uma operação, o Postgres nega por padrão — isso é intencional
-- em vários casos abaixo (ex.: ninguém além do trigger escreve em audit_logs).

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_settings enable row level security;

-- GRANT de base. No Supabase, tabelas novas não herdam automaticamente
-- privilégio de SELECT/INSERT/UPDATE/DELETE para anon/authenticated (só
-- TRUNCATE/REFERENCES/TRIGGER) — RLS restringe linhas, mas o GRANT de
-- operação precisa existir antes da policy ter qualquer efeito. `anon` não
-- recebe grant em nenhuma tabela aqui: nenhuma policy abaixo é `to anon`,
-- então não há necessidade de acesso não autenticado nesta fundação.
grant select on public.roles to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.user_roles to authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert, update on public.user_settings to authenticated;

grant all on public.roles, public.profiles, public.user_roles, public.audit_logs, public.user_settings
  to service_role;

-- roles: catálogo estático, leitura liberada para qualquer autenticado.
-- Escrita (novos papéis) só acontece via migration (ADR-006), nunca pelo app.
create policy "roles_select_authenticated" on public.roles
  for select
  to authenticated
  using (true);

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.has_role('administrador'));

create policy "profiles_insert_own" on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own_or_admin" on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.has_role('administrador'))
  with check (auth.uid() = id or public.has_role('administrador'));

-- Sem policy de DELETE em profiles: exclusão real só via exclusão da conta
-- em auth.users (cascade), nunca por um DELETE direto vindo do app.

-- user_roles: só administrador concede/revoga; cada pessoa só enxerga
-- os próprios papéis (ou todos, se for administrador).
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'));

create policy "user_roles_insert_admin_only" on public.user_roles
  for insert
  to authenticated
  with check (public.has_role('administrador'));

create policy "user_roles_delete_admin_only" on public.user_roles
  for delete
  to authenticated
  using (public.has_role('administrador'));

-- Sem policy de UPDATE em user_roles: concessão é imutável (revoga + concede
-- de novo em vez de atualizar uma linha existente).

-- audit_logs: só administrador lê; ninguém escreve diretamente (só o
-- trigger security definer de log_user_role_change escreve).
create policy "audit_logs_select_admin_only" on public.audit_logs
  for select
  to authenticated
  using (public.has_role('administrador'));

-- user_settings: só a própria pessoa acessa suas preferências.
create policy "user_settings_select_own" on public.user_settings
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "user_settings_insert_own" on public.user_settings
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "user_settings_update_own" on public.user_settings
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
