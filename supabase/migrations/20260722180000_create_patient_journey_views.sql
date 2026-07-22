-- Projeção canônica da jornada para a Experience Layer (read model persistido)

create table public.patient_journey_views (
  journey_id uuid primary key references public.journeys (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  view_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger patient_journey_views_set_updated_at
  before update on public.patient_journey_views
  for each row execute function public.set_updated_at();

create index patient_journey_views_patient_id_idx
  on public.patient_journey_views (patient_id);

alter table public.patient_journey_views enable row level security;

-- Staff interno pode ler e escrever projeções
create policy "patient_journey_views_select_active_staff"
  on public.patient_journey_views for select
  to authenticated
  using (public.is_active_staff());

create policy "patient_journey_views_insert_active_staff"
  on public.patient_journey_views for insert
  to authenticated
  with check (public.is_active_staff());

create policy "patient_journey_views_update_active_staff"
  on public.patient_journey_views for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- Leitura pública por journey_id para superfícies do paciente (link com UUID)
create policy "patient_journey_views_select_public_by_journey"
  on public.patient_journey_views for select
  to anon, authenticated
  using (true);
