-- EPIC-23: comunicação da jornada — notificações derivadas da Jornada

create table if not exists public.patient_notifications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  tipo text not null check (
    tipo in (
      'DOCUMENTOS_RECEBIDOS',
      'DOCUMENTOS_PENDENTES',
      'CURADORIA_INICIADA',
      'CURADORIA_CONCLUIDA',
      'ENTREGA_DISPONIVEL',
      'ESCOLHA_REGISTRADA',
      'ACOMPANHAMENTO_INICIADO'
    )
  ),
  titulo text not null,
  mensagem text not null,
  prioridade text not null check (prioridade in ('BAIXA', 'NORMAL', 'ALTA')),
  origem text not null check (
    origem in ('JORNADA', 'DOCUMENTO', 'ENTREGA', 'ESCOLHA', 'ACOMPANHAMENTO')
  ),
  lida boolean not null default false,
  lida_em timestamptz null,
  referencia_tipo text null check (
    referencia_tipo is null
    or referencia_tipo in ('ETAPA', 'DOCUMENTO', 'ENTREGA', 'ESCOLHA', 'ACOMPANHAMENTO')
  ),
  referencia_id text null,
  source_event_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  criada_em timestamptz not null default now(),
  unique (patient_id, source_event_key)
);

create index if not exists patient_notifications_patient_idx
  on public.patient_notifications (patient_id, criada_em desc);

create index if not exists patient_notifications_journey_idx
  on public.patient_notifications (journey_id, criada_em desc);

create index if not exists patient_notifications_lida_idx
  on public.patient_notifications (patient_id, lida, criada_em desc);

create table if not exists public.patient_notification_preferences (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  receber_email boolean not null default true,
  receber_whatsapp boolean not null default false,
  somente_plataforma boolean not null default false,
  atualizado_em timestamptz not null default now()
);

create trigger patient_notification_preferences_set_updated_at
  before update on public.patient_notification_preferences
  for each row execute function public.set_updated_at();

alter table public.patient_notifications enable row level security;
alter table public.patient_notification_preferences enable row level security;

create policy "patient_notifications_select_owner"
  on public.patient_notifications for select
  to authenticated
  using (public.is_patient_owner(patient_id));

create policy "patient_notifications_update_read_owner"
  on public.patient_notifications for update
  to authenticated
  using (public.is_patient_owner(patient_id))
  with check (public.is_patient_owner(patient_id));

create policy "patient_notifications_insert_staff"
  on public.patient_notifications for insert
  to authenticated
  with check (public.is_active_staff());

create policy "patient_notification_preferences_select_owner"
  on public.patient_notification_preferences for select
  to authenticated
  using (public.is_patient_owner(patient_id));

create policy "patient_notification_preferences_upsert_owner"
  on public.patient_notification_preferences for all
  to authenticated
  using (public.is_patient_owner(patient_id))
  with check (public.is_patient_owner(patient_id));

create policy "patient_notification_preferences_insert_staff"
  on public.patient_notification_preferences for insert
  to authenticated
  with check (public.is_active_staff());
