-- PROTOCOLOS OFICIAIS — persistência dos dois lados.
--
-- Duas tabelas, duas naturezas, e a fronteira entre elas é o próprio Método:
--
--   * `case_needs` — a necessidade da PESSOA, sempre POR CASE. Nunca
--     reutilizada, nunca promovida a característica permanente. É aqui que
--     vivem a resposta estruturada, o grau, a flexibilidade, a leitura
--     proposta pelo Curador e o reconhecimento da pessoa.
--
--   * `practice_protocol_drafts` — o rascunho do PROFISSIONAL respondendo ao
--     Protocolo da Prática: salvar parcial, retomar, revisar. Rascunho não é
--     evidência: a submissão é que gera versões em `practice_evidence`,
--     SEMPRE como `nao_verificado` (P20 — resposta não é evidência
--     verificada).
--
-- Nenhuma das duas alcança o Motor. `case_needs` não é o Mapa de Prioridades
-- (as cinco importâncias seguem em `case_priority_map`, intocadas); é a
-- resposta estruturada que o protocolo da pessoa produz, e quem a traduz em
-- importância continua sendo o Curador pela superfície vigente.

-- ---------------------------------------------------------------------------
-- 1. A necessidade da pessoa — por Case
-- ---------------------------------------------------------------------------

create table curadoria.case_needs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,

  -- Conceito do Catálogo 1.0.0, por código estável (mesma decisão registrada
  -- na Base de Evidências: a virada do catálogo no banco é missão própria).
  subcriterion_code text not null check (length(btrim(subcriterion_code)) > 0),
  catalog_version text not null default '1.0.0',

  -- A resposta estruturada da pessoa (códigos canônicos do protocolo dela).
  options text[] not null default '{}',

  -- Grau declarado ou traduzido — nunca inferido.
  degree text not null check (degree in (
    'ESSENCIAL', 'IMPORTANTE', 'DESEJAVEL', 'SEM_PREFERENCIA'
  )),

  -- Flexibilidade dita por ela ("se não houver, serve?"), curta.
  flexibility text
    check (flexibility is null or (length(btrim(flexibility)) between 1 and 280)),

  -- Texto guiado — SÓ P14 (restrições pessoais). O domínio recusa nos demais.
  guided_text text
    check (guided_text is null or (length(btrim(guided_text)) between 1 and 500)),

  -- Como a resposta nasceu.
  origin text not null check (origin in ('DIRETO', 'TRADUCAO', 'DECLARACAO_CLINICA')),

  -- A leitura proposta pelo Curador, quando por tradução — e o ato da pessoa
  -- sobre ela. Reconhecer é dela; propor é dele; os dois ficam separados.
  proposed_reading text
    check (proposed_reading is null or (length(btrim(proposed_reading)) between 1 and 500)),
  acknowledgment text not null default 'PENDENTE' check (acknowledgment in (
    'PENDENTE', 'RECONHECIDA', 'CORRIGIDA', 'RECUSADA'
  )),
  correction text
    check (correction is null or (length(btrim(correction)) between 1 and 500)),

  declared_by uuid not null,
  declared_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (case_id, subcriterion_code),

  -- Tradução sem leitura proposta não existe; correção sem texto tampouco.
  constraint case_needs_traducao_tem_leitura check (
    origin <> 'TRADUCAO' or proposed_reading is not null
  ),
  constraint case_needs_correcao_tem_texto check (
    acknowledgment <> 'CORRIGIDA' or correction is not null
  )
);

comment on table curadoria.case_needs is
  'Resposta estruturada do Protocolo da Pessoa, POR CASE. Nunca reutilizada entre Cases, nunca promovida a caracteristica permanente. Nao alimenta o Motor: as cinco importancias seguem em case_priority_map. Leitura proposta e do Curador; reconhecimento e ato da pessoa.';

create index case_needs_case_idx on curadoria.case_needs (case_id);

create trigger case_needs_touch
  before update on curadoria.case_needs
  for each row execute function curadoria.set_updated_at();

alter table curadoria.case_needs enable row level security;

-- O mesmo recorte do Mapa de Prioridades: administrador ou o Curador do Case.
create policy "case_needs_select_interno"
  on curadoria.case_needs for select
  to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "case_needs_write_interno"
  on curadoria.case_needs for insert
  to authenticated
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

create policy "case_needs_update_interno"
  on curadoria.case_needs for update
  to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

grant select, insert, update on curadoria.case_needs to authenticated;
grant all on curadoria.case_needs to service_role;
revoke all on curadoria.case_needs from anon;

-- ---------------------------------------------------------------------------
-- 2. O rascunho do profissional — salvar parcial, retomar, revisar
-- ---------------------------------------------------------------------------

create table curadoria.practice_protocol_drafts (
  professional_profile_id uuid primary key
    references curadoria.professional_profiles (id) on delete cascade,
  -- Respostas por conceito, na forma do contrato executável. Rascunho é
  -- área de trabalho: pode ser reescrito à vontade — evidência é que não.
  responses jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid not null
);

comment on table curadoria.practice_protocol_drafts is
  'Rascunho do Protocolo da Pratica Profissional: salvar parcial e retomar. NAO e evidencia — a submissao valida e grava versoes nao_verificado em practice_evidence. Uma linha por profissional.';

create trigger practice_protocol_drafts_touch
  before update on curadoria.practice_protocol_drafts
  for each row execute function curadoria.set_updated_at();

alter table curadoria.practice_protocol_drafts enable row level security;

-- O profissional trabalha no PRÓPRIO rascunho; a operação acompanha tudo.
create policy "drafts_select_dono_ou_operacao"
  on curadoria.practice_protocol_drafts for select
  to authenticated
  using (
    curadoria.has_role('administrador')
    or curadoria.has_role('curador_medico')
    or exists (
      select 1 from curadoria.professional_profiles pp
       where pp.id = professional_profile_id and pp.profile_id = auth.uid()
    )
  );

create policy "drafts_insert_dono_ou_admin"
  on curadoria.practice_protocol_drafts for insert
  to authenticated
  with check (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.professional_profiles pp
       where pp.id = professional_profile_id and pp.profile_id = auth.uid()
    )
  );

create policy "drafts_update_dono_ou_admin"
  on curadoria.practice_protocol_drafts for update
  to authenticated
  using (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.professional_profiles pp
       where pp.id = professional_profile_id and pp.profile_id = auth.uid()
    )
  )
  with check (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.professional_profiles pp
       where pp.id = professional_profile_id and pp.profile_id = auth.uid()
    )
  );

grant select, insert, update on curadoria.practice_protocol_drafts to authenticated;
grant all on curadoria.practice_protocol_drafts to service_role;
revoke all on curadoria.practice_protocol_drafts from anon;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop table if exists curadoria.practice_protocol_drafts;
--   drop table if exists curadoria.case_needs;
--
-- (Aditivas e isoladas; nenhuma tabela existente tocada.)
