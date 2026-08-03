-- ============================================================================
-- BLOCO C / ETAPA 10 (parte da Frente 1) — O RECONHECIMENTO GANHA AUTORIA
-- ============================================================================
--
-- FINALIDADE
--   `acknowledge_priority_profile` (20260728030000) grava o ato mais
--   importante da paciente na fase de prioridades — e não deixava rastro
--   nenhum: nenhum registro de QUEM reconheceu e QUANDO além do carimbo
--   `validated_at` na própria linha. Auditoria de ato sensível é trilha em
--   `audit_logs` (ADR-055; padrão da casa: role_granted, case_discarded,
--   curadoria_delivered, profile_superseded).
--
--   Esta migration REDEFINE a função (CREATE OR REPLACE em migration nova —
--   a original não é editada) com uma única mudança de comportamento: quando
--   o reconhecimento ACONTECE (retorno 'RECONHECIDO'), nasce na mesma
--   transação um audit_log `profile_recognized` com actor = a própria
--   paciente (auth.uid()). Nenhum conteúdo clínico no metadata — só
--   identificadores e carimbo. Os ramos idempotentes/de recusa
--   (JA_RECONHECIDO, MAPA_INCOMPLETO, ...) NÃO geram evento: auditoria
--   registra o ato, não a tentativa.
--
-- PRÉ-CONDIÇÕES
--   - 20260728030000 aplicada (função original, `priority_map_pending`,
--     `is_patient_for_case`); `curadoria.audit_logs` (stage 1).
--   - M156 aplicada (o trigger de transição do Perfil deixa DRAFT ->
--     VALIDATED passar — o UPDATE desta função continua válido).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Reconhecimentos passados não ganham evento retroativo —
--     trilha nasce com o ato, nunca é inventada depois.
--
-- PROVA DE FECHAMENTO
--   - Gate novo da Frente 1 (tests/remediacao/imutabilidade-frente1):
--     reconhecer gera exatamente uma linha `profile_recognized` em
--     audit_logs com actor_id = paciente; repetir (JA_RECONHECIDO) não gera
--     segunda linha; o metadata não carrega texto clínico.
--
-- ROLLBACK
--   -- Recolar o corpo original de 20260728030000 (sem o insert de
--   -- auditoria) via CREATE OR REPLACE. O valor 'profile_recognized' em
--   -- curadoria.audit_action não é removível sem recriar o tipo; inofensivo
--   -- sem uso (mesmo resíduo aceito de M150/M156).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'profile_recognized';

create or replace function curadoria.acknowledge_priority_profile(_case_id uuid)
returns text language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare
  perfil record;
  pendentes integer;
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

  update curadoria.priority_profiles
  set status = 'VALIDATED', validated_at = now()
  where id = perfil.id;

  -- O ato dela deixa rastro (Bloco C/Etapa 10): autora nomeada, na mesma
  -- transação do reconhecimento. Sem conteúdo clínico no metadata.
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
  'O ato da paciente: confirmar que o Mapa de Prioridades reflete o que foi compreendido na Consulta Inicial. Nao valida criterios, nao aprova o Metodo, nao autoriza conclusao clinica. Idempotente. Desde o Bloco C, o reconhecimento efetivo grava audit_log profile_recognized com a propria paciente como autora.';

revoke execute on function curadoria.acknowledge_priority_profile(uuid) from anon;
grant execute on function curadoria.acknowledge_priority_profile(uuid) to authenticated;
