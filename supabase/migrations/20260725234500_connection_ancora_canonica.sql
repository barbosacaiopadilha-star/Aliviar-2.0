-- ÂNCORA CANÔNICA DE CONNECTION (ADR-035)
--
-- Antes: connection_records.final_curadoria_delivery_id era NOT NULL com FK
-- para a tabela de entrega do motor antigo. Uma Curadoria entregue pelo Método
-- era válida para o paciente ler e incapaz de gerar Connection — o ACE seguia
-- sendo dependência operacional por estrutura de banco, não por decisão.
--
-- Depois: a Connection pode nascer do Relatório canônico entregue. Toda a
-- verdade (Case, paciente, três opções, autoria, momento da entrega) é
-- derivada das relações persistidas, nunca do que o browser enviou.
--
-- Nada é removido: a coluna legada, sua FK e os registros históricos
-- permanecem íntegros.

-- 1. A âncora canônica -------------------------------------------------------

alter table curadoria.connection_records
  add column curadoria_report_id uuid references curadoria.curadoria_reports (id);

comment on column curadoria.connection_records.curadoria_report_id is
  'Relatorio canonico entregue que originou esta Connection. Dele derivam Case, paciente, as tres opcoes e a autoria.';

alter table curadoria.connection_records
  alter column final_curadoria_delivery_id drop not null;

comment on column curadoria.connection_records.final_curadoria_delivery_id is
  'Ancora legada (ACE/P010). Preservada para registros historicos; nenhum registro novo deve usa-la.';

-- Uma Connection por Relatorio. Parcial porque a coluna e nula no legado.
create unique index connection_records_curadoria_report_id_key
  on curadoria.connection_records (curadoria_report_id)
  where curadoria_report_id is not null;

-- Exatamente uma fonte: nunca nenhuma, nunca as duas.
alter table curadoria.connection_records
  add constraint connection_records_exactly_one_anchor check (
    (curadoria_report_id is not null)::int
    + (final_curadoria_delivery_id is not null)::int = 1
  ) not valid;

-- Os registros existentes so tem a ancora legada, entao satisfazem a regra.
-- Validado explicitamente em vez de deixado NOT VALID: esconder registro
-- invalido seria pior do que descobrir agora.
alter table curadoria.connection_records
  validate constraint connection_records_exactly_one_anchor;

-- 2. Validação canônica, em um só lugar -------------------------------------

-- Responde se um Relatorio representa uma entrega canonica valida para um
-- Case e um paciente. SECURITY DEFINER com search_path fixo: e usada dentro de
-- policy, onde precisa enxergar as tabelas de origem sem depender da RLS de
-- cada uma delas -- e nunca devolve dado, so um booleano.
create function curadoria.canonical_delivery_matches(
  p_report_id uuid,
  p_case_id uuid,
  p_patient_profile_id uuid
) returns boolean
language sql
stable
security definer
set search_path = curadoria, public
as $$
  select exists (
    select 1
    from curadoria.curadoria_reports r
    join curadoria.curated_selections s on s.id = r.curated_selection_id
    join curadoria.cases c on c.id = r.case_id
    where r.id = p_report_id
      -- entregue, e entregue depois de emitido
      and r.emitted_at is not null
      and r.delivered_at is not null
      -- a selecao que o Relatorio materializa tambem esta entregue
      and s.status = 'DELIVERED'
      and s.delivered_at is not null
      -- nenhum vinculo cruzado: Relatorio, selecao e Case sao o mesmo Case
      and s.case_id = r.case_id
      and r.case_id = p_case_id
      -- o paciente e o dono do Case, derivado do Case e nao do cliente
      and c.patient_profile_id = p_patient_profile_id
      -- autoria humana: a selecao tem um Curador nomeado
      and s.selected_by is not null
      -- exatamente tres opcoes, tres profissionais distintos
      and (select count(*) from curadoria.curadoria_report_options o where o.report_id = r.id) = 3
      and (
        select count(distinct o.professional_profile_id)
        from curadoria.curadoria_report_options o where o.report_id = r.id
      ) = 3
  );
$$;

comment on function curadoria.canonical_delivery_matches is
  'Entrega canonica valida: Relatorio emitido e entregue, selecao entregue do mesmo Case, paciente dono do Case, autoria humana, exatamente tres opcoes distintas.';

-- O profissional escolhido pertence as tres opcoes daquele Relatorio.
create function curadoria.canonical_delivery_has_professional(
  p_report_id uuid,
  p_professional_profile_id uuid
) returns boolean
language sql
stable
security definer
set search_path = curadoria, public
as $$
  select exists (
    select 1 from curadoria.curadoria_report_options o
    where o.report_id = p_report_id
      and o.professional_profile_id = p_professional_profile_id
  );
$$;

-- 3. Coerência do profissional, nas duas fontes -----------------------------

create or replace function curadoria.assert_connection_professional_in_delivery()
returns trigger language plpgsql as $$
begin
  if new.curadoria_report_id is not null then
    if not curadoria.canonical_delivery_matches(new.curadoria_report_id, new.case_id, new.patient_profile_id) then
      raise exception 'connection_records: curadoria_report_id % não representa uma entrega canônica válida para o Case % e o paciente %', new.curadoria_report_id, new.case_id, new.patient_profile_id using errcode = '23514';
    end if;
    if not curadoria.canonical_delivery_has_professional(new.curadoria_report_id, new.professional_profile_id) then
      raise exception 'professional_profile_id % não está entre as três opções entregues no Relatório %', new.professional_profile_id, new.curadoria_report_id using errcode = '23514';
    end if;
    -- Sem fallback para a tabela legada: uma ancora canonica invalida falha,
    -- nunca "tenta o outro caminho".
    return new;
  end if;

  -- Regra historica preservada, palavra por palavra, para o legado.
  if not exists (
    select 1 from curadoria.final_curadoria_deliveries d, jsonb_array_elements(d.provider_presentations) as presentation
    where d.id = new.final_curadoria_delivery_id and presentation ->> 'providerId' = new.professional_profile_id::text
  ) then
    raise exception 'professional_profile_id % não pertence aos profissionais apresentados em final_curadoria_delivery_id %', new.professional_profile_id, new.final_curadoria_delivery_id using errcode = '23514';
  end if;
  return new;
end; $$;

-- 4. RLS: o paciente cria a partir de qualquer uma das duas fontes ----------

drop policy "connection_records_insert_own_patient" on curadoria.connection_records;

create policy "connection_records_insert_own_patient" on curadoria.connection_records
for insert to authenticated
with check (
  patient_profile_id = auth.uid()
  and (
    (
      curadoria_report_id is not null
      and curadoria.canonical_delivery_matches(curadoria_report_id, connection_records.case_id, auth.uid())
    )
    or (
      final_curadoria_delivery_id is not null
      and exists (
        select 1 from curadoria.final_curadoria_deliveries d
        where d.id = connection_records.final_curadoria_delivery_id
          and d.case_id = connection_records.case_id
          and d.patient_profile_id = auth.uid()
      )
    )
  )
);

-- 5. Nascimento transacional e idempotente pela âncora canônica -------------

-- Recebe o minimo: o Relatorio e o profissional escolhido. Case e paciente sao
-- derivados aqui dentro -- o browser nunca os informa.
--
-- Idempotente por construcao: se o Case ja tem Connection, devolve a existente
-- sem criar um segundo evento. Clique repetido e retry de rede param aqui, e
-- nao no tratamento de erro do cliente.
create function curadoria.create_connection_from_report(
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
  -- Deriva Case e paciente do proprio Relatorio.
  select r.case_id, c.patient_profile_id
    into v_case_id, v_patient_profile_id
  from curadoria.curadoria_reports r
  join curadoria.cases c on c.id = r.case_id
  where r.id = p_report_id;

  if v_case_id is null then
    raise exception 'curadoria_reports: Relatório % não encontrado', p_report_id using errcode = '23503';
  end if;

  -- O ator so cria a propria Connection. A RLS repete esta checagem; aqui ela
  -- existe para a mensagem ser honesta em vez de "nenhuma linha afetada".
  if p_actor_id is distinct from v_patient_profile_id then
    raise exception 'connection_records: apenas o paciente do Caso registra a própria escolha' using errcode = '42501';
  end if;

  if not curadoria.canonical_delivery_matches(p_report_id, v_case_id, v_patient_profile_id) then
    raise exception 'connection_records: o Relatório % ainda não representa uma entrega canônica válida', p_report_id using errcode = '23514';
  end if;

  -- Retorno idempotente: mesma acao repetida nao cria segunda Connection nem
  -- segundo evento inicial.
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

  -- Corrida: outra transacao inseriu entre o select e o insert.
  if v_record.id is null then
    select * into v_record from curadoria.connection_records where case_id = v_case_id;
    return v_record;
  end if;

  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'DECISAO_REGISTRADA', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);

  return v_record;
end; $$;

grant execute on function curadoria.create_connection_from_report to authenticated;
grant execute on function curadoria.canonical_delivery_matches to authenticated;
grant execute on function curadoria.canonical_delivery_has_professional to authenticated;
