create table curadoria.consultation_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  curator_id uuid not null references curadoria.profiles (id),
  context_reviewed boolean not null default false,
  documents_reviewed boolean not null default false,
  meeting_scheduled_at timestamptz,
  known_facts text[] not null default '{}',
  open_pendencies text[] not null default '{}',
  narrative text,
  motivation text,
  understanding_confirmed_at timestamptz,
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table curadoria.consultation_records is 'Consulta Inicial - Acolhimento e Historia. understanding_confirmed_at registra o momento de reconhecimento; sem ele a etapa nao cumpriu seu proposito.';
create unique index consultation_records_one_per_case on curadoria.consultation_records (case_id);
create trigger set_consultation_records_updated_at before update on curadoria.consultation_records for each row execute function curadoria.set_updated_at();

create table curadoria.case_clinical_context (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  diagnosis text,
  hypothesis text,
  exams text[] not null default '{}',
  treatments text[] not null default '{}',
  clinical_context text,
  limitations text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table curadoria.case_clinical_context is 'Estruturacao do Caso. diagnosis e hypothesis registram fato relatado - a Aliviar nunca diagnostica nem interpreta exame.';
create unique index case_clinical_context_one_per_case on curadoria.case_clinical_context (case_id);
create trigger set_case_clinical_context_updated_at before update on curadoria.case_clinical_context for each row execute function curadoria.set_updated_at();

create table curadoria.curadoria_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  curated_selection_id uuid not null references curadoria.curated_selections (id) on delete cascade,
  composition_rationale text,
  emitted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_delivery_requires_emission check (delivered_at is null or emitted_at is not null)
);
comment on table curadoria.curadoria_reports is 'Relatorio de Curadoria. Materializa e comunica a decisao humana ja registrada na selecao - nunca toma uma nova decisao.';
create unique index curadoria_reports_one_per_selection on curadoria.curadoria_reports (curated_selection_id);
create trigger set_curadoria_reports_updated_at before update on curadoria.curadoria_reports for each row execute function curadoria.set_updated_at();

create table curadoria.curadoria_report_options (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references curadoria.curadoria_reports (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id),
  position integer not null check (position between 1 and 3),
  justification text not null,
  relation_to_weights text not null,
  favorable_points text[] not null default '{}',
  attention_points text[] not null,
  suggested_questions text[] not null default '{}',
  curator_observations text,
  constraint report_option_justification_not_blank check (btrim(justification) <> ''),
  constraint report_option_relation_not_blank check (btrim(relation_to_weights) <> ''),
  constraint report_option_has_attention_point check (array_length(attention_points, 1) >= 1)
);
comment on table curadoria.curadoria_report_options is 'Uma das tres opcoes do Relatorio. attention_points exige ao menos um item: opcao so com virtudes e recomendacao disfarcada.';
create unique index curadoria_report_options_unique_position on curadoria.curadoria_report_options (report_id, position);
create unique index curadoria_report_options_unique_provider on curadoria.curadoria_report_options (report_id, professional_profile_id);

create or replace function curadoria.enforce_report_has_three()
returns trigger language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare total integer;
begin
  if new.emitted_at is not null and old.emitted_at is null then
    select count(*) into total from curadoria.curadoria_report_options where report_id = new.id;
    if total <> 3 then
      raise exception 'O Relatorio apresenta sempre exatamente tres opcoes (atual: %).', total;
    end if;
  end if;
  return new;
end;
$$;
create trigger enforce_report_has_three_trigger before update on curadoria.curadoria_reports for each row execute function curadoria.enforce_report_has_three();

create or replace function curadoria.protect_delivered_report()
returns trigger language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare report_delivered timestamptz;
begin
  select delivered_at into report_delivered from curadoria.curadoria_reports where id = coalesce(new.report_id, old.report_id);
  if report_delivered is not null then
    raise exception 'Este Relatorio ja foi entregue ao paciente e nao pode mais ser alterado.';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger protect_delivered_report_options before insert or update or delete on curadoria.curadoria_report_options for each row execute function curadoria.protect_delivered_report();

create table curadoria.devolutiva_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  report_id uuid not null references curadoria.curadoria_reports (id) on delete cascade,
  presented_by uuid not null references curadoria.profiles (id),
  presented_at timestamptz,
  patient_questions text[] not null default '{}',
  observations text[] not null default '{}',
  next_steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table curadoria.devolutiva_records is 'A conversa de devolutiva. A entrega e sempre humana: presented_by e NOT NULL. A decisao do paciente vive em patient_curadoria_decisions, porque a autoria e dele.';
create unique index devolutiva_records_one_per_report on curadoria.devolutiva_records (report_id);
create trigger set_devolutiva_records_updated_at before update on curadoria.devolutiva_records for each row execute function curadoria.set_updated_at();

alter table curadoria.consultation_records enable row level security;
alter table curadoria.case_clinical_context enable row level security;
alter table curadoria.curadoria_reports enable row level security;
alter table curadoria.curadoria_report_options enable row level security;
alter table curadoria.devolutiva_records enable row level security;

grant select, insert, update on curadoria.consultation_records to authenticated;
grant select, insert, update on curadoria.case_clinical_context to authenticated;
grant select, insert, update on curadoria.curadoria_reports to authenticated;
grant select, insert, update, delete on curadoria.curadoria_report_options to authenticated;
grant select, insert, update on curadoria.devolutiva_records to authenticated;

grant all on curadoria.consultation_records to service_role;
grant all on curadoria.case_clinical_context to service_role;
grant all on curadoria.curadoria_reports to service_role;
grant all on curadoria.curadoria_report_options to service_role;
grant all on curadoria.devolutiva_records to service_role;

create policy "consultation_write_curator" on curadoria.consultation_records for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "consultation_select_patient" on curadoria.consultation_records for select to authenticated
  using (curadoria.is_patient_for_case(case_id));

create policy "clinical_context_write_curator" on curadoria.case_clinical_context for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "clinical_context_select_patient" on curadoria.case_clinical_context for select to authenticated
  using (curadoria.is_patient_for_case(case_id));

create policy "reports_write_curator" on curadoria.curadoria_reports for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "reports_select_patient_delivered" on curadoria.curadoria_reports for select to authenticated
  using (delivered_at is not null and curadoria.is_patient_for_case(case_id));

create policy "report_options_write_curator" on curadoria.curadoria_report_options for all to authenticated
  using (exists (select 1 from curadoria.curadoria_reports r where r.id = curadoria_report_options.report_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(r.case_id))))
  with check (exists (select 1 from curadoria.curadoria_reports r where r.id = curadoria_report_options.report_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(r.case_id))));
create policy "report_options_select_patient_delivered" on curadoria.curadoria_report_options for select to authenticated
  using (exists (select 1 from curadoria.curadoria_reports r where r.id = curadoria_report_options.report_id and r.delivered_at is not null and curadoria.is_patient_for_case(r.case_id)));

create policy "devolutiva_write_curator" on curadoria.devolutiva_records for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "devolutiva_select_patient" on curadoria.devolutiva_records for select to authenticated
  using (curadoria.is_patient_for_case(case_id));