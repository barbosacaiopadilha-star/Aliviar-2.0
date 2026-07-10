-- Sprint 0B: profiles, patients, journeys

-- Enums
create type public.user_role as enum (
  'ADMIN',
  'MANAGER',
  'CURATOR',
  'OPERATION'
);

create type public.patient_status as enum (
  'ACTIVE',
  'INACTIVE'
);

create type public.journey_status as enum (
  'NEW',
  'ACTIVE',
  'WAITING',
  'FINISHED',
  'CANCELLED'
);

create type public.journey_priority as enum (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  role public.user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patients
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) >= 3),
  preferred_name text,
  birth_date date,
  cpf text check (cpf is null or cpf ~ '^\d{11}$'),
  phone text,
  email text,
  city text,
  state text check (state is null or state ~ '^[A-Za-z]{2}$'),
  health_plan text,
  status public.patient_status not null default 'ACTIVE',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Journeys
create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id),
  title text not null check (char_length(trim(title)) > 0),
  objective text,
  status public.journey_status not null default 'NEW',
  priority public.journey_priority not null default 'NORMAL',
  manager_id uuid not null references public.profiles (id),
  opened_at date not null default current_date,
  closed_at date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journeys_closed_at_check check (
    closed_at is null
    or status in ('FINISHED', 'CANCELLED')
  )
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

create trigger journeys_set_updated_at
  before update on public.journeys
  for each row execute function public.set_updated_at();

-- Active staff helper
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_active = true
  );
$$;

revoke all on function public.is_active_staff() from public;
grant execute on function public.is_active_staff() to authenticated;

-- Valid manager helper
create or replace function public.is_valid_manager(manager uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = manager
      and profiles.is_active = true
      and profiles.role in ('ADMIN', 'MANAGER')
  );
$$;

revoke all on function public.is_valid_manager(uuid) from public;
grant execute on function public.is_valid_manager(uuid) to authenticated;

-- Transactional patient + journey creation
create or replace function public.create_patient_with_initial_journey(
  p_full_name text,
  p_preferred_name text default null,
  p_birth_date date default null,
  p_cpf text default null,
  p_phone text default null,
  p_email text default null,
  p_city text default null,
  p_state text default null,
  p_health_plan text default null,
  p_journey_title text default null,
  p_journey_objective text default null,
  p_manager_id uuid default null,
  p_journey_priority public.journey_priority default 'NORMAL',
  p_opened_at date default current_date
)
returns table (patient_id uuid, journey_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_patient_id uuid;
  v_journey_id uuid;
begin
  if v_user_id is null or not public.is_active_staff() then
    raise exception 'Acesso negado: perfil interno ativo obrigatório';
  end if;

  if p_journey_title is null or char_length(trim(p_journey_title)) = 0 then
    raise exception 'Título da Jornada é obrigatório';
  end if;

  if p_manager_id is null or not public.is_valid_manager(p_manager_id) then
    raise exception 'Gestor inválido: selecione um perfil ADMIN ou MANAGER ativo';
  end if;

  insert into public.patients (
    full_name,
    preferred_name,
    birth_date,
    cpf,
    phone,
    email,
    city,
    state,
    health_plan,
    created_by
  ) values (
    trim(p_full_name),
    nullif(trim(coalesce(p_preferred_name, '')), ''),
    p_birth_date,
    p_cpf,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    upper(nullif(trim(coalesce(p_state, '')), '')),
    nullif(trim(coalesce(p_health_plan, '')), ''),
    v_user_id
  )
  returning id into v_patient_id;

  insert into public.journeys (
    patient_id,
    title,
    objective,
    priority,
    manager_id,
    opened_at,
    created_by
  ) values (
    v_patient_id,
    trim(p_journey_title),
    nullif(trim(coalesce(p_journey_objective, '')), ''),
    coalesce(p_journey_priority, 'NORMAL'::public.journey_priority),
    p_manager_id,
    coalesce(p_opened_at, current_date),
    v_user_id
  )
  returning id into v_journey_id;

  return query select v_patient_id, v_journey_id;
end;
$$;

revoke all on function public.create_patient_with_initial_journey(
  text, text, date, text, text, text, text, text, text, text, text, uuid, public.journey_priority, date
) from public;
grant execute on function public.create_patient_with_initial_journey(
  text, text, date, text, text, text, text, text, text, text, text, uuid, public.journey_priority, date
) to authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.journeys enable row level security;

-- Profiles policies
create policy "profiles_select_active_staff"
  on public.profiles for select
  to authenticated
  using (public.is_active_staff());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() and public.is_active_staff())
  with check (id = auth.uid() and public.is_active_staff());

-- Patients policies
create policy "patients_select_active_staff"
  on public.patients for select
  to authenticated
  using (public.is_active_staff());

create policy "patients_insert_active_staff"
  on public.patients for insert
  to authenticated
  with check (public.is_active_staff() and created_by = auth.uid());

create policy "patients_update_active_staff"
  on public.patients for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- Journeys policies
create policy "journeys_select_active_staff"
  on public.journeys for select
  to authenticated
  using (public.is_active_staff());

create policy "journeys_insert_active_staff"
  on public.journeys for insert
  to authenticated
  with check (
    public.is_active_staff()
    and created_by = auth.uid()
    and public.is_valid_manager(manager_id)
  );

create policy "journeys_update_active_staff"
  on public.journeys for update
  to authenticated
  using (public.is_active_staff())
  with check (
    public.is_active_staff()
    and public.is_valid_manager(manager_id)
    and (
      status not in ('FINISHED', 'CANCELLED')
      or status = (select j.status from public.journeys j where j.id = journeys.id)
    )
  );

-- Indexes
create index patients_created_at_idx on public.patients (created_at desc);
create index patients_status_idx on public.patients (status);
create index journeys_patient_id_idx on public.journeys (patient_id);
create index journeys_opened_at_idx on public.journeys (opened_at desc);
create index journeys_status_idx on public.journeys (status);
create index profiles_role_active_idx on public.profiles (role, is_active);
