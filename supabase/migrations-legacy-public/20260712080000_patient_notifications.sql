-- PORTAL DO PACIENTE: notificações reais para o paciente — nunca uma tela
-- vazia fria. Duas fontes: (1) boas-vindas automáticas ao conceder o papel
-- "paciente" (trigger abaixo); (2) ações administrativas existentes que já
-- afetam o paciente (ver src/modules/profiles/patient-account-actions.ts,
-- alteradas para chamar create_patient_notification após sucesso). Nenhum
-- dado fictício: só evento que realmente aconteceu gera notificação.

create table public.patient_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint patient_notifications_title_not_blank check (btrim(title) <> ''),
  constraint patient_notifications_body_not_blank check (btrim(body) <> '')
);

comment on table public.patient_notifications is 'Notificações reais do paciente (SPRINT PORTAL DO PACIENTE) — geradas por eventos que de fato aconteceram (boas-vindas, ação administrativa), nunca fabricadas para preencher a tela.';

create index patient_notifications_profile_id_idx on public.patient_notifications (profile_id);
create index patient_notifications_created_at_idx on public.patient_notifications (created_at desc);

alter table public.patient_notifications enable row level security;

grant select, insert, update on public.patient_notifications to authenticated;
grant all on public.patient_notifications to service_role;

-- Leitura: o próprio paciente ou administrador.
create policy "patient_notifications_select_own_or_admin" on public.patient_notifications
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'));

-- Escrita (criação): só administrador — o paciente nunca cria a própria
-- notificação, só marca como lida (policy de update abaixo).
create policy "patient_notifications_insert_admin_only" on public.patient_notifications
  for insert
  to authenticated
  with check (public.has_role('administrador'));

-- Atualização: o próprio paciente pode marcar como lida; o trigger abaixo
-- reverte qualquer tentativa de alterar título/corpo/dono por quem não é
-- administrador, então esta policy só precisa garantir que a pessoa só
-- toca a própria linha.
create policy "patient_notifications_update_own_or_admin" on public.patient_notifications
  for update
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'))
  with check (profile_id = auth.uid() or public.has_role('administrador'));

create or replace function public.protect_patient_notification_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('administrador') then
    new.title := old.title;
    new.body := old.body;
    new.profile_id := old.profile_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

comment on function public.protect_patient_notification_content() is 'Garante que um paciente só consiga alterar read_at da própria notificação — qualquer tentativa de mudar título/corpo/dono é silenciosamente revertida quando quem executa não é administrador.';

create trigger protect_patient_notification_content_trigger
  before update on public.patient_notifications
  for each row
  execute function public.protect_patient_notification_content();

-- Boas-vindas automáticas: dispara junto com o trigger já existente
-- log_user_role_change (20260712040620) — Postgres executa ambos os
-- triggers de AFTER INSERT em user_roles, sem conflito entre eles.
create or replace function public.notify_patient_welcome()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role_slug text;
begin
  select slug into _role_slug from public.roles where id = new.role_id;

  if _role_slug = 'paciente' then
    insert into public.patient_notifications (profile_id, title, body)
    values (
      new.profile_id,
      'Bem-vindo à Aliviar',
      'Sua conta foi criada. A partir de agora você pode acompanhar sua jornada por aqui, no seu tempo — sem pressa.'
    );
  end if;

  return new;
end;
$$;

create trigger notify_patient_welcome_on_role_grant
  after insert on public.user_roles
  for each row
  execute function public.notify_patient_welcome();
