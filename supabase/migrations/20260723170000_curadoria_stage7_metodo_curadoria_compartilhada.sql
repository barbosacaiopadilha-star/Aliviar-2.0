-- MISSÃO 209 / FASE 1 — MÉTODO DE CURADORIA COMPARTILHADA
--
-- Cria as 8 tabelas do Método no schema `curadoria`, onde o aliviar-conexao
-- de fato vive em produção. O schema `public` do mesmo banco pertence à
-- AliCIA e não é tocado por nenhuma linha deste arquivo.
--
-- Derivado da Ontologia Oficial (docs/ONTOLOGIA_CURADORIA_COMPARTILHADA.md)
-- e do Curation Engine (docs/CURATION_ENGINE_SPECIFICATION.md).
--
-- PURAMENTE ADITIVA: nenhum DROP, nenhum ALTER destrutivo, nenhum UPDATE em
-- tabela legada. As duas únicas alterações em objeto preexistente são
-- CREATE POLICY em professional_profiles. Rollback = DROP das 8 tabelas.
--
-- O que este schema garante estruturalmente (invariantes da Ontologia §6):
--   • Inv. 10 — todo peso carrega evidência: `evidence` NOT NULL e não-vazio
--   • Inv. 12 — só o paciente valida: registrado em validated_at/validation_note
--   • Inv. 13 — só o Curador seleciona: `selected_by` NOT NULL
--   • Inv. 14 — só o paciente decide: INSERT restrito a ele por RLS
--   • Inv. 16 — a distribuição soma exatamente 100 na validação (trigger)
--   • Inv. 17 — exatamente três opções na entrega (trigger)
--   • Inv. 19 — nenhum médico repetido na mesma seleção
--   • Inv. 26 — o score interno nunca é legível pelo paciente: não existe
--     policy de SELECT para ele em compatibility_analyses
--   • Inv. 27 — os pesos SÃO legíveis pelo paciente: é a importância que ele
--     mesmo atribuiu, nunca nota de médico
--   • Inv. 28 — Perfil validado é imutável (trigger)
--   • Inv. 34 — ausência de dado é lacuna (alignment null), nunca nota baixa

-- ---------------------------------------------------------------------------
-- Helpers de autorização por Caso
-- ---------------------------------------------------------------------------
-- `search_path` fixo por segurança — corrige de saída o padrão que os
-- advisors do Supabase acusam nas funções legadas deste schema.

create or replace function curadoria.is_curator_for_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1 from curadoria.cases c
    where c.id = _case_id and c.assigned_curator_id = auth.uid()
  );
$$;

create or replace function curadoria.is_patient_for_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1 from curadoria.cases c
    where c.id = _case_id and c.patient_profile_id = auth.uid()
  );
$$;

comment on function curadoria.is_curator_for_case(uuid) is 'True quando quem chama é o Curador atribuído ao Caso — usada por toda a RLS da Curadoria Compartilhada.';
comment on function curadoria.is_patient_for_case(uuid) is 'True quando quem chama é o paciente dono do Caso.';

-- Estas funções são infraestrutura de RLS, chamadas dentro de policies.
-- Nada as invoca por RPC — revogar o EXECUTE público evita o achado
-- "Public Can Execute SECURITY DEFINER Function".
revoke execute on function curadoria.is_curator_for_case(uuid) from anon, authenticated;
revoke execute on function curadoria.is_patient_for_case(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Perfil de Prioridades — o artefato central do Método (Ontologia §3.4)
-- ---------------------------------------------------------------------------

create table curadoria.priority_profiles (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  curator_id uuid not null references curadoria.profiles (id),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'VALIDATED', 'SUPERSEDED')),
  -- A história como o Curador a compreendeu na Consulta Inicial. Nunca
  -- substitui patient_stories (a história nas palavras do paciente).
  patient_history text,
  -- Registro do ato de validação. Sem ele o Perfil não existe de fato e
  -- nenhuma compatibilidade pode ser calculada.
  validated_at timestamptz,
  validation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint priority_profile_validation_coherent
    check ((status = 'VALIDATED') = (validated_at is not null))
);

comment on table curadoria.priority_profiles is 'Perfil de Prioridades — primeiro patrimônio construído em conjunto entre paciente e Curador. Só orienta as etapas seguintes depois de validado pelo paciente.';

create unique index priority_profiles_one_active_per_case
  on curadoria.priority_profiles (case_id)
  where status <> 'SUPERSEDED';

create index priority_profiles_case_idx on curadoria.priority_profiles (case_id);

create trigger set_priority_profiles_updated_at
  before update on curadoria.priority_profiles
  for each row execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- Restrições e Observações (Ontologia §3.7)
-- ---------------------------------------------------------------------------

create table curadoria.priority_profile_filters (
  id uuid primary key default gen_random_uuid(),
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  -- FILTRO_OBRIGATORIO elimina quem não atende; PREFERENCIA nunca elimina.
  nature text not null check (nature in ('FILTRO_OBRIGATORIO', 'PREFERENCIA')),
  kind text not null,
  value text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint priority_filter_value_not_blank check (btrim(value) <> '')
);

comment on table curadoria.priority_profile_filters is 'Filtros obrigatórios (eliminatórios) e Preferências (nunca eliminatórias). Restrição elimina e nunca recebe peso (Ontologia, Invariante 20).';

create index priority_profile_filters_profile_idx on curadoria.priority_profile_filters (priority_profile_id);

-- ---------------------------------------------------------------------------
-- Pesos — 100 pontos, cada um com Evidência de Curadoria (Ontologia §3.6)
-- ---------------------------------------------------------------------------

create table curadoria.priority_weights (
  id uuid primary key default gen_random_uuid(),
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  criterion text not null,
  weight integer not null check (weight >= 0 and weight <= 100),
  target_value text,
  -- EVIDÊNCIA DE CURADORIA: o momento da conversa que originou este peso.
  -- NOT NULL por design — um peso sem evidência não existe (Invariante 10).
  evidence text not null,
  created_at timestamptz not null default now(),
  constraint priority_weight_evidence_not_blank check (btrim(evidence) <> '')
);

comment on table curadoria.priority_weights is 'Distribuição de 100 pontos entre os critérios do paciente. Peso é importância atribuída por ele, nunca qualidade de médico.';
comment on column curadoria.priority_weights.evidence is 'Evidência de Curadoria — obrigatória. Um peso sem evidência é estruturalmente impossível.';

create unique index priority_weights_one_per_criterion
  on curadoria.priority_weights (priority_profile_id, criterion);

-- ---------------------------------------------------------------------------
-- Validação: 100 pontos exatos, e imutabilidade depois dela
-- ---------------------------------------------------------------------------

create or replace function curadoria.enforce_priority_profile_validation()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  total integer;
begin
  if new.status = 'VALIDATED' and (old.status is distinct from 'VALIDATED') then
    select coalesce(sum(weight), 0) into total
    from curadoria.priority_weights
    where priority_profile_id = new.id;

    if total <> 100 then
      raise exception 'A distribuição de pesos precisa somar exatamente 100 pontos (soma atual: %).', total;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_priority_profile_validation_trigger
  before update on curadoria.priority_profiles
  for each row execute function curadoria.enforce_priority_profile_validation();

-- Perfil validado é imutável: prioridade validada nunca é reescrita por baixo
-- do paciente. Corrigir significa criar um novo e marcar o anterior como
-- SUPERSEDED (Invariante 28).
create or replace function curadoria.protect_validated_priority_profile()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  profile_status text;
begin
  select status into profile_status
  from curadoria.priority_profiles
  where id = coalesce(new.priority_profile_id, old.priority_profile_id);

  if profile_status = 'VALIDATED' then
    raise exception 'Este Perfil de Prioridades já foi validado pelo paciente e não pode mais ser alterado.';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger protect_validated_priority_weights
  before insert or update or delete on curadoria.priority_weights
  for each row execute function curadoria.protect_validated_priority_profile();

create trigger protect_validated_priority_filters
  before insert or update or delete on curadoria.priority_profile_filters
  for each row execute function curadoria.protect_validated_priority_profile();

-- ---------------------------------------------------------------------------
-- Compatibilidade — ferramenta do Curador (Ontologia §3.10)
-- ---------------------------------------------------------------------------

create table curadoria.compatibility_analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  -- Nível interno (0-100). Ferramenta objetiva do Curador.
  internal_score numeric(5, 2) not null check (internal_score >= 0 and internal_score <= 100),
  -- Nível externo. É o único nível que pode chegar ao paciente.
  band text not null check (band in ('MUITO_ALTA', 'ALTA', 'BOA', 'MODERADA')),
  -- Critérios sem dado no cadastro. Nunca preenchidos com valor inventado.
  criteria_without_data integer not null default 0,
  computed_at timestamptz not null default now()
);

comment on table curadoria.compatibility_analyses is 'Análise de compatibilidade contra um Perfil validado. internal_score é ferramenta do Curador e NUNCA tem policy de SELECT para o paciente (Invariante 26); só a faixa chega a ele.';

create unique index compatibility_analyses_one_per_provider
  on curadoria.compatibility_analyses (priority_profile_id, professional_profile_id);

create index compatibility_analyses_case_idx on curadoria.compatibility_analyses (case_id);

create table curadoria.compatibility_criterion_results (
  id uuid primary key default gen_random_uuid(),
  compatibility_analysis_id uuid not null references curadoria.compatibility_analyses (id) on delete cascade,
  criterion text not null,
  weight integer not null,
  -- Null = o cadastro do profissional não tem esse dado. Nunca 0 disfarçado
  -- de "ruim" (Invariante 34).
  alignment integer check (alignment is null or (alignment >= 0 and alignment <= 100)),
  contribution numeric(6, 2) not null default 0,
  explanation text not null,
  constraint criterion_explanation_not_blank check (btrim(explanation) <> '')
);

comment on table curadoria.compatibility_criterion_results is 'Distribuição da compatibilidade por critério, com explicação em linguagem humana. alignment null significa ausência de dado — nunca um valor inventado.';

create unique index compatibility_criterion_results_one_per_criterion
  on curadoria.compatibility_criterion_results (compatibility_analysis_id, criterion);

-- ---------------------------------------------------------------------------
-- Seleção — exatamente três, escolhidos por um humano (Ontologia §3.11)
-- ---------------------------------------------------------------------------

create table curadoria.curated_selections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  priority_profile_id uuid not null references curadoria.priority_profiles (id) on delete cascade,
  -- Autoria humana obrigatória. O algoritmo nunca seleciona (Princípio 14).
  selected_by uuid not null references curadoria.profiles (id),
  composition_rationale text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'DELIVERED')),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint selection_delivery_coherent check ((status = 'DELIVERED') = (delivered_at is not null)),
  constraint selection_rationale_not_blank check (btrim(composition_rationale) <> '')
);

comment on table curadoria.curated_selections is 'As três opções escolhidas pelo Curador. selected_by é NOT NULL: toda seleção tem autoria humana nomeada (Invariante 13).';

create unique index curated_selections_one_active_per_profile
  on curadoria.curated_selections (priority_profile_id);

create trigger set_curated_selections_updated_at
  before update on curadoria.curated_selections
  for each row execute function curadoria.set_updated_at();

create table curadoria.curated_selection_options (
  id uuid primary key default gen_random_uuid(),
  curated_selection_id uuid not null references curadoria.curated_selections (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id),
  -- Ordem de apresentação, nunca colocação: as três são caminhos legítimos e
  -- diferentes, não um pódio.
  position integer not null check (position between 1 and 3),
  band text not null check (band in ('MUITO_ALTA', 'ALTA', 'BOA', 'MODERADA')),
  rationale text not null,
  trade_off text,
  constraint option_rationale_not_blank check (btrim(rationale) <> '')
);

comment on table curadoria.curated_selection_options is 'Uma das três opções apresentadas. position é ordem de apresentação, nunca colocação. Carrega a faixa qualitativa, nunca o score interno.';

create unique index curated_selection_options_unique_position
  on curadoria.curated_selection_options (curated_selection_id, position);
create unique index curated_selection_options_unique_provider
  on curadoria.curated_selection_options (curated_selection_id, professional_profile_id);

-- Exatamente três no momento da entrega (Invariante 17).
create or replace function curadoria.enforce_selection_has_three()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  total integer;
begin
  if new.status = 'DELIVERED' and (old.status is distinct from 'DELIVERED') then
    select count(*) into total
    from curadoria.curated_selection_options
    where curated_selection_id = new.id;

    if total <> 3 then
      raise exception 'A Curadoria apresenta sempre exatamente três opções (atual: %).', total;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_selection_has_three_trigger
  before update on curadoria.curated_selections
  for each row execute function curadoria.enforce_selection_has_three();

-- ---------------------------------------------------------------------------
-- Decisão do paciente (Ontologia §3.14)
-- ---------------------------------------------------------------------------

create table curadoria.patient_curadoria_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  curated_selection_id uuid not null references curadoria.curated_selections (id) on delete cascade,
  -- Null é decisão legítima: "nenhuma destas" é informação, não falha.
  chosen_option_id uuid references curadoria.curated_selection_options (id),
  outcome text not null check (outcome in ('CHOSEN', 'NONE_OF_THEM')),
  note text,
  decided_at timestamptz not null default now(),
  constraint decision_outcome_coherent check ((outcome = 'CHOSEN') = (chosen_option_id is not null))
);

comment on table curadoria.patient_curadoria_decisions is 'A escolha do paciente. NONE_OF_THEM é desfecho legítimo e registrado — significa que alguma etapa anterior não capturou algo, nunca falha do paciente. Append-only.';

create unique index patient_curadoria_decisions_one_per_selection
  on curadoria.patient_curadoria_decisions (curated_selection_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

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

-- Perfil: Curador do Caso e administrador conduzem; o paciente lê o próprio
-- Perfil somente depois de validado.
create policy "priority_profiles_write_curator" on curadoria.priority_profiles
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "priority_profiles_select_patient_validated" on curadoria.priority_profiles
  for select to authenticated
  using (status = 'VALIDATED' and curadoria.is_patient_for_case(case_id));

create policy "priority_filters_write_curator" on curadoria.priority_profile_filters
  for all to authenticated
  using (exists (select 1 from curadoria.priority_profiles p
    where p.id = priority_profile_filters.priority_profile_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))))
  with check (exists (select 1 from curadoria.priority_profiles p
    where p.id = priority_profile_filters.priority_profile_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))));

create policy "priority_filters_select_patient_validated" on curadoria.priority_profile_filters
  for select to authenticated
  using (exists (select 1 from curadoria.priority_profiles p
    where p.id = priority_profile_filters.priority_profile_id
      and p.status = 'VALIDATED' and curadoria.is_patient_for_case(p.case_id)));

-- Os pesos SÃO do paciente e aparecem para ele (Invariante 27).
create policy "priority_weights_write_curator" on curadoria.priority_weights
  for all to authenticated
  using (exists (select 1 from curadoria.priority_profiles p
    where p.id = priority_weights.priority_profile_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))))
  with check (exists (select 1 from curadoria.priority_profiles p
    where p.id = priority_weights.priority_profile_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(p.case_id))));

create policy "priority_weights_select_patient_validated" on curadoria.priority_weights
  for select to authenticated
  using (exists (select 1 from curadoria.priority_profiles p
    where p.id = priority_weights.priority_profile_id
      and p.status = 'VALIDATED' and curadoria.is_patient_for_case(p.case_id)));

-- Compatibilidade: SOMENTE Curador e administrador. Nenhuma policy concede
-- SELECT ao paciente — o score interno nunca sai do nível interno (Inv. 26).
create policy "compatibility_analyses_curator_only" on curadoria.compatibility_analyses
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "compatibility_criterion_results_curator_only" on curadoria.compatibility_criterion_results
  for all to authenticated
  using (exists (select 1 from curadoria.compatibility_analyses a
    where a.id = compatibility_criterion_results.compatibility_analysis_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(a.case_id))))
  with check (exists (select 1 from curadoria.compatibility_analyses a
    where a.id = compatibility_criterion_results.compatibility_analysis_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(a.case_id))));

-- Seleção: o paciente só enxerga depois de entregue.
create policy "curated_selections_write_curator" on curadoria.curated_selections
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "curated_selections_select_patient_delivered" on curadoria.curated_selections
  for select to authenticated
  using (status = 'DELIVERED' and curadoria.is_patient_for_case(case_id));

create policy "curated_selection_options_write_curator" on curadoria.curated_selection_options
  for all to authenticated
  using (exists (select 1 from curadoria.curated_selections s
    where s.id = curated_selection_options.curated_selection_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(s.case_id))))
  with check (exists (select 1 from curadoria.curated_selections s
    where s.id = curated_selection_options.curated_selection_id
      and (curadoria.has_role('administrador') or curadoria.is_curator_for_case(s.case_id))));

create policy "curated_selection_options_select_patient_delivered" on curadoria.curated_selection_options
  for select to authenticated
  using (exists (select 1 from curadoria.curated_selections s
    where s.id = curated_selection_options.curated_selection_id
      and s.status = 'DELIVERED' and curadoria.is_patient_for_case(s.case_id)));

-- Decisão: quem decide é o paciente. Curador e administrador leem, nunca
-- escrevem — não existe policy de INSERT para eles aqui (Invariante 14).
create policy "patient_decisions_insert_patient" on curadoria.patient_curadoria_decisions
  for insert to authenticated
  with check (curadoria.is_patient_for_case(case_id));

create policy "patient_decisions_select_own_or_team" on curadoria.patient_curadoria_decisions
  for select to authenticated
  using (curadoria.is_patient_for_case(case_id)
    or curadoria.has_role('administrador')
    or curadoria.is_curator_for_case(case_id));

-- ---------------------------------------------------------------------------
-- Duas policies aditivas em tabela preexistente
-- ---------------------------------------------------------------------------
-- Únicas alterações em objeto que já existia. Ambas CREATE POLICY; nenhum
-- DROP, nenhuma policy existente é modificada.

-- O Curador precisa ler o cadastro dos profissionais para comparar — hoje
-- professional_profiles só concede leitura a administrador e ao próprio
-- profissional.
create policy "professional_profiles_select_curator" on curadoria.professional_profiles
  for select to authenticated
  using (curadoria.has_role('curador_medico'));

create policy "professional_competency_areas_select_curator" on curadoria.professional_competency_areas
  for select to authenticated
  using (curadoria.has_role('curador_medico'));

-- O paciente precisa ler o nome do profissional das três opções que recebeu —
-- e apenas desses.
create policy "professional_profiles_select_patient_delivered_option" on curadoria.professional_profiles
  for select to authenticated
  using (exists (
    select 1
    from curadoria.curated_selection_options o
    join curadoria.curated_selections s on s.id = o.curated_selection_id
    where o.professional_profile_id = professional_profiles.id
      and s.status = 'DELIVERED'
      and curadoria.is_patient_for_case(s.case_id)
  ));
