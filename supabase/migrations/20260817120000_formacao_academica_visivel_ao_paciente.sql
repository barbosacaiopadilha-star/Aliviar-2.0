-- =============================================================================
-- FORMAÇÃO ACADÊMICA VISÍVEL AO PACIENTE — local, policy do paciente e rastro
-- de extração assistida.
--
-- O que esta migration NÃO faz: não cria score, nível, ranking ou selo de
-- superioridade a partir de formação; não dá ao pipeline de extração nenhum
-- caminho para `verificado`; não expõe ao paciente documento, página, fonte ou
-- método de comprovação — esses metadados vivem em tabelas SEM policy de
-- paciente, porque RLS é por linha e coluna visível é coluna vazável.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1 · Local da formação. Cidade e país são apresentação, nunca julgamento:
--     nenhum writer de ranking os lê (prova por sentinela na suíte).
-- -----------------------------------------------------------------------------

alter table curadoria.professional_education_entries
  add column city text,
  add column country text;

comment on column curadoria.professional_education_entries.city is
  'Cidade da instituição, quando o currículo a declara. Ausente = omitida na apresentação — nunca "não informado".';
comment on column curadoria.professional_education_entries.country is
  'País da instituição, quando o currículo o declara. Não gera nota, nível, ranking nem selo de superioridade.';

-- -----------------------------------------------------------------------------
-- 2 · Execuções de extração — uma linha por leitura de currículo, concluída OU
--     falha. A execução existe para a revisão administrativa saber o que foi
--     lido, quando, por qual extrator e com que resultado; falha registrada
--     jamais deixa formação parcial (o writer compensa antes de gravar falha).
-- -----------------------------------------------------------------------------

create table curadoria.professional_education_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,
  document_id uuid not null references curadoria.professional_documents (id) on delete cascade,
  status text not null check (status in ('concluida', 'falha')),
  -- hash do TEXTO extraído (nunca o texto): permite detectar reprocessamento
  -- do mesmo conteúdo sem reter uma linha sequer do currículo.
  text_hash text,
  extractor text not null,
  total_candidatos smallint not null default 0,
  descartados smallint not null default 0,
  -- erro redigido (classe/código), nunca conteúdo do documento.
  erro text,
  created_at timestamptz not null default now(),
  created_by uuid not null references curadoria.profiles (id)
);

create index professional_education_extraction_runs_profissional_idx
  on curadoria.professional_education_extraction_runs (professional_profile_id);
create index professional_education_extraction_runs_document_idx
  on curadoria.professional_education_extraction_runs (document_id);

-- -----------------------------------------------------------------------------
-- 3 · Vínculo candidato ↔ documento/execução — separado da execução em si.
--     `human_edited` é a trava do item 5: candidato tocado por gente NUNCA é
--     substituído por reprocessamento, mesmo ainda `nao_verificado`.
-- -----------------------------------------------------------------------------

create table curadoria.professional_education_extraction_links (
  entry_id uuid primary key references curadoria.professional_education_entries (id) on delete cascade,
  run_id uuid not null references curadoria.professional_education_extraction_runs (id) on delete cascade,
  document_id uuid not null references curadoria.professional_documents (id) on delete cascade,
  page_hint smallint,
  human_edited boolean not null default false,
  created_at timestamptz not null default now()
);

create index professional_education_extraction_links_document_idx
  on curadoria.professional_education_extraction_links (document_id);

-- -----------------------------------------------------------------------------
-- 4 · RLS dos metadados: SOMENTE administrador (e service_role). Sem policy de
--     paciente, de curador ou do próprio profissional — origem, página e
--     execução são rastro interno de revisão, nunca apresentação.
-- -----------------------------------------------------------------------------

alter table curadoria.professional_education_extraction_runs enable row level security;
alter table curadoria.professional_education_extraction_links enable row level security;

grant select, insert, update, delete on curadoria.professional_education_extraction_runs to authenticated;
grant select, insert, update, delete on curadoria.professional_education_extraction_links to authenticated;
grant all on curadoria.professional_education_extraction_runs to service_role;
grant all on curadoria.professional_education_extraction_links to service_role;

create policy "education_extraction_runs_admin_only"
  on curadoria.professional_education_extraction_runs for all to authenticated
  using (curadoria.has_role('administrador'))
  with check (curadoria.has_role('administrador'));

create policy "education_extraction_links_admin_only"
  on curadoria.professional_education_extraction_links for all to authenticated
  using (curadoria.has_role('administrador'))
  with check (curadoria.has_role('administrador'));

-- -----------------------------------------------------------------------------
-- 5 · O paciente lê a formação — com a tripla restrição NO BANCO, espelhando o
--     predicado canônico `professional_profiles_select_patient_delivered_option`:
--     (i) a linha está `verificado`; (ii) o profissional é opção de uma
--     Curadoria ENTREGUE; (iii) quem pergunta é o titular do Case. Formação não
--     confirmada não existe para o paciente — por RLS, não por filtro de UI.
-- -----------------------------------------------------------------------------

create policy "professional_education_entries_select_patient_delivered"
  on curadoria.professional_education_entries for select to authenticated
  using (
    verification_status = 'verificado'
    and exists (
      select 1
      from curadoria.curated_selection_options o
      join curadoria.curated_selections s on s.id = o.curated_selection_id
      where o.professional_profile_id = professional_education_entries.professional_profile_id
        and s.status = 'DELIVERED'
        and curadoria.is_patient_for_case(s.case_id)
    )
  );

-- -----------------------------------------------------------------------------
-- 6 · Índice reverso aprovado: o predicado acima (e o canônico de
--     professional_profiles) procuram opções POR PROFISSIONAL, e os únicos
--     índices existentes começam por curated_selection_id. Aditivo; a
--     usabilidade é provada por EXPLAIN na suíte de integração.
-- -----------------------------------------------------------------------------

create index curated_selection_options_professional_idx
  on curadoria.curated_selection_options (professional_profile_id);
