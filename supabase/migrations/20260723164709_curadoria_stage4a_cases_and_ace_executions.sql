-- case_status
create type curadoria.case_status as enum ('NEW','IN_REVIEW','WAITING_FOR_INFORMATION','READY_FOR_CURATION','IN_CURATION','HUMAN_REVIEW','DELIVERED','CLOSED','CANCELLED');

create table curadoria.cases (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  source_story_id uuid not null references curadoria.patient_stories (id),
  status curadoria.case_status not null default 'NEW',
  current_stage text,
  assigned_curator_id uuid references curadoria.profiles (id),
  created_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  closed_at timestamptz,
  method_version text
);
create unique index cases_one_active_per_story_idx on curadoria.cases (source_story_id) where status not in ('CLOSED','CANCELLED');
create index cases_patient_profile_id_idx on curadoria.cases (patient_profile_id);
create index cases_assigned_curator_id_idx on curadoria.cases (assigned_curator_id);
create index cases_status_idx on curadoria.cases (status);
create index cases_updated_at_idx on curadoria.cases (updated_at desc);
create trigger set_cases_updated_at before update on curadoria.cases for each row execute function curadoria.set_updated_at();

create type curadoria.case_event_type as enum ('created','status_changed','curator_assigned','note_updated');
create table curadoria.case_events (
  id bigint generated always as identity primary key,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  event_type curadoria.case_event_type not null,
  actor_id uuid references curadoria.profiles (id),
  from_value text, to_value text, reason text,
  created_at timestamptz not null default now()
);
create index case_events_case_id_idx on curadoria.case_events (case_id, created_at);

alter table curadoria.cases enable row level security;
alter table curadoria.case_events enable row level security;
grant select, insert, update on curadoria.cases to authenticated;
grant select, insert on curadoria.case_events to authenticated;
grant all on curadoria.cases, curadoria.case_events to service_role;
create policy "cases_select_admin_or_assigned_curator" on curadoria.cases for select to authenticated using (curadoria.has_role('administrador') or assigned_curator_id = auth.uid());
create policy "cases_insert_admin_or_curator" on curadoria.cases for insert to authenticated with check ((curadoria.has_role('administrador') or curadoria.has_role('curador_medico')) and created_by = auth.uid());
create policy "cases_update_admin_or_assigned_curator" on curadoria.cases for update to authenticated using (curadoria.has_role('administrador') or assigned_curator_id = auth.uid()) with check (curadoria.has_role('administrador') or assigned_curator_id = auth.uid());
create policy "case_events_select_admin_or_case_curator" on curadoria.case_events for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = case_events.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "case_events_insert_admin_or_case_curator" on curadoria.case_events for insert to authenticated with check (exists (select 1 from curadoria.cases c where c.id = case_events.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));

create or replace function curadoria.enforce_case_status_transition()
returns trigger language plpgsql security definer set search_path = curadoria as $$
declare allowed boolean;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    allowed := case old.status
      when 'NEW' then new.status in ('IN_REVIEW','CANCELLED')
      when 'IN_REVIEW' then new.status in ('WAITING_FOR_INFORMATION','READY_FOR_CURATION','CANCELLED')
      when 'WAITING_FOR_INFORMATION' then new.status in ('IN_REVIEW','CANCELLED')
      when 'READY_FOR_CURATION' then new.status in ('IN_CURATION','CANCELLED')
      when 'IN_CURATION' then new.status in ('HUMAN_REVIEW','WAITING_FOR_INFORMATION','CANCELLED')
      when 'HUMAN_REVIEW' then new.status in ('DELIVERED','WAITING_FOR_INFORMATION','CANCELLED')
      when 'DELIVERED' then new.status in ('CLOSED')
      else false end;
    if not allowed then raise exception 'Transição de status inválida: % -> %', old.status, new.status; end if;
    if new.status = 'IN_CURATION' and old.started_at is null then new.started_at := now(); end if;
    if new.status in ('CLOSED','CANCELLED') then new.closed_at := coalesce(new.closed_at, now()); end if;
  end if;
  return new;
end; $$;
create trigger enforce_case_status_transition_trigger before update on curadoria.cases for each row execute function curadoria.enforce_case_status_transition();

create view curadoria.patient_case_overview as
select c.id as case_id, c.patient_profile_id,
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
from curadoria.cases c
where c.patient_profile_id = auth.uid();
grant select on curadoria.patient_case_overview to authenticated;

-- curador read access
create or replace function curadoria.is_case_curator_for_story(_story_id uuid)
returns boolean language sql security definer set search_path = curadoria stable as $$
  select exists (select 1 from curadoria.cases c where c.source_story_id = _story_id and c.assigned_curator_id = auth.uid());
$$;
create policy "patient_stories_select_assigned_curator" on curadoria.patient_stories for select to authenticated using (curadoria.is_case_curator_for_story(id));
create policy "patient_story_attachments_select_assigned_curator" on curadoria.patient_story_attachments for select to authenticated using (curadoria.is_case_curator_for_story(story_id));
create policy "patient_documents_select_assigned_curator" on curadoria.patient_documents for select to authenticated using (exists (select 1 from curadoria.patient_story_attachments psa where psa.document_id = patient_documents.id and curadoria.is_case_curator_for_story(psa.story_id)));
create policy "curadoria_patient_documents_storage_assigned_curator" on storage.objects for select to authenticated using (bucket_id = 'patient-documents' and exists (select 1 from curadoria.patient_documents pd join curadoria.patient_story_attachments psa on psa.document_id = pd.id where pd.file_path = storage.objects.name and curadoria.is_case_curator_for_story(psa.story_id)));

-- case_notes
create table curadoria.case_notes (
  id bigint generated always as identity primary key,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  author_id uuid not null references curadoria.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint case_notes_body_not_blank check (btrim(body) <> '')
);
create index case_notes_case_id_idx on curadoria.case_notes (case_id, created_at);
alter table curadoria.case_notes enable row level security;
grant select, insert on curadoria.case_notes to authenticated;
grant all on curadoria.case_notes to service_role;
create policy "case_notes_select_admin_or_case_curator" on curadoria.case_notes for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = case_notes.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "case_notes_insert_admin_or_case_curator" on curadoria.case_notes for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from curadoria.cases c where c.id = case_notes.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));

-- ace_executions + ace_artifacts
create type curadoria.ace_execution_status as enum ('PENDING','RUNNING','BLOCKED','FAILED','COMPLETED','CANCELLED');
create table curadoria.ace_executions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  started_by uuid not null references curadoria.profiles (id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status curadoria.ace_execution_status not null default 'PENDING',
  current_protocol text check (current_protocol in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  method_version text not null,
  failure_code text, failure_message text,
  retry_of uuid references curadoria.ace_executions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ace_executions_case_id_idx on curadoria.ace_executions (case_id, created_at desc);
create trigger set_ace_executions_updated_at before update on curadoria.ace_executions for each row execute function curadoria.set_updated_at();
create unique index ace_executions_one_running_per_case_idx on curadoria.ace_executions (case_id) where status = 'RUNNING';
create table curadoria.ace_artifacts (
  id uuid primary key,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  execution_id uuid not null references curadoria.ace_executions (id) on delete cascade,
  artifact_type text not null check (artifact_type in ('Narrative','DecisionCase','CaseAudit','DecisionContext','CompetencyProfile','EligibleProviderSet','CompatibilityMatrix','Shortlist')),
  version integer not null,
  protocol_id text not null check (protocol_id in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  protocol_version text not null,
  method_version text not null,
  payload jsonb not null,
  created_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  supersedes uuid references curadoria.ace_artifacts (id),
  validation_status text not null default 'valid' check (validation_status in ('valid','blocked'))
);
create index ace_artifacts_case_id_idx on curadoria.ace_artifacts (case_id, created_at);
create index ace_artifacts_execution_id_idx on curadoria.ace_artifacts (execution_id);
alter table curadoria.ace_executions enable row level security;
alter table curadoria.ace_artifacts enable row level security;
grant select, insert, update on curadoria.ace_executions to authenticated;
grant select, insert on curadoria.ace_artifacts to authenticated;
grant all on curadoria.ace_executions, curadoria.ace_artifacts to service_role;
create policy "ace_executions_select_admin_or_case_curator" on curadoria.ace_executions for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = ace_executions.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "ace_executions_insert_admin_or_case_curator" on curadoria.ace_executions for insert to authenticated with check (started_by = auth.uid() and exists (select 1 from curadoria.cases c where c.id = ace_executions.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "ace_executions_update_admin_or_case_curator" on curadoria.ace_executions for update to authenticated using (exists (select 1 from curadoria.cases c where c.id = ace_executions.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid()))) with check (exists (select 1 from curadoria.cases c where c.id = ace_executions.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "ace_artifacts_select_admin_or_case_curator" on curadoria.ace_artifacts for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = ace_artifacts.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "ace_artifacts_insert_admin_or_case_curator" on curadoria.ace_artifacts for insert to authenticated with check (created_by = auth.uid() and exists (select 1 from curadoria.cases c where c.id = ace_artifacts.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));