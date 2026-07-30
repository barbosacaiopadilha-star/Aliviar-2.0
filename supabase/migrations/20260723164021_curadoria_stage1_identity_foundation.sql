create schema if not exists curadoria;
grant usage on schema curadoria to authenticated, anon, service_role;

create or replace function curadoria.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table curadoria.roles (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_roles_updated_at before update on curadoria.roles
  for each row execute function curadoria.set_updated_at();
insert into curadoria.roles (slug, name) values
  ('administrador','Administrador'),
  ('profissional','Profissional'),
  ('paciente','Paciente'),
  ('curador_medico','Curador Médico');

create table curadoria.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint display_name_not_blank check (display_name is null or btrim(display_name) <> '')
);
create index profiles_deleted_at_idx on curadoria.profiles (deleted_at) where deleted_at is not null;
create trigger set_profiles_updated_at before update on curadoria.profiles
  for each row execute function curadoria.set_updated_at();

create table curadoria.user_settings (
  profile_id uuid primary key references curadoria.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_user_settings_updated_at before update on curadoria.user_settings
  for each row execute function curadoria.set_updated_at();

create table curadoria.user_roles (
  profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  role_id smallint not null references curadoria.roles (id) on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by uuid references curadoria.profiles (id) on delete set null,
  primary key (profile_id, role_id)
);
create index user_roles_role_id_idx on curadoria.user_roles (role_id);
create or replace function curadoria.has_role(_role_slug text)
returns boolean language sql security definer set search_path = curadoria stable as $$
  select exists (
    select 1 from curadoria.user_roles ur
    join curadoria.roles r on r.id = ur.role_id
    where ur.profile_id = auth.uid() and r.slug = _role_slug
  );
$$;

create type curadoria.audit_action as enum ('role_granted','role_revoked');
create table curadoria.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references curadoria.profiles (id) on delete set null,
  action curadoria.audit_action not null,
  target_profile_id uuid references curadoria.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_target_profile_id_idx on curadoria.audit_logs (target_profile_id);
create index audit_logs_actor_id_idx on curadoria.audit_logs (actor_id);
create index audit_logs_created_at_idx on curadoria.audit_logs (created_at desc);
create or replace function curadoria.log_user_role_change()
returns trigger language plpgsql security definer set search_path = curadoria as $$
begin
  if tg_op = 'INSERT' then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(),'role_granted', new.profile_id, jsonb_build_object('role_id', new.role_id));
    return new;
  elsif tg_op = 'DELETE' then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(),'role_revoked', old.profile_id, jsonb_build_object('role_id', old.role_id));
    return old;
  end if;
  return null;
end;
$$;
create trigger log_user_roles_insert after insert on curadoria.user_roles
  for each row execute function curadoria.log_user_role_change();
create trigger log_user_roles_delete after delete on curadoria.user_roles
  for each row execute function curadoria.log_user_role_change();

alter table curadoria.roles enable row level security;
alter table curadoria.profiles enable row level security;
alter table curadoria.user_roles enable row level security;
alter table curadoria.audit_logs enable row level security;
alter table curadoria.user_settings enable row level security;

grant select on curadoria.roles to authenticated;
grant select, insert, update on curadoria.profiles to authenticated;
grant select, insert, delete on curadoria.user_roles to authenticated;
grant select on curadoria.audit_logs to authenticated;
grant select, insert, update on curadoria.user_settings to authenticated;
grant all on curadoria.roles, curadoria.profiles, curadoria.user_roles, curadoria.audit_logs, curadoria.user_settings to service_role;

create policy "roles_select_authenticated" on curadoria.roles for select to authenticated using (true);
create policy "profiles_select_own_or_admin" on curadoria.profiles for select to authenticated using (auth.uid() = id or curadoria.has_role('administrador'));
create policy "profiles_insert_own" on curadoria.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own_or_admin" on curadoria.profiles for update to authenticated using (auth.uid() = id or curadoria.has_role('administrador')) with check (auth.uid() = id or curadoria.has_role('administrador'));
create policy "user_roles_select_own_or_admin" on curadoria.user_roles for select to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador'));
create policy "user_roles_insert_admin_only" on curadoria.user_roles for insert to authenticated with check (curadoria.has_role('administrador'));
create policy "user_roles_delete_admin_only" on curadoria.user_roles for delete to authenticated using (curadoria.has_role('administrador'));
create policy "audit_logs_select_admin_only" on curadoria.audit_logs for select to authenticated using (curadoria.has_role('administrador'));
create policy "user_settings_select_own" on curadoria.user_settings for select to authenticated using (profile_id = auth.uid());
create policy "user_settings_insert_own" on curadoria.user_settings for insert to authenticated with check (profile_id = auth.uid());
create policy "user_settings_update_own" on curadoria.user_settings for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());