-- MISSÃO 002 — CURADORIA COMPARTILHADA
--
-- O ACE automático deixa de ser o mecanismo de decisão. O Método de
-- Curadoria Compartilhada passa a ser a autoridade máxima
-- (docs/FUNDAMENTOS_DO_METODO_ALIVIAR.md).
--
-- O que este schema garante estruturalmente:
--   • O Curador conduz; o sistema apenas registra e calcula.
--   • O Perfil de Prioridades pertence ao paciente e só existe de fato
--     depois que ele valida (status VALIDATED + validated_at).
--   • Todo peso nasce de uma evidência — evidence é NOT NULL e não-vazio.
--     Peso sem evidência é estruturalmente impossível.
--   • A distribuição de pesos soma exatamente 100 pontos no momento da
--     validação (enforce_priority_profile_validation).
--   • A seleção dos três profissionais tem autoria humana obrigatória
--     (selected_by) e é exatamente três (enforce_selection_has_three).
--   • O score interno de compatibilidade NUNCA é legível pelo paciente —
--     não existe policy de SELECT para ele em compatibility_analyses.
--     O paciente lê a faixa qualitativa, que vive na opção selecionada.
--   • Os pesos SÃO legíveis pelo paciente: são a importância que ele mesmo
--     atribuiu, nunca nota de médico.
--
-- Nenhuma tabela do ACE (ace_executions, ace_artifacts, human_review_results,
-- final_curadoria_deliveries) é alterada ou removida por esta migration —
-- a substituição do mecanismo de decisão é feita por adição, preservando
-- todo o histórico já produzido.

-- ---------------------------------------------------------------------------
-- Helpers de autorização por Caso
-- ---------------------------------------------------------------------------

-- Mesmo padrão de is_case_curator_for_story (20260712100010): toda checagem
-- de papel em RLS passa por uma função, nunca por enum espalhado na policy.
create or replace function public.is_curator_for_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cases c
    where c.id = _case_id and c.assigned_curator_id = auth.uid()
  );
$$;

create or replace function public.is_patient_for_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cases c
    where c.id = _case_id and c.patient_profile_id = auth.uid()
  );
$$;

comment on function public.is_curator_for_case(uuid) is 'True quando quem chama é o Curador atribuído ao Caso — usada por toda a RLS da Curadoria Compartilhada.';
comment on function public.is_patient_for_case(uuid) is 'True quando quem chama é o paciente dono do Caso.';

-- ---------------------------------------------------------------------------
-- Perfil de Prioridades — o artefato central do Método
-- ---------------------------------------------------------------------------

create table public.priority_profiles (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  curator_id uuid not null references public.profiles (id),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'VALIDATED', 'SUPERSEDED')),
  -- A história como o Curador a compreendeu na Consulta Inicial. Nunca
  -- substitui patient_stories (a história nas palavras do paciente) —
  -- é o registro da etapa "Compreender", de autoria do Curador.
  patient_history text,
  -- Registro do ato de validação do paciente. Sem ele o Perfil não existe
  -- de fato e nenhuma compatibilidade pode ser calculada.
  validated_at timestamptz,
  validation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint priority_profile_validation_coherent
    check ((status = 'VALIDATED') = (validated_at is not null))
);

comment on table public.priority_profiles is 'Perfil de Prioridades — primeiro patrimônio construído em conjunto entre paciente e Curador. Só orienta as etapas seguintes depois de validado pelo paciente (status VALIDATED).';
comment on column public.priority_profiles.patient_history is 'A história compreendida pelo Curador na Consulta Inicial (etapa Compreender) — nunca substitui patient_stories.';

-- Um Caso só pode ter um Perfil vigente por vez; versões anteriores viram
-- SUPERSEDED, nunca são apagadas.
create unique index priority_profiles_one_active_per_case
  on public.priority_profiles (case_id)
  where status <> 'SUPERSEDED';

create index priority_profiles_case_idx on public.priority_profiles (case_id);

create trigger set_priority_profiles_updated_at
  before update on public.priority_profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Filtros obrigatórios e Preferências
-- ---------------------------------------------------------------------------

create table public.priority_profile_filters (
  id uuid primary key default gen_random_uuid(),
  priority_profile_id uuid not null references public.priority_profiles (id) on delete cascade,
  -- FILTRO_OBRIGATORIO elimina quem não atende; PREFERENCIA nunca elimina —
  -- é registrada, mostrada ao Curador e ao paciente, e informa a conversa.
  nature text not null check (nature in ('FILTRO_OBRIGATORIO', 'PREFERENCIA')),
  kind text not null,
  value text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint priority_filter_value_not_blank check (btrim(value) <> '')
);

comment on table public.priority_profile_filters is 'Filtros obrigatórios (eliminatórios) e Preferências (nunca eliminatórias) do Perfil de Prioridades.';

create index priority_profile_filters_profile_idx on public.priority_profile_filters (priority_profile_id);

-- ---------------------------------------------------------------------------
-- Distribuição de pesos — 100 pontos, cada um com evidência
-- ---------------------------------------------------------------------------

create table public.priority_weights (
  id uuid primary key default gen_random_uuid(),
  priority_profile_id uuid not null references public.priority_profiles (id) on delete cascade,
  criterion text not null,
  weight integer not null check (weight >= 0 and weight <= 100),
  -- Alvo declarado pelo paciente quando o critério exige um (ex.: qual
  -- abordagem inicial ele prefere). Null quando o critério é monotônico.
  target_value text,
  -- EVIDÊNCIA DE CURADORIA: o momento da conversa que originou este peso.
  -- NOT NULL e não-vazio por design — um peso sem evidência não existe.
  evidence text not null,
  created_at timestamptz not null default now(),
  constraint priority_weight_evidence_not_blank check (btrim(evidence) <> '')
);

comment on table public.priority_weights is 'Distribuição de 100 pontos entre os critérios do paciente. Cada peso carrega obrigatoriamente sua Evidência de Curadoria — o momento da Consulta Inicial que o originou.';
comment on column public.priority_weights.evidence is 'Evidência de Curadoria — obrigatória. Um peso sem evidência é estruturalmente impossível.';

create unique index priority_weights_one_per_criterion
  on public.priority_weights (priority_profile_id, criterion);

-- ---------------------------------------------------------------------------
-- Validação: 100 pontos exatos, no momento em que o paciente valida
-- ---------------------------------------------------------------------------

create or replace function public.enforce_priority_profile_validation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  if new.status = 'VALIDATED' and (old.status is distinct from 'VALIDATED') then
    select coalesce(sum(weight), 0) into total
    from public.priority_weights
    where priority_profile_id = new.id;

    if total <> 100 then
      raise exception 'A distribuição de pesos precisa somar exatamente 100 pontos (soma atual: %).', total;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_priority_profile_validation_trigger
  before update on public.priority_profiles
  for each row
  execute function public.enforce_priority_profile_validation();

-- Um Perfil já validado é imutável: prioridade validada nunca é reescrita
-- por baixo do paciente. Corrigir significa criar um novo Perfil e marcar o
-- anterior como SUPERSEDED.
create or replace function public.protect_validated_priority_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_status text;
begin
  select status into profile_status
  from public.priority_profiles
  where id = coalesce(new.priority_profile_id, old.priority_profile_id);

  if profile_status = 'VALIDATED' then
    raise exception 'Este Perfil de Prioridades já foi validado pelo paciente e não pode mais ser alterado.';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger protect_validated_priority_weights
  before insert or update or delete on public.priority_weights
  for each row
  execute function public.protect_validated_priority_profile();

create trigger protect_validated_priority_filters
  before insert or update or delete on public.priority_profile_filters
  for each row
  execute function public.protect_validated_priority_profile();

-- ---------------------------------------------------------------------------
-- Compatibilidade — ferramenta do Curador, nunca visível ao paciente
-- ---------------------------------------------------------------------------

create table public.compatibility_analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  priority_profile_id uuid not null references public.priority_profiles (id) on delete cascade,
  professional_profile_id uuid not null references public.professional_profiles (id) on delete cascade,
  -- Nível interno (0-100). Ferramenta objetiva do Curador.
  internal_score numeric(5, 2) not null check (internal_score >= 0 and internal_score <= 100),
  -- Nível externo. É o único nível que pode chegar ao paciente.
  band text not null check (band in ('MUITO_ALTA', 'ALTA', 'BOA', 'MODERADA')),
  -- Critérios sem dado registrado no cadastro do profissional. Nunca são
  -- preenchidos com valor inventado — ficam visíveis como lacuna.
  criteria_without_data integer not null default 0,
  computed_at timestamptz not null default now()
);

comment on table public.compatibility_analyses is 'Análise de compatibilidade de um profissional contra um Perfil de Prioridades validado. internal_score é ferramenta do Curador e nunca tem policy de SELECT para o paciente; apenas a faixa (band) pode chegar a ele.';

create unique index compatibility_analyses_one_per_provider
  on public.compatibility_analyses (priority_profile_id, professional_profile_id);

create index compatibility_analyses_case_idx on public.compatibility_analyses (case_id);

create table public.compatibility_criterion_results (
  id uuid primary key default gen_random_uuid(),
  compatibility_analysis_id uuid not null references public.compatibility_analyses (id) on delete cascade,
  criterion text not null,
  weight integer not null,
  -- Null = o cadastro do profissional não tem esse dado. Nunca 0 disfarçado.
  alignment integer check (alignment is null or (alignment >= 0 and alignment <= 100)),
  contribution numeric(6, 2) not null default 0,
  explanation text not null,
  constraint criterion_explanation_not_blank check (btrim(explanation) <> '')
);

comment on table public.compatibility_criterion_results is 'Distribuição da compatibilidade por critério, com a explicação em linguagem humana. alignment null significa ausência de dado no cadastro — nunca um valor inventado.';

create unique index compatibility_criterion_results_one_per_criterion
  on public.compatibility_criterion_results (compatibility_analysis_id, criterion);

-- ---------------------------------------------------------------------------
-- Seleção — exatamente três, escolhidos por um humano
-- ---------------------------------------------------------------------------

create table public.curated_selections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  priority_profile_id uuid not null references public.priority_profiles (id) on delete cascade,
  -- Autoria humana obrigatória. O algoritmo nunca seleciona (Princípio 14).
  selected_by uuid not null references public.profiles (id),
  composition_rationale text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'DELIVERED')),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint selection_delivery_coherent check ((status = 'DELIVERED') = (delivered_at is not null)),
  constraint selection_rationale_not_blank check (btrim(composition_rationale) <> '')
);

comment on table public.curated_selections is 'As três opções escolhidas pelo Curador. selected_by é NOT NULL: toda seleção tem autoria humana nomeada (Princípio 14 — o algoritmo nunca seleciona).';

create unique index curated_selections_one_active_per_profile
  on public.curated_selections (priority_profile_id);

create trigger set_curated_selections_updated_at
  before update on public.curated_selections
  for each row
  execute function public.set_updated_at();

create table public.curated_selection_options (
  id uuid primary key default gen_random_uuid(),
  curated_selection_id uuid not null references public.curated_selections (id) on delete cascade,
  professional_profile_id uuid not null references public.professional_profiles (id),
  -- Ordem de apresentação, nunca colocação: as três são caminhos legítimos
  -- e diferentes, não um pódio.
  position integer not null check (position between 1 and 3),
  band text not null check (band in ('MUITO_ALTA', 'ALTA', 'BOA', 'MODERADA')),
  rationale text not null,
  trade_off text,
  constraint option_rationale_not_blank check (btrim(rationale) <> '')
);

comment on table public.curated_selection_options is 'Uma das três opções apresentadas. position é ordem de apresentação, nunca colocação. Carrega a faixa qualitativa (band), nunca o score interno.';

create unique index curated_selection_options_unique_position
  on public.curated_selection_options (curated_selection_id, position);
create unique index curated_selection_options_unique_provider
  on public.curated_selection_options (curated_selection_id, professional_profile_id);

-- Exatamente três no momento da entrega — nunca uma, nunca duas, nunca mais.
create or replace function public.enforce_selection_has_three()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  if new.status = 'DELIVERED' and (old.status is distinct from 'DELIVERED') then
    select count(*) into total
    from public.curated_selection_options
    where curated_selection_id = new.id;

    if total <> 3 then
      raise exception 'A Curadoria apresenta sempre exatamente três opções (atual: %).', total;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_selection_has_three_trigger
  before update on public.curated_selections
  for each row
  execute function public.enforce_selection_has_three();

-- ---------------------------------------------------------------------------
-- Decisão do paciente
-- ---------------------------------------------------------------------------

create table public.patient_curadoria_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  curated_selection_id uuid not null references public.curated_selections (id) on delete cascade,
  -- Null é uma decisão legítima: "nenhuma destas" é informação, não falha.
  chosen_option_id uuid references public.curated_selection_options (id),
  outcome text not null check (outcome in ('CHOSEN', 'NONE_OF_THEM')),
  note text,
  decided_at timestamptz not null default now(),
  constraint decision_outcome_coherent check ((outcome = 'CHOSEN') = (chosen_option_id is not null))
);

comment on table public.patient_curadoria_decisions is 'A escolha do paciente. NONE_OF_THEM é um desfecho legítimo e registrado — significa que alguma etapa anterior não capturou algo, nunca uma falha do paciente. Append-only.';

create unique index patient_curadoria_decisions_one_per_selection
  on public.patient_curadoria_decisions (curated_selection_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.priority_profiles enable row level security;
alter table public.priority_profile_filters enable row level security;
alter table public.priority_weights enable row level security;
alter table public.compatibility_analyses enable row level security;
alter table public.compatibility_criterion_results enable row level security;
alter table public.curated_selections enable row level security;
alter table public.curated_selection_options enable row level security;
alter table public.patient_curadoria_decisions enable row level security;

grant select, insert, update on public.priority_profiles to authenticated;
grant select, insert, update, delete on public.priority_profile_filters to authenticated;
grant select, insert, update, delete on public.priority_weights to authenticated;
grant select, insert, update, delete on public.compatibility_analyses to authenticated;
grant select, insert, update, delete on public.compatibility_criterion_results to authenticated;
grant select, insert, update on public.curated_selections to authenticated;
grant select, insert, update, delete on public.curated_selection_options to authenticated;
grant select, insert on public.patient_curadoria_decisions to authenticated;

grant all on public.priority_profiles to service_role;
grant all on public.priority_profile_filters to service_role;
grant all on public.priority_weights to service_role;
grant all on public.compatibility_analyses to service_role;
grant all on public.compatibility_criterion_results to service_role;
grant all on public.curated_selections to service_role;
grant all on public.curated_selection_options to service_role;
grant all on public.patient_curadoria_decisions to service_role;

-- Perfil de Prioridades: Curador do Caso e administrador conduzem; o
-- paciente lê o próprio Perfil somente depois de validado.
create policy "priority_profiles_write_curator" on public.priority_profiles
  for all to authenticated
  using (public.has_role('administrador') or public.is_curator_for_case(case_id))
  with check (public.has_role('administrador') or public.is_curator_for_case(case_id));

create policy "priority_profiles_select_patient_validated" on public.priority_profiles
  for select to authenticated
  using (status = 'VALIDATED' and public.is_patient_for_case(case_id));

create policy "priority_filters_write_curator" on public.priority_profile_filters
  for all to authenticated
  using (
    exists (
      select 1 from public.priority_profiles p
      where p.id = priority_profile_filters.priority_profile_id
        and (public.has_role('administrador') or public.is_curator_for_case(p.case_id))
    )
  )
  with check (
    exists (
      select 1 from public.priority_profiles p
      where p.id = priority_profile_filters.priority_profile_id
        and (public.has_role('administrador') or public.is_curator_for_case(p.case_id))
    )
  );

create policy "priority_filters_select_patient_validated" on public.priority_profile_filters
  for select to authenticated
  using (
    exists (
      select 1 from public.priority_profiles p
      where p.id = priority_profile_filters.priority_profile_id
        and p.status = 'VALIDATED'
        and public.is_patient_for_case(p.case_id)
    )
  );

-- Os pesos SÃO do paciente e aparecem para ele: representam a importância
-- que ele mesmo atribuiu, nunca nota de médico.
create policy "priority_weights_write_curator" on public.priority_weights
  for all to authenticated
  using (
    exists (
      select 1 from public.priority_profiles p
      where p.id = priority_weights.priority_profile_id
        and (public.has_role('administrador') or public.is_curator_for_case(p.case_id))
    )
  )
  with check (
    exists (
      select 1 from public.priority_profiles p
      where p.id = priority_weights.priority_profile_id
        and (public.has_role('administrador') or public.is_curator_for_case(p.case_id))
    )
  );

create policy "priority_weights_select_patient_validated" on public.priority_weights
  for select to authenticated
  using (
    exists (
      select 1 from public.priority_profiles p
      where p.id = priority_weights.priority_profile_id
        and p.status = 'VALIDATED'
        and public.is_patient_for_case(p.case_id)
    )
  );

-- Compatibilidade: SOMENTE Curador e administrador. Nenhuma policy concede
-- SELECT ao paciente — o score interno nunca sai do nível interno.
create policy "compatibility_analyses_curator_only" on public.compatibility_analyses
  for all to authenticated
  using (public.has_role('administrador') or public.is_curator_for_case(case_id))
  with check (public.has_role('administrador') or public.is_curator_for_case(case_id));

create policy "compatibility_criterion_results_curator_only" on public.compatibility_criterion_results
  for all to authenticated
  using (
    exists (
      select 1 from public.compatibility_analyses a
      where a.id = compatibility_criterion_results.compatibility_analysis_id
        and (public.has_role('administrador') or public.is_curator_for_case(a.case_id))
    )
  )
  with check (
    exists (
      select 1 from public.compatibility_analyses a
      where a.id = compatibility_criterion_results.compatibility_analysis_id
        and (public.has_role('administrador') or public.is_curator_for_case(a.case_id))
    )
  );

-- Seleção: o paciente só enxerga depois de entregue.
create policy "curated_selections_write_curator" on public.curated_selections
  for all to authenticated
  using (public.has_role('administrador') or public.is_curator_for_case(case_id))
  with check (public.has_role('administrador') or public.is_curator_for_case(case_id));

create policy "curated_selections_select_patient_delivered" on public.curated_selections
  for select to authenticated
  using (status = 'DELIVERED' and public.is_patient_for_case(case_id));

create policy "curated_selection_options_write_curator" on public.curated_selection_options
  for all to authenticated
  using (
    exists (
      select 1 from public.curated_selections s
      where s.id = curated_selection_options.curated_selection_id
        and (public.has_role('administrador') or public.is_curator_for_case(s.case_id))
    )
  )
  with check (
    exists (
      select 1 from public.curated_selections s
      where s.id = curated_selection_options.curated_selection_id
        and (public.has_role('administrador') or public.is_curator_for_case(s.case_id))
    )
  );

create policy "curated_selection_options_select_patient_delivered" on public.curated_selection_options
  for select to authenticated
  using (
    exists (
      select 1 from public.curated_selections s
      where s.id = curated_selection_options.curated_selection_id
        and s.status = 'DELIVERED'
        and public.is_patient_for_case(s.case_id)
    )
  );

-- Decisão: quem decide é o paciente. Curador e administrador leem, nunca
-- escrevem — não existe policy de INSERT para eles aqui.
create policy "patient_decisions_insert_patient" on public.patient_curadoria_decisions
  for insert to authenticated
  with check (public.is_patient_for_case(case_id));

create policy "patient_decisions_select_own_or_team" on public.patient_curadoria_decisions
  for select to authenticated
  using (
    public.is_patient_for_case(case_id)
    or public.has_role('administrador')
    or public.is_curator_for_case(case_id)
  );

-- O paciente precisa conseguir ler o nome do profissional das três opções
-- que recebeu — e apenas desses. professional_profiles não tinha nenhuma
-- policy de leitura para paciente até aqui.
create policy "professional_profiles_select_patient_delivered_option" on public.professional_profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.curated_selection_options o
      join public.curated_selections s on s.id = o.curated_selection_id
      where o.professional_profile_id = professional_profiles.id
        and s.status = 'DELIVERED'
        and public.is_patient_for_case(s.case_id)
    )
  );

-- O Curador precisa ler o cadastro dos profissionais para conseguir
-- comparar — hoje professional_profiles só concede leitura a administrador
-- e ao próprio profissional.
create policy "professional_profiles_select_curator" on public.professional_profiles
  for select to authenticated
  using (public.has_role('curador_medico'));

create policy "professional_competency_areas_select_curator" on public.professional_competency_areas
  for select to authenticated
  using (public.has_role('curador_medico'));
