-- Vertical slice / curation / delivery domain snapshot persistence

create table if not exists public.domain_snapshots (
  collection text not null,
  entity_id uuid not null,
  journey_id uuid references public.journeys (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete cascade,
  lookup_key text,
  snapshot jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, entity_id)
);

create unique index if not exists domain_snapshots_collection_lookup_key_idx
  on public.domain_snapshots (collection, lookup_key)
  where lookup_key is not null;

create index if not exists domain_snapshots_journey_idx
  on public.domain_snapshots (collection, journey_id);

create index if not exists domain_snapshots_patient_idx
  on public.domain_snapshots (collection, patient_id);

create trigger domain_snapshots_set_updated_at
  before update on public.domain_snapshots
  for each row execute function public.set_updated_at();

create table if not exists public.patient_portal_flows (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  auth_user_id uuid not null,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  handoff_id uuid not null,
  session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_portal_flows_journey_idx
  on public.patient_portal_flows (journey_id);

create trigger patient_portal_flows_set_updated_at
  before update on public.patient_portal_flows
  for each row execute function public.set_updated_at();

alter table public.domain_snapshots enable row level security;
alter table public.patient_portal_flows enable row level security;

create policy "domain_snapshots_select_staff"
  on public.domain_snapshots for select
  to authenticated
  using (public.is_active_staff());

create policy "domain_snapshots_insert_staff"
  on public.domain_snapshots for insert
  to authenticated
  with check (public.is_active_staff());

create policy "domain_snapshots_update_staff"
  on public.domain_snapshots for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

create policy "domain_snapshots_select_patient"
  on public.domain_snapshots for select
  to authenticated
  using (
    patient_id in (
      select p.id from public.patients p where p.auth_user_id = auth.uid()
    )
  );

create policy "domain_snapshots_insert_patient"
  on public.domain_snapshots for insert
  to authenticated
  with check (
    patient_id in (
      select p.id from public.patients p where p.auth_user_id = auth.uid()
    )
  );

create policy "domain_snapshots_update_patient"
  on public.domain_snapshots for update
  to authenticated
  using (
    patient_id in (
      select p.id from public.patients p where p.auth_user_id = auth.uid()
    )
  )
  with check (
    patient_id in (
      select p.id from public.patients p where p.auth_user_id = auth.uid()
    )
  );

create policy "patient_portal_flows_select_own"
  on public.patient_portal_flows for select
  to authenticated
  using (auth_user_id = auth.uid() or public.is_active_staff());

create policy "patient_portal_flows_insert_own"
  on public.patient_portal_flows for insert
  to authenticated
  with check (auth_user_id = auth.uid() or public.is_active_staff());

create policy "patient_portal_flows_update_own"
  on public.patient_portal_flows for update
  to authenticated
  using (auth_user_id = auth.uid() or public.is_active_staff())
  with check (auth_user_id = auth.uid() or public.is_active_staff());
