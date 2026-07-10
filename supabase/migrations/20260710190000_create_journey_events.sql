-- Sprint 1: journey_events timeline

-- Enums
create type public.journey_event_category as enum (
  'JOURNEY',
  'CONTACT',
  'CONSULTATION',
  'EXAM',
  'DOCUMENT',
  'DECISION',
  'OPERATIONAL',
  'OBSERVATION'
);

create type public.journey_event_source as enum (
  'MANUAL',
  'SYSTEM'
);

-- Table
create table public.journey_events (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id),
  category public.journey_event_category not null,
  source public.journey_event_source not null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  journey_impact text,
  next_step text,
  occurred_at timestamptz not null,
  is_highlighted boolean not null default false,
  is_corrected boolean not null default false,
  corrected_event_id uuid references public.journey_events (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger journey_events_set_updated_at
  before update on public.journey_events
  for each row execute function public.set_updated_at();

create index journey_events_journey_id_idx on public.journey_events (journey_id);
create index journey_events_occurred_at_idx on public.journey_events (occurred_at desc);
create index journey_events_category_idx on public.journey_events (category);

-- DBF-004: internal system event creator (not exposed to clients)
create or replace function public.create_system_journey_event(
  p_journey_id uuid,
  p_category public.journey_event_category,
  p_title text,
  p_description text default null,
  p_journey_impact text default null,
  p_next_step text default null,
  p_occurred_at timestamptz default now(),
  p_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_created_by uuid := coalesce(p_created_by, auth.uid());
begin
  if v_created_by is null then
    raise exception 'Autoria obrigatória para evento automático';
  end if;

  if not exists (select 1 from public.journeys where id = p_journey_id) then
    raise exception 'Jornada não encontrada';
  end if;

  insert into public.journey_events (
    journey_id,
    category,
    source,
    title,
    description,
    journey_impact,
    next_step,
    occurred_at,
    created_by
  ) values (
    p_journey_id,
    p_category,
    'SYSTEM',
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_journey_impact, '')), ''),
    nullif(trim(coalesce(p_next_step, '')), ''),
    coalesce(p_occurred_at, now()),
    v_created_by
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.create_system_journey_event(
  uuid, public.journey_event_category, text, text, text, text, timestamptz, uuid
) from public;

-- DBF-002: manual event creation
create or replace function public.create_journey_event(
  p_journey_id uuid,
  p_category public.journey_event_category,
  p_title text,
  p_description text default null,
  p_journey_impact text default null,
  p_next_step text default null,
  p_occurred_at timestamptz default null,
  p_is_highlighted boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
  v_occurred_at timestamptz := coalesce(p_occurred_at, now());
begin
  if v_user_id is null or not public.is_active_staff() then
    raise exception 'Acesso negado: perfil interno ativo obrigatório';
  end if;

  if not exists (select 1 from public.journeys where id = p_journey_id) then
    raise exception 'Jornada não encontrada';
  end if;

  if char_length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Título é obrigatório';
  end if;

  if v_occurred_at > now() + interval '7 days' then
    raise exception 'Data do acontecimento não pode estar muito no futuro';
  end if;

  insert into public.journey_events (
    journey_id,
    category,
    source,
    title,
    description,
    journey_impact,
    next_step,
    occurred_at,
    is_highlighted,
    created_by
  ) values (
    p_journey_id,
    p_category,
    'MANUAL',
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_journey_impact, '')), ''),
    nullif(trim(coalesce(p_next_step, '')), ''),
    v_occurred_at,
    coalesce(p_is_highlighted, false),
    v_user_id
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.create_journey_event(
  uuid, public.journey_event_category, text, text, text, text, timestamptz, boolean
) from public;
grant execute on function public.create_journey_event(
  uuid, public.journey_event_category, text, text, text, text, timestamptz, boolean
) to authenticated;

-- DBF-003: non-destructive correction
create or replace function public.correct_journey_event(
  p_original_event_id uuid,
  p_correction_reason text,
  p_category public.journey_event_category,
  p_title text,
  p_description text default null,
  p_journey_impact text default null,
  p_next_step text default null,
  p_occurred_at timestamptz default null,
  p_is_highlighted boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_original public.journey_events;
  v_new_id uuid;
  v_full_description text;
  v_occurred_at timestamptz := coalesce(p_occurred_at, now());
begin
  if v_user_id is null or not public.is_active_staff() then
    raise exception 'Acesso negado: perfil interno ativo obrigatório';
  end if;

  select * into v_original
  from public.journey_events
  where id = p_original_event_id
  for update;

  if not found then
    raise exception 'Evento original não encontrado';
  end if;

  if v_original.is_corrected then
    raise exception 'Este evento já foi corrigido';
  end if;

  if v_original.source <> 'MANUAL' then
    raise exception 'Apenas eventos manuais podem ser corrigidos pela interface';
  end if;

  if char_length(trim(coalesce(p_correction_reason, ''))) = 0 then
    raise exception 'Motivo da correção é obrigatório';
  end if;

  if char_length(trim(coalesce(p_title, ''))) = 0 then
    raise exception 'Título é obrigatório';
  end if;

  if v_occurred_at > now() + interval '7 days' then
    raise exception 'Data do acontecimento não pode estar muito no futuro';
  end if;

  v_full_description := 'Correção do registro anterior: ' || trim(p_correction_reason);
  if nullif(trim(coalesce(p_description, '')), '') is not null then
    v_full_description := v_full_description || E'\n\n' || trim(p_description);
  end if;

  update public.journey_events
  set is_corrected = true
  where id = p_original_event_id;

  insert into public.journey_events (
    journey_id,
    category,
    source,
    title,
    description,
    journey_impact,
    next_step,
    occurred_at,
    is_highlighted,
    corrected_event_id,
    created_by
  ) values (
    v_original.journey_id,
    p_category,
    'MANUAL',
    trim(p_title),
    v_full_description,
    nullif(trim(coalesce(p_journey_impact, '')), ''),
    nullif(trim(coalesce(p_next_step, '')), ''),
    v_occurred_at,
    coalesce(p_is_highlighted, false),
    p_original_event_id,
    v_user_id
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

revoke all on function public.correct_journey_event(
  uuid, text, public.journey_event_category, text, text, text, text, timestamptz, boolean
) from public;
grant execute on function public.correct_journey_event(
  uuid, text, public.journey_event_category, text, text, text, text, timestamptz, boolean
) to authenticated;

-- Automatic events on journey insert
create or replace function public.on_journey_insert_create_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_journey_count integer;
begin
  select count(*) into v_journey_count
  from public.journeys
  where patient_id = new.patient_id;

  if v_journey_count = 1 then
    perform public.create_system_journey_event(
      new.id,
      'JOURNEY',
      'Jornada iniciada',
      null,
      'A Aliviar iniciou a organização da Jornada do paciente.',
      null,
      now(),
      new.created_by
    );
  else
    perform public.create_system_journey_event(
      new.id,
      'JOURNEY',
      'Nova Jornada iniciada',
      null,
      null,
      null,
      now(),
      new.created_by
    );
  end if;

  return new;
end;
$$;

create trigger journeys_after_insert_event
  after insert on public.journeys
  for each row execute function public.on_journey_insert_create_event();

-- Automatic events on status change
create or replace function public.on_journey_status_change_create_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    perform public.create_system_journey_event(
      new.id,
      'JOURNEY',
      'Status da Jornada atualizado',
      'Status alterado de ' || old.status::text || ' para ' || new.status::text || '.',
      null,
      null,
      now(),
      coalesce(auth.uid(), new.created_by)
    );
  end if;

  return new;
end;
$$;

create trigger journeys_after_update_status_event
  after update of status on public.journeys
  for each row execute function public.on_journey_status_change_create_event();

-- Update patient+journey function (no duplicate event — trigger handles it)
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
    full_name, preferred_name, birth_date, cpf, phone, email,
    city, state, health_plan, created_by
  ) values (
    trim(p_full_name),
    nullif(trim(coalesce(p_preferred_name, '')), ''),
    p_birth_date, p_cpf,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    upper(nullif(trim(coalesce(p_state, '')), '')),
    nullif(trim(coalesce(p_health_plan, '')), ''),
    v_user_id
  )
  returning id into v_patient_id;

  insert into public.journeys (
    patient_id, title, objective, priority, manager_id, opened_at, created_by
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

-- RLS: read-only direct access; writes via security definer functions
alter table public.journey_events enable row level security;

create policy "journey_events_select_active_staff"
  on public.journey_events for select
  to authenticated
  using (public.is_active_staff());

-- No INSERT, UPDATE or DELETE policies for authenticated — blocked by default
