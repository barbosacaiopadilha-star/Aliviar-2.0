-- connection_records + events
create table curadoria.connection_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  final_curadoria_delivery_id uuid not null references curadoria.final_curadoria_deliveries (id),
  patient_profile_id uuid not null references curadoria.profiles (id),
  professional_profile_id uuid not null references curadoria.professional_profiles (id),
  status text not null default 'DECISAO_REGISTRADA',
  decided_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connection_records_status_check check (status in ('DECISAO_REGISTRADA','CONTATO_INICIADO','PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO'))
);
create unique index connection_records_case_id_key on curadoria.connection_records (case_id);
create index connection_records_patient_profile_id_idx on curadoria.connection_records (patient_profile_id);
create table curadoria.connection_events (
  id bigint generated always as identity primary key,
  connection_id uuid not null references curadoria.connection_records (id) on delete cascade,
  event_type text not null,
  actor_id uuid not null references curadoria.profiles (id),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint connection_events_type_check check (event_type in ('DECISAO_REGISTRADA','CORRECAO_ESCOLHA','CONTATO_INICIADO','PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO')),
  constraint connection_events_temporal_order check (recorded_at >= occurred_at)
);
create index connection_events_connection_id_idx on curadoria.connection_events (connection_id, occurred_at);

create function curadoria.assert_connection_professional_in_delivery()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from curadoria.final_curadoria_deliveries d, jsonb_array_elements(d.provider_presentations) as presentation
    where d.id = new.final_curadoria_delivery_id and presentation ->> 'providerId' = new.professional_profile_id::text
  ) then
    raise exception 'professional_profile_id % não pertence aos profissionais apresentados em final_curadoria_delivery_id %', new.professional_profile_id, new.final_curadoria_delivery_id using errcode = '23514';
  end if;
  return new;
end; $$;
create trigger connection_records_assert_professional_in_delivery before insert or update of professional_profile_id on curadoria.connection_records for each row execute function curadoria.assert_connection_professional_in_delivery();

create function curadoria.assert_connection_valid_transition()
returns trigger language plpgsql as $$
begin
  if new.professional_profile_id is distinct from old.professional_profile_id and old.status is distinct from 'DECISAO_REGISTRADA' then
    raise exception 'connection_records: correção de profissional só é permitida enquanto status = DECISAO_REGISTRADA (atual: %)', old.status using errcode = '23514';
  end if;
  if new.status is distinct from old.status then
    if old.status in ('PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: % é um estado terminal, nenhuma transição é permitida a partir dele', old.status using errcode = '23514';
    end if;
    if old.status = 'DECISAO_REGISTRADA' and new.status not in ('CONTATO_INICIADO','PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: transição de DECISAO_REGISTRADA para % não é válida', new.status using errcode = '23514';
    end if;
    if old.status = 'CONTATO_INICIADO' and new.status not in ('PRIMEIRO_ATENDIMENTO_REALIZADO','ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: transição de CONTATO_INICIADO para % não é válida', new.status using errcode = '23514';
    end if;
  end if;
  new.updated_at = now();
  return new;
end; $$;
create trigger connection_records_assert_valid_transition before update on curadoria.connection_records for each row execute function curadoria.assert_connection_valid_transition();

alter table curadoria.connection_records enable row level security;
alter table curadoria.connection_events enable row level security;
grant select, insert, update on curadoria.connection_records to authenticated;
grant all on curadoria.connection_records to service_role;
grant select, insert on curadoria.connection_events to authenticated;
grant all on curadoria.connection_events to service_role;
create policy "connection_records_select_own_patient" on curadoria.connection_records for select to authenticated using (patient_profile_id = auth.uid());
create policy "connection_records_select_admin_or_case_curator" on curadoria.connection_records for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = connection_records.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "connection_records_insert_own_patient" on curadoria.connection_records for insert to authenticated with check (patient_profile_id = auth.uid() and exists (select 1 from curadoria.final_curadoria_deliveries d where d.id = connection_records.final_curadoria_delivery_id and d.case_id = connection_records.case_id and d.patient_profile_id = auth.uid()));
create policy "connection_records_update_own_patient" on curadoria.connection_records for update to authenticated using (patient_profile_id = auth.uid()) with check (patient_profile_id = auth.uid());
create policy "connection_events_select_own_patient" on curadoria.connection_events for select to authenticated using (exists (select 1 from curadoria.connection_records cr where cr.id = connection_events.connection_id and cr.patient_profile_id = auth.uid()));
create policy "connection_events_select_admin_or_case_curator" on curadoria.connection_events for select to authenticated using (exists (select 1 from curadoria.connection_records cr join curadoria.cases c on c.id = cr.case_id where cr.id = connection_events.connection_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "connection_events_insert_own_patient" on curadoria.connection_events for insert to authenticated with check (actor_id = auth.uid() and exists (select 1 from curadoria.connection_records cr where cr.id = connection_events.connection_id and cr.patient_profile_id = auth.uid()));

create function curadoria.create_connection_with_event(p_case_id uuid, p_final_curadoria_delivery_id uuid, p_patient_profile_id uuid, p_professional_profile_id uuid, p_decided_at timestamptz, p_actor_id uuid, p_event_payload jsonb, p_occurred_at timestamptz, p_recorded_at timestamptz)
returns curadoria.connection_records language plpgsql security invoker as $$
declare v_record curadoria.connection_records;
begin
  insert into curadoria.connection_records (case_id, final_curadoria_delivery_id, patient_profile_id, professional_profile_id, status, decided_at)
  values (p_case_id, p_final_curadoria_delivery_id, p_patient_profile_id, p_professional_profile_id, 'DECISAO_REGISTRADA', p_decided_at) returning * into v_record;
  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'DECISAO_REGISTRADA', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);
  return v_record;
end; $$;
grant execute on function curadoria.create_connection_with_event to authenticated;

create function curadoria.apply_connection_transition(p_connection_id uuid, p_expected_status text, p_new_status text, p_professional_profile_id uuid, p_event_type text, p_actor_id uuid, p_payload jsonb, p_occurred_at timestamptz, p_recorded_at timestamptz)
returns curadoria.connection_records language plpgsql security invoker as $$
declare v_record curadoria.connection_records;
begin
  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_connection_id, p_event_type, p_actor_id, p_payload, p_occurred_at, p_recorded_at);
  update curadoria.connection_records set status = p_new_status, professional_profile_id = p_professional_profile_id where id = p_connection_id and status = p_expected_status returning * into v_record;
  if not found then raise exception 'connection_records: transição concorrente detectada para % (esperado %)', p_connection_id, p_expected_status using errcode = '55000'; end if;
  return v_record;
end; $$;
grant execute on function curadoria.apply_connection_transition to authenticated;

-- relationship_records + events
create table curadoria.relationship_records (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references curadoria.connection_records (id) on delete cascade,
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  patient_profile_id uuid not null references curadoria.profiles (id),
  professional_profile_id uuid not null references curadoria.professional_profiles (id),
  status text not null default 'ATIVO',
  started_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_records_status_check check (status in ('ATIVO','ENCERRADO'))
);
create unique index relationship_records_connection_id_key on curadoria.relationship_records (connection_id);
create index relationship_records_patient_profile_id_idx on curadoria.relationship_records (patient_profile_id);
create index relationship_records_case_id_idx on curadoria.relationship_records (case_id);
create table curadoria.relationship_events (
  id bigint generated always as identity primary key,
  relationship_id uuid not null references curadoria.relationship_records (id) on delete cascade,
  event_type text not null,
  actor_id uuid not null references curadoria.profiles (id),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint relationship_events_type_check check (event_type in ('RELACIONAMENTO_INICIADO','ENCERRAMENTO_PLANEJADO_DECLARADO','INTERRUPCAO_DECLARADA','REABERTURA_OBSERVADA')),
  constraint relationship_events_temporal_order check (recorded_at >= occurred_at)
);
create index relationship_events_relationship_id_idx on curadoria.relationship_events (relationship_id, occurred_at);

create function curadoria.assert_relationship_matches_connection()
returns trigger language plpgsql as $$
declare v_connection curadoria.connection_records;
begin
  select * into v_connection from curadoria.connection_records where id = new.connection_id;
  if not found then raise exception 'relationship_records: connection_id % não encontrado', new.connection_id using errcode = '23503'; end if;
  if v_connection.status is distinct from 'PRIMEIRO_ATENDIMENTO_REALIZADO' then raise exception 'relationship_records: connection_id % não está em PRIMEIRO_ATENDIMENTO_REALIZADO (atual: %)', new.connection_id, v_connection.status using errcode = '23514'; end if;
  if new.case_id is distinct from v_connection.case_id or new.patient_profile_id is distinct from v_connection.patient_profile_id or new.professional_profile_id is distinct from v_connection.professional_profile_id then
    raise exception 'relationship_records: case_id/patient_profile_id/professional_profile_id devem corresponder exatamente ao connection_id referenciado' using errcode = '23514';
  end if;
  return new;
end; $$;
create trigger relationship_records_assert_matches_connection before insert on curadoria.relationship_records for each row execute function curadoria.assert_relationship_matches_connection();

create function curadoria.assert_relationship_immutable_fields()
returns trigger language plpgsql as $$
begin
  if new.connection_id is distinct from old.connection_id then raise exception 'relationship_records: connection_id é imutável' using errcode = '23514'; end if;
  if new.case_id is distinct from old.case_id then raise exception 'relationship_records: case_id é imutável' using errcode = '23514'; end if;
  if new.patient_profile_id is distinct from old.patient_profile_id then raise exception 'relationship_records: patient_profile_id é imutável' using errcode = '23514'; end if;
  if new.professional_profile_id is distinct from old.professional_profile_id then raise exception 'relationship_records: professional_profile_id é imutável' using errcode = '23514'; end if;
  return new;
end; $$;
create trigger relationship_records_assert_immutable_fields before update on curadoria.relationship_records for each row execute function curadoria.assert_relationship_immutable_fields();

create function curadoria.assert_relationship_valid_transition()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'ENCERRADO' then raise exception 'relationship_records: % é um estado terminal', old.status using errcode = '23514'; end if;
    if old.status = 'ATIVO' and new.status not in ('ENCERRADO') then raise exception 'relationship_records: transição de ATIVO para % não é válida', new.status using errcode = '23514'; end if;
  end if;
  new.updated_at = now();
  return new;
end; $$;
create trigger relationship_records_assert_valid_transition before update on curadoria.relationship_records for each row execute function curadoria.assert_relationship_valid_transition();

alter table curadoria.relationship_records enable row level security;
alter table curadoria.relationship_events enable row level security;
grant select, insert, update on curadoria.relationship_records to authenticated;
grant all on curadoria.relationship_records to service_role;
grant select, insert on curadoria.relationship_events to authenticated;
grant all on curadoria.relationship_events to service_role;
create policy "relationship_records_select_own_patient" on curadoria.relationship_records for select to authenticated using (patient_profile_id = auth.uid());
create policy "relationship_records_select_admin_or_case_curator" on curadoria.relationship_records for select to authenticated using (exists (select 1 from curadoria.cases c where c.id = relationship_records.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "relationship_records_insert_own_patient" on curadoria.relationship_records for insert to authenticated with check (patient_profile_id = auth.uid() and exists (select 1 from curadoria.connection_records cr where cr.id = relationship_records.connection_id and cr.patient_profile_id = auth.uid() and cr.status = 'PRIMEIRO_ATENDIMENTO_REALIZADO'));
create policy "relationship_records_update_own_patient" on curadoria.relationship_records for update to authenticated using (patient_profile_id = auth.uid()) with check (patient_profile_id = auth.uid());
create policy "relationship_records_update_admin_or_case_curator" on curadoria.relationship_records for update to authenticated using (exists (select 1 from curadoria.cases c where c.id = relationship_records.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid()))) with check (exists (select 1 from curadoria.cases c where c.id = relationship_records.case_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "relationship_events_select_own_patient" on curadoria.relationship_events for select to authenticated using (exists (select 1 from curadoria.relationship_records rr where rr.id = relationship_events.relationship_id and rr.patient_profile_id = auth.uid()));
create policy "relationship_events_select_admin_or_case_curator" on curadoria.relationship_events for select to authenticated using (exists (select 1 from curadoria.relationship_records rr join curadoria.cases c on c.id = rr.case_id where rr.id = relationship_events.relationship_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));
create policy "relationship_events_insert_patient_events" on curadoria.relationship_events for insert to authenticated with check (actor_id = auth.uid() and event_type in ('RELACIONAMENTO_INICIADO','ENCERRAMENTO_PLANEJADO_DECLARADO','INTERRUPCAO_DECLARADA') and exists (select 1 from curadoria.relationship_records rr where rr.id = relationship_events.relationship_id and rr.patient_profile_id = auth.uid()));
create policy "relationship_events_insert_team_events" on curadoria.relationship_events for insert to authenticated with check (actor_id = auth.uid() and event_type in ('INTERRUPCAO_DECLARADA','REABERTURA_OBSERVADA') and exists (select 1 from curadoria.relationship_records rr join curadoria.cases c on c.id = rr.case_id where rr.id = relationship_events.relationship_id and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())));

create function curadoria.create_relationship_with_event(p_connection_id uuid, p_actor_id uuid, p_event_payload jsonb, p_occurred_at timestamptz, p_recorded_at timestamptz)
returns curadoria.relationship_records language plpgsql security invoker as $$
declare v_connection curadoria.connection_records; v_record curadoria.relationship_records;
begin
  select * into v_connection from curadoria.connection_records where id = p_connection_id;
  if not found then raise exception 'relationship_records: connection_id % não encontrado', p_connection_id using errcode = '23503'; end if;
  if v_connection.status is distinct from 'PRIMEIRO_ATENDIMENTO_REALIZADO' then raise exception 'relationship_records: connection_id % não está em PRIMEIRO_ATENDIMENTO_REALIZADO (atual: %)', p_connection_id, v_connection.status using errcode = '23514'; end if;
  insert into curadoria.relationship_records (connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at)
  values (v_connection.id, v_connection.case_id, v_connection.patient_profile_id, v_connection.professional_profile_id, 'ATIVO', p_occurred_at) returning * into v_record;
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_record.id, 'RELACIONAMENTO_INICIADO', p_actor_id, p_event_payload, p_occurred_at, p_recorded_at);
  return v_record;
end; $$;
grant execute on function curadoria.create_relationship_with_event to authenticated;

create function curadoria.apply_relationship_transition(p_relationship_id uuid, p_expected_status text, p_new_status text, p_event_type text, p_actor_id uuid, p_payload jsonb, p_occurred_at timestamptz, p_recorded_at timestamptz)
returns curadoria.relationship_records language plpgsql security invoker as $$
declare v_record curadoria.relationship_records;
begin
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_relationship_id, p_event_type, p_actor_id, p_payload, p_occurred_at, p_recorded_at);
  update curadoria.relationship_records set status = p_new_status where id = p_relationship_id and status = p_expected_status returning * into v_record;
  if not found then raise exception 'relationship_records: transição concorrente detectada para % (esperado %)', p_relationship_id, p_expected_status using errcode = '55000'; end if;
  return v_record;
end; $$;
grant execute on function curadoria.apply_relationship_transition to authenticated;

create function curadoria.register_relationship_reopening(p_relationship_id uuid, p_new_case_id uuid, p_actor_id uuid, p_payload jsonb, p_occurred_at timestamptz, p_recorded_at timestamptz)
returns curadoria.relationship_events language plpgsql security invoker as $$
declare v_relationship curadoria.relationship_records; v_event curadoria.relationship_events; v_final_payload jsonb;
begin
  select * into v_relationship from curadoria.relationship_records where id = p_relationship_id;
  if not found then raise exception 'relationship_events: relationship_id % não encontrado', p_relationship_id using errcode = '23503'; end if;
  if v_relationship.status <> 'ENCERRADO' then raise exception 'relationship_events: reabertura só pode ser registrada contra um Relationship terminal (atual: %)', v_relationship.status using errcode = '23514'; end if;
  if not exists (select 1 from curadoria.cases where id = p_new_case_id) then raise exception 'relationship_events: novo Caso % não encontrado', p_new_case_id using errcode = '23503'; end if;
  v_final_payload := coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('newCaseId', p_new_case_id);
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_relationship_id, 'REABERTURA_OBSERVADA', p_actor_id, v_final_payload, p_occurred_at, p_recorded_at) returning * into v_event;
  return v_event;
end; $$;
grant execute on function curadoria.register_relationship_reopening to authenticated;

create function curadoria.confirm_first_appointment_and_birth_relationship(p_connection_id uuid, p_expected_status text, p_actor_id uuid, p_connection_event_payload jsonb, p_relationship_event_payload jsonb, p_occurred_at timestamptz, p_recorded_at timestamptz)
returns table (connection_record curadoria.connection_records, relationship_record curadoria.relationship_records) language plpgsql security invoker as $$
declare v_connection curadoria.connection_records; v_relationship curadoria.relationship_records;
begin
  insert into curadoria.connection_events (connection_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (p_connection_id, 'PRIMEIRO_ATENDIMENTO_REALIZADO', p_actor_id, p_connection_event_payload, p_occurred_at, p_recorded_at);
  update curadoria.connection_records set status = 'PRIMEIRO_ATENDIMENTO_REALIZADO' where id = p_connection_id and status = p_expected_status returning * into v_connection;
  if not found then raise exception 'connection_records: transição concorrente detectada para % (esperado %)', p_connection_id, p_expected_status using errcode = '55000'; end if;
  insert into curadoria.relationship_records (connection_id, case_id, patient_profile_id, professional_profile_id, status, started_at)
  values (v_connection.id, v_connection.case_id, v_connection.patient_profile_id, v_connection.professional_profile_id, 'ATIVO', p_occurred_at) returning * into v_relationship;
  insert into curadoria.relationship_events (relationship_id, event_type, actor_id, payload, occurred_at, recorded_at)
  values (v_relationship.id, 'RELACIONAMENTO_INICIADO', p_actor_id, p_relationship_event_payload, p_occurred_at, p_recorded_at);
  return query select v_connection, v_relationship;
end; $$;
grant execute on function curadoria.confirm_first_appointment_and_birth_relationship to authenticated;