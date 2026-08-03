-- ============================================================================
-- RECONHECIMENTO COBRE O BLOCO RELACIONAL + PACIENTE LÊ AS PRÓPRIAS
-- NECESSIDADES (ADR-065, documento normativo Parte 12)
-- ============================================================================
-- Duas coisas, na ordem:
--
-- 1. A paciente passa a LER as próprias respostas em case_needs (precedente:
--    20260802140000, paciente lê o próprio Mapa). São as palavras dela — o
--    bloco "Como você quer ser cuidada" do cartão do Perfil nasce daqui.
--    Escrita continua interna (o registro é da conversa com o Curador).
--
-- 2. O gate do reconhecimento é ampliado: além do Mapa completo, todo
--    conceito relacional ativo (eixo MODELO_DE_ATENDIMENTO) precisa de
--    resposta registrada da pessoa em case_needs — SEM_PREFERENCIA explícito
--    conta como resposta; ausência não. Mesmo ato, escopo ampliado — nenhum
--    segundo reconhecimento.
--
-- TRANSIÇÃO (ADR-065 §12.2): Perfis já VALIDATED permanecem válidos — a
-- função só age no ato de reconhecer; o bloco relacional entra pelos novos
-- Perfis e supersessões (ADR-049).
--
-- ROLLBACK: recriar acknowledge_priority_profile pela versão da migration
-- 20260802159000; drop function relational_needs_pending; drop policy
-- case_needs_select_patient. Nenhum dado é tocado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Leitura pela paciente — as palavras dela voltam para ela
-- ----------------------------------------------------------------------------

drop policy if exists "case_needs_select_patient" on curadoria.case_needs;
create policy "case_needs_select_patient"
  on curadoria.case_needs for select
  to authenticated
  using (curadoria.is_patient_for_case(case_id));

-- ----------------------------------------------------------------------------
-- 2. O gate relacional — espelho de priority_map_pending
-- ----------------------------------------------------------------------------

create or replace function curadoria.relational_needs_pending(_case_id uuid)
returns integer language sql stable security definer
set search_path = curadoria, pg_temp as $$
  select count(*)::integer
  from curadoria.method_subcriteria ms
  where ms.active
    and ms.axis = 'MODELO_DE_ATENDIMENTO'
    and not exists (
      select 1 from curadoria.case_needs cn
      where cn.case_id = _case_id
        and cn.subcriterion_code = ms.code
    );
$$;

comment on function curadoria.relational_needs_pending(uuid) is
  'ADR-065: quantos conceitos relacionais ativos ainda nao tem resposta registrada da pessoa neste Case. SEM_PREFERENCIA explicito conta como resposta; ausencia nao. Segundo gate do reconhecimento, ao lado de priority_map_pending.';

revoke execute on function curadoria.relational_needs_pending(uuid) from anon;
grant execute on function curadoria.relational_needs_pending(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. O reconhecimento — mesmo ato, escopo ampliado
-- ----------------------------------------------------------------------------

create or replace function curadoria.acknowledge_priority_profile(_case_id uuid)
returns text language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare
  perfil record;
  pendentes integer;
  relacionais_pendentes integer;
begin
  if not curadoria.is_patient_for_case(_case_id) then
    return 'NAO_AUTORIZADO';
  end if;

  select id, status into perfil
  from curadoria.priority_profiles
  where case_id = _case_id
  order by created_at desc
  limit 1;

  if not found then
    return 'PERFIL_INEXISTENTE';
  end if;

  if perfil.status = 'VALIDATED' then
    return 'JA_RECONHECIDO';
  end if;

  if perfil.status = 'SUPERSEDED' then
    return 'PERFIL_SUBSTITUIDO';
  end if;

  select curadoria.priority_map_pending(_case_id) into pendentes;
  if pendentes > 0 then
    return 'MAPA_INCOMPLETO';
  end if;

  -- ADR-065: o Perfil que ela reconhece inclui o bloco relacional. Sem a
  -- resposta dela (ou SEM_PREFERENCIA explicito), nao ha o que reconhecer.
  select curadoria.relational_needs_pending(_case_id) into relacionais_pendentes;
  if relacionais_pendentes > 0 then
    return 'BLOCO_RELACIONAL_INCOMPLETO';
  end if;

  update curadoria.priority_profiles
  set status = 'VALIDATED', validated_at = now()
  where id = perfil.id;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (auth.uid(), 'profile_recognized', auth.uid(),
          jsonb_build_object(
            'case_id', _case_id,
            'priority_profile_id', perfil.id,
            'actor_role', 'paciente',
            'recognized_at', now()));

  return 'RECONHECIDO';
end;
$$;

comment on function curadoria.acknowledge_priority_profile(uuid) is
  'O ato da paciente: confirmar que o Mapa de Prioridades E o bloco relacional (ADR-065) refletem o que foi compreendido. Nao valida criterios, nao aprova o Metodo, nao autoriza conclusao clinica. Idempotente. Grava audit_log profile_recognized com a propria paciente como autora.';

revoke execute on function curadoria.acknowledge_priority_profile(uuid) from anon;
grant execute on function curadoria.acknowledge_priority_profile(uuid) to authenticated;
