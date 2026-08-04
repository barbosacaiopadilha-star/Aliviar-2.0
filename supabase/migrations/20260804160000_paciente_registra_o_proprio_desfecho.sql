-- ============================================================================
-- PP-03A — O CAMINHO DE ESCRITA DA PACIENTE SOBRE O PRÓPRIO RECONHECIMENTO
-- ============================================================================
--
-- FINALIDADE
--   Hoje o reconhecimento da paciente sobre a tradução do Curador é escrito
--   pelo próprio Curador: `acknowledgePersonNeedAction` exige
--   `curador_medico`/`administrador`, e a RLS de `case_needs` só admite
--   escrita interna. Ela LÊ as próprias respostas desde a ADR-065
--   (`case_needs_select_patient`) e não escreve nenhuma delas. Os quatro
--   desfechos do DT-22 existem, exigem o texto dela, e ela não tem como
--   executá-los (PP-03 §1).
--
--   Esta migration dá a ela EXATAMENTE UM VERBO sobre DUAS COLUNAS de UMA
--   LINHA — réplica por conceito do precedente `acknowledge_priority_profile`
--   (20260728030000 + 20260802159000), que é como a casa já resolveu o mesmo
--   problema para o mesmo ator sobre uma tabela interna.
--
--   O que ela NUNCA recebe: `UPDATE` em `case_needs`. Policy filtra LINHA, não
--   COLUNA — conceder `UPDATE` alcançaria `degree`, `options`,
--   `proposed_reading`, `declared_by` e `origin` (PP-03 §4-A). A autorização
--   vive no corpo da função, legível e testável.
--
-- ESCOPO (PP-03 §5 — contrato mínimo)
--   - RPC `SECURITY DEFINER`, grants, comentários e um valor aditivo em
--     `curadoria.audit_action`.
--   - NENHUMA tabela alterada. NENHUMA coluna nova. NENHUMA policy nova ou
--     alterada. A RLS existente permanece exatamente como está.
--
-- AUTORIA (PP-03 §5.6)
--   A autoria da DECLARAÇÃO e a autoria do ATO SOBRE ELA são coisas distintas
--   e ficam em lugares distintos: `declared_by` continua sendo do Curador e
--   NÃO é tocado; o ato dela vive em `audit_logs.actor_id = auth.uid()`.
--
-- PRÉ-CONDIÇÕES
--   - 20260801100000 (tabela `case_needs`, CHECK `case_needs_correcao_tem_texto`,
--     unique (case_id, subcriterion_code));
--   - 20260724022540 (`is_patient_for_case`); `curadoria.audit_logs` (stage 1).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   Nenhum DML. Nenhum desfecho passado ganha evento retroativo — trilha nasce
--   com o ato, nunca é inventada depois (mesmo princípio de 20260802159000).
--
-- ROLLBACK
--   drop function curadoria.acknowledge_case_need(uuid, text, text, text);
--   O valor 'need_acknowledged' em curadoria.audit_action não é removível sem
--   recriar o tipo; inofensivo sem uso (mesmo resíduo aceito de M150/M156 e de
--   'profile_recognized'). Nenhum dado é tocado.
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'need_acknowledged';

create or replace function curadoria.acknowledge_case_need(
  _case_id uuid,
  _subcriterion_code text,
  _acknowledgment text,
  _correction text default null
)
returns text language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare
  linha record;
  perfil_status text;
  texto text;
begin
  -- PRIMEIRA instrução, antes de qualquer leitura (PP-03 §6): Case de
  -- terceiro não chega nem a revelar se o conceito existe.
  if not curadoria.is_patient_for_case(_case_id) then
    return 'NAO_AUTORIZADO';
  end if;

  -- `PENDENTE` não é entrada — é a AUSÊNCIA de ato (PP-03 §5.1). E nenhum
  -- valor fora dos três desfechos atravessa.
  if _acknowledgment is null or _acknowledgment not in ('RECONHECIDA', 'CORRIGIDA', 'RECUSADA') then
    return 'ESTADO_INVALIDO';
  end if;

  texto := nullif(btrim(coalesce(_correction, '')), '');

  -- DT-22: os dois desfechos que AFIRMAM algo sobre a tradução guardam o texto
  -- dela. Sem o texto fica o estado sem o motivo, e o motivo é o que importa.
  if _acknowledgment in ('CORRIGIDA', 'RECUSADA') and texto is null then
    return 'TEXTO_OBRIGATORIO';
  end if;

  -- O reconhecimento não tem o que guardar (DT-22): texto enviado junto de
  -- RECONHECIDA é ignorado, nunca gravado.
  if _acknowledgment = 'RECONHECIDA' then
    texto := null;
  end if;

  select id, origin, acknowledgment into linha
  from curadoria.case_needs
  where case_id = _case_id and subcriterion_code = _subcriterion_code;

  if not found then
    return 'CONCEITO_INEXISTENTE';
  end if;

  -- Ela se manifesta SOBRE UMA TRADUÇÃO. Onde ela mesma respondeu direto, não
  -- há leitura de terceiro sobre a qual concordar ou discordar.
  if linha.origin <> 'TRADUCAO' then
    return 'NAO_TRADUZIDO';
  end if;

  -- Idempotência declarada: o desfecho não regride nem é reescrito.
  if linha.acknowledgment <> 'PENDENTE' then
    return 'JA_RESPONDIDO';
  end if;

  -- ADR-049: Perfil reconhecido é irreversível. Corrigir depois disso é
  -- SUPERSESSÃO do Perfil, não segundo ato sobre o conceito.
  select status into perfil_status
  from curadoria.priority_profiles
  where case_id = _case_id
  order by created_at desc
  limit 1;

  if perfil_status = 'VALIDATED' then
    return 'PERFIL_JA_RECONHECIDO';
  end if;

  -- DUAS COLUNAS. Nada mais (PP-03 §5.4/§5.5): `degree`, `options`,
  -- `guided_text`, `flexibility`, `proposed_reading`, `origin`,
  -- `subcriterion_code`, `catalog_version`, `declared_by`, `declared_at`,
  -- `case_id` e `id` não são alcançáveis por ela. `updated_at` é movido pelo
  -- trigger `case_needs_touch`, não por esta função.
  update curadoria.case_needs
  set acknowledgment = _acknowledgment,
      correction = texto
  where id = linha.id;

  -- Trilha nasce com o ato efetivo — recusa e idempotência NÃO geram evento
  -- (auditoria registra o ato, não a tentativa). Sem conteúdo clínico no
  -- metadata: o texto dela NUNCA entra aqui.
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (auth.uid(), 'need_acknowledged', auth.uid(),
          jsonb_build_object(
            'case_id', _case_id,
            'subcriterion_code', _subcriterion_code,
            'acknowledgment', _acknowledgment,
            'actor_role', 'paciente',
            'acknowledged_at', now()));

  return _acknowledgment;
end;
$$;

comment on function curadoria.acknowledge_case_need(uuid, text, text, text) is
  'O ato da paciente sobre a traducao do Curador, POR CONCEITO: reconhecer, corrigir ou recusar. Um verbo sobre duas colunas (acknowledgment, correction) de uma linha. Autorizacao unica: is_patient_for_case. Idempotente (JA_RESPONDIDO). CORRIGIDA e RECUSADA exigem o texto dela (DT-22). A autoria da declaracao (declared_by) e do Curador e nao muda; a autoria do ato e dela, em audit_logs. PP-03A.';

revoke execute on function curadoria.acknowledge_case_need(uuid, text, text, text) from anon;
grant execute on function curadoria.acknowledge_case_need(uuid, text, text, text) to authenticated;
