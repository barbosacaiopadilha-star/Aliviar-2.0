-- EPIC-17: eventos de atribuição operacional (append-only)

create table public.operational_assignment_events (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  tipo text not null check (tipo in ('ASSUMIR', 'TRANSFERIR', 'ENCERRAR')),
  de_curador_id uuid references public.profiles (id),
  para_curador_id uuid references public.profiles (id),
  motivo text,
  registrado_em timestamptz not null default now(),
  registrado_por uuid not null references public.profiles (id)
);

create index operational_assignment_events_journey_id_idx
  on public.operational_assignment_events (journey_id);

create index operational_assignment_events_registrado_em_idx
  on public.operational_assignment_events (registrado_em desc);

alter table public.operational_assignment_events enable row level security;

create policy "operational_assignment_events_select_active_staff"
  on public.operational_assignment_events for select
  using (public.is_active_staff());

create policy "operational_assignment_events_insert_active_staff"
  on public.operational_assignment_events for insert
  with check (public.is_active_staff());
