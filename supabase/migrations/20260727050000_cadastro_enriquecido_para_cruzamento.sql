-- CADASTRO ENRIQUECIDO — a origem dos dados do motor de cruzamento
--
-- O motor (src/modules/curadoria/cruzamento.ts) já existe e cruza dois
-- perfis. O que faltava era de onde tirar o que ele compara: o cadastro tinha
-- quatro enums (nível de experiência, abordagem, cuidado contínuo, janela de
-- disponibilidade) e um domínio de competência com três valores. Isso não
-- sustenta perguntas como "quanto a formação deste profissional responde às
-- necessidades técnicas deste caso?".
--
-- Duas regras atravessam todas as tabelas abaixo:
--
-- 1. TODO dado relevante carrega proveniência — de onde veio, quando foi
--    verificado, por quem. Um dado sem origem não é informação, é boato; e o
--    motor precisa saber a diferença para distinguir "não atende" de "não se
--    sabe".
--
-- 2. NADA nasce preenchido. Campo novo em profissional existente começa
--    ausente, e ausente significa INFORMACAO_INSUFICIENTE — nunca `false`,
--    nunca zero, nunca "não atende". Preencher automaticamente seria inventar
--    o dado que a verificação deveria produzir.

-- ---------------------------------------------------------------------------
-- Proveniência — o vocabulário compartilhado
-- ---------------------------------------------------------------------------

create type curadoria.verification_status as enum (
  'nao_verificado',
  'verificado',
  'divergente'
);

comment on type curadoria.verification_status is
  'Situacao da verificacao de um dado do cadastro. "divergente" existe porque descobrir que a fonte contradiz o registro e diferente de nunca ter olhado.';

-- ---------------------------------------------------------------------------
-- Área de atuação — texto livre + etiquetas normalizadas
-- ---------------------------------------------------------------------------

-- O texto livre é a verdade do cadastro: "Cirurgia do joelho, artroscopia e
-- lesões ligamentares" é o que a fonte diz, e nunca deve virar enum.
--
-- As etiquetas existem para o cruzamento não depender de reinterpretar o mesmo
-- texto a cada Curadoria. São derivadas do texto por decisão humana (manual ou
-- assistida) e ficam ao lado dele, nunca no lugar dele. Se as duas divergirem,
-- o texto é que vale — e a divergência é sinal de que a etiqueta precisa ser
-- revista, não o contrário.
create table curadoria.professional_practice_areas (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  raw_text text not null,
  tags text[] not null default '{}',
  source text,
  verification_status curadoria.verification_status not null default 'nao_verificado',
  verified_at timestamptz,
  verified_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_areas_raw_text_not_blank check (btrim(raw_text) <> ''),
  constraint practice_areas_one_per_professional unique (professional_profile_id)
);

comment on column curadoria.professional_practice_areas.raw_text is
  'O que a fonte diz, palavra por palavra. Nunca convertido em enum.';
comment on column curadoria.professional_practice_areas.tags is
  'Etiquetas normalizadas derivadas do texto por decisao humana. Existem para o cruzamento ser consistente; o texto continua sendo a verdade.';

-- ---------------------------------------------------------------------------
-- Formação
-- ---------------------------------------------------------------------------

create type curadoria.education_kind as enum (
  'graduacao',
  'residencia',
  'especializacao',
  'fellowship',
  'pos_graduacao',
  'curso'
);

create table curadoria.professional_education_entries (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  title text not null,
  kind curadoria.education_kind not null,
  institution text,
  period_start smallint,
  period_end smallint,
  notes text,
  source text,
  verification_status curadoria.verification_status not null default 'nao_verificado',
  verified_at timestamptz,
  verified_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  constraint education_title_not_blank check (btrim(title) <> ''),
  -- Um período que termina antes de começar denuncia erro de digitação na
  -- hora, e não meses depois dentro de uma Curadoria.
  constraint education_period_coherent check (period_end is null or period_start is null or period_end >= period_start)
);

create index professional_education_entries_professional_idx
  on curadoria.professional_education_entries (professional_profile_id);

-- ---------------------------------------------------------------------------
-- Experiência — um resumo por profissional
-- ---------------------------------------------------------------------------

create table curadoria.professional_experience (
  professional_profile_id uuid primary key references curadoria.professional_profiles (id) on delete cascade,
  years_of_practice smallint,
  main_areas text[] not null default '{}',
  predominant_cases text,
  current_practice text,
  notes text,
  source text,
  verification_status curadoria.verification_status not null default 'nao_verificado',
  verified_at timestamptz,
  verified_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experience_years_plausible check (years_of_practice is null or (years_of_practice >= 0 and years_of_practice <= 80))
);

-- ---------------------------------------------------------------------------
-- Trajetória — fatos verificáveis, nunca opinião
-- ---------------------------------------------------------------------------

create table curadoria.professional_career_entries (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  institution text not null,
  role text,
  bond text,
  period_start smallint,
  period_end smallint,
  notes text,
  source text,
  verification_status curadoria.verification_status not null default 'nao_verificado',
  verified_at timestamptz,
  verified_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  constraint career_institution_not_blank check (btrim(institution) <> ''),
  constraint career_period_coherent check (period_end is null or period_start is null or period_end >= period_start)
);

create index professional_career_entries_professional_idx
  on curadoria.professional_career_entries (professional_profile_id);

comment on table curadoria.professional_career_entries is
  'Vinculos, cargos e historico verificavel. Nunca juizo de valor sobre a carreira.';

-- ---------------------------------------------------------------------------
-- Modelo de atendimento — o lado do profissional no bloco de prioridades
-- ---------------------------------------------------------------------------

create table curadoria.professional_care_model (
  professional_profile_id uuid primary key references curadoria.professional_profiles (id) on delete cascade,
  -- Booleanos anulaveis de proposito: `null` e "nao se sabe", `false` e "nao
  -- atende". Colapsar os dois faria o motor afirmar o que ninguem verificou.
  serves_in_person boolean,
  serves_online boolean,
  cities text[] not null default '{}',
  states text[] not null default '{}',
  offers_continuous_care boolean,
  offers_return_visits boolean,
  multidisciplinary_team boolean,
  availability_window text,
  avg_days_to_first_appointment smallint,
  notes text,
  source text,
  verification_status curadoria.verification_status not null default 'nao_verificado',
  verified_at timestamptz,
  verified_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_model_days_plausible check (avg_days_to_first_appointment is null or avg_days_to_first_appointment >= 0)
);

-- ---------------------------------------------------------------------------
-- Comunicação — só o que é observável
-- ---------------------------------------------------------------------------

create table curadoria.professional_communication (
  professional_profile_id uuid primary key references curadoria.professional_profiles (id) on delete cascade,
  shared_decision boolean,
  family_care boolean,
  languages text[] not null default '{}',
  accessibility text[] not null default '{}',
  resources text[] not null default '{}',
  notes text,
  source text,
  verification_status curadoria.verification_status not null default 'nao_verificado',
  verified_at timestamptz,
  verified_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table curadoria.professional_communication is
  'Caracteristicas observaveis: decisao compartilhada, atendimento familiar, idiomas, acessibilidade, recursos. Nunca "acolhedor" ou "excelente comunicador" -- adjetivo nao e dado verificavel.';

-- ---------------------------------------------------------------------------
-- Perfil de Prioridades do Paciente — o que ELE declarou na Consulta Inicial
-- ---------------------------------------------------------------------------

-- O bloco de prioridades do motor cruza duas declarações. Metade já existia
-- (o modelo de atendimento do profissional); esta é a outra metade, e sem ela
-- o critério "Compatibilidade Pessoal" cairia permanentemente em informação
-- insuficiente.
--
-- Vive ao lado da Consulta Inicial porque é ali que a pessoa fala. Um por
-- Case: são as prioridades desta busca, não do paciente em abstrato.
create table curadoria.patient_priority_declarations (
  case_id uuid primary key references curadoria.cases (id) on delete cascade,

  -- Acesso
  desired_location text,
  commute_limit text,
  preferred_modality text,
  urgency text,
  availability text,

  -- Forma de cuidado
  expected_follow_up text,
  continuity_expectation text,
  team_participation text,
  desired_frequency text,

  -- Compatibilidade pessoal
  shared_decision boolean,
  family_participation boolean,
  language text,
  accessibility_needs text[] not null default '{}',
  communication_needs text,
  other_needs text,

  declared_at timestamptz,
  registered_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table curadoria.patient_priority_declarations is
  'O que a pessoa declarou na Consulta Inicial sobre acesso, forma de cuidado e compatibilidade pessoal. Registra o que ela disse -- nunca o que a equipe concluiu por ela.';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create trigger set_practice_areas_updated_at before update on curadoria.professional_practice_areas
  for each row execute function curadoria.set_updated_at();
create trigger set_professional_experience_updated_at before update on curadoria.professional_experience
  for each row execute function curadoria.set_updated_at();
create trigger set_care_model_updated_at before update on curadoria.professional_care_model
  for each row execute function curadoria.set_updated_at();
create trigger set_communication_updated_at before update on curadoria.professional_communication
  for each row execute function curadoria.set_updated_at();
create trigger set_priority_declarations_updated_at before update on curadoria.patient_priority_declarations
  for each row execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — mesmo recorte já vigente para o cadastro do profissional
-- ---------------------------------------------------------------------------

alter table curadoria.professional_practice_areas enable row level security;
alter table curadoria.professional_education_entries enable row level security;
alter table curadoria.professional_experience enable row level security;
alter table curadoria.professional_career_entries enable row level security;
alter table curadoria.professional_care_model enable row level security;
alter table curadoria.professional_communication enable row level security;
alter table curadoria.patient_priority_declarations enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'professional_practice_areas',
    'professional_education_entries',
    'professional_experience',
    'professional_career_entries',
    'professional_care_model',
    'professional_communication'
  ] loop
    execute format('grant select, insert, update, delete on curadoria.%I to authenticated', t);
    execute format('grant all on curadoria.%I to service_role', t);

    -- Administrador mantém o cadastro.
    execute format(
      'create policy %I on curadoria.%I for all to authenticated using (curadoria.has_role(''administrador'')) with check (curadoria.has_role(''administrador''))',
      t || '_write_admin_only', t);

    -- Curador lê: é ele quem julga a compatibilidade técnica, e julgar sem
    -- ver o dossiê seria adivinhar.
    execute format(
      'create policy %I on curadoria.%I for select to authenticated using (curadoria.has_role(''curador_medico''))',
      t || '_select_curator', t);

    -- O profissional lê o próprio cadastro.
    execute format(
      'create policy %I on curadoria.%I for select to authenticated using (exists (select 1 from curadoria.professional_profiles pp where pp.id = %I.professional_profile_id and pp.profile_id = auth.uid()))',
      t || '_select_own', t, t);
  end loop;
end $$;

grant select, insert, update on curadoria.patient_priority_declarations to authenticated;
grant all on curadoria.patient_priority_declarations to service_role;

-- Mesma regra da Consulta Inicial: quem conduz o Case escreve.
create policy "patient_priority_declarations_write_curator" on curadoria.patient_priority_declarations
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

-- A pessoa lê o que declarou. É sobre ela, e ela nunca precisa pedir para ver.
create policy "patient_priority_declarations_select_patient" on curadoria.patient_priority_declarations
  for select to authenticated
  using (curadoria.is_patient_for_case(case_id));
