-- Sprint 2A: journey_commitments

create type public.commitment_status as enum (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

create table public.journey_commitments (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id),
  title text not null check (char_length(trim(title)) >= 5 and char_length(trim(title)) <= 200),
  assigned_to uuid not null references public.profiles (id),
  status public.commitment_status not null default 'PENDING',
  due_date date,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journey_commitments_completed_check check (
    (status = 'COMPLETED' and completed_at is not null and cancelled_at is null)
    or (status <> 'COMPLETED' and completed_at is null)
  ),
  constraint journey_commitments_cancelled_check check (
    (status = 'CANCELLED' and cancelled_at is not null and completed_at is null)
    or (status <> 'CANCELLED' and cancelled_at is null)
  ),
  constraint journey_commitments_due_date_check check (
    due_date is null or due_date >= created_at::date
  )
);

create trigger journey_commitments_set_updated_at
  before update on public.journey_commitments
  for each row execute function public.set_updated_at();

create index journey_commitments_journey_id_idx on public.journey_commitments (journey_id);
create index journey_commitments_status_idx on public.journey_commitments (status);
create index journey_commitments_due_date_idx on public.journey_commitments (due_date);
create index journey_commitments_assigned_to_idx on public.journey_commitments (assigned_to);

-- Active profile helper (any role)
create or replace function public.is_active_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = profile_id
      and profiles.is_active = true
  );
$$;

revoke all on function public.is_active_profile(uuid) from public;
grant execute on function public.is_active_profile(uuid) to authenticated;

-- Journey allows new commitments
create or replace function public.journey_accepts_commitments(journey uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.journeys
    where id = journey
      and status not in ('FINISHED', 'CANCELLED')
  );
$$;

revoke all on function public.journey_accepts_commitments(uuid) from public;
grant execute on function public.journey_accepts_commitments(uuid) to authenticated;

-- RLS
alter table public.journey_commitments enable row level security;

create policy "journey_commitments_select_active_staff"
  on public.journey_commitments for select
  to authenticated
  using (public.is_active_staff());

create policy "journey_commitments_insert_active_staff"
  on public.journey_commitments for insert
  to authenticated
  with check (
    public.is_active_staff()
    and created_by = auth.uid()
    and public.is_active_profile(assigned_to)
    and public.journey_accepts_commitments(journey_id)
  );

create policy "journey_commitments_update_active_staff"
  on public.journey_commitments for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- Protect immutable fields and closed commitments
create or replace function public.protect_journey_commitment_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by <> old.created_by then
    raise exception 'created_by não pode ser alterado';
  end if;
  if new.journey_id <> old.journey_id then
    raise exception 'journey_id não pode ser alterado';
  end if;
  if new.assigned_to <> old.assigned_to then
    raise exception 'assigned_to não pode ser alterado';
  end if;
  if new.title <> old.title or new.due_date is distinct from old.due_date then
    if old.status in ('COMPLETED', 'CANCELLED') then
      raise exception 'Compromisso encerrado não pode ser alterado';
    end if;
  end if;
  if old.status in ('COMPLETED', 'CANCELLED') and new.status <> old.status then
    raise exception 'Compromisso encerrado não pode mudar de status';
  end if;
  if old.status = 'PENDING' and new.status not in ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') then
    raise exception 'Transição de status inválida';
  end if;
  if old.status = 'IN_PROGRESS' and new.status not in ('IN_PROGRESS', 'COMPLETED', 'CANCELLED') then
    raise exception 'Transição de status inválida';
  end if;
  return new;
end;
$$;

create trigger journey_commitments_protect_update
  before update on public.journey_commitments
  for each row execute function public.protect_journey_commitment_update();

-- No DELETE policy — physical deletion blocked
