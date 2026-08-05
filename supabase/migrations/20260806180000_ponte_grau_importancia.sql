-- ============================================================================
-- ITEM 2.2C — PONTE GRAU → IMPORTÂNCIA (ADR-066 §15-§17, Arquitetura §10.3)
-- ============================================================================
--
--   grau declarado pela pessoa → regra de correspondência vigente → IMPORTÂNCIA
--   PROPOSTA
--
-- A ponte torna pública uma tradução que hoje acontece dentro da cabeça do
-- Curador. O ganho não é economia de atos — é que tradução mental é
-- irrecuperável em auditoria, e tabela versionada é a coisa mais auditável que
-- existe (ADR-066 §15).
--
-- O QUE ELA PRODUZ É SEMPRE UMA PROPOSTA. Nunca declaração, nunca confirmação,
-- nunca entrada do Pipeline de Leitura (A2). A proposta não vira verdade por
-- ter sido emitida.
--
-- ---------------------------------------------------------------------------
-- 1. AS DUAS ESCALAS CONTINUAM DISJUNTAS
-- ---------------------------------------------------------------------------
--   GRAU        = quanto a PESSOA disse que aquilo pesa para ela (4 valores)
--   IMPORTÂNCIA = quanto o CASE declara que o subcritério pesa (5 valores)
--
--   Nenhum valor em comum, nenhuma conversão por posição, nenhuma equivalência
--   presumida. A ponte existe **porque** os domínios são diferentes — se
--   fossem o mesmo, bastaria copiar. A migration 20260801140000 já pagou o
--   preço de duas escalas com o mesmo texto; aqui a correspondência é DADO
--   versionado, linha a linha, e não um `case` escondido em código.
--
-- ---------------------------------------------------------------------------
-- 2. COBERTURA TOTAL, POR CONSTRUÇÃO
-- ---------------------------------------------------------------------------
--   Uma versão apta a emitir tem correspondência para TODOS os quatro graus do
--   conceito. Garantido por trigger DEFERIDO: no commit, o conjunto
--   (regra, versão, conceito) precisa estar completo. Meia tabela não emite —
--   e emitir com meia tabela seria pior do que não emitir, porque o grau
--   faltante viraria silêncio indistinguível de "não se aplica".
--
--   Um grau não pode ter dois destinos na mesma versão: é a PK.
--
-- ---------------------------------------------------------------------------
-- 3. QUAIS CONCEITOS PODEM TER PONTE — e o que o banco consegue provar
-- ---------------------------------------------------------------------------
--   A ADR-066 §16 nomeia quatro exclusões. O banco prova três delas sozinho:
--
--     · sem lado da pessoa  → os 12 de Prática e Trajetória e
--                             MODELO_PREFERENCIAS_E_RESTRICOES (zero opções
--                             `side='paciente'`);
--     · Viabilidade         → eixo VIABILIDADE_DE_ACESSO, fora do Motor por
--                             decisão de Método;
--     · filtros             → não são subcritério; não há linha a criar.
--
--   A QUARTA NÃO É DERIVÁVEL AQUI, e o registro é honesto:
--   `MOTOR_PARTICIPATION` vive em `src/modules/curadoria/evidencias-pratica.ts`
--   e o banco não o tem. `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` tem lado da
--   pessoa, não é Viabilidade, e mesmo assim é `NUNCA`.
--
--   Duplicar a lista em SQL criaria uma SEGUNDA FONTE de um fato de domínio —
--   exatamente o que este projeto combate. A coerência é garantida por guarda
--   executável (`grupo-c-derivacao`, C-11): nenhuma regra pode existir para
--   conceito cuja participação seja `NUNCA`. A fonte continua sendo uma só.
--
-- ---------------------------------------------------------------------------
-- 4. O ESCRITOR ÚNICO
-- ---------------------------------------------------------------------------
--   `curadoria.emitir_proposta_de_importancia` é o único caminho de escrita em
--   `derivation_proposals`. SECURITY INVOKER — não eleva autoridade; quem a
--   chama escreve com o que já tem. `search_path` fixo. Zero grants: nenhum
--   papel de aplicação a alcança, e a estrutura permanece inerte.
--
--   Ela devolve SEMPRE um desfecho nomeado. Não emitir é comportamento
--   explícito e testável, nunca erro silencioso.
--
-- ---------------------------------------------------------------------------
-- 5. IDEMPOTÊNCIA E CONCORRÊNCIA
-- ---------------------------------------------------------------------------
--   Índice único parcial sobre (case_id, subcriterion_code, rule_id,
--   rule_version). O índice é o ÁRBITRO: duas emissões simultâneas para o
--   mesmo alvo colidem, uma vence, a outra recebe `JA_EMITIDA`. A verificação
--   dentro da função é conveniência de mensagem — a garantia é do banco, e a
--   mutação prova a diferença.
--
-- ---------------------------------------------------------------------------
-- O QUE ESTA MIGRATION NÃO FAZ
-- ---------------------------------------------------------------------------
--   Nenhuma regra é semeada — a primeira versão VIGENTE exige identidade
--   técnica da Autoridade de Método, que ainda não existe (impedimento
--   declarado no relatório). Nenhuma Fronteira Humana, nenhuma confirmação,
--   nenhum painel, nenhuma interface, nenhuma API pública. Nenhum valor
--   definitivo de correspondência é decidido aqui: os valores vivem em DADO,
--   e a primeira versão nascerá `PROVISÓRIA` por contrato.
--
--   `case_needs` não é alterado. `case_priority_map` não é alterado. Nenhuma
--   declaração manual é tocada.
--
-- ---------------------------------------------------------------------------
-- ROLLBACK — objeto a objeto, sem `db reset`, nesta ordem:
-- ---------------------------------------------------------------------------
--   drop function curadoria.emitir_proposta_de_importancia(uuid, text, uuid);
--   drop index curadoria.derivation_proposals_uma_por_alvo_regra_versao;
--   drop trigger derivation_rule_degree_map_append_only on curadoria.derivation_rule_degree_map;
--   drop trigger derivation_rule_degree_map_conceito on curadoria.derivation_rule_degree_map;
--   drop function curadoria.valida_conceito_da_correspondencia();
--   drop trigger derivation_rule_degree_map_cobertura on curadoria.derivation_rule_degree_map;
--   drop function curadoria.exige_cobertura_total_dos_graus();
--   drop table curadoria.derivation_rule_degree_map;
--
--   AS PROPOSTAS JÁ EMITIDAS PERMANECEM. O rollback derruba o emissor e a
--   correspondência; não apaga proposta, não apaga `case_priority_map`, não
--   toca regra, ciclo de vida, MR1.x nem os privilégios do 2.2B-R1.
--
--   Consequência assumida: uma proposta cuja correspondência foi removida
--   continua legível e continua apontando `(rule_id, rule_version)` — a
--   proveniência da REGRA sobrevive, que é o que a ADR-066 §17 exige. Desligar
--   a ponte devolve o sistema ao estado anterior sem perder um único dado.
--
--   Executado e conferido em 2026-08-06.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. A CORRESPONDÊNCIA VERSIONADA
-- ---------------------------------------------------------------------------
create table if not exists curadoria.derivation_rule_degree_map (
  rule_id text not null,
  rule_version integer not null,

  -- A ponte é POR CONCEITO: uma regra serve os conceitos para os quais tem
  -- correspondência, e nenhum outro. Conceito sem linha aqui não tem ponte —
  -- é a condição 5 da ADR-066 §16 tornada estrutural.
  subcriterion_code text not null,

  -- A ENTRADA: o grau declarado pela pessoa. Lista fechada, igual à de
  -- `case_needs.degree` — e propositalmente SEM valor em comum com a saída.
  degree text not null check (
    degree in ('ESSENCIAL', 'PESA_MUITO', 'DESEJAVEL', 'SEM_PREFERENCIA')
  ),

  -- A SAÍDA: a importância proposta. Lista fechada do Método.
  importance text not null check (
    importance in ('MUITO_IMPORTANTE', 'IMPORTANTE', 'RELEVANTE', 'POUCO_IMPORTANTE', 'NAO_INFLUENCIA')
  ),

  created_at timestamptz not null default now(),

  -- Um grau, um destino, por (regra, versão, conceito). Dois destinos para o
  -- mesmo grau seria a ponte não sabendo o que propõe.
  primary key (rule_id, rule_version, subcriterion_code, degree),

  -- A correspondência pertence a uma VERSÃO EXATA. RESTRICT dos dois lados,
  -- mesma doutrina do MR1.3: nenhuma cascata destrutiva sobre proveniência.
  constraint derivation_rule_degree_map_versao_fk
    foreign key (rule_id, rule_version)
    references curadoria.derivation_rules (rule_id, version)
    on update restrict
    on delete restrict,

  -- O conceito é do Catálogo, sempre.
  constraint derivation_rule_degree_map_conceito_fk
    foreign key (subcriterion_code)
    references curadoria.method_subcriteria (code)
    on update restrict
    on delete restrict
);

comment on table curadoria.derivation_rule_degree_map is
  'ADR-066 §15-§17 — a CORRESPONDENCIA da ponte grau -> importancia, por (regra, versao, conceito). Append-only. Cobertura total dos quatro graus, garantida por trigger deferido. As duas escalas permanecem disjuntas: nenhum valor de degree coincide com valor de importance. Item 2.2C: nenhuma regra e semeada — a primeira versao VIGENTE exige identidade tecnica da Autoridade de Metodo.';

comment on column curadoria.derivation_rule_degree_map.degree is
  'ENTRADA — o grau declarado pela pessoa (case_needs.degree). NUNCA e importancia: as escalas nao tem valor em comum, e a migration 20260801140000 existe porque essa colisao ja aconteceu uma vez.';

comment on column curadoria.derivation_rule_degree_map.importance is
  'SAIDA — a importancia PROPOSTA para o Case. Proposta, nunca declaracao: quem confirma e humano, e a confirmacao e de outro pacote.';

-- ---------------------------------------------------------------------------
-- 2. APPEND-ONLY — a correspondência que gerou uma proposta não se reescreve
-- ---------------------------------------------------------------------------
-- Reusa a função genérica do MR1: ela recusa o que lhe atribuírem, sem saber o
-- nome de quem protege.
drop trigger if exists derivation_rule_degree_map_append_only on curadoria.derivation_rule_degree_map;
create trigger derivation_rule_degree_map_append_only
  before update or delete on curadoria.derivation_rule_degree_map
  for each row execute function curadoria.recusa_alteracao_de_regra();

-- ---------------------------------------------------------------------------
-- 3. QUAIS CONCEITOS PODEM RECEBER CORRESPONDÊNCIA (ADR-066 §16)
-- ---------------------------------------------------------------------------
create or replace function curadoria.valida_conceito_da_correspondencia()
returns trigger language plpgsql
set search_path = curadoria, pg_temp as $$
declare
  conceito record;
  opcoes_da_pessoa integer;
begin
  select s.code, s.axis, s.active into conceito
  from curadoria.method_subcriteria s where s.code = new.subcriterion_code;

  if not conceito.active then
    raise exception
      'Conceito % saiu de circulacao e nao recebe correspondencia nova (ADR-066 §16).',
      new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  -- Condição 1 do §16: sem pergunta à pessoa, não há origem — logo não há ponte.
  select count(*) into opcoes_da_pessoa
  from curadoria.method_subcriterion_options o
  where o.subcriterion_code = new.subcriterion_code and o.side = 'paciente' and o.active;

  if opcoes_da_pessoa = 0 then
    raise exception
      'Conceito % nao tem lado da pessoa: sem origem nao ha ponte (ADR-066 §16, condicao 1).',
      new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  -- Condição 4 do §16, na parte que o banco consegue provar: Viabilidade está
  -- fora do Motor por decisão de Método.
  if conceito.axis = 'VIABILIDADE_DE_ACESSO' then
    raise exception
      'Conceito % e do eixo Viabilidade, que nao participa do Motor (ADR-066 §16, exclusao nomeada).',
      new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

comment on function curadoria.valida_conceito_da_correspondencia() is
  'ADR-066 §16 — recusa correspondencia para conceito inativo, sem lado da pessoa ou do eixo Viabilidade. A quarta exclusao (MOTOR_PARTICIPATION = NUNCA) NAO e derivavel no banco e e garantida por guarda executavel (C-11): duplicar a lista aqui criaria segunda fonte de um fato de dominio.';

drop trigger if exists derivation_rule_degree_map_conceito on curadoria.derivation_rule_degree_map;
create trigger derivation_rule_degree_map_conceito
  before insert on curadoria.derivation_rule_degree_map
  for each row execute function curadoria.valida_conceito_da_correspondencia();

-- ---------------------------------------------------------------------------
-- 4. COBERTURA TOTAL — meia tabela não emite
-- ---------------------------------------------------------------------------
create or replace function curadoria.exige_cobertura_total_dos_graus()
returns trigger language plpgsql
set search_path = curadoria, pg_temp as $$
declare
  faltando text;
begin
  select string_agg(g, ', ' order by g) into faltando
  from unnest(array['ESSENCIAL', 'PESA_MUITO', 'DESEJAVEL', 'SEM_PREFERENCIA']) g
  where not exists (
    select 1 from curadoria.derivation_rule_degree_map m
    where m.rule_id = new.rule_id
      and m.rule_version = new.rule_version
      and m.subcriterion_code = new.subcriterion_code
      and m.degree = g
  );

  if faltando is not null then
    raise exception
      'Correspondencia incompleta em %/% para %: falta(m) %. Uma versao apta a emitir cobre TODOS os graus (ADR-066 §15).',
      new.rule_id, new.rule_version, new.subcriterion_code, faltando
      using errcode = 'restrict_violation';
  end if;

  return null;
end;
$$;

comment on function curadoria.exige_cobertura_total_dos_graus() is
  'ADR-066 §15 — no commit, o conjunto (regra, versao, conceito) cobre os quatro graus. Constraint trigger DEFERIDO: as quatro linhas entram na mesma transacao, em qualquer ordem. Grau sem destino viraria silencio indistinguivel de "nao se aplica".';

drop trigger if exists derivation_rule_degree_map_cobertura on curadoria.derivation_rule_degree_map;
create constraint trigger derivation_rule_degree_map_cobertura
  after insert on curadoria.derivation_rule_degree_map
  deferrable initially deferred
  for each row execute function curadoria.exige_cobertura_total_dos_graus();

-- ---------------------------------------------------------------------------
-- 5. IDEMPOTÊNCIA E CONCORRÊNCIA — o árbitro é o índice
-- ---------------------------------------------------------------------------
create unique index if not exists derivation_proposals_uma_por_alvo_regra_versao
  on curadoria.derivation_proposals (case_id, subcriterion_code, rule_id, rule_version)
  where case_id is not null;

comment on index curadoria.derivation_proposals_uma_por_alvo_regra_versao is
  'ADR-066 — uma proposta por (Case, conceito, regra, versao). O INDICE e o arbitro: duas emissoes simultaneas colidem, uma vence, a outra recebe JA_EMITIDA. A verificacao dentro do emissor e conveniencia de mensagem — a garantia e do banco.';

-- ---------------------------------------------------------------------------
-- 6. O ESCRITOR ÚNICO — DR1 a DR5
-- ---------------------------------------------------------------------------
create or replace function curadoria.emitir_proposta_de_importancia(
  _case_id uuid,
  _subcriterion_code text,
  _actor_id uuid
)
returns text language plpgsql
set search_path = curadoria, pg_temp as $$
declare
  conceito record;
  necessidade record;
  regra record;
  correspondencia record;
  opcoes_da_pessoa integer;
begin
  if _case_id is null or _subcriterion_code is null or _actor_id is null then
    return 'ENTRADA_INVALIDA';
  end if;

  -- DR1 · o conceito existe, está ativo e tem lado da pessoa.
  select s.code, s.axis, s.active, s.catalog_version into conceito
  from curadoria.method_subcriteria s where s.code = _subcriterion_code;
  if not found or not conceito.active then return 'CONCEITO_INEXISTENTE'; end if;

  select count(*) into opcoes_da_pessoa
  from curadoria.method_subcriterion_options o
  where o.subcriterion_code = _subcriterion_code and o.side = 'paciente' and o.active;
  if opcoes_da_pessoa = 0 or conceito.axis = 'VIABILIDADE_DE_ACESSO' then
    return 'CONCEITO_SEM_PONTE';
  end if;

  -- DR2 · a declaração de origem existe e é de escala fechada.
  select n.id, n.degree, n.declared_by, n.declared_at, n.catalog_version
    into necessidade
  from curadoria.case_needs n
  where n.case_id = _case_id and n.subcriterion_code = _subcriterion_code;
  if not found then return 'SEM_GRAU'; end if;

  -- Condição 7 do §16: os dois lados na mesma versão de catálogo.
  if necessidade.catalog_version is distinct from conceito.catalog_version then
    return 'CATALOGO_DIVERGENTE';
  end if;

  -- A classificação manual PREVALECE. Onde o humano já declarou, a ponte não
  -- oferece: oferecer sobre declaração feita seria propor que ela se
  -- reconsidere sem ninguém ter pedido.
  if exists (
    select 1 from curadoria.case_priority_map m
    join curadoria.method_subcriteria s on s.id = m.subcriterion_id
    where m.case_id = _case_id and s.code = _subcriterion_code
  ) then
    return 'DECLARACAO_MANUAL_VIGENTE';
  end if;

  -- DR3 · existe regra VIGENTE para este conceito — e o estado vem da ÚLTIMA
  -- TRANSIÇÃO (ADR-069), nunca de `derivation_rules.state`, que é o inicial.
  select r.rule_id, r.version into regra
  from curadoria.derivation_rules r
  where exists (
      select 1 from curadoria.derivation_rule_degree_map m
      where m.rule_id = r.rule_id and m.rule_version = r.version
        and m.subcriterion_code = _subcriterion_code
    )
    and curadoria.derivation_rule_state(r.rule_id, r.version) = 'VIGENTE'
  order by r.rule_id, r.version
  limit 1;
  if not found then return 'SEM_REGRA_VIGENTE'; end if;

  -- DR4 · a correspondência cobre o grau declarado.
  select m.importance into correspondencia
  from curadoria.derivation_rule_degree_map m
  where m.rule_id = regra.rule_id and m.rule_version = regra.version
    and m.subcriterion_code = _subcriterion_code
    and m.degree = necessidade.degree;
  if not found then return 'SEM_CORRESPONDENCIA'; end if;

  -- DR5 · persiste UMA vez, com a proveniência inteira. O índice é quem
  -- arbitra a repetição: `on conflict do nothing` + `found` distingue emissão
  -- nova de repetição sem depender de ter consultado antes.
  insert into curadoria.derivation_proposals (
    case_id, subcriterion_code, target_field, suggested_value,
    origin_record, origin_version, origin_declared_at, origin_author,
    rule_id, rule_version, catalog_version, consequence_degree, state
  )
  values (
    _case_id, _subcriterion_code, 'importance', correspondencia.importance,
    'case_needs:' || necessidade.id::text, necessidade.degree,
    necessidade.declared_at, necessidade.declared_by,
    regra.rule_id, regra.version, conceito.catalog_version, 'ESTRUTURAL', 'PROPOSTA'
  )
  -- O predicado `where case_id is not null` repete o do índice de propósito:
  -- sem ele o PostgreSQL não reconhece o índice PARCIAL como árbitro do
  -- conflito, e o `on conflict` falharia em tempo de execução.
  on conflict (case_id, subcriterion_code, rule_id, rule_version)
    where case_id is not null
    do nothing;

  if not found then return 'JA_EMITIDA'; end if;
  return 'EMITIDA';
end;
$$;

comment on function curadoria.emitir_proposta_de_importancia(uuid, text, uuid) is
  'ADR-066 §15-§17 — O UNICO escritor de derivation_proposals. Ponte grau -> importancia: le case_needs, localiza a regra VIGENTE pelo ciclo de vida (ADR-069, nunca por derivation_rules.state), aplica a correspondencia versionada e persiste UMA proposta com a proveniencia inteira. Devolve sempre um desfecho nomeado — nao emitir e comportamento explicito, nunca erro silencioso. SECURITY INVOKER, search_path fixo, zero grants: nenhum papel de aplicacao a alcanca. A proposta NUNCA entra no Pipeline de Leitura (A2).';

-- ---------------------------------------------------------------------------
-- 7. INÉRCIA — mesmo regime de 2.1, 2.2A, 2.2B e 2.2B-R1
-- ---------------------------------------------------------------------------
alter table curadoria.derivation_rule_degree_map enable row level security;
revoke all on curadoria.derivation_rule_degree_map from anon, authenticated;

revoke execute on function curadoria.emitir_proposta_de_importancia(uuid, text, uuid) from public;
revoke execute on function curadoria.valida_conceito_da_correspondencia() from public;
revoke execute on function curadoria.exige_cobertura_total_dos_graus() from public;
