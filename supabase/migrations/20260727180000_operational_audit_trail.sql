-- EPIC-20: audit trail operacional (append-only)

create table if not exists public.operational_audit_events (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  jornada_id uuid null references public.journeys(id) on delete set null,
  patient_id uuid null references public.patients(id) on delete set null,
  curator_id uuid null references public.profiles(id) on delete set null,
  actor_id uuid null,
  actor_role text not null check (actor_role in ('STAFF', 'PATIENT', 'SYSTEM')),
  resultado text not null check (resultado in ('SUCESSO', 'FALHA')),
  error_code text null,
  duration_ms integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists operational_audit_events_occurred_at_idx
  on public.operational_audit_events (occurred_at desc);

create index if not exists operational_audit_events_jornada_id_idx
  on public.operational_audit_events (jornada_id);

create index if not exists operational_audit_events_correlation_id_idx
  on public.operational_audit_events (correlation_id);

alter table public.operational_audit_events enable row level security;

create policy "operational_audit_events_select_staff"
  on public.operational_audit_events for select
  to authenticated
  using (public.is_active_staff());

create policy "operational_audit_events_insert_authenticated"
  on public.operational_audit_events for insert
  to authenticated
  with check (
    actor_role = 'SYSTEM'
    or (actor_role = 'STAFF' and actor_id = auth.uid() and public.is_active_staff())
    or (actor_role = 'PATIENT' and actor_id = auth.uid())
  );

revoke update, delete on public.operational_audit_events from authenticated;
revoke update, delete on public.operational_audit_events from anon;
