-- CORREÇÃO — derivar a verdade exige privilégio; autorizar continua sendo da RLS.
--
-- `create_connection_from_report` é SECURITY INVOKER de propósito: o INSERT
-- precisa passar pela policy do paciente, e é isso que garante o isolamento.
-- Mas ela derivava Case e paciente com um JOIN em `curadoria.cases`, tabela
-- que o paciente não enxerga — o SELECT voltava vazio e a função respondia
-- "Relatório não encontrado" para o dono legítimo do Relatório.
--
-- A separação correta: uma função SECURITY DEFINER devolve apenas os dois
-- identificadores derivados do Relatório, e nada mais. A autorização segue
-- inteiramente na policy de INSERT, que verifica `canonical_delivery_matches`
-- contra `auth.uid()` — de forma independente desta derivação.

create function curadoria.canonical_delivery_target(p_report_id uuid)
returns table (case_id uuid, patient_profile_id uuid)
language sql
stable
security definer
set search_path = curadoria, public
as $$
  select r.case_id, c.patient_profile_id
  from curadoria.curadoria_reports r
  join curadoria.cases c on c.id = r.case_id
  where r.id = p_report_id;
$$;

comment on function curadoria.canonical_delivery_target is
  'Deriva Case e paciente a partir do Relatorio. Nao autoriza nada: quem autoriza e a policy de INSERT de connection_records.';

grant execute on function curadoria.canonical_delivery_target to authenticated;

create or replace function curadoria.create_connection_from_report(
  p_report_id uuid,
  p_professional_profile_id uuid,
  p_decided_at timestamptz,
  p_actor_id uuid,
  p_event_payload jsonb,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
) returns curadoria.connection_records
language plpgsql
security invoker
set search_path = curadoria, public
as $$
declare
  v_case_id uuid;
  v_patient_profile_id uuid;
  v_record curadoria.connection_records;
begin
  select t.case_id, t.patient_profile_id
    into v_case_id, v_patient_profile_id
  from curadoria.canonical_delivery_target(p_report_id) t;

  if v_case_id is null then
    raise exception 'curadoria_reports: Relatório % não encontrado', p_report_id using errcode = '23503';
  end if;

  -- A identidade vem da sessão, nunca do parâmetro. `p_actor_id` só é aceito
  -- quando coincide com quem está autenticado — um cliente não escolhe quem é.
  if auth.uid() is distinct from v_patient_profile_id
     or p_actor_id is distinct from v_patient_profile_id then
    raise exception 'connection_records: apenas o paciente do Caso registra a própria escolha' using errcode = '42501';
  end if;

  if not curadoria.canonical_delivery_matches(p_report_id, v_case_id, v_patient_profile_id) then
    raise exception 'connection_records: o Relatório % ainda não representa uma entrega canônica válida', p_report_id using errcode = '23514';
  end if;

  -- Retorno idempotente: mesma escolha repetida devolve a Connection existente,
  -- sem segundo evento inicial.
  select * into v_record from curadoria.connection_records where case_id = v_case_id;
  if found then
    return v_record;
  end if;

  insert into curadoria.connection_records (
    case_id, curadoria_report_id, patient_profile_id, professional_profile_id, status, decided_at
  ) values (
    v_case_id, p_report_id, v_patient_profile_id, p_professional_profile_id, 'DECISAO_REGISTRADA', p_decided_at
  )
  on conflict (case_id) do nothing
  returning * into v_record;

  -- Corrida: outra transação inseriu entre o select e o insert.
  if v_record.id is null then
    select * into v_record from curadoria.connection_records where case_id = v_case_id;
    return v_record;
  end if;

  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'DECISAO_REGISTRADA', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);

  return v_record;
end; $$;
