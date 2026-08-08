-- ============================================================================
-- ITEM 1.12 — MECANISMO INERTE DE DISCORDÂNCIA NA FRONTEIRA HUMANA
-- ============================================================================
--
-- CONTRATO: CONTRATO_1_12_MECANISMO_DE_DISCORDANCIA.md (APROVADO — PA-12).
-- PRINCÍPIO: P-10 — "confirmar não pode ser mais barato que discordar".
--
-- O QUE NASCE AQUI (§20, coluna "nasce agora")
--   1. `derivation_proposal_acts` — o ato humano como entidade própria,
--      append-only, inerte (RLS sem policy, zero grant);
--   2. o trigger de projeção: `state` da proposta vira LEITURA MATERIALIZADA
--      do ato, na mesma transação (§10);
--   3. a cerca da projeção: estado decisório NÃO muda por nenhum outro caminho;
--   4. a capability única `decidir_proposta` — gate interno, desfechos
--      nomeados, saída mínima, SEM NENHUM GRANT (§20: conceder EXECUTE é ato
--      da abertura da Fronteira, pacote futuro com lavratura própria).
--
-- O QUE NÃO NASCE (§3, §20 coluna "permanece desligado")
--   Nenhuma superfície. Nenhum grant a `authenticated`. Nenhuma proposta real.
--   Nenhuma apresentação a humano. O alvo profissional fica fora (§7).
--
-- A DECISÃO CENTRAL (§10 — Opção B, cláusula normativa)
--   O ato NÃO vira colunas na proposta: a proposta é "imutável na emissão"
--   (ADR-066 §14) e o ato é de OUTRO autor — "a autoria é inteiramente de quem
--   decidiu" (ADR-068 §33). Fato humano em tabela própria; `state` é projeção.
--   Uma origem por fato (P-07): o ato é a origem.
--
-- "O QUE ESTAVA VISÍVEL" (§19 — atestado, não fotografia)
--   O par: (a) `proposal_id` imutável — a proposta contém, por construção,
--   tudo o que os elementos 1–4 da Fronteira exibem; (b) o atestado
--   transacional da condição 6 — a origem estava vigente no instante do ato.
--   NENHUM snapshot duplicado: duplicar o que a proposta garante seria segunda
--   origem para o mesmo fato.
--
-- CONCORRÊNCIA (§13 — árbitro declarativo)
--   Índice único: no máximo UM ato decisório por proposta. O `select ... for
--   update` na linha da proposta serializa corridas; o índice é a rede para o
--   que escapar. `ATO_JA_REGISTRADO` é EXCLUSIVO de mesmo ator + mesma
--   intenção (ressalva do Guardião, §13) — qualquer outro ator recebe
--   `ATO_JA_CONSUMADO`, inclusive no mesmo sentido: ninguém recebe resposta
--   que o faça acreditar que registrou pessoalmente um ato cujo autor é outro.
--
-- C-01d(4) e D-01(2) — evoluções POR LAVRATURA (§14)
--   Funções que alcançam `derivation_proposals`: {emissor · leitora individual
--   · leitora agregada · decisora} + o trigger de projeção que ela dispara.
--   Escritores de `case_priority_map`: {mapa-prioridades-repository (manual) ·
--   decidir_proposta (confirmação)}. As guardas foram atualizadas junto.
--
-- ROLLBACK (§24 — tudo aditivo; executável, nesta ordem, sem reset)
--   drop function curadoria.decidir_proposta(uuid, text, text);
--   drop trigger derivation_proposals_projecao_do_ato on curadoria.derivation_proposal_acts;
--   drop trigger derivation_proposals_estado_decisorio_so_pelo_ato on curadoria.derivation_proposals;
--   drop function curadoria.projetar_estado_da_proposta();
--   drop function curadoria.protege_estado_decisorio();
--   drop trigger derivation_proposal_acts_append_only on curadoria.derivation_proposal_acts;
--   drop function curadoria.recusa_alteracao_de_ato_decisorio();
--   drop table curadoria.derivation_proposal_acts;
--   Nesta onda nenhum ato humano real existe (zero grants, zero propostas
--   reais): o rollback não apaga fato humano. A partir da abertura da
--   Fronteira, rollback NUNCA apaga atos reais (I-7).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 · A ENTIDADE DO ATO — append-only, um por proposta
-- ---------------------------------------------------------------------------

create table curadoria.derivation_proposal_acts (
  id uuid primary key default gen_random_uuid(),

  -- A referência imutável que fixa integralmente o que foi exibido (§19a).
  -- RESTRICT dos dois lados: apagar ou mudar a proposta referenciada é
  -- reescrever a proveniência de um ato humano.
  proposal_id uuid not null references curadoria.derivation_proposals (id)
    on update restrict on delete restrict,

  -- A natureza — lista fechada de DOIS. `SUPERADA`/`RETIRADA` são transições
  -- SISTÊMICAS (S1/S2/S5) e NÃO passam por esta tabela (§11): misturá-las
  -- apagaria a diferença entre "um humano decidiu" e "o mundo mudou".
  natureza text not null check (natureza in ('CONFIRMACAO', 'RECUSA')),

  -- A autoria REAL — sempre `auth.uid()` do decisor, nunca payload do cliente,
  -- nunca o cliente administrativo (§14). Preenchida pela capability.
  actor_id uuid not null,

  acted_at timestamptz not null default now(),

  -- O motivo: OFERECIDO, NUNCA EXIGIDO — nos dois atos (§18). `null` é dado
  -- válido e observável. Vazio não vira string: a capability normaliza.
  -- Mesma família dos campos de 280 do domínio.
  motivo text check (motivo is null or length(btrim(motivo)) between 1 and 280),

  -- §19b — o atestado transacional da condição 6: a origem estava vigente no
  -- instante do ato, verificada NA MESMA transação. O CHECK torna impossível
  -- registrar ato sem o atestado — é atestado, não flag.
  atestado_origem_vigente boolean not null check (atestado_origem_vigente)
);

comment on table curadoria.derivation_proposal_acts is
  'CONTRATO_1_12 §10 (Opcao B) — o ATO HUMANO que decide uma proposta: CONFIRMACAO ou RECUSA. Entidade propria, append-only, um ato decisorio por proposta (indice unico). A autoria e inteiramente de quem decidiu (ADR-068 §33); state da proposta e projecao deste fato. Onda 1B: inerte — RLS sem policy, zero grant; a unica porta e a capability decidir_proposta, que nasce sem EXECUTE.';

comment on column curadoria.derivation_proposal_acts.motivo is
  'CONTRATO_1_12 §18 — opcional nos DOIS atos; exigi-lo violaria P-10 pela porta dos fundos. Visibilidade: SOMENTE a projecao de Auditoria (decisao do Guardiao, Opcao 1); qualquer exposicao adicional exige lavratura especifica. Nunca vira score, merito ou ranking.';

comment on column curadoria.derivation_proposal_acts.atestado_origem_vigente is
  'CONTRATO_1_12 §19 — atestado transacional da condicao 6. O par (proposal_id imutavel + este atestado) e o registro de "o que estava visivel": nenhum snapshot duplicado (P-07).';

-- §13 — O ÁRBITRO DECLARATIVO: no máximo UM ato decisório por proposta.
create unique index derivation_proposal_acts_um_por_proposta
  on curadoria.derivation_proposal_acts (proposal_id);

comment on index curadoria.derivation_proposal_acts_um_por_proposta is
  'CONTRATO_1_12 §13 — o arbitro da concorrencia e declarativo: um ato decisorio por proposta. O segundo INSERT de uma corrida cai aqui e e traduzido para ATO_JA_CONSUMADO.';

-- G-8 — append-only. Trigger, não policy: vale para todo papel, inclusive o
-- dono. Mensagem própria — o ato humano não é a Regra.
create or replace function curadoria.recusa_alteracao_de_ato_decisorio()
returns trigger language plpgsql as $$
begin
  raise exception
    'Ato decisorio e append-only (CONTRATO_1_12 §10, I-7): % recusado. O ato humano nao se edita nem se apaga — o que foi decidido fica registrado como foi decidido.',
    tg_op
    using errcode = 'restrict_violation';
end;
$$;

create trigger derivation_proposal_acts_append_only
  before update or delete on curadoria.derivation_proposal_acts
  for each row execute function curadoria.recusa_alteracao_de_ato_decisorio();

-- Inércia: RLS ligada, ZERO policy, nenhum grant — nem para ler.
alter table curadoria.derivation_proposal_acts enable row level security;
revoke all on curadoria.derivation_proposal_acts from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2 · A PROJEÇÃO — `state` é leitura materializada do ato (§10)
-- ---------------------------------------------------------------------------
--
-- O trigger do INSERT do ato atualiza a proposta NA MESMA transação. O token
-- transacional (`set_config(..., true)`) é o que autoriza a cerca abaixo a
-- deixar passar exatamente esta escrita — e nenhuma outra.

create or replace function curadoria.projetar_estado_da_proposta()
returns trigger language plpgsql as $$
begin
  perform set_config('curadoria.projecao_do_ato', new.proposal_id::text, true);

  update curadoria.derivation_proposals
  set state = case new.natureza when 'CONFIRMACAO' then 'CONFIRMADA' else 'RECUSADA' end
  where id = new.proposal_id;

  perform set_config('curadoria.projecao_do_ato', '', true);
  return new;
end;
$$;

comment on function curadoria.projetar_estado_da_proposta() is
  'CONTRATO_1_12 §10 — a projecao: o ato e a origem do fato; state e leitura materializada dele, atualizada na mesma transacao pelo INSERT do ato. O token transacional autoriza a unica escrita legitima do estado decisorio.';

create trigger derivation_proposals_projecao_do_ato
  after insert on curadoria.derivation_proposal_acts
  for each row execute function curadoria.projetar_estado_da_proposta();

-- A CERCA (G-1 / criterio 4): estado decisório NÃO surge nem muda por UPDATE
-- direto. Decidida é decidida: CONFIRMADA/RECUSADA não transiciona para nada.
-- PROPOSTA → SUPERADA/RETIRADA permanece livre — são as transições sistêmicas
-- do §11, que não são atos deste contrato.
create or replace function curadoria.protege_estado_decisorio()
returns trigger language plpgsql as $$
begin
  if old.state in ('CONFIRMADA', 'RECUSADA') and new.state is distinct from old.state then
    raise exception
      'Proposta decidida nao muda de estado (CONTRATO_1_12 §11): % -> % recusado. A proposta decidida permanece para sempre (ADR-066 §8).',
      old.state, new.state
      using errcode = 'restrict_violation';
  end if;

  if new.state in ('CONFIRMADA', 'RECUSADA') and old.state = 'PROPOSTA' then
    if coalesce(current_setting('curadoria.projecao_do_ato', true), '') <> new.id::text then
      raise exception
        'Estado decisorio so nasce do ato (CONTRATO_1_12 §10): a projecao e disparada pelo INSERT em derivation_proposal_acts, nunca por UPDATE direto.'
        using errcode = 'restrict_violation';
    end if;
  end if;

  return new;
end;
$$;

comment on function curadoria.protege_estado_decisorio() is
  'CONTRATO_1_12 §10/§11 (G-1) — CONFIRMADA/RECUSADA so nascem pelo trigger de projecao do ato (token transacional) e, uma vez decidida, a proposta nao muda de estado. PROPOSTA -> SUPERADA/RETIRADA segue livre: transicoes sistemicas (S1/S2/S5) nao sao atos deste contrato.';

create trigger derivation_proposals_estado_decisorio_so_pelo_ato
  before update of state on curadoria.derivation_proposals
  for each row execute function curadoria.protege_estado_decisorio();

-- ---------------------------------------------------------------------------
-- 3 · A CAPABILITY ÚNICA — `decidir_proposta` (§14)
-- ---------------------------------------------------------------------------
--
-- UMA para os dois atos: capabilities separadas poderiam divergir em gate,
-- validação ou registro — a assimetria nasceria no banco. A natureza é
-- parâmetro de lista fechada, e o caminho de código é o MESMO até o efeito.

create or replace function curadoria.decidir_proposta(
  p_proposal_id uuid,
  p_natureza text,
  p_motivo text default null
)
returns text language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare
  ator uuid;
  proposta record;
  ato_existente record;
  motivo_normalizado text;
  necessidade record;
  alvo_subcriterion_id uuid;
begin
  -- Lista fechada ANTES de tudo: fora dela não há ato a considerar.
  if p_natureza is null or p_natureza not in ('CONFIRMACAO', 'RECUSA') then
    return 'NATUREZA_INVALIDA';
  end if;

  -- §18 — ausência é válida; vazio normaliza para ausência; o que excede o
  -- formato é recusado. NUNCA existe "motivo ausente" como erro.
  motivo_normalizado := nullif(btrim(coalesce(p_motivo, '')), '');
  if motivo_normalizado is not null and length(motivo_normalizado) > 280 then
    return 'MOTIVO_INVALIDO';
  end if;

  -- §14 — a autoria é a identidade AUTENTICADA. Nunca parâmetro, nunca
  -- impersonação: sem `auth.uid()` não há decisor, e sem decisor não há gate
  -- a passar.
  ator := auth.uid();
  if ator is null then
    return 'SEM_AUTORIDADE';
  end if;

  if p_proposal_id is null then
    return 'PROPOSTA_INEXISTENTE';
  end if;

  -- §13 — a verificação transacional da precondição trava a LINHA da
  -- proposta: corridas serializam aqui, e quem chega depois já vê o estado
  -- projetado pelo vencedor.
  select id, case_id, professional_profile_id, subcriterion_code,
         suggested_value, origin_record, origin_version, state
    into proposta
  from curadoria.derivation_proposals
  where id = p_proposal_id
  for update;

  if not found then
    return 'PROPOSTA_INEXISTENTE';
  end if;

  -- §7 — O GATE, UM SÓ, PARA OS DOIS ATOS (O2-C por construção: este bloco
  -- roda antes de qualquer ramo por natureza). Alvo Case: o decisor é o
  -- Curador responsável. `administrador` NÃO decide por atalho — autoridade
  -- sobre o campo é a do §6 da ADR-066, não a do papel técnico. Alvo
  -- profissional: sem emissor e fora de escopo — sem decisor definido, não
  -- há autoridade a reconhecer.
  if proposta.case_id is null
     or not curadoria.is_curator_for_case(proposta.case_id) then
    return 'SEM_AUTORIDADE';
  end if;

  -- §12 — idempotência sobre proposta já decidida. O ato é a origem do fato:
  -- é NELE que se distingue "você já registrou isto" de "outro decidiu".
  if proposta.state in ('CONFIRMADA', 'RECUSADA') then
    select natureza, actor_id into ato_existente
    from curadoria.derivation_proposal_acts
    where proposal_id = p_proposal_id;

    -- Ressalva do Guardião (§13): `ATO_JA_REGISTRADO` é EXCLUSIVO de mesmo
    -- ator + mesma intenção. Qualquer outra combinação é ATO_JA_CONSUMADO.
    if found and ato_existente.actor_id = ator and ato_existente.natureza = p_natureza then
      return 'ATO_JA_REGISTRADO';
    end if;
    return 'ATO_JA_CONSUMADO';
  end if;

  -- §11 — terminais sistêmicos: nenhum ato humano sobre elas.
  if proposta.state <> 'PROPOSTA' then
    return 'PROPOSTA_NAO_DECIDIVEL';
  end if;

  -- §19b/§13 — CONDIÇÃO 6, reavaliada NA TRANSAÇÃO do ato: a declaração de
  -- origem ainda existe e ainda diz o que dizia quando a proposta foi emitida
  -- (o emissor grava `origin_version` = o grau declarado). Se a pessoa
  -- re-declarou, a origem deixou de estar vigente (S1 pendente) e a proposta
  -- não é decidível — decidir sobre fala que mudou seria decidir sobre nada.
  select n.degree into necessidade
  from curadoria.case_needs n
  where 'case_needs:' || n.id::text = proposta.origin_record;

  if not found or necessidade.degree is distinct from proposta.origin_version then
    return 'PROPOSTA_NAO_DECIDIVEL';
  end if;

  -- Decidibilidade do ALVO: se uma declaração manual nasceu no Mapa depois da
  -- emissão, ela PREVALECE (mesma regra do emissor) — e a confirmação
  -- colidiria com a unicidade do Mapa. Para os DOIS atos, deixou de haver o
  -- que decidir.
  select s.id into alvo_subcriterion_id
  from curadoria.method_subcriteria s
  where s.code = proposta.subcriterion_code;

  if exists (
    select 1 from curadoria.case_priority_map m
    where m.case_id = proposta.case_id and m.subcriterion_id = alvo_subcriterion_id
  ) then
    return 'PROPOSTA_NAO_DECIDIVEL';
  end if;

  -- O ATO — a única escrita da tabela de atos. O índice único é a rede da
  -- corrida que escapar do lock (§13).
  begin
    insert into curadoria.derivation_proposal_acts
      (proposal_id, natureza, actor_id, motivo, atestado_origem_vigente)
    values
      (p_proposal_id, p_natureza, ator, motivo_normalizado, true);
  exception when unique_violation then
    select natureza, actor_id into ato_existente
    from curadoria.derivation_proposal_acts
    where proposal_id = p_proposal_id;
    if found and ato_existente.actor_id = ator and ato_existente.natureza = p_natureza then
      return 'ATO_JA_REGISTRADO';
    end if;
    return 'ATO_JA_CONSUMADO';
  end;

  -- A projeção do `state` já aconteceu: trigger do INSERT, mesma transação.

  -- §8 — SÓ NA CONFIRMAÇÃO: a declaração no Mapa. "A confirmação não move a
  -- proposta para dentro do Mapa. Ela cria uma declaração nova, que por acaso
  -- coincide com o que foi proposto" (ADR-066 §6). `declared_by` = o
  -- confirmador; passa pelos MESMOS triggers de validação do caminho manual
  -- (G-7) — se qualquer um recusar, a transação inteira desfaz: ato, projeção
  -- e declaração nascem juntos ou não nascem (§15).
  if p_natureza = 'CONFIRMACAO' then
    -- O cast é a fronteira de tipo do Mapa: `suggested_value` viaja como texto
    -- na proposta (ADR-066 §14.3, escala fechada do campo) e vira o enum do
    -- Mapa aqui. Valor fora da escala não converte — e derruba a transação
    -- inteira, como o §15 exige.
    insert into curadoria.case_priority_map (case_id, subcriterion_id, importance, declared_by)
    values (proposta.case_id, alvo_subcriterion_id,
            proposta.suggested_value::curadoria.importance_level, ator);
  end if;
  -- §9 — na RECUSA, NADA no Mapa: o campo volta a lacuna, nunca ao valor
  -- proposto, nunca a valor anterior. Recusar não obriga declaração
  -- subsequente.

  return 'ATO_REGISTRADO';
end;
$$;

comment on function curadoria.decidir_proposta(uuid, text, text) is
  'CONTRATO_1_12 §14 — a capability UNICA do ato decisorio: CONFIRMACAO ou RECUSA, mesmo gate (Curador responsavel pelo Case, via auth.uid — nunca ator de payload, nunca cliente administrativo), mesmo registro, mesmo custo. Confirmar grava ato + projecao + declaracao no Mapa ATOMICAMENTE; recusar grava ato + RECUSADA + NADA no Mapa (lacuna). Desfechos nomeados do §12/§21. Onda 1B: NASCE SEM NENHUM GRANT — conceder EXECUTE e ato da abertura da Fronteira, com lavratura propria.';

-- §20 — INERTE: nenhum grant. Nem PUBLIC (default do Postgres), nem anon, nem
-- authenticated. A capability existe, está testada, e ninguém a alcança.
revoke execute on function curadoria.decidir_proposta(uuid, text, text)
  from public, anon, authenticated;

