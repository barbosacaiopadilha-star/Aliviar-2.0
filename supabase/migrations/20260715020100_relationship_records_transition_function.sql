-- RELATIONSHIP ENGINE — MVP — PR1 (mecanismo de atomicidade, Fase 3/Etapa
-- 9-10). Mesma necessidade já resolvida para Connection (PR3): o cliente
-- Supabase (PostgREST) não expõe transação multi-tabela entre chamadas
-- .insert()/.update() separadas — sem um mecanismo do lado do banco, uma
-- falha de rede entre a escrita do evento e a atualização do estado
-- deixaria uma sem a outra. Resolvido aqui, já em PR1 (diferente de
-- Connection, que só introduziu isso em PR3), porque a especificação
-- técnica (Fase 3) exige que a persistência já nasça atômica.
--
-- Três funções `security invoker` (nunca `security definer` — RLS de
-- relationship_records/relationship_events continua se aplicando
-- normalmente às escritas feitas dentro delas, então nenhuma policy é
-- contornada). Cada uma roda numa única transação implícita: qualquer
-- exceção (incluindo rejeição de RLS ou dos triggers do PR1) desfaz tudo.

-- Cria o RelationshipRecord e seu evento RELACIONAMENTO_INICIADO numa
-- única transação. Os campos herdados (case_id/patient_profile_id/
-- professional_profile_id) são lidos diretamente do connection_records
-- referenciado — nunca aceitos como parâmetro do chamador — para que seja
-- estruturalmente impossível declarar um vínculo divergente do Connection
-- de origem (reforça, em vez de duplicar, o trigger
-- assert_relationship_matches_connection do PR1).
create function public.create_relationship_with_event(
  p_connection_id uuid,
  p_actor_id uuid,
  p_event_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns public.relationship_records
language plpgsql
security invoker
as $$
declare
  v_connection public.connection_records;
  v_record public.relationship_records;
begin
  select * into v_connection from public.connection_records where id = p_connection_id;

  if not found then
    raise exception 'relationship_records: connection_id % não encontrado', p_connection_id
      using errcode = '23503';
  end if;

  if v_connection.status is distinct from 'PRIMEIRO_ATENDIMENTO_REALIZADO' then
    raise exception 'relationship_records: connection_id % não está em PRIMEIRO_ATENDIMENTO_REALIZADO (atual: %)', p_connection_id, v_connection.status
      using errcode = '23514';
  end if;

  insert into public.relationship_records (
    connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at
  )
  values (
    v_connection.id, v_connection.case_id, v_connection.patient_profile_id, v_connection.professional_profile_id, 'ATIVO', p_occurred_at
  )
  returning * into v_record;

  insert into public.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'RELACIONAMENTO_INICIADO', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);

  return v_record;
end;
$$;

comment on function public.create_relationship_with_event is 'Cria um RelationshipRecord e seu evento RELACIONAMENTO_INICIADO em uma única transação implícita — nunca um sem o outro. Campos herdados são lidos do connection_records referenciado, nunca aceitos do chamador. security invoker: RLS de relationship_records/relationship_events (PR1) se aplica normalmente. Unicidade de connection_id (índice único do PR1) garante que uma segunda chamada para o mesmo Connection é rejeitada (23505), nunca duplicada.';

grant execute on function public.create_relationship_with_event to authenticated;

-- Aplica a transição de status (ATIVO -> ENCERRADO, seja por
-- encerramento planejado ou por interrupção — o motivo vive no
-- event_type, nunca em um status próprio) atomicamente. [CORRIGIDO —
-- Fase 6.1: pausa/retomada removidas junto com o estado PAUSADO.]
-- Concorrência otimista: a atualização só afeta a linha se seu status
-- atual ainda for exatamente p_expected_status — mesmo mecanismo de
-- apply_connection_transition. O trigger
-- relationship_records_assert_valid_transition (PR1) permanece como
-- segunda barreira, redundante e intencional, para a própria regra de
-- transição válida.
create function public.apply_relationship_transition(
  p_relationship_id uuid,
  p_expected_status text,
  p_new_status text,
  p_event_type text,
  p_actor_id uuid,
  p_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns public.relationship_records
language plpgsql
security invoker
as $$
declare
  v_record public.relationship_records;
begin
  insert into public.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_relationship_id, p_event_type, p_actor_id, p_payload, p_occurred_at, p_recorded_at);

  update public.relationship_records
  set status = p_new_status
  where id = p_relationship_id
    and status = p_expected_status
  returning * into v_record;

  if not found then
    raise exception 'relationship_records: transição concorrente detectada para % (esperado %)', p_relationship_id, p_expected_status
      using errcode = '55000';
  end if;

  return v_record;
end;
$$;

comment on function public.apply_relationship_transition is 'Aplica atomicamente uma transição de relationship_records (evento + atualização de estado em uma única transação implícita). Concorrência otimista via WHERE status = p_expected_status — 0 linhas afetadas (errcode 55000) significa que outra requisição já transicionou o registro. Nunca usada para REABERTURA_OBSERVADA (que não altera status — ver register_relationship_reopening). security invoker: RLS continua se aplicando, incluindo a distinção entre eventos de autoria do paciente e da equipe (PR1).';

grant execute on function public.apply_relationship_transition to authenticated;

-- Registra REABERTURA_OBSERVADA — nunca altera relationship_records.status
-- (Fase 3/Etapa 11: "não altera o Relationship anterior"). Só aceito
-- contra um Relationship já terminal, e sempre vinculado a um Caso novo
-- real (nunca inventado ou omitido) — o próprio newCaseId é sempre
-- incorporado ao payload por esta função, nunca confiado ao chamador,
-- garantindo a rastreabilidade exigida pela especificação.
create function public.register_relationship_reopening(
  p_relationship_id uuid,
  p_new_case_id uuid,
  p_actor_id uuid,
  p_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns public.relationship_events
language plpgsql
security invoker
as $$
declare
  v_relationship public.relationship_records;
  v_event public.relationship_events;
  v_final_payload jsonb;
begin
  select * into v_relationship from public.relationship_records where id = p_relationship_id;

  if not found then
    raise exception 'relationship_events: relationship_id % não encontrado', p_relationship_id
      using errcode = '23503';
  end if;

  if v_relationship.status <> 'ENCERRADO' then
    raise exception 'relationship_events: reabertura só pode ser registrada contra um Relationship terminal (atual: %)', v_relationship.status
      using errcode = '23514';
  end if;

  if not exists (select 1 from public.cases where id = p_new_case_id) then
    raise exception 'relationship_events: novo Caso % não encontrado — reabertura exige um Caso real', p_new_case_id
      using errcode = '23503';
  end if;

  v_final_payload := coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('newCaseId', p_new_case_id);

  insert into public.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_relationship_id, 'REABERTURA_OBSERVADA', p_actor_id, v_final_payload, p_occurred_at, p_recorded_at)
  returning * into v_event;

  return v_event;
end;
$$;

comment on function public.register_relationship_reopening is 'Registra um evento REABERTURA_OBSERVADA — nunca altera relationship_records.status. Só aceito contra um Relationship em estado terminal; exige um novo Caso real (nunca inventado), sempre incorporado como newCaseId no payload pela própria função. Pode ser chamada múltiplas vezes contra o mesmo Relationship (histórico legítimo, Fase 2/Etapa 4). security invoker: RLS restringe a autoria a equipe (PR1).';

grant execute on function public.register_relationship_reopening to authenticated;
