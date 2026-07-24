create or replace function curadoria.is_curator_for_case(_case_id uuid)
returns boolean language sql stable security definer
set search_path = curadoria, pg_temp as $$
  select exists (select 1 from curadoria.cases c where c.id = _case_id and c.assigned_curator_id = auth.uid());
$$;

create or replace function curadoria.is_patient_for_case(_case_id uuid)
returns boolean language sql stable security definer
set search_path = curadoria, pg_temp as $$
  select exists (select 1 from curadoria.cases c where c.id = _case_id and c.patient_profile_id = auth.uid());
$$;

comment on function curadoria.is_curator_for_case(uuid) is 'True quando quem chama e o Curador atribuido ao Caso.';
comment on function curadoria.is_patient_for_case(uuid) is 'True quando quem chama e o paciente dono do Caso.';

revoke execute on function curadoria.is_curator_for_case(uuid) from anon, authenticated;
revoke execute on function curadoria.is_patient_for_case(uuid) from anon, authenticated;

create table curadoria.priority_profiles (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  curator_id uuid not null references curadoria.profiles (id),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'VALIDATED', 'SUPERSEDED')),
  patient_history text,
  validated_at timestamptz,
  validation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint priority_profile_validation_coherent check ((status = 'VALIDATED') = (validated_at is not null))
);
comment on table curadoria.priority_profiles is 'Perfil de Prioridades - primeiro patrimonio construido em conjunto entre paciente e Curador.';
create unique index priority_profiles_one_active_per_case on curadoria.priority_profiles (case_id) where status <> 'SUPERSEDED';
create index priority_profiles_case_idx on curadoria.priority_profiles (case_id);
create trigger set_priority_profiles_updated_at before update on curadoria.priority_profiles for each row execute function curadoria.set_updated_at();

create table curadoria.priority_profile_filters (
  id uuid primary key default gen_random_uuid(),
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  nature text not null check (nature in ('FILTRO_OBRIGATORIO', 'PREFERENCIA')),
  kind text not null,
  value text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint priority_filter_value_not_blank check (btrim(value) <> '')
);
comment on table curadoria.priority_profile_filters is 'Filtros obrigatorios (eliminatorios) e Preferencias. Restricao elimina e nunca recebe peso.';
create index priority_profile_filters_profile_idx on curadoria.priority_profile_filters (priority_profile_id);

create table curadoria.priority_weights (
  id uuid primary key default gen_random_uuid(),
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  criterion text not null,
  weight integer not null check (weight >= 0 and weight <= 100),
  target_value text,
  evidence text not null,
  created_at timestamptz not null default now(),
  constraint priority_weight_evidence_not_blank check (btrim(evidence) <> '')
);
comment on table curadoria.priority_weights is 'Distribuicao de 100 pontos. Peso e importancia atribuida pelo paciente, nunca qualidade de medico.';
comment on column curadoria.priority_weights.evidence is 'Evidencia de Curadoria - obrigatoria. Um peso sem evidencia e estruturalmente impossivel.';
create unique index priority_weights_one_per_criterion on curadoria.priority_weights (priority_profile_id, criterion);

create or replace function curadoria.enforce_priority_profile_validation()
returns trigger language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare total integer;
begin
  if new.status = 'VALIDATED' and (old.status is distinct from 'VALIDATED') then
    select coalesce(sum(weight), 0) into total from curadoria.priority_weights where priority_profile_id = new.id;
    if total <> 100 then
      raise exception 'A distribuicao de pesos precisa somar exatamente 100 pontos (soma atual: %).', total;
    end if;
  end if;
  return new;
end;
$$;
create trigger enforce_priority_profile_validation_trigger before update on curadoria.priority_profiles for each row execute function curadoria.enforce_priority_profile_validation();

create or replace function curadoria.protect_validated_priority_profile()
returns trigger language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare profile_status text;
begin
  select status into profile_status from curadoria.priority_profiles where id = coalesce(new.priority_profile_id, old.priority_profile_id);
  if profile_status = 'VALIDATED' then
    raise exception 'Este Perfil de Prioridades ja foi validado pelo paciente e nao pode mais ser alterado.';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger protect_validated_priority_weights before insert or update or delete on curadoria.priority_weights for each row execute function curadoria.protect_validated_priority_profile();
create trigger protect_validated_priority_filters before insert or update or delete on curadoria.priority_profile_filters for each row execute function curadoria.protect_validated_priority_profile();

create table curadoria.compatibility_analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  internal_score numeric(5, 2) not null check (internal_score >= 0 and internal_score <= 100),
  band text not null check (band in ('MUITO_ALTA', 'ALTA', 'BOA', 'MODERADA')),
  criteria_without_data integer not null default 0,
  computed_at timestamptz not null default now()
);
comment on table curadoria.compatibility_analyses is 'Analise de compatibilidade contra um Perfil validado. internal_score nunca tem policy de SELECT para o paciente.';
create unique index compatibility_analyses_one_per_provider on curadoria.compatibility_analyses (priority_profile_id, professional_profile_id);
create index compatibility_analyses_case_idx on curadoria.compatibility_analyses (case_id);

create table curadoria.compatibility_criterion_results (
  id uuid primary key default gen_random_uuid(),
  compatibility_analysis_id uuid not null references curadoria.compatibility_analyses (id) on delete cascade,
  criterion text not null,
  weight integer not null,
  alignment integer check (alignment is null or (alignment >= 0 and alignment <= 100)),
  contribution numeric(6, 2) not null default 0,
  explanation text not null,
  constraint criterion_explanation_not_blank check (btrim(explanation) <> '')
);
comment on table curadoria.compatibility_criterion_results is 'Distribuicao por criterio com explicacao humana. alignment null = ausencia de dado, nunca valor inventado.';
create unique index compatibility_criterion_results_one_per_criterion on curadoria.compatibility_criterion_results (compatibility_analysis_id, criterion);

create table curadoria.curated_selections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  selected_by uuid not null references curadoria.profiles (id),
  composition_rationale text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'DELIVERED')),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint selection_delivery_coherent check ((status = 'DELIVERED') = (delivered_at is not null)),
  constraint selection_rationale_not_blank check (btrim(composition_rationale) <> '')
);
comment on table curadoria.curated_selections is 'As tres opcoes escolhidas pelo Curador. selected_by NOT NULL: toda selecao tem autoria humana nomeada.';
create unique index curated_selections_one_active_per_profile on curadoria.curated_selections (priority_profile_id);
create trigger set_curated_selections_updated_at before update on curadoria.curated_selections for each row execute function curadoria.set_updated_at();

create table curadoria.curated_selection_options (
  id uuid primary key default gen_random_uuid(),
  curated_selection_id uuid not null references curadoria.curated_selections (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id),
  position integer not null check (position between 1 and 3),
  band text not null check (band in ('MUITO_ALTA', 'ALTA', 'BOA', 'MODERADA')),
  rationale text not null,
  trade_off text,
  constraint option_rationale_not_blank check (btrim(rationale) <> '')
);
comment on table curadoria.curated_selection_options is 'Uma das tres opcoes. position e ordem de apresentacao, nunca colocacao.';
create unique index curated_selection_options_unique_position on curadoria.curated_selection_options (curated_selection_id, position);
create unique index curated_selection_options_unique_provider on curadoria.curated_selection_options (curated_selection_id, professional_profile_id);

create or replace function curadoria.enforce_selection_has_three()
returns trigger language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare total integer;
begin
  if new.status = 'DELIVERED' and (old.status is distinct from 'DELIVERED') then
    select count(*) into total from curadoria.curated_selection_options where curated_selection_id = new.id;
    if total <> 3 then
      raise exception 'A Curadoria apresenta sempre exatamente tres opcoes (atual: %).', total;
    end if;
  end if;
  return new;
end;
$$;
create trigger enforce_selection_has_three_trigger before update on curadoria.curated_selections for each row execute function curadoria.enforce_selection_has_three();

create table curadoria.patient_curadoria_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  curated_selection_id uuid not null references curadoria.curated_selections (id) on delete cascade,
  chosen_option_id uuid references curadoria.curated_selection_options (id),
  outcome text not null check (outcome in ('CHOSEN', 'NONE_OF_THEM')),
  note text,
  decided_at timestamptz not null default now(),
  constraint decision_outcome_coherent check ((outcome = 'CHOSEN') = (chosen_option_id is not null))
);
comment on table curadoria.patient_curadoria_decisions is 'A escolha do paciente. NONE_OF_THEM e desfecho legitimo, nunca falha do paciente. Append-only.';
create unique index patient_curadoria_decisions_one_per_selection on curadoria.patient_curadoria_decisions (curated_selection_id);

alter table curadoria.priority_profiles enable row level security;
alter table curadoria.priority_profile_filters enable row level security;
alter table curadoria.priority_weights enable row level security;
alter table curadoria.compatibility_analyses enable row level security;
alter table curadoria.compatibility_criterion_results enable row level security;
alter table curadoria.curated_selections enable row level security;
alter table curadoria.curated_selection_options enable row level security;
alter table curadoria.patient_curadoria_decisions enable row level security;

grant select, insert, update on curadoria.priority_profiles to authenticated;
grant select, insert, update, delete on curadoria.priority_profile_filters to authenticated;
grant select, insert, update, delete on curadoria.priority_weights to authenticated;
grant select, insert, update, delete on curadoria.compatibility_analyses to authenticated;
grant select, insert, update, delete on curadoria.compatibility_criterion_results to authenticated;
grant select, insert, update on curadoria.curated_selections to authenticated;
grant select, insert, update, delete on curadoria.curated_selection_options to authenticated;
grant select, insert on curadoria.patient_curadoria_decisions to authenticated;

grant all on curadoria.priority_profiles to service_role;
grant all on curadoria.priority_profile_filters to service_role;
grant all on curadoria.priority_weights to service_role;
grant all on curadoria.compatibility_analyses to service_role;
grant all on curadoria.compatibility_criterion_results to service_role;
grant all on curadoria.curated_selections to service_role;
grant all on curadoria.curated_selection_options to service_role;
grant all on curadoria.patient_curadoria_decisions to service_role;

create policy "priority_profiles_write_curator" on curadoria.priority_profiles for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "priority_profiles_select_patient_validated" on curadoria.priority_profiles for select to authenticated
  using (status = 'VALIDATED' and curadoria.is_patient_for_case(case_id));

create policy "priority_filters_write_curator" on curadoria.priority_profile_filters for all to authenticated
  using (exists (select 1 from curadoria.priority_profiles p where p.id = priority_profile_filters.priority_profile_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))))
  with check (exists (select 1 from curadoria.priority_profiles p where p.id = priority_profile_filters.priority_profile_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))));
create policy "priority_filters_select_patient_validated" on curadoria.priority_profile_filters for select to authenticated
  using (exists (select 1 from curadoria.priority_profiles p where p.id = priority_profile_filters.priority_profile_id and p.status = 'VALIDATED' and curadoria.is_patient_for_case(p.case_id)));

create policy "priority_weights_write_curator" on curadoria.priority_weights for all to authenticated
  using (exists (select 1 from curadoria.priority_profiles p where p.id = priority_weights.priority_profile_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))))
  with check (exists (select 1 from curadoria.priority_profiles p where p.id = priority_weights.priority_profile_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))));
create policy "priority_weights_select_patient_validated" on curadoria.priority_weights for select to authenticated
  using (exists (select 1 from curadoria.priority_profiles p where p.id = priority_weights.priority_profile_id and p.status = 'VALIDATED' and curadoria.is_patient_for_case(p.case_id)));

create policy "compatibility_analyses_curator_only" on curadoria.compatibility_analyses for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "compatibility_criterion_results_curator_only" on curadoria.compatibility_criterion_results for all to authenticated
  using (exists (select 1 from curadoria.compatibility_analyses a where a.id = compatibility_criterion_results.compatibility_analysis_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(a.case_id))))
  with check (exists (select 1 from curadoria.compatibility_analyses a where a.id = compatibility_criterion_results.compatibility_analysis_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(a.case_id))));

create policy "curated_selections_write_curator" on curadoria.curated_selections for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
create policy "curated_selections_select_patient_delivered" on curadoria.curated_selections for select to authenticated
  using (status = 'DELIVERED' and curadoria.is_patient_for_case(case_id));

create policy "curated_selection_options_write_curator" on curadoria.curated_selection_options for all to authenticated
  using (exists (select 1 from curadoria.curated_selections s where s.id = curated_selection_options.curated_selection_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(s.case_id))))
  with check (exists (select 1 from curadoria.curated_selections s where s.id = curated_selection_options.curated_selection_id and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(s.case_id))));
create policy "curated_selection_options_select_patient_delivered" on curadoria.curated_selection_options for select to authenticated
  using (exists (select 1 from curadoria.curated_selections s where s.id = curated_selection_options.curated_selection_id and s.status = 'DELIVERED' and curadoria.is_patient_for_case(s.case_id)));

create policy "patient_decisions_insert_patient" on curadoria.patient_curadoria_decisions for insert to authenticated
  with check (curadoria.is_patient_for_case(case_id));
create policy "patient_decisions_select_own_or_team" on curadoria.patient_curadoria_decisions for select to authenticated
  using (curadoria.is_patient_for_case(case_id) or curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "professional_profiles_select_curator" on curadoria.professional_profiles for select to authenticated
  using (curadoria.has_role('curador_medico'));
create policy "professional_competency_areas_select_curator" on curadoria.professional_competency_areas for select to authenticated
  using (curadoria.has_role('curador_medico'));
create policy "professional_profiles_select_patient_delivered_option" on curadoria.professional_profiles for select to authenticated
  using (exists (select 1 from curadoria.curated_selection_options o join curadoria.curated_selections s on s.id = o.curated_selection_id where o.professional_profile_id = professional_profiles.id and s.status = 'DELIVERED' and curadoria.is_patient_for_case(s.case_id)));