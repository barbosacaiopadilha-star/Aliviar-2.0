-- ============================================================================
-- PACOTE 2.2C-R1 — PARTICIPAÇÃO DO MOTOR E UNICIDADE POR CONCEITO
-- ============================================================================
--
-- Dois invariantes operacionais e uma precisão contratual, todos apontados pela
-- Verificação Independente do Item 2.2C.
--
-- ---------------------------------------------------------------------------
-- F-1 · `MOTOR_PARTICIPATION` PASSA A MORAR NO CATÁLOGO
-- ---------------------------------------------------------------------------
--   O 2.2C registrou o limite honestamente: a quarta exclusão da ADR-066 §16
--   não era derivável no banco, porque a participação vivia num `Record` manual
--   em `evidencias-pratica.ts`. A proteção dependia de guarda de teste — e
--   guarda de teste não impede escrita direta.
--
--   Agora o atributo é do CONCEITO, versionado com o Catálogo, autoritativo no
--   banco, gerado para TypeScript pelo mecanismo canônico e coberto pelo hash
--   de paridade. A lista manual morre no mesmo commit: duas fontes temporárias
--   seriam exatamente o defeito que este pacote existe para fechar.
--
--   VALORES: são os canônicos vigentes, transcritos do `Record` que morre —
--   nenhum inventado, nenhum inferido. Quatro `NUNCA`, o restante `DIRETO` ou
--   `INDIRETO`, conforme a Matriz de Cobertura.
--
--   `cruzamento` NÃO é substituto e não foi reutilizado. Ele diz QUEM JULGA;
--   participação diz SE E COMO o conceito entra no Motor. Entre os
--   `cruzamento = 'humano'`, dois são `NUNCA` e um é `INDIRETO`
--   (`MODELO_DECISAO_COMPARTILHADA`) — a prova de que não são a mesma coisa.
--   E `INDIRETO` NÃO É `NUNCA`: os conceitos de Prática e Trajetória
--   participam, por outra via.
--
-- ---------------------------------------------------------------------------
-- F-2 · UMA ÚNICA REGRA VIGENTE POR CONCEITO
-- ---------------------------------------------------------------------------
--   O 2.2C deixava o emissor escolher entre candidatas com
--   `order by rule_id limit 1` — arbitragem por NOME, que é o oposto de
--   método. A correção não é escolher melhor: é tornar impossível haver duas.
--
--   O invariante: **em qualquer instante, para cada conceito, no máximo uma
--   versão vigente o cobre**. Vale por `subcriterion_code`, independe de
--   `rule_id`, de `version` e de qualquer convenção da aplicação. Uma regra
--   pode cobrir vários conceitos; um conceito não pode ter duas donas.
--
--   COMO É GARANTIDO — mesmo padrão aprovado no MR1.2 reinterpretado
--   (ADR-069 §8), aplicado a outro sujeito:
--
--     · `derivation_concept_vigencia` registra a OCUPAÇÃO de um conceito por
--       uma versão, com `ocupacao_seq` = quantas ocupações daquele conceito já
--       se encerraram, mais um;
--     · o ÍNDICE ÚNICO (subcriterion_code, ocupacao_seq) é o ÁRBITRO: duas
--       transações concorrentes calculam o MESMO ordinal e colidem — uma
--       vence, a outra falha. Nunca "a última ganha";
--     · os TRIGGERS calculam o ordinal e alcançam as duas portas.
--
--   Como no MR1.2: **nenhum dos dois garante sozinho**. O índice não sabe qual
--   ordinal é o certo; o trigger não resolve corrida. As mutações provam os
--   dois papéis separadamente.
--
--   AS DUAS PORTAS, porque a cobertura pode nascer depois da promoção:
--     PORTA 1 — promoção e reativação (`* → VIGENTE`): ocupa todos os
--               conceitos cobertos pela versão, de uma vez. Se qualquer um já
--               tiver dona, a transação inteira falha — a regra nunca fica
--               parcialmente vigente.
--     PORTA 2 — correspondência nova em versão JÁ vigente: ocupa aquele
--               conceito na hora. Sem esta porta, bastaria promover primeiro e
--               cobrir depois para furar o invariante.
--
--   LIBERAÇÃO: sair de `VIGENTE` (suspensão ou revogação) encerra a ocupação —
--   e o próximo ordinal fica livre. Nada é apagado: `derivation_concept_vigencia`
--   é append-only, e a liberação é o FATO da transição de saída, não um DELETE.
--
-- ---------------------------------------------------------------------------
-- F-3 · `SEM_CORRESPONDENCIA` — RESERVA NÃO OPERACIONAL
-- ---------------------------------------------------------------------------
--   O desfecho PERMANECE no contrato do emissor e é hoje INALCANÇÁVEL: a
--   cobertura total dos quatro graus é obrigatória (trigger deferido
--   `..._cobertura`), então uma regra que cobre um conceito cobre todos os
--   graus dele. Não removemos o ramo e não afrouxamos DR3 para fabricá-lo —
--   as duas coisas seriam mentir sobre o contrato. Ele fica declarado como
--   reserva, e qualquer ativação futura exige mudança arquitetural explícita.
--
-- ---------------------------------------------------------------------------
-- O QUE ESTA MIGRATION NÃO FAZ
-- ---------------------------------------------------------------------------
--   Nenhuma regra é materializada. Nenhum seed operacional. Nenhuma alteração
--   no grafo da ADR-069, em MR1.1, MR1.2 ou MR1.3, nos privilégios do 2.2B-R1,
--   nas propostas históricas ou nas declarações manuais. Nenhuma policy,
--   nenhum grant, nenhuma API pública, nenhum segundo emissor. Fronteira
--   Humana, 2.C e 2.3 permanecem fechados.
--
-- ---------------------------------------------------------------------------
-- ROLLBACK — objeto a objeto, sem `db reset`, nesta ordem:
-- ---------------------------------------------------------------------------
--   drop trigger derivation_rule_degree_map_ocupa_conceito on curadoria.derivation_rule_degree_map;
--   drop trigger derivation_rule_transitions_ocupa_conceitos on curadoria.derivation_rule_transitions;
--   drop function curadoria.ocupa_conceito_por_correspondencia();
--   drop function curadoria.ocupa_conceitos_da_versao();
--   drop function curadoria.proxima_ocupacao_do_conceito(text);
--   drop table curadoria.derivation_concept_vigencia;
--   -- e restaurar a versão 2.2C de:
--   --   curadoria.valida_conceito_da_correspondencia()
--   --   curadoria.emitir_proposta_de_importancia(uuid, text, uuid)
--   alter table curadoria.method_subcriteria drop constraint method_subcriteria_ativo_declara_motor;
--   alter table curadoria.method_subcriteria drop column motor_participation;
--
--   O rollback NÃO apaga proposta, correspondência, regra, transição nem
--   declaração manual.
--
--   O ROLLBACK DO BANCO SOZINHO NÃO EXISTE. Executado de verdade, ele revela o
--   acoplamento: o gerador passa a projetar uma coluna que não está mais lá e
--   RECUSA rodar ("column method_subcriteria.motor_participation does not
--   exist"). Isso é o comportamento desejado — falhar alto é melhor do que
--   emitir um Catálogo divergente em silêncio —, mas significa que reverter
--   este pacote é reverter o COMMIT inteiro (migration + gerador + gerado +
--   `evidencias-pratica.ts` + gate de paridade), e só então regenerar. Quem
--   tentar desfazer só o SQL vai parar no gerador, e é para parar mesmo.
--
--   Executado e conferido em 2026-08-06: rollback objeto a objeto, reaplicação
--   e regeneração devolveram o MESMO hash de Catálogo
--   (4b53a6b551d88a3617484a4d5d9ef5f289159a4d807d44c7f8ea1e0559f6e292),
--   duas vezes seguidas, e uma terceira depois de um `db reset` — a migration
--   também aplica do zero, na ordem do ledger.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. O ATRIBUTO NO CATÁLOGO
-- ---------------------------------------------------------------------------
alter table curadoria.method_subcriteria
  add column if not exists motor_participation text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'method_subcriteria_motor_participation_check'
      and conrelid = 'curadoria.method_subcriteria'::regclass
  ) then
    alter table curadoria.method_subcriteria
      add constraint method_subcriteria_motor_participation_check
      check (motor_participation is null or motor_participation in ('DIRETO', 'INDIRETO', 'NUNCA'));
  end if;
end $$;

-- Os valores canônicos vigentes, transcritos do `Record` que este pacote
-- elimina. Nenhum inventado. `update` idempotente: reaplicar reescreve o mesmo.
--
-- O `set_config` é exigência do `catalog_guard` (migration 20260802165000): o
-- Catálogo é norma, e toda mudança de linha registra quem, quando e por quê em
-- `catalog_change_log`. Vai no MESMO bloco para ficar na mesma transação — é o
-- contrato da casa, e cumpri-lo produz o rastro em vez de contorná-lo.
do $$
begin
  perform set_config('curadoria.catalog_change_rationale',
    'ADR-066 §16 / 2.2C-R1: MOTOR_PARTICIPATION passa a morar no Catalogo. Valores transcritos do Record manual de evidencias-pratica.ts, que este pacote elimina. Nenhum valor novo.', true);

update curadoria.method_subcriteria set motor_participation = v.participacao
from (values
  ('ACESSO_MODALIDADE', 'DIRETO'),
  ('ACESSO_DISPONIBILIDADE', 'DIRETO'),
  ('ACESSO_PRAZO_PARA_CONSULTA', 'DIRETO'),
  ('ACESSO_LOCAL_DE_ATENDIMENTO', 'DIRETO'),
  ('CONTINUIDADE_RETORNOS', 'DIRETO'),
  ('CONTINUIDADE_POS_PROCEDIMENTO', 'INDIRETO'),
  ('CONTINUIDADE_EQUIPE_DE_APOIO', 'DIRETO'),
  ('CONTINUIDADE_COORDENACAO', 'DIRETO'),
  ('CONTINUIDADE_CANAIS', 'DIRETO'),
  ('MODELO_COMUNICACAO', 'DIRETO'),
  ('MODELO_DECISAO_COMPARTILHADA', 'INDIRETO'),
  ('MODELO_ALTERNATIVAS', 'DIRETO'),
  ('MODELO_PARTICIPACAO_FAMILIAR', 'DIRETO'),
  ('MODELO_PREFERENCIAS_E_RESTRICOES', 'NUNCA'),
  -- ADR-065: cruzamento humano obrigatório — nunca entra no Motor.
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'NUNCA'),
  ('FORMACAO_GRADUACAO', 'INDIRETO'),
  ('FORMACAO_RESIDENCIA', 'INDIRETO'),
  ('FORMACAO_ESPECIALIZACAO', 'INDIRETO'),
  ('FORMACAO_FELLOWSHIP', 'INDIRETO'),
  ('FORMACAO_COMPLEMENTAR', 'INDIRETO'),
  ('EXPERIENCIA_TEMPO_DE_PRATICA', 'INDIRETO'),
  ('EXPERIENCIA_NO_TIPO_DE_CASO', 'INDIRETO'),
  ('EXPERIENCIA_VOLUME_DE_ATUACAO', 'INDIRETO'),
  ('PRATICA_LIMITES_DE_ATUACAO', 'INDIRETO'),
  ('HISTORICO_TRAJETORIA_INSTITUCIONAL', 'INDIRETO'),
  ('HISTORICO_ATIVIDADE_ACADEMICA', 'INDIRETO'),
  ('HISTORICO_AREAS_DE_ATUACAO', 'INDIRETO'),
  ('VIABILIDADE_COBERTURA_E_CONVENIO', 'NUNCA'),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO', 'NUNCA')
) as v(code, participacao)
where curadoria.method_subcriteria.code = v.code;
end $$;

-- Conceito ATIVO precisa declarar. Os inativos do legado 0.9.0 ficam `null`:
-- eles saíram de circulação antes de o atributo existir, e atribuir-lhes um
-- valor seria inventar domínio sobre o que já não participa de nada.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'method_subcriteria_ativo_declara_motor'
      and conrelid = 'curadoria.method_subcriteria'::regclass
  ) then
    alter table curadoria.method_subcriteria
      add constraint method_subcriteria_ativo_declara_motor
      check (not active or motor_participation is not null);
  end if;
end $$;

comment on column curadoria.method_subcriteria.motor_participation is
  'ADR-066 §16 / Matriz de Cobertura — SE E COMO o conceito participa do Motor: DIRETO, INDIRETO ou NUNCA. FONTE AUTORITATIVA (ADR-047), versionada com o Catalogo e gerada para TypeScript. NAO confundir com `cruzamento`, que diz QUEM JULGA: entre os cruzamento=humano ha dois NUNCA e um INDIRETO. INDIRETO NAO E NUNCA — os conceitos de Pratica e Trajetoria participam por outra via. Conceito ativo precisa declarar (constraint method_subcriteria_ativo_declara_motor); inativo do legado 0.9.0 permanece null.';

-- ---------------------------------------------------------------------------
-- 2. F-1 · CONCEITO `NUNCA` NÃO RECEBE CORRESPONDÊNCIA — no banco
-- ---------------------------------------------------------------------------
-- Substitui a versão do 2.2C. A heurística de eixo (`VIABILIDADE_DE_ACESSO`)
-- SAI: ela era o que se conseguia provar sem o atributo, e manter as duas
-- criaria duas fontes para a mesma pergunta. Os dois conceitos de Viabilidade
-- continuam recusados — agora pela fonte autoritativa, que os declara `NUNCA`.
create or replace function curadoria.valida_conceito_da_correspondencia()
returns trigger language plpgsql
set search_path = curadoria, pg_temp as $$
declare
  conceito record;
  opcoes_da_pessoa integer;
begin
  select s.code, s.active, s.motor_participation into conceito
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

  -- Condição 4 do §16, agora pela FONTE AUTORITATIVA. Sem lista embutida: a
  -- função pergunta ao Catálogo, e o Catálogo é quem sabe.
  if conceito.motor_participation = 'NUNCA' then
    raise exception
      'Conceito % nao participa do Motor (MOTOR_PARTICIPATION = NUNCA): exige juizo humano e nao tem ponte (ADR-066 §16, condicao 4).',
      new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

comment on function curadoria.valida_conceito_da_correspondencia() is
  'ADR-066 §16 — recusa correspondencia para conceito inativo, sem lado da pessoa ou com MOTOR_PARTICIPATION = NUNCA. 2.2C-R1: a participacao vem da coluna autoritativa do Catalogo, nao de lista embutida nem de guarda de teste. Vale para qualquer papel, inclusive service_role.';

-- ---------------------------------------------------------------------------
-- 3. F-2 · A OCUPAÇÃO DO CONCEITO — o sujeito do novo invariante
-- ---------------------------------------------------------------------------
create table if not exists curadoria.derivation_concept_vigencia (
  subcriterion_code text not null,

  -- O ordinal da OCUPAÇÃO: a n-ésima vez que este conceito é coberto por uma
  -- versão vigente. É sobre ele que o índice único arbitra.
  ocupacao_seq integer not null check (ocupacao_seq >= 1),

  rule_id text not null,
  rule_version integer not null,
  occupied_at timestamptz not null default now(),

  -- O ÁRBITRO. Duas ocupações concorrentes do mesmo conceito calculam o mesmo
  -- ordinal e colidem aqui — uma vence, a outra falha.
  primary key (subcriterion_code, ocupacao_seq),

  constraint derivation_concept_vigencia_versao_fk
    foreign key (rule_id, rule_version)
    references curadoria.derivation_rules (rule_id, version)
    on update restrict
    on delete restrict,

  constraint derivation_concept_vigencia_conceito_fk
    foreign key (subcriterion_code)
    references curadoria.method_subcriteria (code)
    on update restrict
    on delete restrict
);

comment on table curadoria.derivation_concept_vigencia is
  'ADR-066 §16 / 2.2C-R1 — a OCUPACAO de um conceito por uma versao vigente. Append-only. A PK (subcriterion_code, ocupacao_seq) e o ARBITRO do invariante "no maximo uma regra vigente por conceito": duas ocupacoes concorrentes calculam o mesmo ordinal e colidem. Sair de VIGENTE encerra a ocupacao pelo FATO da transicao de saida — nada e apagado.';

-- Append-only: reusa a função genérica do MR1.
drop trigger if exists derivation_concept_vigencia_append_only on curadoria.derivation_concept_vigencia;
create trigger derivation_concept_vigencia_append_only
  before update or delete on curadoria.derivation_concept_vigencia
  for each row execute function curadoria.recusa_alteracao_de_regra();

/**
 * O próximo ordinal de ocupação de um conceito.
 *
 * Ocupações ENCERRADAS = transições de SAÍDA de `VIGENTE` de versões que
 * cobrem o conceito. Mesma física do `vigencia_seq` da ADR-069, aplicada por
 * conceito em vez de por regra.
 */
create or replace function curadoria.proxima_ocupacao_do_conceito(_code text)
returns integer language sql stable
set search_path = curadoria, pg_temp as $$
  select 1 + count(*)::integer
  from curadoria.derivation_rule_transitions t
  where t.from_state = 'VIGENTE'
    and exists (
      select 1 from curadoria.derivation_rule_degree_map m
      where m.rule_id = t.rule_id
        and m.rule_version = t.rule_version
        and m.subcriterion_code = _code
    );
$$;

comment on function curadoria.proxima_ocupacao_do_conceito(text) is
  '2.2C-R1 — quantas ocupacoes deste conceito ja se encerraram, mais um. Encerramento e a transicao de SAIDA de VIGENTE de uma versao que o cobre. Este calculo NAO garante o invariante: quem arbitra e a PK de derivation_concept_vigencia.';

-- ---------------------------------------------------------------------------
-- 4. PORTA 1 — promoção e reativação ocupam TODOS os conceitos da versão
-- ---------------------------------------------------------------------------
create or replace function curadoria.ocupa_conceitos_da_versao()
returns trigger language plpgsql
set search_path = curadoria, pg_temp as $$
declare
  conceito text;
begin
  if new.to_state <> 'VIGENTE' then return null; end if;

  -- Um insert por conceito coberto. Se qualquer um colidir, a transação
  -- INTEIRA falha: a regra nunca fica parcialmente vigente.
  for conceito in
    select distinct m.subcriterion_code
    from curadoria.derivation_rule_degree_map m
    where m.rule_id = new.rule_id and m.rule_version = new.rule_version
    order by 1
  loop
    begin
      insert into curadoria.derivation_concept_vigencia
        (subcriterion_code, ocupacao_seq, rule_id, rule_version)
      values (conceito, curadoria.proxima_ocupacao_do_conceito(conceito), new.rule_id, new.rule_version);
    exception when unique_violation then
      raise exception
        'Conceito % ja esta coberto por outra regra vigente. Uma regra por conceito, a qualquer instante (2.2C-R1). A versao %/% NAO entra em vigor.',
        conceito, new.rule_id, new.rule_version
        using errcode = 'restrict_violation';
    end;
  end loop;

  return null;
end;
$$;

comment on function curadoria.ocupa_conceitos_da_versao() is
  '2.2C-R1 PORTA 1 — na promocao e na reativacao, ocupa todos os conceitos cobertos pela versao. Recusa ATOMICA: colisao em qualquer conceito derruba a transicao inteira, e a regra nunca fica parcialmente vigente.';

drop trigger if exists derivation_rule_transitions_ocupa_conceitos on curadoria.derivation_rule_transitions;
create trigger derivation_rule_transitions_ocupa_conceitos
  after insert on curadoria.derivation_rule_transitions
  for each row execute function curadoria.ocupa_conceitos_da_versao();

-- ---------------------------------------------------------------------------
-- 5. PORTA 2 — correspondência nova em versão JÁ vigente ocupa o conceito
-- ---------------------------------------------------------------------------
-- Sem esta porta bastaria promover primeiro e cobrir depois para furar o
-- invariante — e a cobertura pode legitimamente nascer depois da promoção.
create or replace function curadoria.ocupa_conceito_por_correspondencia()
returns trigger language plpgsql
set search_path = curadoria, pg_temp as $$
begin
  if curadoria.derivation_rule_state(new.rule_id, new.rule_version) is distinct from 'VIGENTE' then
    return null;
  end if;

  -- A versão já vigora: a cobertura nova ocupa o conceito agora. Se ele já
  -- tiver dona, a correspondência é recusada e as existentes ficam intactas.
  --
  -- ANTES DISSO, a saída silenciosa quando ESTA MESMA versão já é a dona: os
  -- quatro graus de um conceito entram como quatro linhas, e o trigger dispara
  -- em cada uma. Sem esta verificação, a segunda linha tentaria ocupar de novo
  -- e colidiria com a ocupação que ela mesma acabou de criar — recusando uma
  -- correspondência perfeitamente legítima.
  --
  -- O ordinal da ocupação ABERTA é `proxima_ocupacao_do_conceito`, não ela
  -- menos um: `proxima` = encerradas + 1, e a ocupação aberta (se existe)
  -- carrega exatamente esse número.
  if exists (
    select 1 from curadoria.derivation_concept_vigencia v
    where v.subcriterion_code = new.subcriterion_code
      and v.rule_id = new.rule_id
      and v.rule_version = new.rule_version
      and v.ocupacao_seq = curadoria.proxima_ocupacao_do_conceito(new.subcriterion_code)
  ) then
    return null; -- esta versão já ocupa o conceito; nada a fazer
  end if;

  begin
    insert into curadoria.derivation_concept_vigencia
      (subcriterion_code, ocupacao_seq, rule_id, rule_version)
    values (new.subcriterion_code, curadoria.proxima_ocupacao_do_conceito(new.subcriterion_code),
            new.rule_id, new.rule_version);
  exception when unique_violation then
    raise exception
      'Conceito % ja esta coberto por outra regra vigente: a correspondencia de %/% e recusada (2.2C-R1, porta 2).',
      new.subcriterion_code, new.rule_id, new.rule_version
      using errcode = 'restrict_violation';
  end;

  return null;
end;
$$;

comment on function curadoria.ocupa_conceito_por_correspondencia() is
  '2.2C-R1 PORTA 2 — correspondencia nova numa versao JA vigente ocupa o conceito na hora. Obrigatoria porque a cobertura pode nascer depois da promocao: sem ela bastaria promover primeiro e cobrir depois. Correspondencias existentes sao preservadas.';

drop trigger if exists derivation_rule_degree_map_ocupa_conceito on curadoria.derivation_rule_degree_map;
create trigger derivation_rule_degree_map_ocupa_conceito
  after insert on curadoria.derivation_rule_degree_map
  for each row execute function curadoria.ocupa_conceito_por_correspondencia();

-- ---------------------------------------------------------------------------
-- 6. O EMISSOR — sem arbitragem por nome, e sem degradação silenciosa
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
  candidatas integer;
  correspondencia record;
  opcoes_da_pessoa integer;
begin
  if _case_id is null or _subcriterion_code is null or _actor_id is null then
    return 'ENTRADA_INVALIDA';
  end if;

  -- DR1 · conceito existe, ativo, com lado da pessoa e participando do Motor.
  select s.code, s.active, s.catalog_version, s.motor_participation into conceito
  from curadoria.method_subcriteria s where s.code = _subcriterion_code;
  if not found or not conceito.active then return 'CONCEITO_INEXISTENTE'; end if;

  select count(*) into opcoes_da_pessoa
  from curadoria.method_subcriterion_options o
  where o.subcriterion_code = _subcriterion_code and o.side = 'paciente' and o.active;

  -- F-1: a participação vem da fonte autoritativa, nunca de lista embutida.
  if opcoes_da_pessoa = 0 or conceito.motor_participation = 'NUNCA' then
    return 'CONCEITO_SEM_PONTE';
  end if;

  -- DR2 · a declaração de origem existe e é de escala fechada.
  select n.id, n.degree, n.declared_by, n.declared_at, n.catalog_version
    into necessidade
  from curadoria.case_needs n
  where n.case_id = _case_id and n.subcriterion_code = _subcriterion_code;
  if not found then return 'SEM_GRAU'; end if;

  if necessidade.catalog_version is distinct from conceito.catalog_version then
    return 'CATALOGO_DIVERGENTE';
  end if;

  -- A classificação manual PREVALECE.
  if exists (
    select 1 from curadoria.case_priority_map m
    join curadoria.method_subcriteria s on s.id = m.subcriterion_id
    where m.case_id = _case_id and s.code = _subcriterion_code
  ) then
    return 'DECLARACAO_MANUAL_VIGENTE';
  end if;

  -- DR3 · a regra vigente que cobre o conceito.
  --
  -- SEM `order by rule_id`: escolher por nome é o oposto de método. O F-2
  -- torna duas candidatas estruturalmente impossíveis, e o emissor CONTA
  -- antes de usar — se o invariante for violado, ele levanta em vez de
  -- escolher em silêncio. Degradação silenciosa é o defeito, não o empate.
  select count(*) into candidatas
  from curadoria.derivation_rules r
  where exists (
      select 1 from curadoria.derivation_rule_degree_map m
      where m.rule_id = r.rule_id and m.rule_version = r.version
        and m.subcriterion_code = _subcriterion_code
    )
    and curadoria.derivation_rule_state(r.rule_id, r.version) = 'VIGENTE';

  if candidatas = 0 then return 'SEM_REGRA_VIGENTE'; end if;

  if candidatas > 1 then
    raise exception
      'INVARIANTE VIOLADO: % regras vigentes cobrem o conceito %. O emissor nao escolhe — uma regra por conceito e garantia estrutural (2.2C-R1).',
      candidatas, _subcriterion_code
      using errcode = 'internal_error';
  end if;

  select r.rule_id, r.version into regra
  from curadoria.derivation_rules r
  where exists (
      select 1 from curadoria.derivation_rule_degree_map m
      where m.rule_id = r.rule_id and m.rule_version = r.version
        and m.subcriterion_code = _subcriterion_code
    )
    and curadoria.derivation_rule_state(r.rule_id, r.version) = 'VIGENTE';

  -- DR4 · a correspondência cobre o grau declarado.
  --
  -- `SEM_CORRESPONDENCIA` é RESERVA NÃO OPERACIONAL (F-3): a cobertura total
  -- dos quatro graus é obrigatória, então uma regra que cobre o conceito cobre
  -- todos os graus dele. O ramo permanece no contrato — retirá-lo tornaria a
  -- falha silenciosa no dia em que a cobertura total for revista, e afrouxar
  -- DR3 para alcançá-lo seria fabricar um fluxo que não existe.
  select m.importance into correspondencia
  from curadoria.derivation_rule_degree_map m
  where m.rule_id = regra.rule_id and m.rule_version = regra.version
    and m.subcriterion_code = _subcriterion_code
    and m.degree = necessidade.degree;
  if not found then return 'SEM_CORRESPONDENCIA'; end if;

  -- DR5 · persiste UMA vez, com a proveniência inteira.
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
  on conflict (case_id, subcriterion_code, rule_id, rule_version)
    where case_id is not null
    do nothing;

  if not found then return 'JA_EMITIDA'; end if;
  return 'EMITIDA';
end;
$$;

comment on function curadoria.emitir_proposta_de_importancia(uuid, text, uuid) is
  'ADR-066 §15-§17 — O UNICO escritor de derivation_proposals. 2.2C-R1: a participacao no Motor vem da coluna autoritativa do Catalogo; NAO ha mais arbitragem por `order by rule_id` — o emissor CONTA as candidatas e LEVANTA se houver mais de uma, em vez de escolher em silencio. SEM_CORRESPONDENCIA permanece no contrato como RESERVA NAO OPERACIONAL enquanto a cobertura total dos quatro graus for obrigatoria. SECURITY INVOKER, search_path fixo, zero grants. A proposta NUNCA entra no Pipeline de Leitura (A2).';

-- ---------------------------------------------------------------------------
-- 7. INÉRCIA — mesmo regime dos pacotes anteriores
-- ---------------------------------------------------------------------------
alter table curadoria.derivation_concept_vigencia enable row level security;
revoke all on curadoria.derivation_concept_vigencia from anon, authenticated;
revoke execute on function curadoria.proxima_ocupacao_do_conceito(text) from public;
revoke execute on function curadoria.ocupa_conceitos_da_versao() from public;
revoke execute on function curadoria.ocupa_conceito_por_correspondencia() from public;
revoke execute on function curadoria.emitir_proposta_de_importancia(uuid, text, uuid) from public;
revoke execute on function curadoria.valida_conceito_da_correspondencia() from public;
