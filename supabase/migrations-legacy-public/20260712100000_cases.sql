-- ÉPICO 1 / SPRINT 2 — MÓDULO DE CASO: ponte operacional entre uma História
-- enviada e a operação de curadoria da Aliviar (ADR-019). Não persiste
-- artefatos do ACE (P001-P010) — isso é uma sprint futura, quando o
-- pipeline realmente rodar. A História original (patient_stories) nunca é
-- alterada por este módulo: um Caso só referencia, nunca sobrescreve.

create type public.case_status as enum (
  'NEW',
  'IN_REVIEW',
  'WAITING_FOR_INFORMATION',
  'READY_FOR_CURATION',
  'IN_CURATION',
  'HUMAN_REVIEW',
  'DELIVERED',
  'CLOSED',
  'CANCELLED'
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.profiles (id) on delete cascade,
  source_story_id uuid not null references public.patient_stories (id),
  status public.case_status not null default 'NEW',
  current_stage text,
  assigned_curator_id uuid references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  closed_at timestamptz,
  notes text,
  method_version text
);

comment on table public.cases is 'Caso operacional da Aliviar (ÉPICO 1/SPRINT 2) — nasce de uma public.patient_stories já "enviada", nunca a altera. current_stage é reservado para o estágio do pipeline ACE (P001..P010) quando existir (ainda sempre null nesta sprint). method_version é reservado para quando o ACE rodar de fato.';

-- Nunca dois Casos ATIVOS (não terminais) para a mesma História — um novo
-- Caso da mesma História só pode existir depois que o anterior chegar a
-- CLOSED/CANCELLED (índice parcial, não uma unicidade permanente).
create unique index cases_one_active_per_story_idx
  on public.cases (source_story_id)
  where status not in ('CLOSED', 'CANCELLED');

create index cases_patient_profile_id_idx on public.cases (patient_profile_id);
create index cases_assigned_curator_id_idx on public.cases (assigned_curator_id);
create index cases_status_idx on public.cases (status);
create index cases_updated_at_idx on public.cases (updated_at desc);

create trigger set_cases_updated_at
  before update on public.cases
  for each row
  execute function public.set_updated_at();

-- Log unificado de eventos — cobre criação, mudança de status e
-- reatribuição de curador em um só lugar (também serve de linha do tempo
-- operacional para a tela de detalhe). Append-only.
create type public.case_event_type as enum ('created', 'status_changed', 'curator_assigned', 'note_updated');

create table public.case_events (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  event_type public.case_event_type not null,
  actor_id uuid references public.profiles (id),
  from_value text,
  to_value text,
  reason text,
  created_at timestamptz not null default now()
);

comment on table public.case_events is 'Log append-only de criação/mudança de status/reatribuição de curador de um Caso — também serve de linha do tempo operacional (ÉPICO 1/SPRINT 2).';

create index case_events_case_id_idx on public.case_events (case_id, created_at);

alter table public.cases enable row level security;
alter table public.case_events enable row level security;

grant select, insert, update on public.cases to authenticated;
grant select, insert on public.case_events to authenticated;
grant all on public.cases, public.case_events to service_role;

-- Leitura: administrador vê todos; curador médico só os Casos atribuídos a
-- ele. Paciente e profissional NUNCA leem esta tabela diretamente — o
-- paciente só lê a view patient_case_overview (abaixo), que nunca expõe
-- notas, protocolos ou status bruto.
create policy "cases_select_admin_or_assigned_curator" on public.cases
  for select
  to authenticated
  using (public.has_role('administrador') or assigned_curator_id = auth.uid());

-- Escrita: só administrador ou curador médico podem criar (a validação de
-- "história enviada" e "sem caso ativo duplicado" é reforçada por
-- constraint/FK acima e pela camada de aplicação, que consulta o status da
-- história antes de inserir).
create policy "cases_insert_admin_or_curator" on public.cases
  for insert
  to authenticated
  with check (
    (public.has_role('administrador') or public.has_role('curador_medico'))
    and created_by = auth.uid()
  );

-- Atualização: administrador sempre; curador médico só no próprio Caso
-- atribuído. A validação de transição de status válida é reforçada por
-- trigger (abaixo), nunca só pela aplicação.
create policy "cases_update_admin_or_assigned_curator" on public.cases
  for update
  to authenticated
  using (public.has_role('administrador') or assigned_curator_id = auth.uid())
  with check (public.has_role('administrador') or assigned_curator_id = auth.uid());

-- Sem policy de DELETE: um Caso nunca é apagado, só encerrado/cancelado.

create policy "case_events_select_admin_or_case_curator" on public.case_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_events.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "case_events_insert_admin_or_case_curator" on public.case_events
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = case_events.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- Máquina de estados (ADR-019) — reforçada no banco, nunca só na
-- aplicação. Bloqueia qualquer transição fora da lista permitida;
-- carimba started_at/closed_at nos momentos certos.
create or replace function public.enforce_case_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    allowed := case old.status
      when 'NEW' then new.status in ('IN_REVIEW', 'CANCELLED')
      when 'IN_REVIEW' then new.status in ('WAITING_FOR_INFORMATION', 'READY_FOR_CURATION', 'CANCELLED')
      when 'WAITING_FOR_INFORMATION' then new.status in ('IN_REVIEW', 'CANCELLED')
      when 'READY_FOR_CURATION' then new.status in ('IN_CURATION', 'CANCELLED')
      when 'IN_CURATION' then new.status in ('HUMAN_REVIEW', 'CANCELLED')
      when 'HUMAN_REVIEW' then new.status in ('DELIVERED', 'WAITING_FOR_INFORMATION', 'CANCELLED')
      when 'DELIVERED' then new.status in ('CLOSED')
      else false
    end;

    if not allowed then
      raise exception 'Transição de status inválida: % -> %', old.status, new.status;
    end if;

    if new.status = 'IN_CURATION' and old.started_at is null then
      new.started_at := now();
    end if;

    if new.status in ('CLOSED', 'CANCELLED') then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_case_status_transition_trigger
  before update on public.cases
  for each row
  execute function public.enforce_case_status_transition();

-- View pública ao paciente: só status traduzido, nunca o enum bruto, nunca
-- notas, nunca protocolo. security_invoker permanece false (padrão) de
-- propósito — a view roda com o privilégio de quem a criou (contorna a RLS
-- de public.cases, que nunca concede leitura a paciente), e o próprio WHERE
-- abaixo já restringe cada pessoa à própria linha.
create view public.patient_case_overview as
select
  c.id as case_id,
  c.patient_profile_id,
  case c.status
    when 'NEW' then 'Recebemos sua história.'
    when 'IN_REVIEW' then 'Nossa equipe está organizando as informações.'
    when 'WAITING_FOR_INFORMATION' then 'Precisamos de uma informação adicional.'
    when 'READY_FOR_CURATION' then 'Sua curadoria está sendo preparada.'
    when 'IN_CURATION' then 'Sua curadoria está em andamento.'
    when 'HUMAN_REVIEW' then 'Sua curadoria está em revisão final.'
    when 'DELIVERED' then 'Seu relatório está pronto.'
    when 'CLOSED' then 'Seu acompanhamento foi encerrado.'
    when 'CANCELLED' then 'Não conseguimos avançar com esta curadoria no momento — nossa equipe vai entrar em contato.'
  end as status_label,
  c.updated_at
from public.cases c
where c.patient_profile_id = auth.uid();

comment on view public.patient_case_overview is 'Única superfície de leitura de Caso para o paciente (ÉPICO 1/SPRINT 2) — nunca expõe notas, current_stage, method_version ou o enum bruto além do rótulo traduzido. Tradução feita em SQL de propósito, para nunca depender de disciplina da camada de aplicação.';

grant select on public.patient_case_overview to authenticated;
