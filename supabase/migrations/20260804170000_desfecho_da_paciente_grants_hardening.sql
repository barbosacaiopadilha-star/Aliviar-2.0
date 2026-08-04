-- ============================================================================
-- PP-03B — ENDURECIMENTO DOS GRANTS DA ESCRITA DA PACIENTE (D-1 e D-3)
-- ============================================================================
--
-- D-1 · A ACL
--   `create function` concede EXECUTE a PUBLIC por padrão, e PUBLIC alcança
--   `anon`. A migration 20260804160000 revogou de `anon` explicitamente — o
--   que NÃO desfaz o grant herdado de PUBLIC. Medido no banco local:
--
--     acknowledge_case_need         public=t  anon=t  authenticated=t   ← aberta
--     acknowledge_priority_profile  public=f  anon=f  authenticated=t   ← fechada
--
--   O precedente estava fechado porque 20260728050000 revogou de PUBLIC. Eu
--   repliquei apenas a migration posterior (20260802159000), que revoga de
--   `anon`, e o `revoke from anon` ficou cosmético: quem não está autenticado
--   continuava alcançando a função. Esta migration replica o precedente que
--   faltava — mesma forma, mesmas duas linhas.
--
--   A autorização real sempre foi `is_patient_for_case` no corpo (um chamador
--   `anon` receberia `NAO_AUTORIZADO`), mas função sensível ao alcance de quem
--   não se autenticou é superfície que não deve existir.
--
-- D-3 · SUPERSEDED
--   `acknowledge_priority_profile` distingue três estados do Perfil: VALIDATED
--   (`JA_RECONHECIDO`), SUPERSEDED (`PERFIL_SUBSTITUIDO`) e o resto (segue).
--   `acknowledge_case_need` tratava só VALIDATED: com o Perfil substituído e
--   nenhum sucessor ainda criado, o desfecho era aceito sobre um Perfil que
--   saiu de cena. Esta redefinição replica o ramo que faltava — mesmo estado,
--   mesmo nome de retorno do precedente. Nenhuma ADR é reinterpretada e nenhum
--   comportamento novo é inventado.
--
-- ESCOPO
--   Grants e uma redefinição por CREATE OR REPLACE. NENHUMA tabela, coluna,
--   policy ou tipo tocado. O contrato de entrada da RPC não muda.
--
-- ROLLBACK
--   grant execute on function curadoria.acknowledge_case_need(uuid, text, text, text) to public;
--   -- e recolar o corpo de 20260804160000 (sem o ramo SUPERSEDED) via
--   -- CREATE OR REPLACE. Nenhum dado é tocado.
-- ============================================================================

revoke execute on function curadoria.acknowledge_case_need(uuid, text, text, text) from public;
grant execute on function curadoria.acknowledge_case_need(uuid, text, text, text) to authenticated;

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

  select status into perfil_status
  from curadoria.priority_profiles
  where case_id = _case_id
  order by created_at desc
  limit 1;

  -- ADR-049: Perfil reconhecido é irreversível. Corrigir depois disso é
  -- SUPERSESSÃO do Perfil, não segundo ato sobre o conceito.
  if perfil_status = 'VALIDATED' then
    return 'PERFIL_JA_RECONHECIDO';
  end if;

  -- D-3 — mesmo ramo, mesmo nome de retorno do precedente
  -- `acknowledge_priority_profile`: um Perfil substituído não está pendente,
  -- ele saiu de cena. O ato acontece sobre o Perfil vigente.
  if perfil_status = 'SUPERSEDED' then
    return 'PERFIL_SUBSTITUIDO';
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

-- CREATE OR REPLACE preserva a ACL da função existente, mas o revoke acima
-- roda ANTES da redefinição. Repetido aqui para que a ordem de aplicação
-- nunca deixe uma janela em que a função nova nasça aberta a PUBLIC.
revoke execute on function curadoria.acknowledge_case_need(uuid, text, text, text) from public;
revoke execute on function curadoria.acknowledge_case_need(uuid, text, text, text) from anon;
grant execute on function curadoria.acknowledge_case_need(uuid, text, text, text) to authenticated;
