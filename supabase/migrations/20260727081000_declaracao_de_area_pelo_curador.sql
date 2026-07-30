-- DECLARAÇÃO DE ÁREA — o filtro eliminatório que só o Curador aplica
--
-- O motor de cruzamento (src/modules/curadoria/cruzamento.ts) trata a área de
-- atuação como porta de entrada em quatro estados, e não como pontuação. Até
-- aqui essa decisão existia só em memória: `applyAreaGate` recebia um objeto
-- que ninguém gravava.
--
-- Esta tabela é onde a declaração passa a viver. Uma por par (Case,
-- profissional), porque a mesma formação responde a um caso e não responde a
-- outro — a compatibilidade não é atributo do profissional, é da relação
-- entre ele e aquela pessoa.
--
-- O sistema não escreve aqui sozinho. Nenhum gatilho, nenhuma inferência
-- semântica: quem declara é gente, e a linha guarda quem foi.

create table curadoria.area_compatibility_declarations (
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,

  compatibility text not null check (compatibility in (
    'COMPATIVEL', 'PARCIALMENTE_COMPATIVEL', 'INCOMPATIVEL', 'INFORMACAO_INSUFICIENTE'
  )),

  -- `PARCIALMENTE_COMPATIVEL` só deixa o profissional participar quando o
  -- Curador confirma explicitamente. O default é não participar: uma
  -- compatibilidade parcial aceita por omissão seria uma decisão que ninguém
  -- tomou.
  confirmed_by_curator boolean not null default false,

  rationale text,

  -- O que o Curador tinha diante dos olhos quando decidiu. Guardado porque o
  -- cadastro muda, e uma justificativa sem o texto que a motivou fica
  -- impossível de reavaliar depois.
  area_text_reviewed text,
  case_requirement_reviewed text,

  declared_by uuid not null references curadoria.profiles (id),
  declared_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (case_id, professional_profile_id),

  constraint area_parcial_exige_justificativa
    check (compatibility <> 'PARCIALMENTE_COMPATIVEL' or (rationale is not null and btrim(rationale) <> '')),
  constraint area_incompativel_exige_justificativa
    check (compatibility <> 'INCOMPATIVEL' or (rationale is not null and btrim(rationale) <> ''))
);

comment on table curadoria.area_compatibility_declarations is
  'Declaracao humana de compatibilidade de area entre um Case e um profissional. Porta de entrada da Curadoria, nunca pontuacao. O sistema organiza e mostra; quem decide e o Curador (ADR-035).';

create trigger set_area_declarations_updated_at before update on curadoria.area_compatibility_declarations
  for each row execute function curadoria.set_updated_at();

alter table curadoria.area_compatibility_declarations enable row level security;

grant select, insert, update on curadoria.area_compatibility_declarations to authenticated;
grant all on curadoria.area_compatibility_declarations to service_role;

create policy "area_declarations_curator_write" on curadoria.area_compatibility_declarations
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

-- O profissional lê o que foi declarado sobre ele. É sobre ele.
create policy "area_declarations_professional_select_own" on curadoria.area_compatibility_declarations
  for select to authenticated
  using (exists (
    select 1 from curadoria.professional_profiles pp
     where pp.id = area_compatibility_declarations.professional_profile_id
       and pp.profile_id = auth.uid()
  ));
