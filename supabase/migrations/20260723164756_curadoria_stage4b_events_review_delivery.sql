-- ace_execution_events
create table curadoria.ace_execution_events (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references curadoria.ace_executions (id) on delete cascade,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  event_type text not null check (event_type in ('STARTED','RESUMED','PROTOCOL_STARTED','PROTOCOL_COMPLETED','ARTIFACT_REUSED','BLOCKED','FAILED','COMPLETED')),
  protocol_id text check (protocol_id in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index ace_execution_events_execution_id_idx on curadoria.ace_execution_events (execution_id, created_at);
create index ace_execution_events_case_id_idx on curadoria.ace_execution_events (case_id, created_at);
alter table curadoria.ace_execution_events enable row level security;
grant select, insert on curadoria.ace_execution_events to authenticated;
grant all on curadoria.ace_execution_events to service_role;
create policy "ace_execution_events_select_admin_or_case_curator" on curadoria.ace_execution_events for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = ace_execution_events.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "ace_execution_events_insert_admin_or_case_curator" on curadoria.ace_execution_events for insert to authenticated with check (exists (select 1 from curadoria.cases c where c.id = ace_execution_events.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));

-- human_review_results
create table curadoria.human_review_results (
  id uuid primary key,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  execution_id uuid not null references curadoria.ace_executions (id),
  reviewer_id uuid not null references curadoria.profiles (id),
  reviewed_at timestamptz not null,
  review_status text not null check (review_status in ('VALIDATED','REJECTED','INFORMATION_REQUESTED')),
  review_action text not null check (review_action in ('APPROVE','ADJUST','REJECT','REQUEST_MORE_INFORMATION')),
  original_shortlist_artifact_id uuid not null references curadoria.ace_artifacts (id),
  original_shortlist_artifact_version integer not null,
  compatibility_matrix_artifact_id uuid not null references curadoria.ace_artifacts (id),
  compatibility_matrix_artifact_version integer not null,
  approved_provider_ids uuid[] not null default '{}',
  changes jsonb not null default '[]'::jsonb,
  review_rationale text not null,
  evidence_references text[] not null default '{}',
  return_to_protocol text check (return_to_protocol in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  method_version text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);
create index human_review_results_case_id_idx on curadoria.human_review_results (case_id, created_at desc);
create index human_review_results_execution_id_idx on curadoria.human_review_results (execution_id);
create unique index human_review_results_one_validated_per_case_idx on curadoria.human_review_results (case_id) where (review_status = 'VALIDATED');
alter table curadoria.human_review_results enable row level security;
grant select, insert on curadoria.human_review_results to authenticated;
grant all on curadoria.human_review_results to service_role;
create policy "human_review_results_select_admin_or_case_curator" on curadoria.human_review_results for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = human_review_results.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "human_review_results_insert_admin_or_case_curator" on curadoria.human_review_results for insert to authenticated with check (reviewer_id = auth.uid() and exists (select 1 from curadoria.cases c where c.id = human_review_results.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));

-- professional_profiles: coluna de apresentação do P010
alter table curadoria.professional_profiles add column practical_considerations text[] not null default '{}';

-- final_curadoria_deliveries
create table curadoria.final_curadoria_deliveries (
  id uuid primary key,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  patient_profile_id uuid not null references curadoria.profiles (id),
  human_review_result_id uuid not null references curadoria.human_review_results (id),
  validated_by uuid not null references curadoria.profiles (id),
  validated_at timestamptz not null,
  delivered_by uuid not null references curadoria.profiles (id),
  delivered_at timestamptz not null default now(),
  generated_at timestamptz not null,
  decision_summary text not null,
  client_context_summary text not null,
  provider_presentations jsonb not null,
  comparison_summary text not null,
  relevant_limitations text[] not null default '{}',
  relevant_missing_information text[] not null default '{}',
  next_steps text[] not null,
  method_explanation text not null,
  disclaimer text not null,
  method_version text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);
create unique index final_curadoria_deliveries_case_id_key on curadoria.final_curadoria_deliveries (case_id);
create index final_curadoria_deliveries_patient_profile_id_idx on curadoria.final_curadoria_deliveries (patient_profile_id);
alter table curadoria.final_curadoria_deliveries enable row level security;
grant select, insert on curadoria.final_curadoria_deliveries to authenticated;
grant all on curadoria.final_curadoria_deliveries to service_role;
create policy "final_curadoria_deliveries_select_admin_or_curator" on curadoria.final_curadoria_deliveries for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = final_curadoria_deliveries.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "final_curadoria_deliveries_select_own_patient" on curadoria.final_curadoria_deliveries for select to authenticated using (patient_profile_id = auth.uid());
create policy "final_curadoria_deliveries_insert_admin_or_case_curator" on curadoria.final_curadoria_deliveries for insert to authenticated with check (delivered_by = auth.uid() and exists (select 1 from curadoria.cases c where c.id = final_curadoria_deliveries.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));

-- view final (texto DELIVERED)
create or replace view curadoria.patient_case_overview as
select c.id as case_id, c.patient_profile_id,
  case c.status
    when 'NEW' then 'Recebemos sua história.'
    when 'IN_REVIEW' then 'Nossa equipe está organizando as informações.'
    when 'WAITING_FOR_INFORMATION' then 'Precisamos de uma informação adicional.'
    when 'READY_FOR_CURATION' then 'Sua curadoria está sendo preparada.'
    when 'IN_CURATION' then 'Sua curadoria está em andamento.'
    when 'HUMAN_REVIEW' then 'Sua curadoria está em revisão final.'
    when 'DELIVERED' then 'Sua Curadoria está pronta!'
    when 'CLOSED' then 'Seu acompanhamento foi encerrado.'
    when 'CANCELLED' then 'Não conseguimos avançar com esta curadoria no momento — nossa equipe vai entrar em contato.'
  end as status_label,
  c.updated_at
from curadoria.cases c
where c.patient_profile_id = auth.uid();