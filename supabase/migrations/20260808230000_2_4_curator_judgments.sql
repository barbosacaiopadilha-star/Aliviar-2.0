-- ============================================================================
-- ITEM 2.4 — `curator_judgments`: INFRAESTRUTURA INERTE DO JUÍZO HUMANO
-- ============================================================================
--
-- CONTRATO_2_4 (APROVADO — PA-15) · ADR-067 §§7–13. O registro auditável do
-- juízo humano do Curador sobre conceito cujo resultado não pertence a uma
-- célula automática do Motor. Juízo humano ≠ proposta de derivação: o juízo é
-- ato do Curador (autoridade originária); a proposta é ato do sistema sobre
-- campo alheio. Um não substitui o outro, nunca.
--
-- A ENTIDADE NASCE INERTE (§15–16): RLS ligada · zero policy · zero grant ·
-- zero writer · zero superfície · zero juízo real. O caminho de escrita
-- pertence ao Item 2.3 (§17), que herdará as cláusulas de autoria (§9 — o
-- autor é auth.uid(), nunca payload) e os desfechos nomeados (§13:
-- JUIZO_REGISTRADO · VERSAO_JA_GRAVADA · CONFLITO_DE_VERSAO). Esta migration
-- entrega SOMENTE os árbitros estruturais que aquele writer usará.
--
-- DECISÕES ESTRUTURAIS LAVRADAS, na ordem do contrato §8:
--   · alvo composto: (case_id, professional_profile_id, subcriterion_code);
--   · naturezas: DUAS por CHECK (G-2.4-1); conceitos: SEIS, nos pares certos,
--     por CHECK — NUNCA FK ao Catálogo (registro vinculante nº 1 do PA-15:
--     FORMACAO/EXPERIENCIA/HISTORICO são identificadores de critério, não
--     códigos de subcritério; a validação de Catálogo pertence às EVIDÊNCIAS);
--   · `AREA` estruturalmente ausente (RS-03; G-2.4-3);
--   · estados: VIGENTE | SUPERADO | RETIRADO — três, nominais (ADR-067 §13);
--     PENDENTE não é estado; rascunho não existe;
--   · versionamento append-only com cadeia explícita (versao +
--     versao_anterior_id); ordem pela cadeia, NUNCA pelo relógio (C-05);
--   · autoria da VERSÃO obrigatória (actor_id not null — G-2.4-6);
--   · fatos visíveis por referência com versão (padrão do atestado do 1.12);
--   · evidências em tabela satélite: ponteiro id+version a practice_evidence,
--     com estado de verificação acompanhando SEM contaminar a conclusão, e a
--     COMPATIBILIDADE evidência×julgamento da ressalva do PA-15 imposta por
--     trigger (RELACIONAL: mesmo código; TECNICO: família do critério);
--   · árbitros declarativos de concorrência (§14): um VIGENTE por alvo +
--     uma sucessora por versão-base + versão única na cadeia do alvo.
--
-- O MOTOR NÃO JULGA (G-2.4-7): nada aqui toca o Motor, a Camada de Derivação
-- ou `derivation_proposals` — e as guardas varrem que continue assim.
--
-- ROLLBACK (objeto a objeto, ordem inversa; nenhum fato humano existe
-- enquanto inerte):
--   drop trigger + function das refs (validação e append-only);
--   drop table curadoria.curator_judgment_evidence_refs;
--   drop trigger + function do julgamento (cadeia, transição, delete);
--   drop table curadoria.curator_judgments;
--   drop function curadoria.fatos_visiveis_bem_formados(jsonb);
-- Nenhuma tabela existente é alterada por esta migration; a reaplicação é
-- idempotente (if not exists / or replace / drop if exists).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fatos visíveis (item 7 do §8): lista de ponteiros {registro, versao} — o
-- padrão do atestado do 1.12 (referência textual + versão), nunca cópia.
-- ----------------------------------------------------------------------------
create or replace function curadoria.fatos_visiveis_bem_formados(p_fatos jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(p_fatos) = 'array'
     and not exists (
       select 1
       from jsonb_array_elements(p_fatos) as fato
       where jsonb_typeof(fato) <> 'object'
          or coalesce(btrim(fato ->> 'registro'), '') = ''
          or coalesce(btrim(fato ->> 'versao'), '') = ''
     );
$$;

comment on function curadoria.fatos_visiveis_bem_formados(jsonb) is
  'CONTRATO_2_4 §8 (ADR-067 §8 item 7) — fatos visíveis do ato: lista de referências {registro, versao} no padrão do atestado do 1.12. Ponteiro com versão, nunca texto copiado.';

-- ----------------------------------------------------------------------------
-- A entidade
-- ----------------------------------------------------------------------------
create table if not exists curadoria.curator_judgments (
  -- item 1 — identidade estável da VERSÃO (a PK é da versão, não da cadeia)
  id uuid primary key default gen_random_uuid(),

  -- item 2 — alvo composto: o par (Case, profissional) + conceito por código
  case_id uuid not null
    references curadoria.cases (id) on update restrict on delete restrict,
  professional_profile_id uuid not null
    references curadoria.professional_profiles (id) on update restrict on delete restrict,
  subcriterion_code text not null,

  -- item 3 — natureza: DUAS (G-2.4-1)
  natureza text not null
    constraint curator_judgments_natureza_fechada
    check (natureza in ('TECNICO', 'RELACIONAL')),

  -- G-2.4-2 — os SEIS conceitos, cada um na natureza certa. CHECK, nunca FK:
  -- FORMACAO/EXPERIENCIA/HISTORICO são identificadores de critério (PA-15,
  -- registro vinculante nº 1). Sétimo conceito e `AREA` são impossíveis aqui.
  constraint curator_judgments_par_natureza_conceito check (
    (natureza = 'TECNICO' and subcriterion_code in ('FORMACAO', 'EXPERIENCIA', 'HISTORICO'))
    or (natureza = 'RELACIONAL' and subcriterion_code in (
      'MODELO_DECISAO_COMPARTILHADA',
      'MODELO_PREFERENCIAS_E_RESTRICOES',
      'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS'
    ))
  ),

  -- item 11 — estado: TRÊS, nominais (ADR-067 §13). PENDENTE não é estado.
  state text not null default 'VIGENTE'
    constraint curator_judgments_estado_fechado
    check (state in ('VIGENTE', 'SUPERADO', 'RETIRADO')),

  -- item 6 — a conclusão É o juízo: expressa, curta, sem extensão mínima (§7)
  conclusao text not null
    constraint curator_judgments_conclusao_expressa
    check (length(btrim(conclusao)) between 1 and 280),

  -- §9 — motivo oferecido, NUNCA exigido (P-10)
  motivo text
    constraint curator_judgments_motivo_curto
    check (motivo is null or length(btrim(motivo)) between 1 and 280),

  -- item 7 — fatos visíveis no momento do ato, por referência com versão
  fatos_visiveis jsonb not null default '[]'::jsonb
    constraint curator_judgments_fatos_bem_formados
    check (curadoria.fatos_visiveis_bem_formados(fatos_visiveis)),

  -- item 9 — versão do catálogo vigente no ato
  catalog_version text not null
    constraint curator_judgments_catalogo_declarado
    check (length(btrim(catalog_version)) > 0),

  -- item 10 — versão do julgamento + cadeia explícita (§9: cada uma referencia
  -- a anterior; a primeira não referencia nada)
  versao integer not null
    constraint curator_judgments_versao_positiva
    check (versao > 0),
  versao_anterior_id uuid
    references curadoria.curator_judgments (id) on update restrict on delete restrict,
  constraint curator_judgments_primeira_sem_anterior
    check ((versao = 1) = (versao_anterior_id is null)),

  -- itens 4 e 5 — autoria da VERSÃO (G-2.4-6) e o instante do ato. O relógio
  -- NUNCA arbitra ordem — a cadeia arbitra (C-05).
  actor_id uuid not null
    references curadoria.profiles (id) on update restrict on delete restrict,
  acted_at timestamptz not null default now(),

  -- suporte à FK composta das referências de evidência: o profissional da
  -- referência é, por construção, o do julgamento.
  constraint curator_judgments_id_profissional_key unique (id, professional_profile_id)
);

comment on table curadoria.curator_judgments is
  'CONTRATO_2_4 (PA-15) / ADR-067 — o juízo humano do Curador, versionado e append-only. Alvo = (Case, profissional, conceito por código). Naturezas TECNICO|RELACIONAL e seis conceitos por CHECK (nunca FK ao Catálogo — PA-15 reg. 1); AREA estruturalmente ausente (RS-03); estados VIGENTE|SUPERADO|RETIRADO; um VIGENTE por alvo; cadeia explícita com uma sucessora por versão-base; ordem pela cadeia, nunca pelo relógio. Nasce INERTE: RLS sem policy, zero grant, zero writer — o caminho de escrita é do Item 2.3.';

comment on column curadoria.curator_judgments.fatos_visiveis is
  'ADR-067 §8 item 7 — as declarações visíveis no ato, como referências {registro, versao} (padrão do atestado do 1.12). Nunca texto copiado.';
comment on column curadoria.curator_judgments.versao_anterior_id is
  'ADR-067 §9 — a cadeia: cada versão referencia a anterior; a primeira não referencia nada. O índice único parcial garante UMA sucessora por versão-base (árbitro de CONFLITO_DE_VERSAO do futuro 2.3).';
comment on column curadoria.curator_judgments.actor_id is
  'G-2.4-6 — autoria da VERSÃO, obrigatória. No futuro writer (2.3) o autor é auth.uid(), nunca payload; service_role não é autoria humana.';

-- Árbitros declarativos de concorrência (§14):
-- 1. no máximo UM VIGENTE por alvo (ADR-067 §13, invariante de unicidade)
create unique index if not exists curator_judgments_um_vigente_por_alvo
  on curadoria.curator_judgments (case_id, professional_profile_id, subcriterion_code)
  where state = 'VIGENTE';

-- 2. UMA sucessora por versão-base (a cadeia não bifurca; o segundo INSERT
--    simultâneo cai aqui e o 2.3 o traduzirá para CONFLITO_DE_VERSAO)
create unique index if not exists curator_judgments_uma_sucessora_por_base
  on curadoria.curator_judgments (versao_anterior_id)
  where versao_anterior_id is not null;

-- 3. número de versão único na cadeia do alvo (reconstrução íntegra)
create unique index if not exists curator_judgments_versao_unica_por_alvo
  on curadoria.curator_judgments (case_id, professional_profile_id, subcriterion_code, versao);

-- ----------------------------------------------------------------------------
-- Cadeia coerente: a sucessora pertence ao MESMO alvo e é a versão seguinte.
-- ----------------------------------------------------------------------------
create or replace function curadoria.curator_judgments_cadeia_coerente()
returns trigger
language plpgsql
as $$
declare
  anterior curadoria.curator_judgments%rowtype;
begin
  if new.versao_anterior_id is null then
    return new;
  end if;

  select * into anterior
    from curadoria.curator_judgments
   where id = new.versao_anterior_id;

  if anterior.case_id is distinct from new.case_id
     or anterior.professional_profile_id is distinct from new.professional_profile_id
     or anterior.subcriterion_code is distinct from new.subcriterion_code then
    raise exception
      'Cadeia quebrada (CONTRATO_2_4 §12): a versao anterior % pertence a outro alvo. A historia de um alvo e uma so — julgamento nao se move entre alvos (ADR-067 §10).',
      new.versao_anterior_id
      using errcode = 'restrict_violation';
  end if;

  if new.versao is distinct from anterior.versao + 1 then
    raise exception
      'Cadeia quebrada (CONTRATO_2_4 §12): a sucessora de v% deve ser v%, recebeu v%. A ordem e da cadeia, nunca do relogio.',
      anterior.versao, anterior.versao + 1, new.versao
      using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists curator_judgments_cadeia_coerente on curadoria.curator_judgments;
create trigger curator_judgments_cadeia_coerente
  before insert on curadoria.curator_judgments
  for each row execute function curadoria.curator_judgments_cadeia_coerente();

-- ----------------------------------------------------------------------------
-- Append-only (§11, G-2.4-4): nenhum UPDATE reescreve o ato; a ÚNICA mudança
-- admitida é a transição de estado VIGENTE -> SUPERADO | RETIRADO, que é o
-- mecanismo estrutural de supersessão/retirada (JS1–JS4) — nunca reescrita.
-- Terminais são terminais. DELETE não existe: história é fato.
-- ----------------------------------------------------------------------------
create or replace function curadoria.curator_judgments_so_transicao_de_estado()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.case_id is distinct from old.case_id
     or new.professional_profile_id is distinct from old.professional_profile_id
     or new.subcriterion_code is distinct from old.subcriterion_code
     or new.natureza is distinct from old.natureza
     or new.conclusao is distinct from old.conclusao
     or new.motivo is distinct from old.motivo
     or new.fatos_visiveis is distinct from old.fatos_visiveis
     or new.catalog_version is distinct from old.catalog_version
     or new.versao is distinct from old.versao
     or new.versao_anterior_id is distinct from old.versao_anterior_id
     or new.actor_id is distinct from old.actor_id
     or new.acted_at is distinct from old.acted_at then
    raise exception
      'Julgamento e append-only (CONTRATO_2_4 §11): nenhuma coluna do ato se reescreve — nem para virgula (ADR-067 §10). Retificar e gravar versao nova.'
      using errcode = 'restrict_violation';
  end if;

  if old.state = 'VIGENTE' and new.state in ('SUPERADO', 'RETIRADO') then
    return new;
  end if;

  raise exception
    'Transicao de estado invalida (CONTRATO_2_4 §7/§11): % -> % recusado. So existe VIGENTE -> SUPERADO (JS1–JS4) e VIGENTE -> RETIRADO (ato do autor); terminais sao terminais.',
    old.state, new.state
    using errcode = 'restrict_violation';
end;
$$;

drop trigger if exists curator_judgments_so_transicao_de_estado on curadoria.curator_judgments;
create trigger curator_judgments_so_transicao_de_estado
  before update on curadoria.curator_judgments
  for each row execute function curadoria.curator_judgments_so_transicao_de_estado();

create or replace function curadoria.curator_judgments_sem_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'Julgamento nao se apaga (CONTRATO_2_4 §11): nao existe "desjulgar" — um julgamento que existiu, existiu (ADR-067 §10). Retirar e transicao para RETIRADO, nunca DELETE.'
    using errcode = 'restrict_violation';
end;
$$;

drop trigger if exists curator_judgments_sem_delete on curadoria.curator_judgments;
create trigger curator_judgments_sem_delete
  before delete on curadoria.curator_judgments
  for each row execute function curadoria.curator_judgments_sem_delete();

-- ----------------------------------------------------------------------------
-- Evidências referenciadas (item 8 do §8; §10 do contrato): ponteiro
-- id+version a practice_evidence — nunca busca, nunca texto. O estado de
-- verificação acompanha a referência SEM contaminar a conclusão (I-5).
-- ----------------------------------------------------------------------------
create table if not exists curadoria.curator_judgment_evidence_refs (
  judgment_id uuid not null,
  professional_profile_id uuid not null,
  evidence_id uuid not null,
  evidence_version integer not null
    constraint curator_judgment_evidence_refs_versao_positiva
    check (evidence_version > 0),
  -- o estado de verificação NO MOMENTO DO ATO — registrado, jamais nota
  verification_status curadoria.verification_status not null,

  primary key (judgment_id, evidence_id),

  -- o profissional da referência é o do julgamento — declarativo
  constraint curator_judgment_evidence_refs_julgamento_fk
    foreign key (judgment_id, professional_profile_id)
    references curadoria.curator_judgments (id, professional_profile_id)
    on update restrict on delete restrict,

  -- evidência de OUTRO profissional é irrepresentável — FK composta, padrão
  -- do vínculo 1.8-R1 (practice_evidence_id_profissional_key)
  constraint curator_judgment_evidence_refs_evidencia_fk
    foreign key (evidence_id, professional_profile_id)
    references curadoria.practice_evidence (id, professional_profile_id)
    on update restrict on delete restrict
);

comment on table curadoria.curator_judgment_evidence_refs is
  'CONTRATO_2_4 §10 — as evidências que sustentam a versão do juízo, por PONTEIRO id+version a practice_evidence (C-01c: nunca busca, nunca texto copiado — G-2.4-5). As FKs compostas tornam evidência de outro profissional irrepresentável; o trigger valida a versão exata, o estado de verificação no ato e a COMPATIBILIDADE da ressalva do PA-15 (RELACIONAL: mesmo código; TECNICO: família do critério). Append-only como o ato que a carrega.';

create or replace function curadoria.curator_judgment_evidence_refs_valida_referencia()
returns trigger
language plpgsql
as $$
declare
  evidencia curadoria.practice_evidence%rowtype;
  julgamento curadoria.curator_judgments%rowtype;
begin
  select * into julgamento
    from curadoria.curator_judgments
   where id = new.judgment_id;
  if not found then
    -- Julgamento inexistente é matéria da FK composta — a recusa canônica
    -- (23503) fala; este trigger só valida o que existe.
    return new;
  end if;

  select * into evidencia
    from curadoria.practice_evidence
   where id = new.evidence_id;
  if not found then
    -- Evidência inexistente idem: "referência solta não existe" é a FK.
    return new;
  end if;

  -- A referência é à LINHA EXATA: id + version (§10). Version divergente é
  -- referência a versão inexistente — recusa.
  if evidencia.version is distinct from new.evidence_version then
    raise exception
      'Referencia de evidencia invalida (CONTRATO_2_4 §10): a evidencia % e v%, a referencia declara v%. O ponteiro e a linha exata — nunca "a vigente", nunca busca (C-01c).',
      new.evidence_id, evidencia.version, new.evidence_version
      using errcode = 'restrict_violation';
  end if;

  -- O estado de verificação registrado é o REAL no momento do ato (I-5) —
  -- acompanha a referência sem contaminar a conclusão.
  if evidencia.status is distinct from new.verification_status then
    raise exception
      'Estado de verificacao divergente (CONTRATO_2_4 §10, I-5): a evidencia % esta "%", a referencia declara "%". O juizo registra o estado real do ato — nem melhora, nem piora.',
      new.evidence_id, evidencia.status, new.verification_status
      using errcode = 'restrict_violation';
  end if;

  -- COMPATIBILIDADE evidencia × julgamento — ressalva do Guardiao (PA-15),
  -- norma do §10: cada criterio possui suas proprias evidencias; citacao
  -- cruzada de familia comprometeria a proveniencia da conclusao. Admitir
  -- familia diversa exigira EMENDA NORMATIVA, nunca flexibilizacao aqui.
  if julgamento.natureza = 'RELACIONAL' then
    if evidencia.subcriterion_code is distinct from julgamento.subcriterion_code then
      raise exception
        'Evidencia incompativel (CONTRATO_2_4 §10, PA-15): julgamento RELACIONAL de % nao referencia evidencia de % — o codigo deve ser IGUAL ao conceito julgado.',
        julgamento.subcriterion_code, evidencia.subcriterion_code
        using errcode = 'restrict_violation';
    end if;
  else
    if evidencia.subcriterion_code not like julgamento.subcriterion_code || '\_%' then
      raise exception
        'Evidencia incompativel (CONTRATO_2_4 §10, PA-15): julgamento TECNICO de % so referencia evidencias %_* — recebeu %. Familia diversa exige emenda normativa, nunca flexibilizacao.',
        julgamento.subcriterion_code, julgamento.subcriterion_code, evidencia.subcriterion_code
        using errcode = 'restrict_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists curator_judgment_evidence_refs_valida_referencia on curadoria.curator_judgment_evidence_refs;
create trigger curator_judgment_evidence_refs_valida_referencia
  before insert on curadoria.curator_judgment_evidence_refs
  for each row execute function curadoria.curator_judgment_evidence_refs_valida_referencia();

create or replace function curadoria.curator_judgment_evidence_refs_apenas_apendavel()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'Referencia de evidencia e parte do ato (CONTRATO_2_4 §11): append-only — nao se edita nem se apaga; retificar e gravar versao nova do julgamento.'
    using errcode = 'restrict_violation';
end;
$$;

drop trigger if exists curator_judgment_evidence_refs_apenas_apendavel on curadoria.curator_judgment_evidence_refs;
create trigger curator_judgment_evidence_refs_apenas_apendavel
  before update or delete on curadoria.curator_judgment_evidence_refs
  for each row execute function curadoria.curator_judgment_evidence_refs_apenas_apendavel();

-- ----------------------------------------------------------------------------
-- Inércia (§15–16, G-2.4-8): RLS ligada, ZERO policy, ZERO grant. Estrutura
-- não é operação — o caminho de escrita nasce no 2.3, com lavratura própria.
-- ----------------------------------------------------------------------------
alter table curadoria.curator_judgments enable row level security;
alter table curadoria.curator_judgment_evidence_refs enable row level security;

revoke all on table curadoria.curator_judgments from public, anon, authenticated;
revoke all on table curadoria.curator_judgment_evidence_refs from public, anon, authenticated;
