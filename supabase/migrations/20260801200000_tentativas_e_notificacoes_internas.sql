-- Incremento 2 da Continuidade Pós-Decisão (ADR-044 + decisão P6).
--
-- Três conceitos, três estruturas, e a distinção precisa sobreviver a toda
-- evolução futura: o fato cria trabalho; o trabalho pode gerar notificação;
-- a notificação nunca cria o fato nem a responsabilidade.
--
--   approach_attempts  — a tentativa (fato, cardinalidade N por Connection)
--   team_notifications — a atenção (evidência, nunca fonte de verdade)
--   trabalho pendente  — projeção derivada, SEM tabela
--
-- Propriedade que esta migration existe para garantir: transferir o Case muda
-- quem enxerga e responde, e NÃO reescreve a história da tentativa nem da
-- notificação. Nenhuma das duas tabelas guarda responsabilidade — ela vive só
-- em `cases`, e a visibilidade é recalculada por can_access_case a cada leitura.
--
-- O que esta migration NÃO faz: canal externo, SLA, expiração, "sem resposta"
-- por tempo, Temporary Access, acesso do profissional, troca de profissional,
-- pausa por segurança, tabela de tarefa, fila por papel, e nenhuma alteração
-- em Relationship, na área da paciente ou no Incremento 1.

-- ---------------------------------------------------------------------------
-- 1. Eventos da tentativa — aditivo, nenhum valor removido
-- ---------------------------------------------------------------------------

alter table curadoria.connection_events
  drop constraint if exists connection_events_type_check;

alter table curadoria.connection_events
  add constraint connection_events_type_check
  check (event_type in (
    'DECISAO_REGISTRADA',
    'CORRECAO_ESCOLHA',
    'CONTATO_INICIADO',
    'PRIMEIRO_ATENDIMENTO_REALIZADO',
    'ENCERRADO_SEM_RELACIONAMENTO',
    'MODO_CONTATO_DEFINIDO',
    -- Incremento 2. Nenhum destes altera a escolha da paciente, seleciona
    -- outro profissional, inicia Relationship ou encerra a Connection.
    'TENTATIVA_CRIADA',
    'TENTATIVA_DESPACHADA',
    'PROFISSIONAL_DISPONIVEL',
    'PROFISSIONAL_INDISPONIVEL',
    'TENTATIVA_CANCELADA'
  ));

-- ---------------------------------------------------------------------------
-- 2. approach_attempts — a tentativa de aproximação
-- ---------------------------------------------------------------------------

create table if not exists curadoria.approach_attempts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  connection_id uuid not null references curadoria.connection_records (id) on delete cascade,
  professional_profile_id uuid not null references curadoria.professional_profiles (id),
  -- Quem EXECUTOU a ação. Nunca quem responde pelo Case: isso vive em
  -- `cases.responsible_id` e não ganha cópia aqui.
  actor_id uuid not null references curadoria.profiles (id),
  contact_mode text not null,
  status text not null default 'CRIADA',
  response_kind text,
  response_source text,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  responded_at timestamptz,
  cancelled_at timestamptz,
  receipt_verified_at timestamptz,

  -- Só existe tentativa no modo em que a Aliviar age. No contato direto
  -- acompanhado quem contata é a paciente, e não há o que despachar.
  constraint approach_attempts_modo_intermediado
    check (contact_mode = 'APROXIMACAO_INTERMEDIADA'),

  constraint approach_attempts_status_check
    check (status in ('CRIADA', 'DESPACHADA', 'RESPONDIDA', 'CANCELADA')),

  -- Desfecho verificável, nunca estado de espera. "Disponível" e
  -- "indisponível" são o QUE a resposta disse, não o estado da tentativa.
  constraint approach_attempts_response_kind_check
    check (response_kind is null or response_kind in ('PODE_RECEBER_CONTATO', 'INDISPONIVEL')),

  constraint approach_attempts_response_source_check
    check (response_source is null or response_source in ('PROFISSIONAL', 'RELATO_CONCIERGE', 'RELATO_PACIENTE')),

  -- Coerência entre status e marcos temporais: um estado que não pode ser
  -- comprovado pelos próprios carimbos é um estado inventado.
  constraint approach_attempts_status_coerente check (
    case status
      when 'CRIADA' then
        dispatched_at is null and responded_at is null and cancelled_at is null
        and response_kind is null and receipt_verified_at is null
      when 'DESPACHADA' then
        dispatched_at is not null and responded_at is null and cancelled_at is null
        and response_kind is null
      when 'RESPONDIDA' then
        dispatched_at is not null and responded_at is not null and cancelled_at is null
        and response_kind is not null and response_source is not null
      when 'CANCELADA' then
        cancelled_at is not null and responded_at is null and response_kind is null
      else false
    end
  ),

  -- Recebimento é atributo opcional, verificável só em alguns canais — nunca
  -- um estado que se possa afirmar por padrão.
  constraint approach_attempts_recibo_exige_despacho
    check (receipt_verified_at is null or dispatched_at is not null)
);

create index if not exists approach_attempts_connection_idx
  on curadoria.approach_attempts (connection_id, created_at desc);
create index if not exists approach_attempts_case_idx
  on curadoria.approach_attempts (case_id);

-- Uma tentativa aberta por vez. Múltiplas tentativas são a razão de existir
-- desta tabela — mas duas abertas simultaneamente seriam ambiguidade, não
-- histórico. Fechada a anterior, a próxima é linha nova.
create unique index if not exists approach_attempts_uma_aberta_por_connection
  on curadoria.approach_attempts (connection_id)
  where status in ('CRIADA', 'DESPACHADA');

comment on table curadoria.approach_attempts is
  'Tentativas de aproximação com o profissional (ADR-044). Cardinalidade N por Connection: nova tentativa é linha nova, nunca reabertura — o histórico das tentativas é a evidência do que foi feito. Ausência de resposta NÃO é estado: é ausência de fato, e distingui-la de indisponibilidade exigiria regra temporal que não existe.';

comment on column curadoria.approach_attempts.actor_id is
  'Quem executou a ação. NÃO é quem responde pelo Case — essa é fonte única de cases.responsible_id e não tem cópia aqui.';

comment on column curadoria.approach_attempts.response_kind is
  'Desfecho da resposta, quando houve resposta. Indisponibilidade nunca altera professional_profile_id nem seleciona substituto.';

-- Coerência com a Connection: mesmo Case, mesmo profissional, e modo
-- intermediado de fato registrado. Mesma família de guarda do
-- assert_connection_professional_in_delivery.
create or replace function curadoria.assert_attempt_matches_connection()
returns trigger language plpgsql as $$
declare v_connection curadoria.connection_records;
begin
  select * into v_connection from curadoria.connection_records where id = new.connection_id;

  if not found then
    raise exception 'approach_attempts: Connection % não encontrada', new.connection_id using errcode = '23503';
  end if;

  if v_connection.case_id is distinct from new.case_id then
    raise exception 'approach_attempts: case_id não corresponde ao Case da Connection' using errcode = '23514';
  end if;

  if v_connection.professional_profile_id is distinct from new.professional_profile_id then
    raise exception 'approach_attempts: a tentativa só pode ser dirigida ao profissional que a paciente escolheu' using errcode = '23514';
  end if;

  if v_connection.contact_mode is distinct from 'APROXIMACAO_INTERMEDIADA' then
    raise exception 'approach_attempts: só existe tentativa quando a paciente pediu que a Aliviar fizesse a aproximação (modo atual: %)', coalesce(v_connection.contact_mode, 'não definido') using errcode = '23514';
  end if;

  if v_connection.status is distinct from 'DECISAO_REGISTRADA' then
    raise exception 'approach_attempts: a Connection não admite nova tentativa neste estado (%)', v_connection.status using errcode = '23514';
  end if;

  return new;
end; $$;

create trigger approach_attempts_assert_matches_connection
  before insert on curadoria.approach_attempts
  for each row execute function curadoria.assert_attempt_matches_connection();

-- Imutabilidade do que já aconteceu: uma tentativa avança, nunca regride, e
-- não muda de Connection nem de profissional no caminho.
create or replace function curadoria.assert_attempt_valid_transition()
returns trigger language plpgsql as $$
begin
  if new.connection_id is distinct from old.connection_id
     or new.case_id is distinct from old.case_id
     or new.professional_profile_id is distinct from old.professional_profile_id then
    raise exception 'approach_attempts: vínculo da tentativa é imutável' using errcode = '23514';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('RESPONDIDA', 'CANCELADA') then
      raise exception 'approach_attempts: % é estado terminal desta tentativa; uma nova tentativa é uma linha nova', old.status using errcode = '23514';
    end if;
    if old.status = 'CRIADA' and new.status not in ('DESPACHADA', 'CANCELADA') then
      raise exception 'approach_attempts: transição de CRIADA para % não é válida', new.status using errcode = '23514';
    end if;
    if old.status = 'DESPACHADA' and new.status not in ('RESPONDIDA', 'CANCELADA') then
      raise exception 'approach_attempts: transição de DESPACHADA para % não é válida', new.status using errcode = '23514';
    end if;
  end if;

  return new;
end; $$;

create trigger approach_attempts_assert_valid_transition
  before update on curadoria.approach_attempts
  for each row execute function curadoria.assert_attempt_valid_transition();

-- ---------------------------------------------------------------------------
-- 3. team_notifications — a atenção, nunca a obrigação
-- ---------------------------------------------------------------------------

create table if not exists curadoria.team_notifications (
  id uuid primary key default gen_random_uuid(),
  -- A âncora de autorização. É o que torna a decisão P6 real: a notificação
  -- é DO CASE, e quem responde pelo Case o próprio Case já diz.
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  connection_id uuid references curadoria.connection_records (id) on delete cascade,
  approach_attempt_id uuid references curadoria.approach_attempts (id) on delete cascade,
  kind text not null,
  -- Por (fato, Case) — nunca por responsável. Reatribuir não é fato novo, e
  -- por isso não gera notificação nova.
  deduplication_key text not null,
  -- INERTE. Evidência de a quem a atenção se dirigiu à época; jamais condição
  -- de acesso. Se um dia aparecer numa cláusula `using`, a decisão P6 foi
  -- revertida sem ADR.
  recipient_user_id uuid references curadoria.profiles (id),
  created_by uuid references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  read_by uuid references curadoria.profiles (id),
  archived_at timestamptz,
  archived_by uuid references curadoria.profiles (id),

  constraint team_notifications_kind_check check (kind in (
    'DECISAO_REGISTRADA',
    'MODO_CONTATO_DEFINIDO',
    'TENTATIVA_DESPACHADA',
    'PROFISSIONAL_DISPONIVEL',
    'PROFISSIONAL_INDISPONIVEL',
    'TENTATIVA_CANCELADA'
  )),
  constraint team_notifications_leitura_coerente
    check ((read_at is null) = (read_by is null)),
  constraint team_notifications_arquivamento_coerente
    check ((archived_at is null) = (archived_by is null))
);

create unique index if not exists team_notifications_dedup_key
  on curadoria.team_notifications (deduplication_key);
create index if not exists team_notifications_case_idx
  on curadoria.team_notifications (case_id, created_at desc);
-- A caixa: o que ainda não foi visto.
create index if not exists team_notifications_nao_lidas_idx
  on curadoria.team_notifications (case_id)
  where read_at is null and archived_at is null;

comment on table curadoria.team_notifications is
  'Notificação interna da equipe (ADR-044 + P6). É mecanismo de atenção e evidência operacional: NÃO é fonte de verdade do fato, NÃO cria responsabilidade, NÃO prova execução. Apagar esta tabela inteira não muda quem responde por nenhum Case. Visibilidade deriva de can_access_case(case_id) — nunca de recipient_user_id, nunca de papel.';

comment on column curadoria.team_notifications.recipient_user_id is
  'INERTE — evidência de a quem a atenção se dirigiu no momento da criação. Nunca concede acesso e nunca impede o novo responsável de ler. Após uma transferência, permanece como auditoria e não é reescrito.';

comment on column curadoria.team_notifications.deduplication_key is
  'Derivada de (fato, Case). Reatribuição não é fato novo e não gera notificação nova.';

-- ---------------------------------------------------------------------------
-- 4. RLS — a mesma âncora do Incremento 1
--
-- can_access_case: administrador, responsável ATUAL e Curador designado.
-- Quem já entregou o Case não continua enxergando — e é isso que faz a
-- reatribuição funcionar sem nenhuma escrita nestas tabelas.
-- ---------------------------------------------------------------------------

alter table curadoria.approach_attempts enable row level security;
alter table curadoria.team_notifications enable row level security;

grant select, insert, update on curadoria.approach_attempts to authenticated;
grant select, insert, update on curadoria.team_notifications to authenticated;
grant all on curadoria.approach_attempts to service_role;
grant all on curadoria.team_notifications to service_role;

create policy approach_attempts_select_case
  on curadoria.approach_attempts for select to authenticated
  using (curadoria.can_access_case(case_id));

create policy approach_attempts_insert_case
  on curadoria.approach_attempts for insert to authenticated
  with check (curadoria.can_access_case(case_id) and actor_id = auth.uid());

create policy approach_attempts_update_case
  on curadoria.approach_attempts for update to authenticated
  using (curadoria.can_access_case(case_id))
  with check (curadoria.can_access_case(case_id));

create policy team_notifications_select_case
  on curadoria.team_notifications for select to authenticated
  using (curadoria.can_access_case(case_id));

create policy team_notifications_insert_case
  on curadoria.team_notifications for insert to authenticated
  with check (curadoria.can_access_case(case_id));

create policy team_notifications_update_case
  on curadoria.team_notifications for update to authenticated
  using (curadoria.can_access_case(case_id))
  with check (curadoria.can_access_case(case_id));

-- A equipe passa a escrever eventos de Connection — mas SÓ os da tentativa.
--
-- Até aqui, `connection_events_insert_own_patient` era a única porta de
-- escrita, e isso não é acidente: DECISAO_REGISTRADA, CORRECAO_ESCOLHA,
-- CONTATO_INICIADO, PRIMEIRO_ATENDIMENTO_REALIZADO e
-- ENCERRADO_SEM_RELACIONAMENTO são declarações da paciente sobre a própria
-- vida, e ninguém as faz por ela.
--
-- Os fatos da tentativa são nossos: quem despachou fomos nós, quem cancelou
-- fomos nós. Por isso a segunda porta existe — e é do tamanho exato desses
-- fatos. Abrir a tabela inteira permitiria à equipe declarar, em nome dela,
-- que ela iniciou o contato.
create policy connection_events_insert_continuidade
  on curadoria.connection_events for insert to authenticated
  with check (
    actor_id = auth.uid()
    and event_type in (
      'TENTATIVA_CRIADA',
      'TENTATIVA_DESPACHADA',
      'PROFISSIONAL_DISPONIVEL',
      'PROFISSIONAL_INDISPONIVEL',
      'TENTATIVA_CANCELADA'
    )
    and exists (
      select 1
      from curadoria.connection_records cr
      where cr.id = connection_events.connection_id
        and curadoria.can_access_case(cr.case_id)
    )
  );

comment on policy connection_events_insert_continuidade on curadoria.connection_events is
  'Segunda porta de escrita em connection_events, do tamanho exato dos fatos da equipe. Os cinco eventos que são declaração da paciente permanecem exclusivos dela: nenhuma cláusula aqui os alcança.';

comment on policy team_notifications_select_case on curadoria.team_notifications is
  'Leitura pelo vínculo ATUAL com o Case. Nenhuma referência a recipient_user_id nem a papel: outro Concierge não lê, o ex-responsável perde o acesso na transferência, e a paciente nunca lê notificação interna.';

-- ---------------------------------------------------------------------------
-- 5. RPCs — tentativa e notificação na mesma transação
--
-- security invoker: a RLS continua sendo a autoridade. Quem não pode escrever
-- na linha simplesmente não escreve.
-- ---------------------------------------------------------------------------

-- Notificação idempotente: a mesma chave nunca produz duas linhas.
create or replace function curadoria.upsert_team_notification(
  p_case_id uuid,
  p_connection_id uuid,
  p_attempt_id uuid,
  p_kind text,
  p_dedup_key text,
  p_recipient_user_id uuid,
  p_created_by uuid
)
returns void
language sql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
  insert into curadoria.team_notifications (
    case_id, connection_id, approach_attempt_id, kind,
    deduplication_key, recipient_user_id, created_by
  ) values (
    p_case_id, p_connection_id, p_attempt_id, p_kind,
    p_dedup_key, p_recipient_user_id, p_created_by
  )
  on conflict (deduplication_key) do nothing;
$function$;

create or replace function curadoria.create_approach_attempt(
  p_connection_id uuid,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns curadoria.approach_attempts
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  v_connection curadoria.connection_records;
  v_attempt curadoria.approach_attempts;
begin
  select * into v_connection from curadoria.connection_records where id = p_connection_id;
  if not found then
    raise exception 'approach_attempts: Connection não encontrada' using errcode = '02000';
  end if;

  insert into curadoria.approach_attempts (
    case_id, connection_id, professional_profile_id, actor_id, contact_mode, status
  ) values (
    v_connection.case_id, p_connection_id, v_connection.professional_profile_id,
    p_actor_id, v_connection.contact_mode, 'CRIADA'
  )
  returning * into v_attempt;

  insert into curadoria.connection_events (
    connection_id, event_type, actor_id, payload, occurred_at, recorded_at
  ) values (
    p_connection_id, 'TENTATIVA_CRIADA', p_actor_id,
    jsonb_build_object('attemptId', v_attempt.id), p_occurred_at, p_recorded_at
  );

  return v_attempt;
end;
$function$;

create or replace function curadoria.dispatch_approach_attempt(
  p_attempt_id uuid,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns curadoria.approach_attempts
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare v_attempt curadoria.approach_attempts;
begin
  select * into v_attempt from curadoria.approach_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'approach_attempts: tentativa não encontrada' using errcode = '02000';
  end if;

  -- Idempotência: despachar o que já foi despachado não é erro nem fato novo.
  if v_attempt.status = 'DESPACHADA' then
    return v_attempt;
  end if;

  if v_attempt.status is distinct from 'CRIADA' then
    raise exception 'approach_attempts: só uma tentativa em CRIADA pode ser despachada (atual: %)', v_attempt.status using errcode = '55000';
  end if;

  update curadoria.approach_attempts
  set status = 'DESPACHADA', dispatched_at = p_occurred_at
  where id = p_attempt_id
  returning * into v_attempt;

  insert into curadoria.connection_events (
    connection_id, event_type, actor_id, payload, occurred_at, recorded_at
  ) values (
    v_attempt.connection_id, 'TENTATIVA_DESPACHADA', p_actor_id,
    jsonb_build_object('attemptId', v_attempt.id), p_occurred_at, p_recorded_at
  );

  perform curadoria.upsert_team_notification(
    v_attempt.case_id, v_attempt.connection_id, v_attempt.id,
    'TENTATIVA_DESPACHADA',
    'TENTATIVA_DESPACHADA:' || v_attempt.id::text,
    null, p_actor_id
  );

  return v_attempt;
end;
$function$;

create or replace function curadoria.respond_approach_attempt(
  p_attempt_id uuid,
  p_response_kind text,
  p_response_source text,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns curadoria.approach_attempts
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  v_attempt curadoria.approach_attempts;
  v_event text;
begin
  select * into v_attempt from curadoria.approach_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'approach_attempts: tentativa não encontrada' using errcode = '02000';
  end if;

  -- Idempotência: mesma resposta, mesmo desfecho, nenhum fato novo.
  if v_attempt.status = 'RESPONDIDA' and v_attempt.response_kind = p_response_kind then
    return v_attempt;
  end if;

  if v_attempt.status is distinct from 'DESPACHADA' then
    raise exception 'approach_attempts: só uma tentativa DESPACHADA pode receber resposta (atual: %)', v_attempt.status using errcode = '55000';
  end if;

  update curadoria.approach_attempts
  set status = 'RESPONDIDA',
      responded_at = p_occurred_at,
      response_kind = p_response_kind,
      response_source = p_response_source
  where id = p_attempt_id
  returning * into v_attempt;

  v_event := case p_response_kind
    when 'PODE_RECEBER_CONTATO' then 'PROFISSIONAL_DISPONIVEL'
    else 'PROFISSIONAL_INDISPONIVEL'
  end;

  insert into curadoria.connection_events (
    connection_id, event_type, actor_id, payload, occurred_at, recorded_at
  ) values (
    v_attempt.connection_id, v_event, p_actor_id,
    jsonb_build_object('attemptId', v_attempt.id, 'responseSource', p_response_source),
    p_occurred_at, p_recorded_at
  );

  perform curadoria.upsert_team_notification(
    v_attempt.case_id, v_attempt.connection_id, v_attempt.id,
    v_event, v_event || ':' || v_attempt.id::text, null, p_actor_id
  );

  return v_attempt;
end;
$function$;

create or replace function curadoria.cancel_approach_attempt(
  p_attempt_id uuid,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns curadoria.approach_attempts
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare v_attempt curadoria.approach_attempts;
begin
  select * into v_attempt from curadoria.approach_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'approach_attempts: tentativa não encontrada' using errcode = '02000';
  end if;

  if v_attempt.status = 'CANCELADA' then
    return v_attempt;
  end if;

  if v_attempt.status not in ('CRIADA', 'DESPACHADA') then
    raise exception 'approach_attempts: tentativa em % não pode ser cancelada', v_attempt.status using errcode = '55000';
  end if;

  update curadoria.approach_attempts
  set status = 'CANCELADA', cancelled_at = p_occurred_at
  where id = p_attempt_id
  returning * into v_attempt;

  insert into curadoria.connection_events (
    connection_id, event_type, actor_id, payload, occurred_at, recorded_at
  ) values (
    v_attempt.connection_id, 'TENTATIVA_CANCELADA', p_actor_id,
    jsonb_build_object('attemptId', v_attempt.id), p_occurred_at, p_recorded_at
  );

  perform curadoria.upsert_team_notification(
    v_attempt.case_id, v_attempt.connection_id, v_attempt.id,
    'TENTATIVA_CANCELADA', 'TENTATIVA_CANCELADA:' || v_attempt.id::text, null, p_actor_id
  );

  return v_attempt;
end;
$function$;

comment on function curadoria.create_approach_attempt(uuid, uuid, timestamptz, timestamptz) is
  'Cria a tentativa e o evento na mesma transação. security invoker: a RLS decide quem pode. A tentativa nunca altera a escolha da paciente, não inicia Relationship e não encerra a Connection.';

comment on function curadoria.cancel_approach_attempt(uuid, uuid, timestamptz, timestamptz) is
  'Cancela a tentativa. Cancelar uma tentativa NÃO encerra a Connection — a Connection permanece exatamente onde estava, e uma nova tentativa é linha nova.';

revoke execute on function curadoria.upsert_team_notification(uuid, uuid, uuid, text, text, uuid, uuid) from public;
revoke execute on function curadoria.create_approach_attempt(uuid, uuid, timestamptz, timestamptz) from public;
revoke execute on function curadoria.dispatch_approach_attempt(uuid, uuid, timestamptz, timestamptz) from public;
revoke execute on function curadoria.respond_approach_attempt(uuid, text, text, uuid, timestamptz, timestamptz) from public;
revoke execute on function curadoria.cancel_approach_attempt(uuid, uuid, timestamptz, timestamptz) from public;

grant execute on function curadoria.upsert_team_notification(uuid, uuid, uuid, text, text, uuid, uuid) to authenticated;
grant execute on function curadoria.create_approach_attempt(uuid, uuid, timestamptz, timestamptz) to authenticated;
grant execute on function curadoria.dispatch_approach_attempt(uuid, uuid, timestamptz, timestamptz) to authenticated;
grant execute on function curadoria.respond_approach_attempt(uuid, text, text, uuid, timestamptz, timestamptz) to authenticated;
grant execute on function curadoria.cancel_approach_attempt(uuid, uuid, timestamptz, timestamptz) to authenticated;
