-- RELATIONSHIP ENGINE — MVP — PR1 (camada de persistência).
-- Especificação-fonte: docs/architecture/DOMAIN_RELATIONSHIP.md (Veredito
-- A, Fase 4.1) e docs/architecture/RELATIONSHIP_TECHNICAL_ARCHITECTURE.md.
-- Modelo híbrido (mesmo padrão já em produção em cases/case_notes e
-- connection_records/connection_events): estado atual denormalizado em
-- relationship_records + histórico append-only em relationship_events.
--
-- [CORRIGIDO — Fase 6.1] Esta migration nunca foi commitada — não é
-- "histórica" (docs/DECISIONS.md ADR-007: banco local é descartável).
-- Editada diretamente, em vez de corrigida por migration nova, porque
-- construída sobre uma teoria de Relationship anterior à Fase 4.1: tinha
-- quatro estados (ATIVO/PAUSADO/ENCERRADO_PLANEJADO/
-- ENCERRADO_POR_INTERRUPCAO). A teoria definitiva rejeita PAUSADO como
-- estado (nenhuma consequência de domínio própria comprovada) e exige um
-- único estado terminal ENCERRADO — o motivo (planejado/interrupção) vive
-- só no evento, nunca no estado.
--
-- Relationship nasce mecanicamente de um ConnectionRecord em
-- PRIMEIRO_ATENDIMENTO_REALIZADO (relação 1:1 via connection_id) — nunca de
-- qualquer outro estado do Connection. Nenhuma alteração é feita em
-- connection_records/connection_events por esta migration; apenas leitura.
--
-- Escopo estritamente limitado a: migration, estrutura, constraints, RLS,
-- índices e as funções transacionais de atomicidade (Fase 3, Etapa 9/10).
-- Nenhum domínio puro, repository, Server Action, componente ou integração
-- com Compatibility Intelligence é implementado aqui. ExperienceSignal
-- continua pertencendo exclusivamente ao CI — nenhuma tabela ou lógica sua
-- existe nesta migration.

create table public.relationship_records (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connection_records (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id),
  professional_profile_id uuid not null references public.professional_profiles (id),
  status text not null default 'ATIVO',
  started_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_records_status_check
    check (status in ('ATIVO', 'ENCERRADO'))
);

comment on table public.relationship_records is 'Relationship (MVP) — acompanhamento longitudinal do vínculo paciente-profissional após o primeiro atendimento confirmado em Connection. Um único registro por Connection (relação 1:1) — nunca reaberto após o estado terminal ENCERRADO; reabertura é sempre um evento novo (REABERTURA_OBSERVADA em relationship_events), nunca uma transição de status. Nunca escreve em connection_records, cases, final_curadoria_deliveries, ou qualquer artefato do ACE/CI.';
comment on column public.relationship_records.connection_id is 'Origem exclusiva do nascimento — sempre um ConnectionRecord já em PRIMEIRO_ATENDIMENTO_REALIZADO no momento da criação (validado por trigger e pela função de criação). Imutável.';
comment on column public.relationship_records.case_id is 'Herdado do Connection na criação, denormalizado para leitura direta e para RLS de equipe/admin — nunca a chave de unicidade (essa é connection_id).';
comment on column public.relationship_records.professional_profile_id is 'Herdado do Connection na criação — imutável para sempre (Fase 3/Etapa 3: "impossibilidade de troca de profissional dentro do mesmo Relationship"). Trocar de profissional é sempre um novo Caso/Connection/Relationship.';
comment on column public.relationship_records.started_at is 'Momento real do nascimento — o occurred_at do evento PRIMEIRO_ATENDIMENTO_REALIZADO do Connection de origem, nunca o created_at (momento de registro), mesma Teoria da Temporalidade já usada em Connection.';

create unique index relationship_records_connection_id_key on public.relationship_records (connection_id);
create index relationship_records_patient_profile_id_idx on public.relationship_records (patient_profile_id);
create index relationship_records_case_id_idx on public.relationship_records (case_id);

-- Histórico append-only — nunca update, nunca delete (mesmo padrão de
-- connection_events/case_notes: a imutabilidade é garantida pela ausência
-- dessas policies, não por disciplina de aplicação).
create table public.relationship_events (
  id bigint generated always as identity primary key,
  relationship_id uuid not null references public.relationship_records (id) on delete cascade,
  event_type text not null,
  actor_id uuid not null references public.profiles (id),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint relationship_events_type_check
    check (event_type in ('RELACIONAMENTO_INICIADO', 'ENCERRAMENTO_PLANEJADO_DECLARADO', 'INTERRUPCAO_DECLARADA', 'REABERTURA_OBSERVADA')),
  constraint relationship_events_temporal_order
    check (recorded_at >= occurred_at)
);

comment on table public.relationship_events is 'Histórico append-only de eventos de um RelationshipRecord (mesma Teoria dos Eventos e Temporalidade de Connection & Relationship Fase 2) — nunca editado ou apagado. occurred_at é o momento real do fato; recorded_at é o momento em que o sistema o registrou. payload nunca carrega conteúdo clínico ou de compatibilidade — apenas dados estruturais do próprio evento (ex.: newCaseId em REABERTURA_OBSERVADA, sempre incluído pela função de registro, nunca confiado ao chamador).';
comment on column public.relationship_events.event_type is 'RELACIONAMENTO_INICIADO: derivado mecanicamente do Connection, nunca declarado por humano. ENCERRAMENTO_PLANEJADO_DECLARADO: autoria exclusiva do paciente. INTERRUPCAO_DECLARADA: paciente ou equipe (única exceção de autoria dupla). Ambos levam relationship_records.status a ENCERRADO — a distinção é só o tipo de evento, nunca um estado próprio. REABERTURA_OBSERVADA: autoria exclusiva da equipe, só contra um Relationship já terminal, nunca altera relationship_records.status.';

create index relationship_events_relationship_id_idx on public.relationship_events (relationship_id, occurred_at);

-- Garante, no nível do banco, que um relationship_records só nasce de um
-- Connection realmente em PRIMEIRO_ATENDIMENTO_REALIZADO, e que os quatro
-- campos herdados (case_id/patient_profile_id/professional_profile_id)
-- correspondem exatamente ao connection_id referenciado — nunca confiado
-- apenas à função de criação (segunda barreira redundante e intencional,
-- mesmo princípio já usado em assert_connection_professional_in_delivery).
create function public.assert_relationship_matches_connection()
returns trigger
language plpgsql
as $$
declare
  v_connection public.connection_records;
begin
  select * into v_connection from public.connection_records where id = new.connection_id;

  if not found then
    raise exception 'relationship_records: connection_id % não encontrado', new.connection_id
      using errcode = '23503';
  end if;

  if v_connection.status is distinct from 'PRIMEIRO_ATENDIMENTO_REALIZADO' then
    raise exception 'relationship_records: connection_id % não está em PRIMEIRO_ATENDIMENTO_REALIZADO (atual: %)', new.connection_id, v_connection.status
      using errcode = '23514';
  end if;

  if new.case_id is distinct from v_connection.case_id
     or new.patient_profile_id is distinct from v_connection.patient_profile_id
     or new.professional_profile_id is distinct from v_connection.professional_profile_id then
    raise exception 'relationship_records: case_id/patient_profile_id/professional_profile_id devem corresponder exatamente ao connection_id referenciado'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger relationship_records_assert_matches_connection
  before insert on public.relationship_records
  for each row
  execute function public.assert_relationship_matches_connection();

-- Imutabilidade dos quatro campos de identidade — nenhuma UPDATE pode
-- alterá-los, mesmo executada com privilégio de service_role (Fase 3/Etapa
-- 3: "impossibilidade de troca de profissional dentro do mesmo
-- Relationship", estendida aqui aos demais vínculos de identidade).
create function public.assert_relationship_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.connection_id is distinct from old.connection_id then
    raise exception 'relationship_records: connection_id é imutável — nunca pode ser alterado após a criação'
      using errcode = '23514';
  end if;

  if new.case_id is distinct from old.case_id then
    raise exception 'relationship_records: case_id é imutável — nunca pode ser alterado após a criação'
      using errcode = '23514';
  end if;

  if new.patient_profile_id is distinct from old.patient_profile_id then
    raise exception 'relationship_records: patient_profile_id é imutável — nunca pode ser alterado após a criação'
      using errcode = '23514';
  end if;

  if new.professional_profile_id is distinct from old.professional_profile_id then
    raise exception 'relationship_records: professional_profile_id é imutável — nunca pode ser alterado após a criação'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger relationship_records_assert_immutable_fields
  before update on public.relationship_records
  for each row
  execute function public.assert_relationship_immutable_fields();

-- Garante a máquina de estados definitiva
-- (docs/architecture/DOMAIN_RELATIONSHIP.md, Veredito A, Fase 4.1) no
-- nível do banco — exatamente dois estados (ATIVO, ENCERRADO), nunca uma
-- transição a partir de um estado terminal. REABERTURA_OBSERVADA nunca
-- aparece aqui porque nunca altera relationship_records.status (é só um
-- evento adicional em relationship_events, mesmo com o registro já
-- terminal).
--
-- [CORRIGIDO — Fase 6.1] PAUSADO removido — nenhuma transição para/de
-- PAUSADO é mais válida; ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO
-- consolidados em ENCERRADO único.
create function public.assert_relationship_valid_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if old.status = 'ENCERRADO' then
      raise exception 'relationship_records: % é um estado terminal, nenhuma transição é permitida a partir dele', old.status
        using errcode = '23514';
    end if;

    if old.status = 'ATIVO' and new.status not in ('ENCERRADO') then
      raise exception 'relationship_records: transição de ATIVO para % não é válida', new.status
        using errcode = '23514';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger relationship_records_assert_valid_transition
  before update on public.relationship_records
  for each row
  execute function public.assert_relationship_valid_transition();

alter table public.relationship_records enable row level security;
alter table public.relationship_events enable row level security;

grant select, insert, update on public.relationship_records to authenticated;
grant all on public.relationship_records to service_role;

grant select, insert on public.relationship_events to authenticated;
grant all on public.relationship_events to service_role;

-- relationship_records: paciente vê e escreve somente o próprio; curador
-- atribuído ao caso e administrador leem sempre, e escrevem apenas para a
-- transição de INTERRUPCAO_DECLARADA (Fase 2/Etapa 1 — única exceção de
-- autoria dupla). RLS não distingue qual transição específica está sendo
-- aplicada em cada UPDATE — essa granularidade fina (equipe só pode causar
-- ENCERRADO_POR_INTERRUPCAO, nunca as demais transições) é responsabilidade
-- do domínio/comandos puros, em PR futuro — mesma divisão de
-- responsabilidade já usada em connection_records.
create policy "relationship_records_select_own_patient" on public.relationship_records
  for select
  to authenticated
  using (patient_profile_id = auth.uid());

create policy "relationship_records_select_admin_or_case_curator" on public.relationship_records
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = relationship_records.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "relationship_records_insert_own_patient" on public.relationship_records
  for insert
  to authenticated
  with check (
    patient_profile_id = auth.uid()
    and exists (
      select 1 from public.connection_records cr
      where cr.id = relationship_records.connection_id
        and cr.patient_profile_id = auth.uid()
        and cr.status = 'PRIMEIRO_ATENDIMENTO_REALIZADO'
    )
  );

create policy "relationship_records_update_own_patient" on public.relationship_records
  for update
  to authenticated
  using (patient_profile_id = auth.uid())
  with check (patient_profile_id = auth.uid());

create policy "relationship_records_update_admin_or_case_curator" on public.relationship_records
  for update
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = relationship_records.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = relationship_records.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- relationship_events: mesmo recorte de visibilidade de relationship_records;
-- append-only (sem policy de update/delete). Insert dividido em duas
-- policies permissivas (OR semântico): uma para os eventos de autoria do
-- paciente (incluindo RELACIONAMENTO_INICIADO, criado na mesma transação
-- da criação do próprio Relationship pelo paciente), outra para os dois
-- eventos que a equipe pode registrar (Fase 2/Etapa 1).
create policy "relationship_events_select_own_patient" on public.relationship_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.relationship_records rr
      where rr.id = relationship_events.relationship_id
        and rr.patient_profile_id = auth.uid()
    )
  );

create policy "relationship_events_select_admin_or_case_curator" on public.relationship_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.relationship_records rr
      join public.cases c on c.id = rr.case_id
      where rr.id = relationship_events.relationship_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "relationship_events_insert_patient_events" on public.relationship_events
  for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and event_type in ('RELACIONAMENTO_INICIADO', 'ENCERRAMENTO_PLANEJADO_DECLARADO', 'INTERRUPCAO_DECLARADA')
    and exists (
      select 1 from public.relationship_records rr
      where rr.id = relationship_events.relationship_id
        and rr.patient_profile_id = auth.uid()
    )
  );

create policy "relationship_events_insert_team_events" on public.relationship_events
  for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and event_type in ('INTERRUPCAO_DECLARADA', 'REABERTURA_OBSERVADA')
    and exists (
      select 1 from public.relationship_records rr
      join public.cases c on c.id = rr.case_id
      where rr.id = relationship_events.relationship_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );
