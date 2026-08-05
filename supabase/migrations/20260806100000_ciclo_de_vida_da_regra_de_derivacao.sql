-- ============================================================================
-- ITEM 2.2B — CICLO DE VIDA DAS REGRAS DE DERIVAÇÃO (ADR-069)
-- ============================================================================
--
-- FINALIDADE
--   A ADR-069 fechou as três decisões que faltavam ao 2.2B:
--
--     B-1  `derivation_rules.state` deixa de ser fonte de verdade e permanece
--          como registro imutável do ESTADO INICIAL. Não é removido, não vira
--          cache (§5.4 — cache é segunda fonte de verdade, contra P-07).
--     B-2  Grafo fechado. Nascimento em PROPOSTA; cinco pares de saída
--          permitidos; REVOGADA terminal; PROPOSTA→REVOGADA não existe;
--          ninguém volta a PROPOSTA (§7).
--     B-3  MR1.2 muda de SUJEITO, não de conteúdo: de "uma linha VIGENTE por
--          regra" para "uma transição de entrada em VIGENTE sem saída
--          posterior, por regra" — e a garantia continua DECLARATIVA (§8.3).
--
--   O princípio: a versão é FATO imutável; a transição é ATO append-only; o
--   estado vigente é LEITURA derivada. É a ADR-066 §5 aplicada ao terceiro
--   objeto da mesma família.
--
-- ---------------------------------------------------------------------------
-- COMO A UNICIDADE DA VIGENTE É GARANTIDA — e por que não é contagem
-- ---------------------------------------------------------------------------
--   O caminho óbvio seria um trigger que conta vigentes antes de inserir. Ele
--   é furado sob concorrência: em READ COMMITTED, duas transações simultâneas
--   contam zero e ambas inserem. A ADR §8.2 exige o contrário — "duas
--   transições concorrentes para VIGENTE na mesma regra devem COLIDIR".
--
--   A garantia é um ÍNDICE ÚNICO PARCIAL sobre `(rule_id, vigencia_seq)` nas
--   linhas de entrada em VIGENTE. `vigencia_seq` é o ordinal do PERÍODO de
--   vigência daquela regra: a n-ésima vez que aquela regra vigora.
--
--     · vigência aberta (entrada sem saída)  → a próxima entrada calcula o
--       MESMO ordinal e COLIDE no índice. É o invariante.
--     · vigência fechada (entrada com saída) → a próxima calcula ordinal+1 e
--       entra. Ciclos VIGENTE↔SUSPENSA sem limite (§6.1).
--     · duas concorrentes                    → ambas calculam o mesmo ordinal;
--       o índice deixa UMA passar. Nunca "a última ganha".
--
--   O índice é o ÁRBITRO — declarativo, para todo papel, inclusive
--   `service_role`, sem depender de ninguém lembrar de verificar (§8.3). O
--   trigger apenas CALCULA e CONFERE o ordinal; ele não é a garantia, e a
--   mutação de controle prova os dois papéis separadamente.
--
-- ---------------------------------------------------------------------------
-- ORDENAÇÃO — nunca pelo relógio (§11)
-- ---------------------------------------------------------------------------
--   `seq` é ordinal monotônico POR VERSÃO, com PK `(rule_id, rule_version, seq)`.
--   Carimbo de tempo empata sob concorrência, e um estado que depende de
--   desempate não é auditável. `occurred_at` registra QUANDO — nunca QUAL foi
--   a última.
--
-- ---------------------------------------------------------------------------
-- O QUE ACONTECE COM OS OBJETOS DO MR1 (ADR §15)
-- ---------------------------------------------------------------------------
--   MR1.1 (trigger append-only)  PRESERVADO SEM EXCEÇÃO. Nenhuma exceção é
--                                criada; a alternativa que a exigia foi
--                                rejeitada pela ADR §5.4.
--   MR1.3 (FK composta)          INTOCADA. E a mesma doutrina é estendida às
--                                transições (§10 regra 5).
--   MR1.2 (índice parcial)       Torna-se VACUAMENTE VERDADEIRO — nenhuma
--                                versão nasce VIGENTE (novo CHECK abaixo).
--                                NÃO é removido: continua correto e barato,
--                                como cinto de segurança. Mas o COMENTÁRIO é
--                                reescrito: apresentá-lo como a garantia seria
--                                proteção vacuamente apresentada como ativa.
--   CHECK vigente_exige_autoridade   idem — vacuamente verdadeiro; a exigência
--                                    real migra para a transição.
--   CHECK fim_tem_data               idem.
--
-- ---------------------------------------------------------------------------
-- O QUE ESTA MIGRATION NÃO FAZ
-- ---------------------------------------------------------------------------
--   Nenhum seed, backfill ou DML. Nenhuma policy, nenhum grant a papel de
--   aplicação — mesmo regime inerte da 2.1 e da 2.2A. Nenhum escritor, nenhum
--   pipeline, nenhuma avaliação de regra, nenhuma criação de proposta, nenhuma
--   interface. 2.C não é iniciada.
--
-- ---------------------------------------------------------------------------
-- IDEMPOTÊNCIA
-- ---------------------------------------------------------------------------
--   Todo objeto nasce com `if not exists` ou dentro de `do $$ ... $$` que
--   verifica o catálogo antes. Reaplicar é no-op. A correção NÃO depende de as
--   tabelas estarem vazias: o CHECK de nascimento e o índice parcial são
--   validados contra as linhas existentes na aplicação, e hoje não há nenhuma.
--
-- ---------------------------------------------------------------------------
-- ROLLBACK — objeto a objeto, sem `db reset`. Nesta ordem exata:
-- ---------------------------------------------------------------------------
--   drop trigger derivation_rules_exige_transicao_inicial on curadoria.derivation_rules;
--   drop function curadoria.exige_transicao_inicial();
--   drop trigger derivation_rule_transitions_append_only on curadoria.derivation_rule_transitions;
--   drop trigger derivation_rule_transitions_cadeia on curadoria.derivation_rule_transitions;
--   drop function curadoria.valida_transicao_da_regra();
--   drop function curadoria.derivation_rule_state(text, integer);
--   drop function curadoria.derivation_rule_current_version(text);
--   drop index curadoria.derivation_rule_transitions_uma_vigente_por_regra;
--   drop table curadoria.derivation_rule_transitions;
--   alter table curadoria.derivation_rules drop constraint derivation_rules_nasce_em_proposta;
--   comment on index curadoria.derivation_rules_uma_vigente_por_regra is
--     'MR1.2 — no maximo UMA versao VIGENTE por rule_id. PROPOSTA, SUSPENSA e REVOGADA coexistem: o historico depende disso.';
--
--   `curadoria.recusa_alteracao_de_regra()` NÃO é removida no rollback: ela é
--   do MR1 e passa a ser compartilhada pelos dois append-only. Removê-la
--   derrubaria MR1.1 — que este pacote não pode tocar.
--
--   Verificado: volta exatamente ao estado de 2a8b802, com as três tabelas
--   vazias e sem reset do banco.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. NASCIMENTO — nenhuma versão nasce vigente (ADR §9)
-- ---------------------------------------------------------------------------
-- Declarativo, e é o que torna vacuamente verdadeiros o índice do MR1.2 e os
-- dois CHECK de estado. `state` passa a significar "o estado em que nasceu" —
-- e um campo cujo significado é "inicial" não pode divergir do corrente,
-- porque não afirma nada sobre o corrente (ADR §5.3 regra 3).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'derivation_rules_nasce_em_proposta'
      and conrelid = 'curadoria.derivation_rules'::regclass
  ) then
    alter table curadoria.derivation_rules
      add constraint derivation_rules_nasce_em_proposta check (state = 'PROPOSTA');
  end if;
end $$;

comment on column curadoria.derivation_rules.state is
  'ADR-069 B-1: REGISTRO IMUTAVEL DO ESTADO INICIAL, nunca o estado corrente. Toda versao nasce PROPOSTA (constraint derivation_rules_nasce_em_proposta). O estado corrente e leitura derivada da ultima transicao — curadoria.derivation_rule_state(). Nao e cache e nunca e atualizado (MR1.1).';

-- ---------------------------------------------------------------------------
-- 2. A TRANSIÇÃO — o ato, append-only
-- ---------------------------------------------------------------------------
create table if not exists curadoria.derivation_rule_transitions (
  rule_id text not null,
  rule_version integer not null,

  -- Ordinal monotônico POR VERSÃO. Nunca o relógio (ADR §11).
  seq integer not null check (seq >= 1),

  -- `null` só no nascimento: não havia estado antes dele.
  from_state text check (from_state in ('PROPOSTA', 'VIGENTE', 'SUSPENSA', 'REVOGADA')),
  to_state text not null check (to_state in ('PROPOSTA', 'VIGENTE', 'SUSPENSA', 'REVOGADA')),

  -- O ordinal do PERÍODO de vigência. Preenchido SOMENTE na entrada em
  -- VIGENTE — é sobre ele que o índice único parcial arbitra (MR1.2 novo).
  vigencia_seq integer check (vigencia_seq is null or vigencia_seq >= 1),

  -- Autoria: quem praticou o ato. Transição sem autor não existe (ADR §12).
  actor_id uuid not null,

  -- Qual autoridade foi exercida. Lista fechada dos três atores da ADR §6.3.
  authority text not null check (
    authority in ('PAPEL_INTERNO', 'AUTORIDADE_DE_METODO', 'CURADOR_DO_CASE')
  ),

  -- Motivo: todas exigem, sem exceção (ADR §7). Registrado sem porquê é carimbo.
  reason text not null check (length(btrim(reason)) > 0),

  -- A ADR que sustenta o ato. Exigida na entrada em VIGENTE e em qualquer
  -- entrada em REVOGADA (ADR §12).
  approval_adr text check (approval_adr is null or length(btrim(approval_adr)) > 0),

  -- Exclusiva do freio do Curador: por que foi preciso parar a regra sem
  -- esperar pela Autoridade (ADR §12 regra 2).
  emergency_justification text check (
    emergency_justification is null or length(btrim(emergency_justification)) > 0
  ),

  -- Fato: QUANDO aconteceu. Nunca chave de ordenação (ADR §11.3).
  occurred_at timestamptz not null default now(),

  primary key (rule_id, rule_version, seq),

  -- MR1.3 estendida às transições (ADR §10 regra 5): transição órfã não nasce,
  -- e nenhuma cascata destrutiva sobre proveniência.
  constraint derivation_rule_transitions_versao_fk
    foreign key (rule_id, rule_version)
    references curadoria.derivation_rules (rule_id, version)
    on update restrict
    on delete restrict,

  -- O GRAFO, fechado em CHECK (ADR §7). Ele já exclui, por construção:
  --   PROPOSTA→REVOGADA (não se revoga o que nunca valeu, §6.2)
  --   qualquer→PROPOSTA (nascimento não se repete)
  --   REVOGADA→qualquer (terminal)
  --   X→X              (transição sem mudança não é ato)
  constraint derivation_rule_transitions_grafo_fechado check (
    (from_state is null and to_state = 'PROPOSTA')
    or (from_state = 'PROPOSTA' and to_state in ('VIGENTE', 'SUSPENSA'))
    or (from_state = 'VIGENTE' and to_state in ('SUSPENSA', 'REVOGADA'))
    or (from_state = 'SUSPENSA' and to_state in ('VIGENTE', 'REVOGADA'))
  ),

  -- Nascimento é sempre a primeira transição, e só ele não tem origem.
  constraint derivation_rule_transitions_nascimento_e_o_primeiro check (
    (from_state is null) = (seq = 1)
  ),

  -- `vigencia_seq` existe exatamente nas entradas em VIGENTE.
  constraint derivation_rule_transitions_vigencia_seq_coerente check (
    (vigencia_seq is not null) = (to_state = 'VIGENTE')
  ),

  -- Entrada em VIGENTE e qualquer entrada em REVOGADA exigem ADR (§12).
  constraint derivation_rule_transitions_adr_quando_exigida check (
    to_state not in ('VIGENTE', 'REVOGADA') or approval_adr is not null
  ),

  -- O FREIO DO CURADOR, em três cláusulas (ADR §6.3 e §12):
  --   pode APENAS VIGENTE→SUSPENSA;
  --   sempre com justificativa de emergência;
  --   e a justificativa é exclusivamente dele — ninguém mais a usa.
  constraint derivation_rule_transitions_freio_do_curador check (
    authority <> 'CURADOR_DO_CASE'
    or (from_state = 'VIGENTE' and to_state = 'SUSPENSA' and emergency_justification is not null)
  ),
  constraint derivation_rule_transitions_emergencia_e_do_freio check (
    emergency_justification is null or authority = 'CURADOR_DO_CASE'
  ),

  -- Qualquer papel interno PROPÕE (cria a versão). Nada além disso (§6.3).
  constraint derivation_rule_transitions_papel_interno_so_propoe check (
    authority <> 'PAPEL_INTERNO' or from_state is null
  )
);

comment on table curadoria.derivation_rule_transitions is
  'ADR-069 — O ATO no ciclo de vida da Regra de Derivacao. Append-only: cada mudanca de posicao no ciclo e uma linha nova, com autor, autoridade, data e motivo. A VERSAO e fato imutavel (MR1.1); esta tabela e o ato; o estado vigente e leitura derivada (curadoria.derivation_rule_state). Item 2.2B: INERTE — RLS habilitada, zero policies, nenhum grant a papel de aplicacao. Nenhum escritor nasce aqui.';

comment on column curadoria.derivation_rule_transitions.seq is
  'Ordinal monotonico POR VERSAO. A ultima transicao e a de maior seq — nunca a mais recente por occurred_at (ADR §11): carimbo de tempo empata sob concorrencia, e estado que depende de desempate nao e auditavel.';

comment on column curadoria.derivation_rule_transitions.vigencia_seq is
  'O ordinal do PERIODO de vigencia da regra: a n-esima vez que ela vigora. Preenchido somente na entrada em VIGENTE. E sobre ele que o indice unico parcial derivation_rule_transitions_uma_vigente_por_regra arbitra o MR1.2 reinterpretado — vigencia aberta faz a proxima entrada colidir; vigencia fechada libera o ordinal seguinte.';

comment on column curadoria.derivation_rule_transitions.occurred_at is
  'QUANDO o ato aconteceu. Fato, nunca chave de ordenacao (ADR §11.3).';

comment on column curadoria.derivation_rule_transitions.emergency_justification is
  'Exclusiva do freio do Curador do Case (§5.4 cond. 7). Existe para que a Autoridade, ao revisar, saiba por que alguem precisou parar a regra sem esperar por ela.';

-- ---------------------------------------------------------------------------
-- 3. MR1.2 REINTERPRETADO — a garantia declarativa (ADR §8)
-- ---------------------------------------------------------------------------
-- "No maximo uma transicao de entrada em VIGENTE sem transicao de saida
-- posterior, por rule_id." O sujeito mudou da linha da versao para o fluxo de
-- transicoes; o conteudo — uma vigente por regra — e o mesmo.
create unique index if not exists derivation_rule_transitions_uma_vigente_por_regra
  on curadoria.derivation_rule_transitions (rule_id, vigencia_seq)
  where to_state = 'VIGENTE';

comment on index curadoria.derivation_rule_transitions_uma_vigente_por_regra is
  'MR1.2 REINTERPRETADO (ADR-069 §8) — no maximo UMA vigencia aberta por rule_id, INDEPENDENTE DA VERSAO. Declarativo: vale para todo papel, inclusive service_role, e nao depende de ninguem lembrar de verificar. Duas entradas concorrentes calculam o mesmo vigencia_seq e COLIDEM aqui — uma vence, a outra falha. Nunca "a ultima ganha".';

-- ---------------------------------------------------------------------------
-- 4. A CADEIA — from_state confere com a transição anterior, e o ordinal também
-- ---------------------------------------------------------------------------
-- O que este trigger faz e o que NÃO faz:
--   FAZ    confere que `from_state` é o `to_state` da transição anterior da
--          MESMA versão; que `seq` é o próximo; e CALCULA/CONFERE `vigencia_seq`.
--   NÃO FAZ  garantir a unicidade da vigente — quem garante é o índice. Este
--          trigger apenas calcula o ordinal certo; se ele sumir, o índice
--          continua impedindo duas entradas com o mesmo ordinal.
create or replace function curadoria.valida_transicao_da_regra()
returns trigger language plpgsql as $$
declare
  ultima record;
  vigencias_fechadas integer;
begin
  select t.seq, t.to_state into ultima
  from curadoria.derivation_rule_transitions t
  where t.rule_id = new.rule_id and t.rule_version = new.rule_version
  order by t.seq desc
  limit 1;

  if not found then
    if new.seq <> 1 or new.from_state is not null then
      raise exception
        'Transicao inicial da versao %/% deve ser seq=1 sem origem (ADR-069 §9). Recebido seq=%, from_state=%.',
        new.rule_id, new.rule_version, new.seq, coalesce(new.from_state, 'null')
        using errcode = 'restrict_violation';
    end if;
  else
    if new.seq <> ultima.seq + 1 then
      raise exception
        'Ordenacao monotonica quebrada em %/%: a proxima transicao e seq=%, recebido seq=% (ADR-069 §11).',
        new.rule_id, new.rule_version, ultima.seq + 1, new.seq
        using errcode = 'restrict_violation';
    end if;
    if new.from_state is distinct from ultima.to_state then
      raise exception
        'Cadeia rompida em %/%: a transicao anterior terminou em %, e esta parte de % (ADR-069 §10).',
        new.rule_id, new.rule_version, ultima.to_state, coalesce(new.from_state, 'null')
        using errcode = 'restrict_violation';
    end if;
  end if;

  -- O ordinal do período de vigência: quantas vigências desta REGRA já se
  -- fecharam, mais um. Conta por `rule_id` — a unicidade é da regra, não da
  -- versão (uma regra não pode ter duas versões vigentes ao mesmo tempo).
  if new.to_state = 'VIGENTE' then
    select count(*) into vigencias_fechadas
    from curadoria.derivation_rule_transitions t
    where t.rule_id = new.rule_id and t.from_state = 'VIGENTE';

    if new.vigencia_seq is distinct from vigencias_fechadas + 1 then
      raise exception
        'vigencia_seq de %/% deve ser % (vigencias fechadas + 1), recebido % (ADR-069 §8).',
        new.rule_id, new.rule_version, vigencias_fechadas + 1, coalesce(new.vigencia_seq::text, 'null')
        using errcode = 'restrict_violation';
    end if;
  end if;

  return new;
end;
$$;

comment on function curadoria.valida_transicao_da_regra() is
  'ADR-069 §10 e §11 — confere a cadeia (from_state = to_state da anterior), a monotonicidade de seq e o ordinal de vigencia. NAO e a garantia do MR1.2: quem arbitra a unicidade e o indice unico parcial. Este trigger calcula o ordinal certo; o indice recusa o repetido.';

drop trigger if exists derivation_rule_transitions_cadeia on curadoria.derivation_rule_transitions;
create trigger derivation_rule_transitions_cadeia
  before insert on curadoria.derivation_rule_transitions
  for each row execute function curadoria.valida_transicao_da_regra();

-- ---------------------------------------------------------------------------
-- 5. APPEND-ONLY DA TRANSIÇÃO — nenhuma transição apaga outra (ADR §10 regra 4)
-- ---------------------------------------------------------------------------
-- Reusa a função genérica do MR1: ela recusa o que lhe atribuírem, sem saber o
-- nome de quem protege. Reusar mantém uma única voz para a mesma recusa.
drop trigger if exists derivation_rule_transitions_append_only on curadoria.derivation_rule_transitions;
create trigger derivation_rule_transitions_append_only
  before update or delete on curadoria.derivation_rule_transitions
  for each row execute function curadoria.recusa_alteracao_de_regra();

-- ---------------------------------------------------------------------------
-- 6. O PAR INDIVISÍVEL — versão sem transição inicial não existe (ADR §9)
-- ---------------------------------------------------------------------------
-- Constraint trigger DEFERRABLE INITIALLY DEFERRED: a versão e o seu
-- nascimento entram na mesma transação, em qualquer ordem, e no COMMIT o par
-- precisa estar completo. Não é escritor — não cria nada; apenas recusa a
-- versão que ficou sem ato de nascimento.
create or replace function curadoria.exige_transicao_inicial()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from curadoria.derivation_rule_transitions t
    where t.rule_id = new.rule_id
      and t.rule_version = new.version
      and t.seq = 1
  ) then
    raise exception
      'Versao %/% nasceu sem transicao inicial. O par (versao, nascimento) e indivisivel (ADR-069 §9).',
      new.rule_id, new.version
      using errcode = 'restrict_violation';
  end if;
  return null;
end;
$$;

comment on function curadoria.exige_transicao_inicial() is
  'ADR-069 §9 — o par (versao, transicao de nascimento) e indivisivel. Constraint trigger DEFERIDO: confere no COMMIT, nao cria nada. Recusa, nunca escreve.';

drop trigger if exists derivation_rules_exige_transicao_inicial on curadoria.derivation_rules;
create constraint trigger derivation_rules_exige_transicao_inicial
  after insert on curadoria.derivation_rules
  deferrable initially deferred
  for each row execute function curadoria.exige_transicao_inicial();

-- ---------------------------------------------------------------------------
-- 7. A LEITURA DERIVADA — a única (ADR §8.2)
-- ---------------------------------------------------------------------------
-- Nenhuma interface reconstrói estado. Nenhuma consulta usa "maior versão",
-- "mais recente por created_at" ou qualquer heurística. E nenhuma delas lê
-- `derivation_rules.state` — que diz como nasceu, não onde está.
create or replace function curadoria.derivation_rule_state(_rule_id text, _version integer)
returns text language sql stable as $$
  select t.to_state
  from curadoria.derivation_rule_transitions t
  where t.rule_id = _rule_id and t.rule_version = _version
  order by t.seq desc
  limit 1;
$$;

comment on function curadoria.derivation_rule_state(text, integer) is
  'ADR-069 — o ESTADO CORRENTE de uma versao: o destino da ultima transicao, pela ordem monotonica de seq. Leitura canonica e unica. Nao le derivation_rules.state, que e o estado INICIAL. Devolve null se a versao nao existe.';

create or replace function curadoria.derivation_rule_current_version(_rule_id text)
returns integer language sql stable as $$
  select t.rule_version
  from curadoria.derivation_rule_transitions t
  where t.rule_id = _rule_id
    and t.to_state = 'VIGENTE'
    and not exists (
      select 1 from curadoria.derivation_rule_transitions s
      where s.rule_id = t.rule_id
        and s.rule_version = t.rule_version
        and s.seq > t.seq
    )
  limit 1;
$$;

comment on function curadoria.derivation_rule_current_version(text) is
  'ADR-069 — qual VERSAO de uma regra esta vigente agora, ou null. Deriva das transicoes: entrada em VIGENTE que e a ultima da sua versao. O indice unico parcial garante que no maximo uma satisfaz isso por rule_id.';

-- ---------------------------------------------------------------------------
-- 8. INÉRCIA — mesmo regime da 2.1 e da 2.2A
-- ---------------------------------------------------------------------------
alter table curadoria.derivation_rule_transitions enable row level security;
revoke all on curadoria.derivation_rule_transitions from anon, authenticated;
revoke all on function curadoria.derivation_rule_state(text, integer) from anon, authenticated;
revoke all on function curadoria.derivation_rule_current_version(text) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. OS OBJETOS DO MR1 QUE FICARAM VACUAMENTE VERDADEIROS (ADR §15)
-- ---------------------------------------------------------------------------
-- Nenhum é removido — continuam corretos e baratos, como cinto de segurança.
-- Mas o comentário deixa de apresentá-los como a garantia: proteção vacuamente
-- apresentada como ativa é pior do que proteção ausente, porque mente.
comment on index curadoria.derivation_rules_uma_vigente_por_regra is
  'MR1.2 ORIGINAL — VACUAMENTE VERDADEIRO desde a ADR-069: nenhuma versao nasce VIGENTE (constraint derivation_rules_nasce_em_proposta), entao o conjunto indexado e sempre vazio. NAO E MAIS A GARANTIA de "uma vigente por regra" — quem garante e derivation_rule_transitions_uma_vigente_por_regra. Preservado como cinto de seguranca, nunca como prova.';

comment on constraint derivation_rules_vigente_exige_autoridade on curadoria.derivation_rules is
  'VACUAMENTE VERDADEIRO desde a ADR-069: nenhuma versao nasce VIGENTE. A exigencia real de autoridade e ADR migrou para a transicao de entrada em VIGENTE (derivation_rule_transitions_adr_quando_exigida). Preservado como cinto de seguranca.';

comment on constraint derivation_rules_fim_tem_data on curadoria.derivation_rules is
  'VACUAMENTE VERDADEIRO desde a ADR-069: nenhuma versao nasce SUSPENSA nem REVOGADA. O "quando deixou de valer" passa a ser occurred_at da transicao — que tem autor e motivo, o que esta coluna nunca teve. Preservado como cinto de seguranca.';
