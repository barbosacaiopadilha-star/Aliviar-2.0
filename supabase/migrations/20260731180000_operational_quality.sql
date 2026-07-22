-- EPIC-24: feedback, incidentes e melhoria contínua operacional

create table if not exists public.patient_journey_feedback (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  satisfacao_geral smallint not null check (satisfacao_geral between 1 and 5),
  clareza_informacoes smallint not null check (clareza_informacoes between 1 and 5),
  facilidade_uso smallint not null check (facilidade_uso between 1 and 5),
  comentarios text null,
  criado_em timestamptz not null default now()
);

create table if not exists public.curator_journey_feedback (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references public.profiles (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  dificuldades text null,
  informacoes_ausentes text null,
  sugestoes text null,
  problemas_operacionais text null,
  criado_em timestamptz not null default now()
);

create table if not exists public.operational_incidents (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  categoria text not null check (
    categoria in ('PLATAFORMA', 'PROCESSO', 'COMUNICACAO', 'DOCUMENTACAO', 'OPERACIONAL')
  ),
  severidade text not null check (severidade in ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')),
  descricao text not null check (char_length(trim(descricao)) > 0),
  status text not null default 'ABERTO' check (status in ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO')),
  responsavel_id uuid null references public.profiles (id) on delete set null,
  criado_por uuid not null references public.profiles (id) on delete restrict,
  criado_em timestamptz not null default now(),
  resolvido_em timestamptz null
);

create table if not exists public.operational_incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.operational_incidents (id) on delete cascade,
  evento_tipo text not null check (
    evento_tipo in ('CRIADO', 'STATUS_ALTERADO', 'RESPONSAVEL_ATRIBUIDO', 'RESOLVIDO', 'NOTA')
  ),
  status text null check (status is null or status in ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO')),
  responsavel_id uuid null references public.profiles (id) on delete set null,
  descricao text null,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  ocorrido_em timestamptz not null default now()
);

create index if not exists patient_journey_feedback_journey_idx
  on public.patient_journey_feedback (journey_id, criado_em desc);

create index if not exists curator_journey_feedback_journey_idx
  on public.curator_journey_feedback (journey_id, criado_em desc);

create index if not exists operational_incidents_status_idx
  on public.operational_incidents (status, criado_em desc);

create index if not exists operational_incidents_categoria_idx
  on public.operational_incidents (categoria, criado_em desc);

create index if not exists operational_incident_events_incident_idx
  on public.operational_incident_events (incident_id, ocorrido_em desc);

alter table public.patient_journey_feedback enable row level security;
alter table public.curator_journey_feedback enable row level security;
alter table public.operational_incidents enable row level security;
alter table public.operational_incident_events enable row level security;

create policy "patient_feedback_insert_owner"
  on public.patient_journey_feedback for insert
  to authenticated
  with check (public.is_patient_owner(patient_id));

create policy "patient_feedback_select_owner"
  on public.patient_journey_feedback for select
  to authenticated
  using (public.is_patient_owner(patient_id));

create policy "curator_feedback_own"
  on public.curator_journey_feedback for all
  to authenticated
  using (curator_id = auth.uid() and public.is_active_staff())
  with check (curator_id = auth.uid() and public.is_active_staff());

create policy "operational_incidents_staff_select"
  on public.operational_incidents for select
  to authenticated
  using (public.is_active_staff());

create policy "operational_incidents_staff_insert"
  on public.operational_incidents for insert
  to authenticated
  with check (public.is_active_staff());

create policy "operational_incidents_staff_update"
  on public.operational_incidents for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "operational_incident_events_staff_select"
  on public.operational_incident_events for select
  to authenticated
  using (public.is_active_staff());

create policy "operational_incident_events_staff_insert"
  on public.operational_incident_events for insert
  to authenticated
  with check (public.is_active_staff());

create or replace function public.prevent_operational_incident_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'operational_incidents are append-only';
end;
$$;

drop trigger if exists operational_incidents_no_delete on public.operational_incidents;
create trigger operational_incidents_no_delete
  before delete on public.operational_incidents
  for each row execute function public.prevent_operational_incident_delete();

drop trigger if exists operational_incident_events_no_delete on public.operational_incident_events;
create trigger operational_incident_events_no_delete
  before delete on public.operational_incident_events
  for each row execute function public.prevent_operational_incident_delete();

drop trigger if exists operational_incident_events_no_update on public.operational_incident_events;
create trigger operational_incident_events_no_update
  before update on public.operational_incident_events
  for each row execute function public.prevent_operational_incident_delete();
