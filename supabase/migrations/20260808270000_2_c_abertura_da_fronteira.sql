-- ============================================================================
-- ITEM 2.C — ABERTURA CONTROLADA DA FRONTEIRA DO MAPA DO PROFISSIONAL
-- ============================================================================
--
-- CONTRATO_2_C (APROVADO — PA-17), com a decisão normativa explícita do
-- Guardião: ABERTURA AUTORIZADA SOMENTE APÓS LAVRATURA E EM MISSÃO PRÓPRIA,
-- EXCLUSIVAMENTE NO RECORTE DO CONTRATO. Esta migration é o pacote material
-- do §8 — objeto por objeto, nada além:
--
--   1. o EMISSOR PROFISSIONAL `emitir_proposta_de_estado` — quinta função
--      nominal da C-01d (RS-2.C-1), espelho do emissor Case sob as mesmas
--      condições da ponte; VAZIO-HONESTO: a forma da correspondência
--      evidência→estado NÃO TEM LAVRATURA (PA-13 §10.2) e portanto NENHUMA
--      regra vigente cobre o lado profissional — zero propostas até a
--      primeira lavratura da Autoridade de Método (CD-1); zero grants;
--   2. a DECISORA `decidir_proposta` ESTENDIDA ao alvo profissional, como o
--      1.12 §7 previu: mesmo mecanismo, mesmo registro, mesmos desfechos
--      (PA-12); gate por alvo (Case ⇒ Curador do Case; profissional ⇒
--      has_role('administrador') — ADR-068 §14.2); condição 6 por alvo;
--      efeito da confirmação profissional = declaração ATÔMICA de
--      `status` + `evidence_id` no Mapa (1.8-R1 §7.2), pelo INSERT comum,
--      sob os MESMOS triggers do caminho manual (D-01: validações idênticas);
--   3. o ATO DE ABERTURA: um único GRANT EXECUTE na decisora para
--      `authenticated`. PUBLIC e anon permanecem revogados; TODAS as tabelas
--      permanecem sem grant e sem policy; nenhuma outra função ganha acesso.
--
-- O LADO CASE PERMANECE VAZIO POR CONSTRUÇÃO (registro de transparência do
-- Guardião): o grant habilita o mecanismo para os dois alvos contratados, mas
-- nenhuma regra da ponte existe nem nasce aqui (R-1/CD-1) — o emissor Case
-- segue devolvendo SEM_REGRA_VIGENTE, e o lado profissional idem.
--
-- ROLLBACK (§13 — fechar sem apagar, objeto a objeto):
--   revoke execute on function curadoria.decidir_proposta(uuid, text, text)
--     from authenticated;                       -- fecha a porta, um comando
--   drop function curadoria.emitir_proposta_de_estado(uuid, text, uuid);
--   drop index curadoria.derivation_proposals_uma_por_alvo_profissional;
--   (o corpo estendido da decisora pode ser recolado do arquivo do 1.12)
-- JAMAIS apaga: atos, confirmações, recusas, propostas, evidências,
-- julgamentos, declarações — fatos humanos são história (I-7).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Unicidade do alvo profissional — espelho estrutural do lado Case
-- ----------------------------------------------------------------------------
create unique index if not exists derivation_proposals_uma_por_alvo_profissional
  on curadoria.derivation_proposals (professional_profile_id, subcriterion_code, rule_id, rule_version)
  where (professional_profile_id is not null);

-- ----------------------------------------------------------------------------
-- O emissor profissional (§7) — quinta função nominal (RS-2.C-1)
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
  candidatas integer;
begin
  if _professional_profile_id is null or _subcriterion_code is null or _actor_id is null then
    return 'ENTRADA_INVALIDA';
  end if;

  -- DR1 · conceito existe, ativo — e pertence ao mecanismo: o 1.A lavrou que
  -- só o cruzamento automático deriva estado (humano/misto = FORA_DA_DERIVACAO;
  -- ADR-067), e conceito `NUNCA` não entra no Motor (validador do Catálogo).
  select s.code, s.active, s.catalog_version, s.motor_participation, s.cruzamento
    into conceito
  from curadoria.method_subcriteria s where s.code = _subcriterion_code;
  if not found or not conceito.active then return 'CONCEITO_INEXISTENTE'; end if;

  if conceito.cruzamento is distinct from 'automatico'
     or conceito.motor_participation = 'NUNCA' then
    return 'CONCEITO_SEM_PONTE';
  end if;

  -- DR2 · a declaração de origem: a evidência de prática CORRENTE do par
  -- (profissional, conceito) — "leitura corrente = max(version)", a única
  -- regra de composição lavrada (PA-13 §8). É ela que a proposta vinculará
  -- por id exato quando a emissão for possível.
  select e.id, e.version, e.collected_at, e.collected_by, e.catalog_version
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

  -- DR3 · a regra vigente que cobre o conceito NO LADO PROFISSIONAL.
  --
  -- A FORMA da correspondência evidência→estado NÃO TEM LAVRATURA (PA-13
  -- §10.2: "a forma da regra e sua primeira instância exigem lavratura
  -- própria") — não existe sequer a tabela onde uma cobertura profissional
  -- poderia ser declarada. O conjunto de candidatas é VAZIO POR CONSTRUÇÃO,
  -- e é exatamente isso que faz o 2.C nascer vazio-honesto (CD-1): emissor
  -- completo, ZERO propostas até a Autoridade de Método lavrar a primeira
  -- regra — quando a lavratura da forma acontecer, é ELA que pluga a
  -- consulta aqui (emenda própria, nunca edição silenciosa).
  candidatas := 0;

  if candidatas = 0 then return 'SEM_REGRA_VIGENTE'; end if;

  -- Braço de emissão: INALCANÇÁVEL até a lavratura da forma (mesmo padrão do
  -- braço PROPOSTO do 1.A). Quando existir, a proposta persistirá os doze
  -- itens com origem `practice_evidence:<id>` exata + versão + data + autor
  -- da coleta, `target_field = 'status'`, e o índice único do alvo
  -- profissional arbitrará a duplicidade. NENHUM insert existe hoje — o
  -- emissor não escreve no Mapa, não julga, não confirma (A2b, G-2.C-8).
  raise exception
    'INVARIANTE VIOLADO: cobertura profissional sem forma lavrada produziu candidata. A emissao real exige a lavratura da forma da correspondencia (PA-13 §10.2).'
    using errcode = 'internal_error';
end;
$$;

comment on function curadoria.emitir_proposta_de_estado(uuid, text, uuid) is
  'CONTRATO_2_C §7 (PA-17, RS-2.C-1) — o emissor do lado profissional, QUINTA funcao nominal do regime de derivation_proposals (C-01d fechada em cinco). Espelho do emissor Case sob as mesmas condicoes da ponte: conceito automatico e participante, evidencia de pratica CORRENTE como origem exata, declaracao manual prevalece, e regra VIGENTE obrigatoria — cuja forma NAO tem lavratura (PA-13 §10.2): zero candidatas POR CONSTRUCAO, zero propostas ate a primeira regra da Autoridade de Metodo (CD-1). Nao escreve no Mapa, nao julga, nao confirma (A2b/G-2.C-8). SECURITY INVOKER, search_path fixo, ZERO grants.';

-- Inércia EXPLÍCITA e auto-restaurável: revogar só de PUBLIC bastaria no
-- nascimento (é o default do Postgres), mas nomear os três papéis faz a
-- reaplicação DESFAZER qualquer grant que tenha aparecido no meio do caminho
-- — a migration passa a ser idempotente no EFEITO, não só na sintaxe.
revoke execute on function curadoria.emitir_proposta_de_estado(uuid, text, uuid)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- A decisora — estendida ao alvo profissional (1.12 §7; PA-12 integral)
-- ----------------------------------------------------------------------------
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
  evidencia record;
  evidencia_id uuid;
  alvo_subcriterion_id uuid;
begin
  -- Lista fechada ANTES de tudo: fora dela não há ato a considerar.
  if p_natureza is null or p_natureza not in ('CONFIRMACAO', 'RECUSA') then
    return 'NATUREZA_INVALIDA';
  end if;

  -- §18 — ausência é válida; vazio normaliza para ausência; o que excede o
  -- formato é recusado. NUNCA existe "motivo ausente" como erro (P-10,
  -- simétrico para os dois atos — O2 de custo).
  motivo_normalizado := nullif(btrim(coalesce(p_motivo, '')), '');
  if motivo_normalizado is not null and length(motivo_normalizado) > 280 then
    return 'MOTIVO_INVALIDO';
  end if;

  -- §14 — a autoria é a identidade AUTENTICADA. Nunca parâmetro, nunca
  -- impersonação: sem `auth.uid()` não há decisor.
  ator := auth.uid();
  if ator is null then
    return 'SEM_AUTORIDADE';
  end if;

  if p_proposal_id is null then
    return 'PROPOSTA_INEXISTENTE';
  end if;

  -- §13 — a verificação transacional da precondição trava a LINHA da
  -- proposta: corridas serializam aqui.
  select id, case_id, professional_profile_id, subcriterion_code,
         suggested_value, origin_record, origin_version, state
    into proposta
  from curadoria.derivation_proposals
  where id = p_proposal_id
  for update;

  if not found then
    return 'PROPOSTA_INEXISTENTE';
  end if;

  -- O GATE, UM SÓ, PARA OS DOIS ATOS — POR ALVO (2.C §8; O2-C preservado:
  -- roda antes de qualquer ramo por natureza).
  --   Alvo Case: o decisor é o Curador responsável (1.12 §7 — administrador
  --     NÃO decide por atalho).
  --   Alvo profissional: autoridade sobre o campo = `administrador`
  --     (ADR-068 §14.2); paciente e Curador NÃO confirmam o Mapa do
  --     Profissional (G-2.C-11).
  if proposta.case_id is not null then
    if not curadoria.is_curator_for_case(proposta.case_id) then
      return 'SEM_AUTORIDADE';
    end if;
  else
    if not curadoria.has_role('administrador') then
      return 'SEM_AUTORIDADE';
    end if;

    -- ADR-068 §13.2, herdada pelo 2.6 §13 item 6 e EXECUTÁVEL com a abertura:
    -- "quem confirma o estado não pode ser quem julga e seleciona nesse mesmo
    -- Case". No alvo profissional a colisão mensurável é o ator com juízo
    -- VIGENTE sobre ESTE profissional: confirmaria o estado que a própria
    -- avaliação dele consome — atestaria a própria leitura. Recusado como
    -- falta de autoridade sobre o campo.
    if exists (
      select 1 from curadoria.curator_judgments j
      where j.professional_profile_id = proposta.professional_profile_id
        and j.actor_id = ator
        and j.state = 'VIGENTE'
    ) then
      return 'SEM_AUTORIDADE';
    end if;
  end if;

  -- §12 — idempotência sobre proposta já decidida (PA-12: ATO_JA_REGISTRADO
  -- é EXCLUSIVO de mesmo ator + mesma intenção).
  if proposta.state in ('CONFIRMADA', 'RECUSADA') then
    select natureza, actor_id into ato_existente
    from curadoria.derivation_proposal_acts
    where proposal_id = p_proposal_id;

    if found and ato_existente.actor_id = ator and ato_existente.natureza = p_natureza then
      return 'ATO_JA_REGISTRADO';
    end if;
    return 'ATO_JA_CONSUMADO';
  end if;

  -- §11 — terminais sistêmicos: nenhum ato humano sobre elas.
  if proposta.state <> 'PROPOSTA' then
    return 'PROPOSTA_NAO_DECIDIVEL';
  end if;

  -- CONDIÇÃO 6, reavaliada NA TRANSAÇÃO do ato — POR ALVO: a declaração de
  -- origem ainda existe e ainda diz o que dizia na emissão. S1 pendente ⇒
  -- não-decidível: decidir sobre fala que mudou seria decidir sobre nada.
  if proposta.case_id is not null then
    select n.degree into necessidade
    from curadoria.case_needs n
    where 'case_needs:' || n.id::text = proposta.origin_record;

    if not found or necessidade.degree is distinct from proposta.origin_version then
      return 'PROPOSTA_NAO_DECIDIVEL';
    end if;
  else
    -- Alvo profissional: a origem é `practice_evidence:<id>` exata. Ela deve
    -- existir, declarar a versão da emissão E AINDA SER A CORRENTE do par —
    -- evidência nova (S1) desatualiza a proposta.
    evidencia_id := nullif(replace(proposta.origin_record, 'practice_evidence:', ''), '')::uuid;

    select e.id, e.version, e.professional_profile_id into evidencia
    from curadoria.practice_evidence e
    where e.id = evidencia_id;

    if not found
       or evidencia.version::text is distinct from proposta.origin_version
       or exists (
         select 1 from curadoria.practice_evidence mais_nova
         where mais_nova.professional_profile_id = proposta.professional_profile_id
           and mais_nova.subcriterion_code = proposta.subcriterion_code
           and mais_nova.version > evidencia.version
       ) then
      return 'PROPOSTA_NAO_DECIDIVEL';
    end if;
  end if;

  -- Decidibilidade do ALVO: declaração manual nascida depois da emissão
  -- PREVALECE (mesma regra do emissor) — para os DOIS atos, deixou de haver
  -- o que decidir.
  select s.id into alvo_subcriterion_id
  from curadoria.method_subcriteria s
  where s.code = proposta.subcriterion_code;

  if proposta.case_id is not null then
    if exists (
      select 1 from curadoria.case_priority_map m
      where m.case_id = proposta.case_id and m.subcriterion_id = alvo_subcriterion_id
    ) then
      return 'PROPOSTA_NAO_DECIDIVEL';
    end if;
  else
    if exists (
      select 1 from curadoria.professional_subcriterion_map m
      where m.professional_profile_id = proposta.professional_profile_id
        and m.subcriterion_id = alvo_subcriterion_id
    ) then
      return 'PROPOSTA_NAO_DECIDIVEL';
    end if;
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

  -- SÓ NA CONFIRMAÇÃO: a declaração no alvo. "A confirmação não move a
  -- proposta para dentro do Mapa. Ela cria uma declaração nova, que por acaso
  -- coincide com o que foi proposto" (ADR-066 §6). Pelos MESMOS caminhos e
  -- triggers do manual (D-01) — qualquer recusa desfaz a transação INTEIRA:
  -- ato, projeção e declaração nascem juntos ou não nascem (§15).
  if p_natureza = 'CONFIRMACAO' then
    if proposta.case_id is not null then
      insert into curadoria.case_priority_map (case_id, subcriterion_id, importance, declared_by)
      values (proposta.case_id, alvo_subcriterion_id,
              proposta.suggested_value::curadoria.importance_level, ator);
    else
      -- 2.C §8/1.8-R1 §7.2: a confirmação profissional declara `status` E
      -- `evidence_id` — a evidência EXATA da proposta — no MESMO insert:
      -- atômico por construção, sem estado intermediário possível. O cast é
      -- a fronteira de tipo; a FK composta (evidence_id, professional) e os
      -- triggers do Mapa arbitram o resto.
      insert into curadoria.professional_subcriterion_map
        (professional_profile_id, subcriterion_id, status, declared_by, evidence_id)
      values (proposta.professional_profile_id, alvo_subcriterion_id,
              proposta.suggested_value::curadoria.subcriterion_status, ator, evidencia_id);
    end if;
  end if;
  -- Na RECUSA, NADA no alvo: o campo volta a lacuna, nunca ao valor proposto
  -- (ADR-066 §7.3). O painel 1.11 conta o desfecho automaticamente.

  return 'ATO_REGISTRADO';
end;
$$;

comment on function curadoria.decidir_proposta(uuid, text, text) is
  'CONTRATO_1_12 §14 + CONTRATO_2_C §8 (PA-17) — a capability UNICA do ato decisorio, agora nos DOIS alvos contratados: CONFIRMACAO ou RECUSA, gate por alvo (Case = Curador responsavel; profissional = administrador, ADR-068 §14.2, com a incompatibilidade §13.2 executavel), autoria por auth.uid (nunca payload), desfechos PA-12 integrais. Confirmar grava ato + projecao + declaracao ATOMICAMENTE — no alvo profissional, status + evidence_id no MESMO insert (1.8-R1 §7.2). Recusar grava lacuna. ABERTURA DA FRONTEIRA (PA-17): EXECUTE a authenticated — o gate real e interno; PUBLIC e anon permanecem revogados; o lado Case permanece vazio por construcao (R-1/CD-1).';

-- ----------------------------------------------------------------------------
-- O ATO DE ABERTURA — o único grant novo do pacote (§8)
-- ----------------------------------------------------------------------------
revoke execute on function curadoria.decidir_proposta(uuid, text, text) from public, anon;
grant execute on function curadoria.decidir_proposta(uuid, text, text) to authenticated;
