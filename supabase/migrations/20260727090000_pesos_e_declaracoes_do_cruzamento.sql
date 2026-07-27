-- MESA DO CRUZAMENTO — o que faltava persistir
--
-- O motor 50/50 (cruzamento.ts) recebe pesos e avaliações prontos. A
-- declaração de área já tem casa (area_compatibility_declarations); faltavam
-- as outras duas entradas:
--
-- 1. OS PESOS DO CASE. Dois blocos de 50, distribuídos pelo Curador durante a
--    conversa. Por Case, não por profissional: o peso é a importância que
--    ESTA pessoa dá a cada critério, e vale igualmente para todos os
--    profissionais comparados.
--
-- 2. AS DECLARAÇÕES DE CRITÉRIO. O Curador avalia cada critério de cada
--    profissional em quatro estados. Por (Case, profissional, critério),
--    porque a mesma formação atende plenamente um caso e parcialmente outro.
--
-- Nenhuma das duas tabelas aceita conclusão sem justificativa gravada — a
-- Mesa mostra a frase ao lado do estado, e uma avaliação sem frase não
-- explica nada a ninguém.

create table curadoria.cruzamento_weights (
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  criterion text not null check (criterion in (
    'FORMACAO', 'EXPERIENCIA', 'TRAJETORIA',
    'ACESSO', 'FORMA_DE_CUIDADO', 'COMPATIBILIDADE_PESSOAL'
  )),
  weight smallint not null check (weight >= 0 and weight <= 50),
  updated_by uuid not null references curadoria.profiles (id),
  updated_at timestamptz not null default now(),

  primary key (case_id, criterion)
);

comment on table curadoria.cruzamento_weights is
  'Os pesos do Case no modelo 50/50. O saldo por bloco e verificado no dominio (balanceOfBlock); o banco garante o intervalo e a unicidade por criterio.';

create table curadoria.criterion_declarations (
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  criterion text not null check (criterion in (
    'FORMACAO', 'EXPERIENCIA', 'TRAJETORIA',
    'ACESSO', 'FORMA_DE_CUIDADO', 'COMPATIBILIDADE_PESSOAL'
  )),
  assessment text not null check (assessment in (
    'ATENDE_PLENAMENTE', 'ATENDE_PARCIALMENTE', 'NAO_ATENDE', 'INFORMACAO_INSUFICIENTE'
  )),
  evidence text not null,
  declared_by uuid not null references curadoria.profiles (id),
  declared_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (case_id, professional_profile_id, criterion),

  constraint criterion_declaration_evidence_not_blank check (btrim(evidence) <> '')
);

comment on table curadoria.criterion_declarations is
  'Avaliacao do Curador por criterio, nos quatro estados do motor. A evidencia e obrigatoria: um estado sem frase nao explica nada a ninguem.';

create trigger set_cruzamento_weights_updated_at before update on curadoria.cruzamento_weights
  for each row execute function curadoria.set_updated_at();
create trigger set_criterion_declarations_updated_at before update on curadoria.criterion_declarations
  for each row execute function curadoria.set_updated_at();

alter table curadoria.cruzamento_weights enable row level security;
alter table curadoria.criterion_declarations enable row level security;

grant select, insert, update, delete on curadoria.cruzamento_weights to authenticated;
grant select, insert, update, delete on curadoria.criterion_declarations to authenticated;
grant all on curadoria.cruzamento_weights to service_role;
grant all on curadoria.criterion_declarations to service_role;

-- Mesmo recorte da declaração de área: quem conduz o Case escreve.
create policy "cruzamento_weights_curator_write" on curadoria.cruzamento_weights
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "criterion_declarations_curator_write" on curadoria.criterion_declarations
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));
