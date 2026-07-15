-- CONNECTION ENGINE — MVP — PR3 (mecanismo de atomicidade).
--
-- Achado da auditoria prévia do PR3: PR1 (20260715000000) e PR2 (domínio
-- puro) são compatíveis campo a campo, mas nenhum dos dois cobria como
-- as duas escritas exigidas por cada comando do domínio — inserir o
-- evento append-only em connection_events e atualizar (ou criar) o
-- estado atual em connection_records — permanecem inseparáveis. O
-- cliente Supabase (PostgREST) não expõe transação multi-tabela entre
-- duas chamadas .insert()/.update() separadas; sem um mecanismo do lado
-- do banco, uma falha de rede entre as duas chamadas deixaria um evento
-- sem a atualização de estado correspondente, ou vice-versa.
--
-- Resolvido com duas funções plpgsql (`security invoker`, nunca
-- `security definer` — RLS de connection_records/connection_events
-- continua se aplicando normalmente às escritas feitas dentro delas,
-- então nenhuma política é contornada). Cada função roda numa única
-- transação implícita: se qualquer exceção for lançada (incluindo uma
-- rejeição de RLS ou dos triggers já existentes no PR1), nada é
-- persistido. Mesmo princípio arquitetural já usado nos triggers do
-- próprio PR1 e em enforce_case_status_transition — nenhuma tecnologia
-- nova introduzida.

create function public.create_connection_with_event(
  p_case_id uuid,
  p_final_curadoria_delivery_id uuid,
  p_patient_profile_id uuid,
  p_professional_profile_id uuid,
  p_decided_at timestamptz,
  p_actor_id uuid,
  p_event_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns public.connection_records
language plpgsql
security invoker
as $$
declare
  v_record public.connection_records;
begin
  insert into public.connection_records (
    case_id, final_curadoria_delivery_id, patient_profile_id, professional_profile_id, status, decided_at
  )
  values (
    p_case_id, p_final_curadoria_delivery_id, p_patient_profile_id, p_professional_profile_id, 'DECISAO_REGISTRADA', p_decided_at
  )
  returning * into v_record;

  insert into public.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'DECISAO_REGISTRADA', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);

  return v_record;
end;
$$;

comment on function public.create_connection_with_event is 'Cria um ConnectionRecord e seu evento DECISAO_REGISTRADA em uma única transação implícita — nunca um sem o outro. security invoker: RLS de connection_records/connection_events (PR1) se aplica normalmente a quem chama.';

grant execute on function public.create_connection_with_event to authenticated;

-- Aplica qualquer uma das quatro transições subsequentes (correção,
-- intenção de contato, confirmação, encerramento) atomicamente.
-- Concorrência otimista: a atualização só afeta a linha se seu status
-- atual ainda for exatamente p_expected_status — se outra requisição já
-- tiver transicionado o registro entre a leitura e esta chamada, 0 linhas
-- são afetadas e a função lança uma exceção explícita (nunca aceita um
-- estado obsoleto silenciosamente). O trigger connection_records_assert_
-- valid_transition (PR1) permanece como segunda barreira, redundante e
-- intencional, para a própria regra de transição válida.
create function public.apply_connection_transition(
  p_connection_id uuid,
  p_expected_status text,
  p_new_status text,
  p_professional_profile_id uuid,
  p_event_type text,
  p_actor_id uuid,
  p_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns public.connection_records
language plpgsql
security invoker
as $$
declare
  v_record public.connection_records;
begin
  insert into public.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_connection_id, p_event_type, p_actor_id, p_payload, p_occurred_at, p_recorded_at);

  update public.connection_records
  set status = p_new_status,
      professional_profile_id = p_professional_profile_id
  where id = p_connection_id
    and status = p_expected_status
  returning * into v_record;

  if not found then
    raise exception 'connection_records: transição concorrente detectada para % (esperado %)', p_connection_id, p_expected_status
      using errcode = '55000';
  end if;

  return v_record;
end;
$$;

comment on function public.apply_connection_transition is 'Aplica atomicamente uma transição de connection_records (evento + atualização de estado em uma única transação implícita). Concorrência otimista via WHERE status = p_expected_status — 0 linhas afetadas (errcode 55000) significa que outra requisição já transicionou o registro. security invoker: RLS continua se aplicando.';

grant execute on function public.apply_connection_transition to authenticated;
