-- ============================================================================
-- EMENDA DR3 — CONECTA A REGRA 001 `VIGENTE` AO EMISSOR PROFISSIONAL
-- ============================================================================
--
-- CONTRATO_EMENDA_DR3_REGRA_001.md (Agente 02), implementado literalmente.
-- A semântica NÃO é decidida aqui: a ficha REGRA_001_CONTINUIDADE_COORDENACAO
-- v2.0 e a ADR-070 são as autoridades; esta emenda EXECUTA o que elas
-- decidiram.
--
-- O ACHADO QUE ELA FECHA (§1 do contrato): a Regra 001 está `VIGENTE` e NÃO
-- OCUPA CONCEITO NENHUM — `ocupa_conceitos_da_versao` só percorre
-- `derivation_rule_degree_map` (Case-side), onde a Regra 001 tem zero linhas
-- por CD-1. Logo o invariante "uma regra vigente por conceito" (ADR-066 §16,
-- condição 8) está ABERTO no lado profissional. As portas 1 e 2 profissionais
-- o fecham — a condição já dizia "regra", sem qualificar lado; nenhuma ADR
-- nova é necessária.
--
-- O QUE ESTA MIGRATION FAZ (§15), e nada além:
--   1. cria `derivation_rule_option_semantics` — o CORPO EXECUTÁVEL que
--      faltava: declara qual conceito a regra governa E o papel de cada opção;
--   2. append-only, validação de opção/conceito e cobertura total (deferido);
--   3. estende a porta 1 e cria a porta 2 do lado profissional;
--   4. estende `proxima_ocupacao_do_conceito` para enxergar os DOIS lados;
--   5. substitui `candidatas := 0` pela consulta lavrada e implementa o
--      avaliador genérico + o braço de emissão, com três desfechos novos;
--   6. insere as CINCO linhas da Regra 001, transcritas da ficha.
--
-- ZERO código de aplicação · ZERO grant · ZERO policy · ZERO RPC nova ·
-- ZERO UI · nenhum conceito além de CONTINUIDADE_COORDENACAO · Regra 002 não
-- existe e não nasce aqui. CD-1 INTACTA: `derivation_rule_degree_map`
-- permanece vazio e FORA do caminho profissional.
--
-- ROLLBACK (§14 do contrato), objeto a objeto, sem db reset:
--   1. reverter o DR3 a `candidatas := 0` (recolar o corpo de 20260808270000);
--   2. drop function curadoria.avalia_semantica_da_evidencia(text,integer,text,text[]);
--   3. drop trigger derivation_rule_option_semantics_ocupa_conceito + function;
--   4. restaurar `ocupa_conceitos_da_versao()` e `proxima_ocupacao_do_conceito()`
--      às versões que leem só o `degree_map` (corpo em 20260806220000);
--   5. delete das linhas de `derivation_concept_vigencia` criadas pela emenda
--      — ÚNICO ponto que exige desabilitar o append-only temporariamente, e
--      por isso EXIGE AUTORIZAÇÃO EXPLÍCITA (o contrato o nomeia assim);
--   6. drop table curadoria.derivation_rule_option_semantics.
-- A Regra 001 e suas transições NÃO são revertidas (I-7).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. O CORPO EXECUTÁVEL — espelha a FORMA do degree_map, nunca a reutiliza
-- ----------------------------------------------------------------------------
create table if not exists curadoria.derivation_rule_option_semantics (
  rule_id text not null,
  rule_version integer not null,
  -- A DECLARAÇÃO DE COBERTURA: é daqui que sai "esta regra governa este
  -- conceito". Nunca por parsing do `rule_id` — que é `text` sem restrição de
  -- formato (§9 da missão, §3 do contrato).
  subcriterion_code text not null
    references curadoria.method_subcriteria (code) on update restrict on delete restrict,
  option_value text not null,
  papel text not null
    constraint derivation_rule_option_semantics_papel_fechado
    check (papel in ('POSITIVA_DIRETA', 'NEGATIVA_EXPLICITA', 'INSUFICIENTE')),
  created_at timestamptz not null default now(),

  -- uma opção, um papel, por versão
  constraint derivation_rule_option_semantics_pkey
    primary key (rule_id, rule_version, subcriterion_code, option_value),
  constraint derivation_rule_option_semantics_versao_fk
    foreign key (rule_id, rule_version)
    references curadoria.derivation_rules (rule_id, version)
    on update restrict on delete restrict
);

comment on table curadoria.derivation_rule_option_semantics is
  'EMENDA DR3 — o corpo executavel da regra material do lado PROFISSIONAL: declara qual conceito a versao governa (subcriterion_code) e o papel de cada opcao canonica (POSITIVA_DIRETA | NEGATIVA_EXPLICITA | INSUFICIENTE). Espelha a FORMA de derivation_rule_degree_map sem reutiliza-la: o degree_map e Case-side e permanece VAZIO (CD-1). Append-only e coberta por trigger deferido de cobertura total — versao nao vigora com opcao sem papel declarado. Sem score, sem peso, sem prioridade.';

comment on column curadoria.derivation_rule_option_semantics.papel is
  'Lista fechada de TRES papeis. Nao e escala nem peso: e a classe semantica da opcao, transcrita da ficha da regra. O avaliador le papeis — nunca nomes de conceito ou de opcao.';

-- INÉRCIA, declarada no nascimento (guarda 13): a tabela existe sem policy e
-- sem grant. Fica ANTES dos dados de propósito — depois dos INSERTs o ALTER
-- seria recusado por eventos pendentes do trigger deferido de cobertura.
alter table curadoria.derivation_rule_option_semantics enable row level security;
revoke all on table curadoria.derivation_rule_option_semantics from public, anon, authenticated;

-- Append-only: o MESMO mecanismo das outras tabelas do regime.
drop trigger if exists derivation_rule_option_semantics_append_only on curadoria.derivation_rule_option_semantics;
create trigger derivation_rule_option_semantics_append_only
  before update or delete on curadoria.derivation_rule_option_semantics
  for each row execute function curadoria.recusa_alteracao_de_regra();

-- ----------------------------------------------------------------------------
-- 2. A opção declarada existe, é do CONCEITO, é do lado PROFISSIONAL e é ativa
-- ----------------------------------------------------------------------------
create or replace function curadoria.valida_opcao_da_semantica()
returns trigger
language plpgsql
as $$
declare
  conceito record;
begin
  select s.code, s.active, s.cruzamento, s.motor_participation into conceito
  from curadoria.method_subcriteria s where s.code = new.subcriterion_code;

  if not conceito.active then
    raise exception
      'Conceito % saiu de circulacao e nao recebe semantica nova (ADR-066 §16).',
      new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  -- O mesmo recorte do emissor: só conceito automático e participante do Motor
  -- tem derivação de estado (1.A: humano/misto ficam FORA_DA_DERIVACAO).
  if conceito.cruzamento is distinct from 'automatico' or conceito.motor_participation = 'NUNCA' then
    raise exception
      'Conceito % nao participa da derivacao automatica: semantica de regra profissional e recusada.',
      new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  -- A opção precisa ser canônica, DESTE conceito, do lado PROFISSIONAL e ativa.
  if not exists (
    select 1 from curadoria.method_subcriterion_options o
    where o.subcriterion_code = new.subcriterion_code
      and o.side = 'profissional'
      and o.field = 'principal'
      and o.active
      and o.value = new.option_value
  ) then
    raise exception
      'Opcao % nao e opcao profissional ativa de % no Catalogo vigente: semantica implicita e proibida.',
      new.option_value, new.subcriterion_code using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists derivation_rule_option_semantics_opcao on curadoria.derivation_rule_option_semantics;
create trigger derivation_rule_option_semantics_opcao
  before insert on curadoria.derivation_rule_option_semantics
  for each row execute function curadoria.valida_opcao_da_semantica();

-- ----------------------------------------------------------------------------
-- 3. COBERTURA TOTAL — espelho do `derivation_rule_degree_map_cobertura`
--    Deferido: as cinco linhas entram na mesma transação, em qualquer ordem.
-- ----------------------------------------------------------------------------
create or replace function curadoria.exige_cobertura_total_das_opcoes()
returns trigger
language plpgsql
as $$
declare
  faltando text;
begin
  select string_agg(o.value, ', ' order by o.value) into faltando
  from curadoria.method_subcriterion_options o
  where o.subcriterion_code = new.subcriterion_code
    and o.side = 'profissional'
    and o.field = 'principal'
    and o.active
    and not exists (
      select 1 from curadoria.derivation_rule_option_semantics s
      where s.rule_id = new.rule_id
        and s.rule_version = new.rule_version
        and s.subcriterion_code = new.subcriterion_code
        and s.option_value = o.value
    );

  if faltando is not null then
    raise exception
      'Semantica incompleta em %/% para %: falta(m) %. Uma versao apta a emitir classifica TODAS as opcoes ativas do conceito — opcao sem papel seria semantica implicita.',
      new.rule_id, new.rule_version, new.subcriterion_code, faltando
      using errcode = 'restrict_violation';
  end if;

  return null;
end;
$$;

drop trigger if exists derivation_rule_option_semantics_cobertura on curadoria.derivation_rule_option_semantics;
create constraint trigger derivation_rule_option_semantics_cobertura
  after insert on curadoria.derivation_rule_option_semantics
  deferrable initially deferred
  for each row execute function curadoria.exige_cobertura_total_das_opcoes();

-- ----------------------------------------------------------------------------
-- 4. O ORDINAL DA OCUPAÇÃO — passa a enxergar os DOIS lados
--
-- Antes contava só as saídas de `VIGENTE` de regras com cobertura Case-side:
-- uma regra PROFISSIONAL que deixasse de vigorar não avançaria o ordinal, e o
-- conceito ficaria travado para sempre. A extensão é obrigatória para que a
-- porta profissional funcione — e o lado Case permanece com o mesmo resultado.
-- ----------------------------------------------------------------------------
create or replace function curadoria.proxima_ocupacao_do_conceito(_code text)
returns integer
language sql
stable
set search_path = curadoria, pg_temp
as $$
  select 1 + count(*)::integer
  from curadoria.derivation_rule_transitions t
  where t.from_state = 'VIGENTE'
    and (
      exists (
        select 1 from curadoria.derivation_rule_degree_map m
        where m.rule_id = t.rule_id
          and m.rule_version = t.rule_version
          and m.subcriterion_code = _code
      )
      or exists (
        select 1 from curadoria.derivation_rule_option_semantics s
        where s.rule_id = t.rule_id
          and s.rule_version = t.rule_version
          and s.subcriterion_code = _code
      )
    );
$$;

comment on function curadoria.proxima_ocupacao_do_conceito(text) is
  'Ordinal da proxima ocupacao do conceito = ocupacoes ENCERRADAS + 1. EMENDA DR3: passa a contar as saidas de VIGENTE dos DOIS lados — cobertura Case-side (degree_map) e profissional (option_semantics). Sem isso, uma regra profissional que deixasse de vigorar nao liberaria o conceito.';

-- ----------------------------------------------------------------------------
-- 5. PORTA 1 — a promoção passa a ocupar também pelos conceitos profissionais
-- ----------------------------------------------------------------------------
create or replace function curadoria.ocupa_conceitos_da_versao()
returns trigger
language plpgsql
as $$
declare
  conceito text;
begin
  if new.to_state <> 'VIGENTE' then return null; end if;

  -- Um insert por conceito coberto. Se qualquer um colidir, a transação
  -- INTEIRA falha: a regra nunca fica parcialmente vigente.
  --
  -- EMENDA DR3: a união com `derivation_rule_option_semantics` fecha o buraco
  -- do lado profissional. `distinct` garante que uma regra que cobrisse o
  -- mesmo conceito dos dois lados ocupe UMA vez.
  for conceito in
    select m.subcriterion_code
    from curadoria.derivation_rule_degree_map m
    where m.rule_id = new.rule_id and m.rule_version = new.rule_version
    union
    select s.subcriterion_code
    from curadoria.derivation_rule_option_semantics s
    where s.rule_id = new.rule_id and s.rule_version = new.rule_version
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

-- ----------------------------------------------------------------------------
-- 6. PORTA 2 PROFISSIONAL — cobertura nascendo DEPOIS da promoção
--    (é exatamente o caso da Regra 001: já está VIGENTE)
-- ----------------------------------------------------------------------------
create or replace function curadoria.ocupa_conceito_por_semantica()
returns trigger
language plpgsql
as $$
begin
  if curadoria.derivation_rule_state(new.rule_id, new.rule_version) is distinct from 'VIGENTE' then
    return null;
  end if;

  -- Saída silenciosa quando ESTA MESMA versão já é a dona: as cinco opções de
  -- um conceito entram como cinco linhas e o trigger dispara em cada uma. Sem
  -- isto, a segunda linha colidiria com a ocupação que ela mesma criou —
  -- recusando uma cobertura legítima. (Mesmo raciocínio da porta 2 Case-side.)
  if exists (
    select 1 from curadoria.derivation_concept_vigencia v
    where v.subcriterion_code = new.subcriterion_code
      and v.rule_id = new.rule_id
      and v.rule_version = new.rule_version
      and v.ocupacao_seq = curadoria.proxima_ocupacao_do_conceito(new.subcriterion_code)
  ) then
    return null;
  end if;

  begin
    insert into curadoria.derivation_concept_vigencia
      (subcriterion_code, ocupacao_seq, rule_id, rule_version)
    values (new.subcriterion_code, curadoria.proxima_ocupacao_do_conceito(new.subcriterion_code),
            new.rule_id, new.rule_version);
  exception when unique_violation then
    raise exception
      'Conceito % ja esta coberto por outra regra vigente: a semantica de %/% e recusada (EMENDA DR3, porta 2 profissional).',
      new.subcriterion_code, new.rule_id, new.rule_version
      using errcode = 'restrict_violation';
  end;

  return null;
end;
$$;

drop trigger if exists derivation_rule_option_semantics_ocupa_conceito on curadoria.derivation_rule_option_semantics;
create trigger derivation_rule_option_semantics_ocupa_conceito
  after insert on curadoria.derivation_rule_option_semantics
  for each row execute function curadoria.ocupa_conceito_por_semantica();

-- ----------------------------------------------------------------------------
-- 7. O AVALIADOR — genérico: lê PAPÉIS, nunca conceitos nem nomes de opção
--
-- A ordem é NORMATIVA (matriz §15.1 da ficha; §8 do contrato): a contradição
-- precede a afirmação, porque contradição não vira afirmação. `NAO_INFORMADO`
-- não é produzível — nenhum papel o gera.
-- ----------------------------------------------------------------------------
create or replace function curadoria.avalia_semantica_da_evidencia(
  _rule_id text,
  _rule_version integer,
  _subcriterion_code text,
  _options text[]
)
returns text
language plpgsql
stable
set search_path = curadoria, pg_temp
as $$
declare
  fora integer;
  positivas integer;
  negativas integer;
begin
  -- 1 · opção fora das canônicas ativas do conceito
  select count(*) into fora
  from unnest(coalesce(_options, array[]::text[])) as opcao
  where not exists (
    select 1 from curadoria.method_subcriterion_options o
    where o.subcriterion_code = _subcriterion_code
      and o.side = 'profissional'
      and o.field = 'principal'
      and o.active
      and o.value = opcao
  );
  if fora > 0 then return 'EVIDENCIA_INCOMPATIVEL'; end if;

  -- 2 · nenhuma opção declarada
  if coalesce(array_length(_options, 1), 0) = 0 then
    return 'EVIDENCIA_INSUFICIENTE';
  end if;

  select count(*) filter (where s.papel = 'POSITIVA_DIRETA'),
         count(*) filter (where s.papel = 'NEGATIVA_EXPLICITA')
    into positivas, negativas
  from curadoria.derivation_rule_option_semantics s
  where s.rule_id = _rule_id
    and s.rule_version = _rule_version
    and s.subcriterion_code = _subcriterion_code
    and s.option_value = any(_options);

  -- 3 · contradição ANTES de qualquer afirmação
  if positivas > 0 and negativas > 0 then return 'EVIDENCIA_CONTRADITORIA'; end if;
  -- 4 · afirmação positiva
  if positivas > 0 then return 'CONFIRMADO'; end if;
  -- 5 · negativa verificada
  if negativas > 0 then return 'NAO_CONFIRMADO'; end if;
  -- 6 · só INSUFICIENTE
  return 'EVIDENCIA_INSUFICIENTE';
end;
$$;

comment on function curadoria.avalia_semantica_da_evidencia(text, integer, text, text[]) is
  'EMENDA DR3 §8 — o avaliador GENERICO: recebe as opcoes da evidencia corrente e devolve CONFIRMADO | NAO_CONFIRMADO | EVIDENCIA_CONTRADITORIA | EVIDENCIA_INCOMPATIVEL | EVIDENCIA_INSUFICIENTE. Le PAPEIS da tabela de semantica — nunca menciona conceito nem nome de opcao, e por isso serve a qualquer regra desta natureza. Ordem normativa: incompatibilidade, vazio, CONTRADICAO, positiva, negativa, insuficiente. NAO_INFORMADO nao e produzivel.';

revoke execute on function curadoria.avalia_semantica_da_evidencia(text, integer, text, text[]) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. O DR3 — a consulta lavrada no lugar de `candidatas := 0`, e a emissão
-- ----------------------------------------------------------------------------
create or replace function curadoria.emitir_proposta_de_estado(
  _professional_profile_id uuid,
  _subcriterion_code text,
  _actor_id uuid
)
returns text language plpgsql
set search_path = curadoria, pg_temp as $$
declare
  conceito record;
  evidencia record;
  regra record;
  candidatas integer;
  avaliacao text;
begin
  if _professional_profile_id is null or _subcriterion_code is null or _actor_id is null then
    return 'ENTRADA_INVALIDA';
  end if;

  -- DR1 · conceito existe, ativo — e pertence ao mecanismo.
  select s.code, s.active, s.catalog_version, s.motor_participation, s.cruzamento
    into conceito
  from curadoria.method_subcriteria s where s.code = _subcriterion_code;
  if not found or not conceito.active then return 'CONCEITO_INEXISTENTE'; end if;

  if conceito.cruzamento is distinct from 'automatico'
     or conceito.motor_participation = 'NUNCA' then
    return 'CONCEITO_SEM_PONTE';
  end if;

  -- DR2 · a evidência CORRENTE do par — "leitura corrente = max(version)".
  select e.id, e.version, e.options, e.collected_at, e.collected_by, e.catalog_version
    into evidencia
  from curadoria.practice_evidence e
  where e.professional_profile_id = _professional_profile_id
    and e.subcriterion_code = _subcriterion_code
  order by e.version desc
  limit 1;
  if not found then return 'SEM_EVIDENCIA'; end if;

  if evidencia.catalog_version is distinct from conceito.catalog_version then
    return 'CATALOGO_DIVERGENTE';
  end if;

  -- A declaração manual PREVALECE — espelho exato do lado Case.
  if exists (
    select 1 from curadoria.professional_subcriterion_map m
    join curadoria.method_subcriteria s on s.id = m.subcriterion_id
    where m.professional_profile_id = _professional_profile_id
      and s.code = _subcriterion_code
  ) then
    return 'DECLARACAO_MANUAL_VIGENTE';
  end if;

  -- DR3 · A REGRA MATERIAL VIGENTE QUE COBRE ESTE CONCEITO (EMENDA DR3).
  --
  -- A cobertura vem de DADO estruturado (`option_semantics`), nunca de
  -- parsing do `rule_id`. O estado vem da FUNÇÃO DERIVADA, lida a cada
  -- chamada — suspensa/revogada deixa de emitir sem cache algum. A versão é a
  -- da linha de cobertura: nunca `max(version)`, e uma v2 futura traz a sua.
  select s.rule_id, s.rule_version
    into regra
  from curadoria.derivation_rule_option_semantics s
  where s.subcriterion_code = _subcriterion_code
    and curadoria.derivation_rule_state(s.rule_id, s.rule_version) = 'VIGENTE'
  group by s.rule_id, s.rule_version;

  get diagnostics candidatas = row_count;
  if candidatas = 0 then return 'SEM_REGRA_VIGENTE'; end if;

  -- Duas candidatas são impossíveis: a PK de `derivation_concept_vigencia`
  -- arbitra a ocupação (portas 1 e 2). Se acontecer, é invariante violado —
  -- e o emissor LEVANTA em vez de escolher em silêncio (padrão do lado Case).
  if candidatas > 1 then
    raise exception
      'INVARIANTE VIOLADO: % regras vigentes cobrem o conceito %. O emissor nao escolhe — uma regra por conceito e garantia estrutural.',
      candidatas, _subcriterion_code
      using errcode = 'internal_error';
  end if;

  -- O AVALIADOR — genérico, uma evidência, uma avaliação.
  avaliacao := curadoria.avalia_semantica_da_evidencia(
    regra.rule_id, regra.rule_version, _subcriterion_code, evidencia.options
  );

  -- Não emissão EXPLÍCITA — desfecho nomeado, nunca erro silencioso.
  if avaliacao in ('EVIDENCIA_INCOMPATIVEL', 'EVIDENCIA_INSUFICIENTE', 'EVIDENCIA_CONTRADITORIA') then
    return avaliacao;
  end if;

  -- DR5 · persiste UMA vez, com a proveniência inteira. O `status` de
  -- verificação da evidência NÃO viaja para a proposta e NÃO influencia o
  -- valor sugerido (I-5): ele é alcançável pelo ponteiro `origin_record`.
  insert into curadoria.derivation_proposals (
    professional_profile_id, subcriterion_code, target_field, suggested_value,
    origin_record, origin_version, origin_declared_at, origin_author,
    rule_id, rule_version, catalog_version, consequence_degree, state
  )
  values (
    _professional_profile_id, _subcriterion_code, 'status', avaliacao,
    'practice_evidence:' || evidencia.id::text, evidencia.version::text,
    evidencia.collected_at, evidencia.collected_by,
    regra.rule_id, regra.rule_version, conceito.catalog_version, 'ESTRUTURAL', 'PROPOSTA'
  )
  on conflict (professional_profile_id, subcriterion_code, rule_id, rule_version)
    where professional_profile_id is not null
    do nothing;

  if not found then return 'JA_EMITIDA'; end if;

  return 'EMITIDA';
end;
$$;

comment on function curadoria.emitir_proposta_de_estado(uuid, text, uuid) is
  'CONTRATO_2_C §7 + EMENDA DR3 — o emissor do lado profissional, quinta funcao nominal da C-01d. DR3 CONECTADO: a regra material vigente vem de `derivation_rule_option_semantics` (dado estruturado, nunca parsing de rule_id), com estado lido pela funcao DERIVADA a cada chamada e versao exata da linha de cobertura. O avaliador generico traduz papeis em CONFIRMADO/NAO_CONFIRMADO, e a contradicao precede a afirmacao. Tres desfechos novos de nao-emissao explicita: EVIDENCIA_CONTRADITORIA, EVIDENCIA_INCOMPATIVEL, EVIDENCIA_INSUFICIENTE. Nao escreve no Mapa, nao julga, nao confirma (A2b). CD-1: nao consulta degree_map, grau, importancia nem satisfied_by. SECURITY INVOKER, search_path fixo, ZERO grants.';

revoke execute on function curadoria.emitir_proposta_de_estado(uuid, text, uuid)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9. AS CINCO LINHAS DA REGRA 001 — transcrição literal da ficha v2.0
--
-- A porta 2 dispara aqui: a Regra 001 JÁ está VIGENTE, então a cobertura nova
-- ocupa `CONTINUIDADE_COORDENACAO` agora — fechando o buraco do §1. A cobertura
-- total é conferida no COMMIT (trigger deferido): as cinco entram juntas.
-- ----------------------------------------------------------------------------
insert into curadoria.derivation_rule_option_semantics
  (rule_id, rule_version, subcriterion_code, option_value, papel)
values
  ('CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA', 1, 'CONTINUIDADE_COORDENACAO', 'CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL', 'POSITIVA_DIRETA'),
  ('CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA', 1, 'CONTINUIDADE_COORDENACAO', 'ENVIA_RELATORIO_ESCRITO', 'POSITIVA_DIRETA'),
  ('CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA', 1, 'CONTINUIDADE_COORDENACAO', 'PARTICIPA_DE_DISCUSSAO_DE_CASO', 'POSITIVA_DIRETA'),
  ('CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA', 1, 'CONTINUIDADE_COORDENACAO', 'ATUA_DE_FORMA_INDEPENDENTE', 'NEGATIVA_EXPLICITA'),
  ('CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA', 1, 'CONTINUIDADE_COORDENACAO', 'ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO', 'INSUFICIENTE')
-- Reaplicável no padrão da casa: reexecutar a migration inteira não duplica
-- nem falha. `do nothing` aqui NÃO é permissão para reclassificar — o
-- append-only recusa qualquer UPDATE, e mudar um papel exige VERSÃO NOVA.
on conflict (rule_id, rule_version, subcriterion_code, option_value) do nothing;
