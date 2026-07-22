-- EPIC-25: ACE Melhorado — persistência de análises estruturadas

create table if not exists public.ace_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  ace_version text not null default '2.0.0',
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb null,
  status text not null check (status in ('INICIADO', 'CONCLUIDO', 'PARCIAL', 'FALHA')),
  duration_ms integer not null default 0,
  correlation_id text not null,
  retries integer not null default 0,
  triggered_by text not null check (triggered_by in ('UPLOAD', 'STAFF', 'SISTEMA')),
  actor_id uuid null references public.profiles (id) on delete set null,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz null
);

create index if not exists ace_analysis_runs_journey_idx
  on public.ace_analysis_runs (journey_id, iniciado_em desc);

create index if not exists ace_analysis_runs_correlation_idx
  on public.ace_analysis_runs (correlation_id);

alter table public.ace_analysis_runs enable row level security;

create policy "ace_analysis_runs_staff_select"
  on public.ace_analysis_runs for select
  to authenticated
  using (public.is_active_staff());

create policy "ace_analysis_runs_staff_insert"
  on public.ace_analysis_runs for insert
  to authenticated
  with check (public.is_active_staff() or triggered_by = 'UPLOAD');

create policy "ace_analysis_runs_patient_select_own"
  on public.ace_analysis_runs for select
  to authenticated
  using (public.is_patient_owner(patient_id));
