-- ============================================================================
-- ITEM 2.3 — DIVISÃO DA ETAPA AVALIAÇÃO: O CAMINHO OPERACIONAL DO JUÍZO
-- ============================================================================
--
-- CONTRATO_2_3 (APROVADO — PA-16) · ADR-067 §5/§12 · sobre a infraestrutura
-- do 2.4 (FORMALMENTE ENCERRADO — nada dela é alterado aqui).
--
-- A divisão: o Motor lê e sinaliza; o CURADOR conclui; o BANCO arbitra; a
-- etapa deriva. Este arquivo entrega exatamente o caminho operacional:
--
--   · `registrar_julgamento` — nascimento e revisão, gate-first, autoria por
--     sessão, desfechos fechados do §7 (JUIZO_REGISTRADO · VERSAO_JA_GRAVADA ·
--     CONFLITO_DE_VERSAO · SEM_AUTORIDADE);
--   · `retirar_julgamento` — RS-2.3-1: retirar exige CUMULATIVAMENTE ser
--     Curador do Case E autor da versão VIGENTE; não-autor recebe
--     SEM_AUTORIDADE mesmo sendo Curador; sucessor que discorda SUPERSEDE
--     por versão própria, nunca retira ato alheio;
--   · `ler_julgamentos_para_avaliacao` — a leitura da Mesa, gate-first; a
--     tabela permanece SEM policy e SEM grant (o cliente jamais a toca);
--   · trigger JS3 — evidência nova supersede o juízo VIGENTE compatível na
--     MESMA transação (RELACIONAL: mesmo código; TECNICO: mesma família),
--     mesmo que a conclusão provavelmente não mudasse. NUNCA cria juízo,
--     NUNCA copia conclusão — o motivo JUIZO_SUPERADO_POR_EVIDENCIA é
--     DERIVAÇÃO DE LEITURA (SUPERADO sem sucessora), não coluna nova.
--
-- CONCORRÊNCIA (§7): o árbitro é o conjunto estrutural do 2.4 — os índices
-- `um_vigente_por_alvo` · `uma_sucessora_por_base` · `versao_unica_por_alvo`
-- e o trigger de transição. O writer TRADUZ violações em desfechos nomeados;
-- os SELECTs internos apenas melhoram a mensagem — quem decide a corrida é a
-- constraint (o handler de unique_violation existe exatamente para isso).
--
-- MOTIVO DA RETIRADA: o domínio do 2.4 não tem coluna para motivo de
-- transição (append-only: transição muda SÓ o estado). O motivo oferecido
-- vai à TRILHA (`audit_logs`, precedente das capabilities administrativas) —
-- auditoria, nunca segunda origem do juízo.
--
-- ROLLBACK DO 2.3 (sem tocar o 2.4 — §17): drop das três functions (com os
-- grants indo junto) + drop do trigger JS3 e sua function. `curator_judgments`,
-- refs, histórico e atos humanos JAMAIS são removidos; `criterion_declarations`
-- permanece intacta (G-2.3-7 — nenhuma linha deste arquivo a menciona).
-- ============================================================================

-- A ação da trilha — o padrão aditivo da casa (case_discarded,
-- curadoria_delivered, need_acknowledged…): o motivo da retirada é auditoria.
alter type curadoria.audit_action add value if not exists 'julgamento_retirado';

-- ----------------------------------------------------------------------------
-- registrar_julgamento — nascimento e revisão (§7/§12)
-- ----------------------------------------------------------------------------
create or replace function curadoria.registrar_julgamento(
  p_case_id uuid,
  p_professional_profile_id uuid,
  p_subcriterion_code text,
  p_natureza text,
  p_conclusao text,
  p_fatos_visiveis jsonb default '[]'::jsonb,
  p_evidencias jsonb default '[]'::jsonb,
  p_motivo text default null,
  p_versao_base_id uuid default null
)
returns table (desfecho text, versao_id uuid)
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  ator uuid;
  ultima curadoria.curator_judgments%rowtype;
  base curadoria.curator_judgments%rowtype;
  sucessora curadoria.curator_judgments%rowtype;
  novo_id uuid;
  refs_payload jsonb;
  motivo_normalizado text;
begin
  -- Autoria pela sessão — parâmetro de autor NÃO EXISTE (G-2.3-3).
  ator := auth.uid();
  if ator is null then
    return query select 'SEM_AUTORIDADE'::text, null::uuid;
    return;
  end if;

  -- GATE-FIRST (G-2.3-4): a autoridade decide antes de qualquer dado
  -- material. Quem não é o Curador do Case não descobre nem o que existe.
  if not curadoria.is_curator_for_case(p_case_id) then
    return query select 'SEM_AUTORIDADE'::text, null::uuid;
    return;
  end if;

  motivo_normalizado := nullif(btrim(coalesce(p_motivo, '')), '');

  -- Normaliza as referências do payload para comparação e gravação:
  -- [{id, version}] — malformação estoura no cast (erro técnico do chamador,
  -- nunca desfecho).
  refs_payload := coalesce(
    (
      select jsonb_agg(
               jsonb_build_object('id', (e ->> 'id')::uuid, 'version', (e ->> 'version')::integer)
               order by (e ->> 'id')::uuid
             )
      from jsonb_array_elements(coalesce(p_evidencias, '[]'::jsonb)) as e
    ),
    '[]'::jsonb
  );

  -- A ponta da cadeia do alvo, travada: serializa com retirada e com o JS3
  -- (que fazem UPDATE na vigente). O lock melhora a serialização; o árbitro
  -- continua sendo o conjunto de índices únicos do 2.4 (G-2.3-6).
  select * into ultima
    from curadoria.curator_judgments
   where case_id = p_case_id
     and professional_profile_id = p_professional_profile_id
     and subcriterion_code = p_subcriterion_code
   order by versao desc
   limit 1
   for update;

  if p_versao_base_id is null then
    -- "null = primeiro julgamento do alvo" (§12).
    if found then
      -- Já existe cadeia. Retry honesto do primeiro ato (mesmo ator, mesmo
      -- conteúdo, v1) é idempotente; qualquer outra coisa é base obsoleta.
      if ultima.versao = 1
         and ultima.actor_id = ator
         and curadoria.julgamento_tem_mesmo_conteudo(
               ultima.id, p_natureza, p_subcriterion_code, p_conclusao,
               motivo_normalizado, p_fatos_visiveis, refs_payload
             ) then
        return query select 'VERSAO_JA_GRAVADA'::text, ultima.id;
        return;
      end if;
      return query select 'CONFLITO_DE_VERSAO'::text, null::uuid;
      return;
    end if;
    base := null;
  else
    select * into base
      from curadoria.curator_judgments
     where id = p_versao_base_id;

    -- Base inexistente, de outro alvo, ou que não é a ponta da cadeia:
    -- o ator está olhando para um estado que não existe mais (§7).
    if not found
       or base.case_id is distinct from p_case_id
       or base.professional_profile_id is distinct from p_professional_profile_id
       or base.subcriterion_code is distinct from p_subcriterion_code then
      return query select 'CONFLITO_DE_VERSAO'::text, null::uuid;
      return;
    end if;

    -- A base já tem sucessora? Idempotência do PA-15: SÓ o mesmo ator, com o
    -- MESMO conteúdo, recebe VERSAO_JA_GRAVADA. Outro ator jamais recebe
    -- sucesso idempotente por ato que não autorou.
    select * into sucessora
      from curadoria.curator_judgments
     where versao_anterior_id = base.id;

    if found then
      if sucessora.actor_id = ator
         and curadoria.julgamento_tem_mesmo_conteudo(
               sucessora.id, p_natureza, p_subcriterion_code, p_conclusao,
               motivo_normalizado, p_fatos_visiveis, refs_payload
             ) then
        return query select 'VERSAO_JA_GRAVADA'::text, sucessora.id;
        return;
      end if;
      return query select 'CONFLITO_DE_VERSAO'::text, null::uuid;
      return;
    end if;

    if base.id is distinct from ultima.id then
      return query select 'CONFLITO_DE_VERSAO'::text, null::uuid;
      return;
    end if;
  end if;

  -- O ATO — uma transação (§12): supersessão da vigente + versão nova + refs.
  -- Falha parcial não existe: qualquer recusa estrutural derruba tudo.
  begin
    if base.id is not null and base.state = 'VIGENTE' then
      update curadoria.curator_judgments
         set state = 'SUPERADO'
       where id = base.id;
    end if;

    insert into curadoria.curator_judgments
      (case_id, professional_profile_id, subcriterion_code, natureza, conclusao,
       motivo, fatos_visiveis, catalog_version, versao, versao_anterior_id, actor_id)
    values
      (p_case_id, p_professional_profile_id, p_subcriterion_code, p_natureza, p_conclusao,
       motivo_normalizado, coalesce(p_fatos_visiveis, '[]'::jsonb),
       (select coalesce(max(catalog_version), '1.1.0')
          from curadoria.method_subcriteria where active),
       coalesce(base.versao, 0) + 1,
       base.id,
       ator)
    returning id into novo_id;

    -- As referências de evidência: o estado de verificação gravado é o REAL
    -- do momento (o trigger do 2.4 o confere e valida família/conceito/versão
    -- — PA-15 é estrutural; nada é re-julgado aqui).
    insert into curadoria.curator_judgment_evidence_refs
      (judgment_id, professional_profile_id, evidence_id, evidence_version, verification_status)
    select novo_id,
           p_professional_profile_id,
           (e ->> 'id')::uuid,
           (e ->> 'version')::integer,
           coalesce(
             (select pe.status from curadoria.practice_evidence pe where pe.id = (e ->> 'id')::uuid),
             'nao_verificado'::curadoria.verification_status
           )
      from jsonb_array_elements(refs_payload) as e;

    return query select 'JUIZO_REGISTRADO'::text, novo_id;
    return;
  exception
    when unique_violation then
      -- A CORRIDA REAL: outra transação chegou primeiro em um dos árbitros do
      -- 2.4 (um VIGENTE por alvo · uma sucessora por base · versão única).
      -- O SELECT lá de cima só melhora mensagens — quem decidiu foi a
      -- constraint, e aqui ela é TRADUZIDA (G-2.3-6): se a sucessora que
      -- venceu é deste ator com este conteúdo, idempotência; senão, conflito.
      if base.id is not null then
        select * into sucessora
          from curadoria.curator_judgments
         where versao_anterior_id = base.id;
        if found
           and sucessora.actor_id = ator
           and curadoria.julgamento_tem_mesmo_conteudo(
                 sucessora.id, p_natureza, p_subcriterion_code, p_conclusao,
                 motivo_normalizado, p_fatos_visiveis, refs_payload
               ) then
          return query select 'VERSAO_JA_GRAVADA'::text, sucessora.id;
          return;
        end if;
      end if;
      return query select 'CONFLITO_DE_VERSAO'::text, null::uuid;
      return;
  end;
end;
$$;

comment on function curadoria.registrar_julgamento(uuid, uuid, text, text, text, jsonb, jsonb, text, uuid) is
  'CONTRATO_2_3 §7/§12 (PA-16) — o ato humano de julgar (H8–H11): gate-first (is_curator_for_case antes de qualquer dado), autoria exclusiva de auth.uid() (não existe parâmetro de autor — G-2.3-3), desfechos fechados: JUIZO_REGISTRADO · VERSAO_JA_GRAVADA (só mesmo ator + mesmo conteúdo, PA-15) · CONFLITO_DE_VERSAO (base obsoleta, sucedida, ou corrida — outro ator nunca recebe idempotência alheia) · SEM_AUTORIDADE. Nova versão + SUPERADO da anterior + refs: UMA transação. O árbitro é o conjunto estrutural do 2.4; o writer traduz constraints, nunca as substitui (G-2.3-6).';

-- Comparador do "mesmo conteúdo" — a definição vinculante do PA-15: todos os
-- campos materiais de domínio; excluídos apenas identidade técnica, instante
-- e metadados. Fatos e refs comparados normalizados.
create or replace function curadoria.julgamento_tem_mesmo_conteudo(
  p_julgamento_id uuid,
  p_natureza text,
  p_subcriterion_code text,
  p_conclusao text,
  p_motivo text,
  p_fatos_visiveis jsonb,
  p_refs_normalizadas jsonb
)
returns boolean
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select exists (
    select 1
    from curadoria.curator_judgments j
    where j.id = p_julgamento_id
      and j.natureza = p_natureza
      and j.subcriterion_code = p_subcriterion_code
      and j.conclusao = p_conclusao
      and j.motivo is not distinct from p_motivo
      and (
        select coalesce(jsonb_agg(f order by f ->> 'registro'), '[]'::jsonb)
        from jsonb_array_elements(j.fatos_visiveis) as f
      ) = (
        select coalesce(jsonb_agg(f order by f ->> 'registro'), '[]'::jsonb)
        from jsonb_array_elements(coalesce(p_fatos_visiveis, '[]'::jsonb)) as f
      )
      and (
        select coalesce(
                 jsonb_agg(jsonb_build_object('id', r.evidence_id, 'version', r.evidence_version)
                           order by r.evidence_id),
                 '[]'::jsonb
               )
        from curadoria.curator_judgment_evidence_refs r
        where r.judgment_id = j.id
      ) = coalesce(p_refs_normalizadas, '[]'::jsonb)
  );
$$;

comment on function curadoria.julgamento_tem_mesmo_conteudo(uuid, text, text, text, text, jsonb, jsonb) is
  'CONTRATO_2_3 §7 — "mesmo conteúdo" do PA-15, executável: natureza, conceito, conclusão, motivo, fatos visíveis e referências de evidência COM versões, normalizados. Identidade técnica, instante e metadados ficam fora. Interna ao writer.';

revoke all on function curadoria.julgamento_tem_mesmo_conteudo(uuid, text, text, text, text, jsonb, jsonb) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- retirar_julgamento — RS-2.3-1 (§7/§12)
-- ----------------------------------------------------------------------------
create or replace function curadoria.retirar_julgamento(
  p_versao_vigente_id uuid,
  p_motivo text default null
)
returns table (desfecho text, versao_id uuid)
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  ator uuid;
  julgamento curadoria.curator_judgments%rowtype;
  motivo_normalizado text;
begin
  ator := auth.uid();
  if ator is null then
    return query select 'SEM_AUTORIDADE'::text, null::uuid;
    return;
  end if;

  -- A resolução estrutural mínima autorizada pelo §12: a linha do julgamento
  -- é o que permite descobrir o Case do gate e o autor da versão. Nenhum dado
  -- material adicional é lido antes das três autoridades abaixo decidirem.
  select * into julgamento
    from curadoria.curator_judgments
   where id = p_versao_vigente_id
   for update;

  -- Inexistente funde com sem-autoridade: a capability não confirma a
  -- existência de julgamento a quem não tem autoridade sobre ele (padrão 2.6).
  if not found then
    return query select 'SEM_AUTORIDADE'::text, null::uuid;
    return;
  end if;

  -- GATE 1 — Curador do Case (gate-first sobre o dado mínimo resolvido).
  if not curadoria.is_curator_for_case(julgamento.case_id) then
    return query select 'SEM_AUTORIDADE'::text, null::uuid;
    return;
  end if;

  -- GATE 2 — RS-2.3-1: retirar é ato PESSOAL do autor. Curador do Case que
  -- não é o autor da versão vigente NÃO retira — supersede por versão própria
  -- (registrar_julgamento). As duas autoridades são CUMULATIVAS.
  if julgamento.actor_id is distinct from ator then
    return query select 'SEM_AUTORIDADE'::text, null::uuid;
    return;
  end if;

  -- Corrida com supersessão/nova versão/outra retirada: quem chega ao estado
  -- já transicionado relê e age de novo.
  if julgamento.state <> 'VIGENTE' then
    return query select 'CONFLITO_DE_VERSAO'::text, null::uuid;
    return;
  end if;

  update curadoria.curator_judgments
     set state = 'RETIRADO'
   where id = julgamento.id;

  -- O motivo oferecido (nunca exigido) vai à TRILHA: o domínio do 2.4 é
  -- append-only e a transição muda só o estado — auditoria é o destino
  -- lavrável sem criar segunda origem (precedente das capabilities
  -- administrativas da casa).
  motivo_normalizado := nullif(btrim(coalesce(p_motivo, '')), '');
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    ator,
    'julgamento_retirado',
    ator,
    jsonb_build_object(
      'judgment_id', julgamento.id,
      'case_id', julgamento.case_id,
      'professional_profile_id', julgamento.professional_profile_id,
      'subcriterion_code', julgamento.subcriterion_code,
      'motivo', motivo_normalizado
    )
  );

  return query select 'JUIZO_RETIRADO'::text, julgamento.id;
end;
$$;

comment on function curadoria.retirar_julgamento(uuid, text) is
  'CONTRATO_2_3 §7/§12, RS-2.3-1 (PA-16) — retirar exige CUMULATIVAMENTE: Curador do Case (is_curator_for_case) E autor da versão VIGENTE (auth.uid() = actor_id da versão). Não-autor recebe SEM_AUTORIDADE mesmo sendo Curador do Case — sucessor que discorda supersede por versão própria, nunca retira ato alheio. Sem parâmetro de autor. Inexistente funde com SEM_AUTORIDADE; estado já transicionado é CONFLITO_DE_VERSAO. VIGENTE → RETIRADO; o conceito volta a ausência de juízo e a etapa volta a AGUARDA_JUIZO_DO_CURADOR. Motivo oferecido vai à trilha (audit_logs), nunca ao domínio append-only.';

-- ----------------------------------------------------------------------------
-- ler_julgamentos_para_avaliacao — a leitura da Mesa (§12/§13)
-- ----------------------------------------------------------------------------
create or replace function curadoria.ler_julgamentos_para_avaliacao(
  p_case_id uuid,
  p_professional_profile_id uuid
)
returns table (
  id uuid,
  subcriterion_code text,
  natureza text,
  state text,
  conclusao text,
  motivo text,
  versao integer,
  versao_anterior_id uuid,
  actor_id uuid,
  acted_at timestamptz,
  tem_sucessora boolean,
  evidencias jsonb
)
language plpgsql
stable
security definer
set search_path = curadoria, pg_temp
as $$
begin
  -- GATE-FIRST: sem autoridade, zero linhas — nada existe para quem não é o
  -- Curador do Case (a tabela não tem policy; este é o ÚNICO caminho de
  -- leitura, e ele não vaza).
  if auth.uid() is null or not curadoria.is_curator_for_case(p_case_id) then
    return;
  end if;

  return query
  select j.id,
         j.subcriterion_code,
         j.natureza,
         j.state,
         j.conclusao,
         j.motivo,
         j.versao,
         j.versao_anterior_id,
         j.actor_id,
         j.acted_at,
         exists (
           select 1 from curadoria.curator_judgments s where s.versao_anterior_id = j.id
         ) as tem_sucessora,
         coalesce(
           (
             select jsonb_agg(
                      jsonb_build_object(
                        'evidenceId', r.evidence_id,
                        'evidenceVersion', r.evidence_version,
                        'verificationStatus', r.verification_status
                      )
                      order by r.evidence_id
                    )
             from curadoria.curator_judgment_evidence_refs r
             where r.judgment_id = j.id
           ),
           '[]'::jsonb
         ) as evidencias
    from curadoria.curator_judgments j
   where j.case_id = p_case_id
     and j.professional_profile_id = p_professional_profile_id
   order by j.subcriterion_code, j.versao;
end;
$$;

comment on function curadoria.ler_julgamentos_para_avaliacao(uuid, uuid) is
  'CONTRATO_2_3 §12/§13 — a leitura da Mesa: julgamentos do par (Case, profissional) com histórico, sucessão e referências de evidência. Gate-first (is_curator_for_case); sem autoridade, zero linhas. A tabela permanece sem policy e sem grant — este é o único caminho de leitura, e o cliente jamais toca a tabela. O motivo JUIZO_SUPERADO_POR_EVIDENCIA é derivação: SUPERADO sem sucessora.';

-- ----------------------------------------------------------------------------
-- Trigger JS3 — evidência nova supersede o juízo compatível (§10)
-- ----------------------------------------------------------------------------
create or replace function curadoria.js3_evidencia_nova_supersede_juizo()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  -- ADR-067 §12 JS3: evidência nova supersede o juízo VIGENTE compatível,
  -- MESMO QUE a conclusão provavelmente não mudasse — sem heurística de
  -- materialidade. Escopo ratificado (§11 da missão): RELACIONAL por código
  -- igual; TECNICO pela família do critério. Este trigger:
  --   · só usa a transição VIGENTE → SUPERADO (a única que o 2.4 permite);
  --   · NUNCA cria julgamento, NUNCA copia conclusão, NUNCA pré-preenche;
  --   · roda na MESMA transação do INSERT da evidência;
  --   · o motivo JUIZO_SUPERADO_POR_EVIDENCIA é derivável na leitura:
  --     SUPERADO sem sucessora (JS1 sempre nasce com sucessora na mesma
  --     transação; JS3 nunca).
  update curadoria.curator_judgments j
     set state = 'SUPERADO'
   where j.professional_profile_id = new.professional_profile_id
     and j.state = 'VIGENTE'
     and (
       (j.natureza = 'RELACIONAL' and j.subcriterion_code = new.subcriterion_code)
       or (j.natureza = 'TECNICO' and new.subcriterion_code like j.subcriterion_code || '\_%')
     );

  return null;
end;
$$;

drop trigger if exists practice_evidence_js3_supersede_juizo on curadoria.practice_evidence;
create trigger practice_evidence_js3_supersede_juizo
  after insert on curadoria.practice_evidence
  for each row execute function curadoria.js3_evidencia_nova_supersede_juizo();

comment on function curadoria.js3_evidencia_nova_supersede_juizo() is
  'CONTRATO_2_3 §10 (ADR-067 §12, JS3) — evidência nova supersede o juízo VIGENTE compatível na mesma transação: RELACIONAL por código igual; TECNICO pela família (FORMACAO_*/EXPERIENCIA_*/HISTORICO_*). Só VIGENTE→SUPERADO; nunca cria juízo; nunca copia conclusão; a revisão é novo ato humano com o campo NASCENDO VAZIO (sem carry-forward — G-2.3-5). Motivo derivável: SUPERADO sem sucessora = JUIZO_SUPERADO_POR_EVIDENCIA.';

-- ----------------------------------------------------------------------------
-- Grants — EXECUTE controlado (O-2 do PA-16); a TABELA segue sem nada
-- ----------------------------------------------------------------------------
revoke all on function curadoria.registrar_julgamento(uuid, uuid, text, text, text, jsonb, jsonb, text, uuid) from public;
revoke all on function curadoria.retirar_julgamento(uuid, text) from public;
revoke all on function curadoria.ler_julgamentos_para_avaliacao(uuid, uuid) from public;
revoke execute on function curadoria.registrar_julgamento(uuid, uuid, text, text, text, jsonb, jsonb, text, uuid) from anon;
revoke execute on function curadoria.retirar_julgamento(uuid, text) from anon;
revoke execute on function curadoria.ler_julgamentos_para_avaliacao(uuid, uuid) from anon;
grant execute on function curadoria.registrar_julgamento(uuid, uuid, text, text, text, jsonb, jsonb, text, uuid) to authenticated;
grant execute on function curadoria.retirar_julgamento(uuid, text) to authenticated;
grant execute on function curadoria.ler_julgamentos_para_avaliacao(uuid, uuid) to authenticated;
