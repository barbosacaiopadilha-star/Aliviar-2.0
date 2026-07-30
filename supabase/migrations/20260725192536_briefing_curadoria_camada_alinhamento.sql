-- BRIEFING DA CURADORIA — camada de apoio ao Curador.
--
-- ADITIVA: não altera cases, não altera o sistema de pesos, não altera
-- computeCompatibility(), não altera nenhuma tabela existente. Acrescenta
-- contexto e nada mais (ACE_FOUNDATION §1).
--
-- Três blocos independentes, conforme ALIGNMENT_PROFILE:
--   1. respostas do paciente  — POR CASE (as 5 perguntas mudam por caso)
--   2. declarações do médico  — POR PROFISSIONAL (estável, revisável por ele)
--   3. observações do Curador — POR CASE, com autor e data, nunca da pessoa

-- ---------------------------------------------------------------------------
-- BLOCO 1 — Paciente
-- ---------------------------------------------------------------------------
create table if not exists curadoria.alignment_patient_answers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases(id) on delete cascade,
  question_id text not null check (question_id in ('PA1','PA2','PA3','PA4','PA5')),
  option text not null,
  -- A fala preservada (Evidência de Curadoria). Resumo que vira rótulo é
  -- proibido: guarda-se o que a pessoa disse.
  verbatim text,
  answered_at timestamptz not null default now(),
  recorded_by uuid not null references curadoria.profiles(id),
  created_at timestamptz not null default now(),
  -- Uma resposta por pergunta por Case: registrar de novo corrige, nunca duplica.
  unique (case_id, question_id)
);

comment on table curadoria.alignment_patient_answers is
  'Perfil de Alinhamento — respostas do paciente (ALIGNMENT_PROFILE §1). Classe PREFERENCIA DECLARADA: é o que a pessoa disse, nunca verdade sobre ela. Todas opcionais. Escopo de Case. NUNCA usado para filtrar, ordenar ou pontuar profissionais.';

-- ---------------------------------------------------------------------------
-- BLOCO 2 — Médico
-- ---------------------------------------------------------------------------
create table if not exists curadoria.alignment_professional_answers (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.profiles(id) on delete cascade,
  question_id text not null check (question_id in ('ME1','ME2','ME3','ME4','ME5')),
  option text,
  declared_text text,
  declared_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_profile_id, question_id),
  -- Ou opção fechada, ou texto declarado — nunca vazio dos dois.
  constraint alignment_professional_has_content
    check (option is not null or coalesce(btrim(declared_text),'') <> '')
);

comment on table curadoria.alignment_professional_answers is
  'Perfil de Alinhamento — declarações do médico sobre COMO conduz (ALIGNMENT_PROFILE §2). Classe FATO DECLARADO, com direito de correção pelo próprio. NUNCA vira nota, comparação ou ranking entre profissionais — declarar limite (ME3) jamais penaliza.';

-- ---------------------------------------------------------------------------
-- BLOCO 3 — Curador
-- ---------------------------------------------------------------------------
create table if not exists curadoria.curator_observations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases(id) on delete cascade,
  kind text not null check (kind in ('CU1','CU2','CU3','CU4','CU5')),
  note text not null check (length(btrim(note)) > 0),
  author_id uuid not null references curadoria.profiles(id),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table curadoria.curator_observations is
  'Observações do Curador (ALIGNMENT_PROFILE §3). Classe INTERPRETACAO, com autor e data obrigatórios. Pertencem ao CASE, nunca à pessoa: não existe coluna ligando a observação ao paciente ou ao profissional como sujeito permanente. Sobre situação, nunca sobre essência.';

create index if not exists alignment_patient_answers_case_idx on curadoria.alignment_patient_answers (case_id);
create index if not exists curator_observations_case_idx on curadoria.curator_observations (case_id, observed_at desc);

-- ---------------------------------------------------------------------------
-- RLS — o Briefing pertence ao processo de Curadoria
-- ---------------------------------------------------------------------------
-- O PACIENTE nunca vê o Briefing (ACE_BOUNDARIES §3.1): nenhuma policy o
-- inclui. O MÉDICO não vê o Briefing (§3.2), mas vê e corrige as PRÓPRIAS
-- declarações. O acesso da equipe reusa can_access_case — a autoridade única
-- de acesso ao Case, já provada por papel.

alter table curadoria.alignment_patient_answers enable row level security;
alter table curadoria.alignment_professional_answers enable row level security;
alter table curadoria.curator_observations enable row level security;

create policy alignment_patient_answers_select on curadoria.alignment_patient_answers
  for select to authenticated using (curadoria.can_access_case(case_id));
create policy alignment_patient_answers_write on curadoria.alignment_patient_answers
  for insert to authenticated with check (curadoria.can_access_case(case_id) and recorded_by = auth.uid());
create policy alignment_patient_answers_update on curadoria.alignment_patient_answers
  for update to authenticated using (curadoria.can_access_case(case_id));

-- Profissional: lê e corrige o próprio; equipe operacional lê para o Briefing.
create policy alignment_professional_answers_select on curadoria.alignment_professional_answers
  for select to authenticated using (
    professional_profile_id = auth.uid()
    or curadoria.has_role('curador_medico')
    or curadoria.has_role('administrador')
  );
create policy alignment_professional_answers_own_write on curadoria.alignment_professional_answers
  for insert to authenticated with check (professional_profile_id = auth.uid() or curadoria.has_role('administrador'));
create policy alignment_professional_answers_own_update on curadoria.alignment_professional_answers
  for update to authenticated using (professional_profile_id = auth.uid() or curadoria.has_role('administrador'));

create policy curator_observations_select on curadoria.curator_observations
  for select to authenticated using (curadoria.can_access_case(case_id));
create policy curator_observations_insert on curadoria.curator_observations
  for insert to authenticated with check (curadoria.can_access_case(case_id) and author_id = auth.uid());
