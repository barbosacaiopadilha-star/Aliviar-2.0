-- Portal do curador: workspace operacional por jornada

create table public.curator_case_workspaces (
  journey_id uuid primary key references public.journeys (id) on delete cascade,
  curator_id uuid references public.profiles (id) on delete set null,
  assumed_at timestamptz,
  workspace_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger curator_case_workspaces_set_updated_at
  before update on public.curator_case_workspaces
  for each row execute function public.set_updated_at();

create index curator_case_workspaces_curator_id_idx on public.curator_case_workspaces (curator_id);
create index curator_case_workspaces_updated_at_idx on public.curator_case_workspaces (updated_at desc);

alter table public.curator_case_workspaces enable row level security;

create policy "curator_workspaces_select_staff"
  on public.curator_case_workspaces for select
  to authenticated
  using (public.is_active_staff());

create policy "curator_workspaces_insert_staff"
  on public.curator_case_workspaces for insert
  to authenticated
  with check (public.is_active_staff());

create policy "curator_workspaces_update_staff"
  on public.curator_case_workspaces for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());
