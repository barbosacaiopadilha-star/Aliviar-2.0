-- EPIC-21: governança operacional — configuração, feature flags, RBAC AUDITOR

do $$ begin
  alter type public.user_role add value 'AUDITOR';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.system_configuration (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rollout_percentage integer not null default 0 check (rollout_percentage between 0 and 100),
  description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.system_configuration (key, value) values
  ('sla_policies', '[
    {"fila":"PRIMEIRO_CONTATO","tempo_esperado_horas":24,"tempo_limite_horas":48,"responsavel":"EQUIPE_ALIVIAR"},
    {"fila":"DOCUMENTACAO","tempo_esperado_horas":48,"tempo_limite_horas":72,"responsavel":"ACE"},
    {"fila":"CURADORIA","tempo_esperado_horas":72,"tempo_limite_horas":120,"responsavel":"CURADOR"},
    {"fila":"ENTREGA","tempo_esperado_horas":24,"tempo_limite_horas":48,"responsavel":"PACIENTE"},
    {"fila":"ACOMPANHAMENTO","tempo_esperado_horas":168,"tempo_limite_horas":336,"responsavel":"EQUIPE_ALIVIAR"}
  ]'::jsonb),
  ('upload_limits', '{"max_bytes":10485760,"allowed_mime_types":["application/pdf","image/jpeg","image/png","image/webp"]}'::jsonb),
  ('maintenance', '{"enabled":false,"message":""}'::jsonb),
  ('global_messages', '{"banner":null}'::jsonb)
on conflict (key) do nothing;

insert into public.feature_flags (key, enabled, rollout_percentage, description) values
  ('patient_portal', true, 100, 'Portal do paciente'),
  ('curator_portal', true, 100, 'Portal do curador'),
  ('operational_panel', true, 100, 'Painel operacional')
on conflict (key) do nothing;

alter table public.system_configuration enable row level security;
alter table public.feature_flags enable row level security;

create policy "system_configuration_select_staff"
  on public.system_configuration for select
  to authenticated
  using (public.is_active_staff());

create policy "system_configuration_write_admin"
  on public.system_configuration for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN' and p.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN' and p.is_active = true
    )
  );

create policy "feature_flags_select_staff"
  on public.feature_flags for select
  to authenticated
  using (public.is_active_staff());

create policy "feature_flags_write_admin"
  on public.feature_flags for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN' and p.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN' and p.is_active = true
    )
  );

create policy "operational_audit_events_select_admin_auditor"
  on public.operational_audit_events for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_active = true
        and p.role in ('ADMIN', 'AUDITOR')
    )
  );
