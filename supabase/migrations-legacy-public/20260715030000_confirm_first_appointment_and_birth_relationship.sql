-- RELATIONSHIP ENGINE — MVP — PR4 (nascimento automático).
--
-- Achado da auditoria prévia (Etapa 1): hoje, confirmFirstAppointmentAction
-- persiste a transição do Connection (via apply_connection_transition,
-- Connection PR3) numa transação própria que termina ali — nenhum
-- Relationship nasce na mesma operação. Isso deixa, estruturalmente,
-- espaço para uma janela onde um Connection está em
-- PRIMEIRO_ATENDIMENTO_REALIZADO sem nenhum Relationship correspondente
-- (proibido pela especificação, Fase 3/Etapa 10: "pode existir Connection
-- terminal positivo sem Relationship? Não").
--
-- Resolvido com uma função nova, dedicada a esta única transição
-- específica — nunca modificando apply_connection_transition nem
-- create_relationship_with_event, que continuam servindo os demais casos
-- (correção de escolha, intenção de contato, encerramento sem
-- relacionamento; e qualquer criação avulsa de Relationship fora deste
-- fluxo, se algum dia necessária). Dentro de uma única transação
-- implícita (`security invoker`, RLS de connection_records e
-- relationship_records continua se aplicando normalmente à identidade
-- real do chamador — nenhuma policy nova, nenhuma autoridade nova):
--   1. insere o evento PRIMEIRO_ATENDIMENTO_REALIZADO em connection_events;
--   2. atualiza connection_records para PRIMEIRO_ATENDIMENTO_REALIZADO,
--      com a mesma concorrência otimista já usada em
--      apply_connection_transition (WHERE status = expected);
--   3. cria o RelationshipRecord em ATIVO, herdando connection_id/
--      case_id/patient_profile_id/professional_profile_id diretamente da
--      linha de connection_records recém-atualizada (nunca de parâmetro
--      do chamador — estruturalmente impossível declarar um vínculo
--      divergente);
--   4. insere o evento RELACIONAMENTO_INICIADO em relationship_events.
--
-- Os triggers já existentes de ambos os domínios (PR1 de Connection e PR1
-- de Relationship) continuam disparando normalmente sobre estas escritas
-- — nenhuma validação é duplicada aqui, apenas orquestrada na ordem
-- correta dentro da mesma transação. Em particular,
-- assert_relationship_matches_connection (Relationship PR1) lê
-- connection_records.status no momento do INSERT em relationship_records
-- — como o UPDATE do passo 2 já ocorreu na mesma transação, ele enxerga
-- PRIMEIRO_ATENDIMENTO_REALIZADO corretamente (semântica de leitura
-- read-your-own-writes dentro da mesma transação).

create function public.confirm_first_appointment_and_birth_relationship(
  p_connection_id uuid,
  p_expected_status text,
  p_actor_id uuid,
  p_connection_event_payload jsonb,
  p_relationship_event_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns table (
  connection_record public.connection_records,
  relationship_record public.relationship_records
)
language plpgsql
security invoker
as $$
declare
  v_connection public.connection_records;
  v_relationship public.relationship_records;
begin
  insert into public.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_connection_id, 'PRIMEIRO_ATENDIMENTO_REALIZADO', p_actor_id, p_connection_event_payload, p_occurred_at, p_recorded_at);

  update public.connection_records
  set status = 'PRIMEIRO_ATENDIMENTO_REALIZADO'
  where id = p_connection_id
    and status = p_expected_status
  returning * into v_connection;

  if not found then
    raise exception 'connection_records: transição concorrente detectada para % (esperado %)', p_connection_id, p_expected_status
      using errcode = '55000';
  end if;

  insert into public.relationship_records (
    connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at
  )
  values (
    v_connection.id, v_connection.case_id, v_connection.patient_profile_id, v_connection.professional_profile_id, 'ATIVO', p_occurred_at
  )
  returning * into v_relationship;

  insert into public.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_relationship.id, 'RELACIONAMENTO_INICIADO', p_actor_id, p_relationship_event_payload, p_occurred_at, p_recorded_at);

  return query select v_connection, v_relationship;
end;
$$;

comment on function public.confirm_first_appointment_and_birth_relationship is 'Confirma o primeiro atendimento de um Connection e faz nascer o Relationship correspondente, atomicamente, numa única transação implícita — os dois efeitos são inseparáveis (PR4). Nunca usada para nenhuma outra transição de Connection (correção, intenção de contato, encerramento sem relacionamento continuam usando apply_connection_transition, inalterada). Concorrência otimista via WHERE status = p_expected_status — 0 linhas afetadas (errcode 55000) significa que outra requisição já transicionou o Connection. A unicidade de relationship_records.connection_id (PR1 do Relationship) garante, como segunda barreira, que uma repetição pós-sucesso nunca duplica o Relationship — ela já falha antes disso, no próprio WHERE da atualização do Connection, porque o status esperado (DECISAO_REGISTRADA/CONTATO_INICIADO) não bate mais. security invoker: RLS de connection_records e relationship_records continua se aplicando à identidade real do chamador — nenhuma policy nova, nenhuma autoridade nova.';

grant execute on function public.confirm_first_appointment_and_birth_relationship to authenticated;
