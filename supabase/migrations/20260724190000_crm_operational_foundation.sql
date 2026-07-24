-- CRM Operacional Aliviar — fundação do Sistema Operacional (Painel do Concierge)
--
-- PURAMENTE ADITIVA no schema `curadoria`. Não altera landing, AliCIA nem
-- o domínio clínico existente (`cases`, `patient_profiles`, etc.).
--
-- Entidades: crm_contacts, crm_cases, crm_interactions, crm_tasks,
-- crm_appointments, crm_audit_log
--
-- Aplicar: supabase db push (local) ou supabase migration up (remoto)

-- ---------------------------------------------------------------------------
-- Papel Concierge
-- ---------------------------------------------------------------------------

insert into curadoria.roles (slug, name)
values ('concierge', 'Concierge')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Contatos
-- ---------------------------------------------------------------------------

create table curadoria.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  preferred_name text,
  phone text,
  phone_normalized text,
  email text,
  email_normalized text,
  city text,
  state text,
  source text not null,
  source_detail text,
  status text not null default 'ativo' check (status in ('ativo', 'arquivado')),
  pipeline_stage text not null default 'new_contact',
  assigned_to uuid references curadoria.profiles (id) on delete set null,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  initial_reason text,
  preferred_channel text,
  consent_status text not null default 'pendente'
    check (consent_status in ('pendente', 'concedido', 'negado', 'revogado')),
  consent_recorded_at timestamptz,
  last_interaction_at timestamptz,
  next_action_at timestamptz,
  active_case_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_contacts_full_name_not_blank check (btrim(full_name) <> ''),
  constraint crm_contacts_state_format check (state is null or state ~ '^[A-Z]{2}$')
);

create index crm_contacts_phone_normalized_idx on curadoria.crm_contacts (phone_normalized)
  where phone_normalized is not null;
create index crm_contacts_email_normalized_idx on curadoria.crm_contacts (email_normalized)
  where email_normalized is not null;
create index crm_contacts_pipeline_stage_idx on curadoria.crm_contacts (pipeline_stage);
create index crm_contacts_assigned_to_idx on curadoria.crm_contacts (assigned_to);
create index crm_contacts_next_action_at_idx on curadoria.crm_contacts (next_action_at);
create index crm_contacts_created_at_idx on curadoria.crm_contacts (created_at desc);
create index crm_contacts_status_idx on curadoria.crm_contacts (status);

create trigger set_crm_contacts_updated_at
  before update on curadoria.crm_contacts
  for each row
  execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- Casos operacionais (distintos de curadoria.cases clínico)
-- ---------------------------------------------------------------------------

create table curadoria.crm_cases (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references curadoria.crm_contacts (id) on delete cascade,
  title text not null,
  summary text,
  status text not null default 'aberto' check (status in ('aberto', 'fechado', 'arquivado')),
  pipeline_stage text not null default 'new_contact',
  responsible_concierge_id uuid references curadoria.profiles (id) on delete set null,
  responsible_curator_id uuid references curadoria.profiles (id) on delete set null,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_cases_title_not_blank check (btrim(title) <> '')
);

create index crm_cases_contact_id_idx on curadoria.crm_cases (contact_id);
create index crm_cases_responsible_concierge_idx on curadoria.crm_cases (responsible_concierge_id);
create index crm_cases_responsible_curator_idx on curadoria.crm_cases (responsible_curator_id);
create index crm_cases_pipeline_stage_idx on curadoria.crm_cases (pipeline_stage);

alter table curadoria.crm_contacts
  add constraint crm_contacts_active_case_fk
  foreign key (active_case_id) references curadoria.crm_cases (id) on delete set null;

create trigger set_crm_cases_updated_at
  before update on curadoria.crm_cases
  for each row
  execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- Interações
-- ---------------------------------------------------------------------------

create table curadoria.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references curadoria.crm_contacts (id) on delete cascade,
  case_id uuid references curadoria.crm_cases (id) on delete set null,
  type text not null,
  channel text not null,
  direction text not null check (direction in ('entrada', 'saida', 'interno')),
  subject text,
  content text not null,
  occurred_at timestamptz not null default now(),
  created_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  external_reference text,
  visibility text not null default 'operacional'
    check (visibility in ('operacional', 'restrita', 'administrativa')),
  constraint crm_interactions_content_not_blank check (btrim(content) <> '')
);

create index crm_interactions_contact_id_occurred_idx
  on curadoria.crm_interactions (contact_id, occurred_at desc);
create index crm_interactions_case_id_idx on curadoria.crm_interactions (case_id);

-- ---------------------------------------------------------------------------
-- Tarefas
-- ---------------------------------------------------------------------------

create table curadoria.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references curadoria.crm_contacts (id) on delete cascade,
  case_id uuid references curadoria.crm_cases (id) on delete set null,
  title text not null,
  description text,
  type text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  assigned_to uuid not null references curadoria.profiles (id),
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_tasks_title_not_blank check (btrim(title) <> '')
);

create index crm_tasks_assigned_due_idx on curadoria.crm_tasks (assigned_to, due_at);
create index crm_tasks_contact_id_idx on curadoria.crm_tasks (contact_id);
create index crm_tasks_status_idx on curadoria.crm_tasks (status);

create trigger set_crm_tasks_updated_at
  before update on curadoria.crm_tasks
  for each row
  execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- Compromissos de agenda operacional
-- ---------------------------------------------------------------------------

create table curadoria.crm_appointments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references curadoria.crm_contacts (id) on delete cascade,
  case_id uuid references curadoria.crm_cases (id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  type text not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu')),
  assigned_to uuid not null references curadoria.profiles (id),
  location_or_link text,
  created_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_appointments_title_not_blank check (btrim(title) <> '')
);

create index crm_appointments_assigned_start_idx on curadoria.crm_appointments (assigned_to, start_at);
create index crm_appointments_contact_id_idx on curadoria.crm_appointments (contact_id);
create index crm_appointments_start_at_idx on curadoria.crm_appointments (start_at);

create trigger set_crm_appointments_updated_at
  before update on curadoria.crm_appointments
  for each row
  execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auditoria CRM (imutável pela UI comum)
-- ---------------------------------------------------------------------------

create table curadoria.crm_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references curadoria.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  previous_values jsonb,
  new_values jsonb,
  context jsonb,
  created_at timestamptz not null default now()
);

create index crm_audit_log_entity_idx on curadoria.crm_audit_log (entity_type, entity_id, created_at desc);
create index crm_audit_log_created_at_idx on curadoria.crm_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers de autorização CRM (após tabelas existirem)
-- ---------------------------------------------------------------------------

create or replace function curadoria.is_curator_for_crm_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1
    from curadoria.crm_cases c
    where c.id = _case_id
      and c.responsible_curator_id = auth.uid()
  );
$$;

create or replace function curadoria.can_access_crm_contact(_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1
    from curadoria.crm_contacts c
    where c.id = _contact_id
      and (
        curadoria.has_role('administrador')
        or (curadoria.has_role('concierge') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (
          curadoria.has_role('curador_medico')
          and exists (
            select 1
            from curadoria.crm_cases k
            where k.contact_id = c.id
              and k.responsible_curator_id = auth.uid()
              and k.pipeline_stage in (
                'sent_to_curator',
                'curation_in_progress',
                'report_ready',
                'report_delivered',
                'doctor_selected',
                'scheduling_support',
                'completed'
              )
          )
        )
      )
  );
$$;

revoke execute on function curadoria.is_curator_for_crm_case(uuid) from anon, authenticated;
revoke execute on function curadoria.can_access_crm_contact(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table curadoria.crm_contacts enable row level security;
alter table curadoria.crm_cases enable row level security;
alter table curadoria.crm_interactions enable row level security;
alter table curadoria.crm_tasks enable row level security;
alter table curadoria.crm_appointments enable row level security;
alter table curadoria.crm_audit_log enable row level security;

grant select, insert, update on curadoria.crm_contacts to authenticated;
grant select, insert, update on curadoria.crm_cases to authenticated;
grant select, insert on curadoria.crm_interactions to authenticated;
grant select, insert, update on curadoria.crm_tasks to authenticated;
grant select, insert, update on curadoria.crm_appointments to authenticated;
grant select, insert on curadoria.crm_audit_log to authenticated;

grant all on
  curadoria.crm_contacts,
  curadoria.crm_cases,
  curadoria.crm_interactions,
  curadoria.crm_tasks,
  curadoria.crm_appointments,
  curadoria.crm_audit_log
to service_role;

-- Contatos
create policy crm_contacts_select on curadoria.crm_contacts
  for select to authenticated
  using (curadoria.can_access_crm_contact(id));

create policy crm_contacts_insert on curadoria.crm_contacts
  for insert to authenticated
  with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));

create policy crm_contacts_update on curadoria.crm_contacts
  for update to authenticated
  using (curadoria.can_access_crm_contact(id))
  with check (curadoria.can_access_crm_contact(id));

-- Casos
create policy crm_cases_select on curadoria.crm_cases
  for select to authenticated
  using (
    curadoria.has_role('administrador')
    or (curadoria.has_role('concierge') and (
      responsible_concierge_id is null
      or responsible_concierge_id = auth.uid()
      or exists (
        select 1 from curadoria.crm_contacts c
        where c.id = contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())
      )
    ))
    or curadoria.is_curator_for_crm_case(id)
  );

create policy crm_cases_insert on curadoria.crm_cases
  for insert to authenticated
  with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));

create policy crm_cases_update on curadoria.crm_cases
  for update to authenticated
  using (
    curadoria.has_role('administrador')
    or (curadoria.has_role('concierge') and (
      responsible_concierge_id = auth.uid()
      or exists (
        select 1 from curadoria.crm_contacts c
        where c.id = contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())
      )
    ))
  )
  with check (
    curadoria.has_role('administrador')
    or (curadoria.has_role('concierge') and (
      responsible_concierge_id = auth.uid()
      or exists (
        select 1 from curadoria.crm_contacts c
        where c.id = contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())
      )
    ))
  );

-- Interações
create policy crm_interactions_select on curadoria.crm_interactions
  for select to authenticated
  using (
    curadoria.can_access_crm_contact(contact_id)
    and (
      visibility = 'operacional'
      or (visibility = 'restrita' and curadoria.has_role('administrador'))
      or (visibility = 'administrativa' and curadoria.has_role('administrador'))
    )
  );

create policy crm_interactions_insert on curadoria.crm_interactions
  for insert to authenticated
  with check (
    curadoria.can_access_crm_contact(contact_id)
    and (curadoria.has_role('administrador') or curadoria.has_role('concierge'))
  );

-- Tarefas
create policy crm_tasks_select on curadoria.crm_tasks
  for select to authenticated
  using (
    curadoria.has_role('administrador')
    or assigned_to = auth.uid()
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  );

create policy crm_tasks_insert on curadoria.crm_tasks
  for insert to authenticated
  with check (
    curadoria.has_role('administrador')
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  );

create policy crm_tasks_update on curadoria.crm_tasks
  for update to authenticated
  using (
    curadoria.has_role('administrador')
    or assigned_to = auth.uid()
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  )
  with check (
    curadoria.has_role('administrador')
    or assigned_to = auth.uid()
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  );

-- Compromissos
create policy crm_appointments_select on curadoria.crm_appointments
  for select to authenticated
  using (
    curadoria.has_role('administrador')
    or assigned_to = auth.uid()
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  );

create policy crm_appointments_insert on curadoria.crm_appointments
  for insert to authenticated
  with check (
    curadoria.has_role('administrador')
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  );

create policy crm_appointments_update on curadoria.crm_appointments
  for update to authenticated
  using (
    curadoria.has_role('administrador')
    or assigned_to = auth.uid()
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  )
  with check (
    curadoria.has_role('administrador')
    or assigned_to = auth.uid()
    or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))
  );

-- Auditoria: leitura só administrador; escrita via app autenticado
create policy crm_audit_log_select on curadoria.crm_audit_log
  for select to authenticated
  using (curadoria.has_role('administrador'));

create policy crm_audit_log_insert on curadoria.crm_audit_log
  for insert to authenticated
  with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));

comment on table curadoria.crm_contacts is 'Contatos operacionais do CRM Aliviar — leads e pessoas em acompanhamento comercial.';
comment on table curadoria.crm_cases is 'Casos operacionais vinculados a contatos — distintos dos casos clínicos de curadoria.';
comment on table curadoria.crm_interactions is 'Histórico de interações operacionais (não clínicas).';
comment on table curadoria.crm_tasks is 'Tarefas e próximas ações do Concierge.';
comment on table curadoria.crm_appointments is 'Agenda operacional — não é prontuário nem agenda médica complexa.';
comment on table curadoria.crm_audit_log is 'Trilha de auditoria do CRM — somente leitura administrativa.';
