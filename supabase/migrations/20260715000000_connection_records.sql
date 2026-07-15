-- CONNECTION ENGINE — MVP — PR1 (camada de persistência).
-- Especificação-fonte: Connection Engine Fase 2 (decisões definitivas):
-- um ConnectionRecord por Caso (identidade = case_id, mesmo padrão de
-- final_curadoria_deliveries); confirmação de atendimento exclusiva do
-- paciente; CONTATO_INICIADO existe; Relationship nasce oficialmente na
-- transição para PRIMEIRO_ATENDIMENTO_REALIZADO (não implementado nesta
-- entrega — nenhuma tabela ou lógica de Relationship existe aqui).
--
-- Modelo híbrido (Fase 2, Etapa 7): estado atual denormalizado em
-- connection_records + histórico append-only em connection_events — mesmo
-- padrão já em produção (cases.status + case_notes).
--
-- Escopo estritamente limitado a: migration, estrutura, constraints, RLS,
-- índices. Nenhuma Server Action, repository, componente ou regra de
-- negócio além da integridade estrutural (máquina de estados e
-- pertencimento do profissional à Curadoria) é implementada aqui.

create table public.connection_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  final_curadoria_delivery_id uuid not null references public.final_curadoria_deliveries (id),
  patient_profile_id uuid not null references public.profiles (id),
  professional_profile_id uuid not null references public.professional_profiles (id),
  status text not null default 'DECISAO_REGISTRADA',
  decided_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connection_records_status_check
    check (status in ('DECISAO_REGISTRADA', 'CONTATO_INICIADO', 'PRIMEIRO_ATENDIMENTO_REALIZADO', 'ENCERRADO_SEM_RELACIONAMENTO'))
);

comment on table public.connection_records is 'Connection (MVP, Fase 2) — decisão do paciente e desfecho do primeiro contato após a entrega da Curadoria. Um único registro por Caso (decisão definitiva da Fase 2, item 1) — nunca reaberto após um dos dois estados terminais. Nunca escreve em final_curadoria_deliveries, human_review_results ou qualquer artefato do ACE.';
comment on column public.connection_records.professional_profile_id is 'Profissional atualmente escolhido — pode ser alterado por evento de correção (CORRECAO_ESCOLHA em connection_events) somente enquanto status = DECISAO_REGISTRADA; sempre um dos três presentes em final_curadoria_delivery_id.provider_presentations, nunca validado apenas no client.';
comment on column public.connection_records.decided_at is 'Momento real da decisão inicial do paciente — distinto de created_at (momento de registro), conforme a Teoria da Temporalidade (Connection & Relationship, Fase 2).';

create unique index connection_records_case_id_key on public.connection_records (case_id);
create index connection_records_patient_profile_id_idx on public.connection_records (patient_profile_id);

-- Histórico append-only — nunca update, nunca delete (mesmo padrão de
-- case_notes: a imutabilidade é garantida pela ausência dessas policies,
-- não por disciplina de aplicação).
create table public.connection_events (
  id bigint generated always as identity primary key,
  connection_id uuid not null references public.connection_records (id) on delete cascade,
  event_type text not null,
  actor_id uuid not null references public.profiles (id),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint connection_events_type_check
    check (event_type in ('DECISAO_REGISTRADA', 'CORRECAO_ESCOLHA', 'CONTATO_INICIADO', 'PRIMEIRO_ATENDIMENTO_REALIZADO', 'ENCERRADO_SEM_RELACIONAMENTO')),
  constraint connection_events_temporal_order
    check (recorded_at >= occurred_at)
);

comment on table public.connection_events is 'Histórico append-only de eventos de um ConnectionRecord (Teoria dos Eventos, Connection & Relationship Fase 2) — nunca editado ou apagado. occurred_at é o momento real do fato; recorded_at é o momento em que o sistema o registrou (podem divergir; recorded_at nunca é anterior a occurred_at). payload carrega dados específicos do evento (ex.: o novo professional_profile_id em CORRECAO_ESCOLHA) — nunca conteúdo clínico ou de compatibilidade.';

create index connection_events_connection_id_idx on public.connection_events (connection_id, occurred_at);

-- Garante, no nível do banco, que o profissional escolhido (na criação ou
-- em uma correção) sempre pertence aos três apresentados naquela entrega
-- específica — nunca confiado apenas ao client. Substitui uma checagem
-- equivalente que, em outras tabelas desta base (final_curadoria_deliveries),
-- é feita via policy; aqui é feita via trigger porque a comparação exige
-- inspecionar um array jsonb de outra tabela, o que uma policy RLS padrão
-- também poderia fazer, mas o trigger garante a mesma validação tanto em
-- INSERT quanto em UPDATE (correção) sem duplicar a lógica em duas policies.
create function public.assert_connection_professional_in_delivery()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.final_curadoria_deliveries d,
         jsonb_array_elements(d.provider_presentations) as presentation
    where d.id = new.final_curadoria_delivery_id
      and presentation ->> 'providerId' = new.professional_profile_id::text
  ) then
    raise exception 'professional_profile_id % não pertence aos profissionais apresentados em final_curadoria_delivery_id %', new.professional_profile_id, new.final_curadoria_delivery_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger connection_records_assert_professional_in_delivery
  before insert or update of professional_profile_id on public.connection_records
  for each row
  execute function public.assert_connection_professional_in_delivery();

-- Garante a máquina de estados definitiva (Connection Engine Fase 2,
-- Etapa 5) no nível do banco — nunca uma transição a partir de um estado
-- terminal, nunca "para trás", e nunca uma correção de profissional fora
-- de DECISAO_REGISTRADA. Não é uma regra de negócio de apresentação (isso
-- fica para a Server Action, fora deste PR) — é a mesma garantia de
-- integridade estrutural que o padrão de Method Invariants já aplica no
-- ACE (validação determinística, nunca reinterpretação).
create function public.assert_connection_valid_transition()
returns trigger
language plpgsql
as $$
begin
  if new.professional_profile_id is distinct from old.professional_profile_id
     and old.status is distinct from 'DECISAO_REGISTRADA' then
    raise exception 'connection_records: correção de profissional só é permitida enquanto status = DECISAO_REGISTRADA (atual: %)', old.status
      using errcode = '23514';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('PRIMEIRO_ATENDIMENTO_REALIZADO', 'ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: % é um estado terminal, nenhuma transição é permitida a partir dele', old.status
        using errcode = '23514';
    end if;

    if old.status = 'DECISAO_REGISTRADA'
       and new.status not in ('CONTATO_INICIADO', 'PRIMEIRO_ATENDIMENTO_REALIZADO', 'ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: transição de DECISAO_REGISTRADA para % não é válida', new.status
        using errcode = '23514';
    end if;

    if old.status = 'CONTATO_INICIADO'
       and new.status not in ('PRIMEIRO_ATENDIMENTO_REALIZADO', 'ENCERRADO_SEM_RELACIONAMENTO') then
      raise exception 'connection_records: transição de CONTATO_INICIADO para % não é válida', new.status
        using errcode = '23514';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger connection_records_assert_valid_transition
  before update on public.connection_records
  for each row
  execute function public.assert_connection_valid_transition();

alter table public.connection_records enable row level security;
alter table public.connection_events enable row level security;

grant select, insert, update on public.connection_records to authenticated;
grant all on public.connection_records to service_role;

grant select, insert on public.connection_events to authenticated;
grant all on public.connection_events to service_role;

-- connection_records: paciente vê e escreve somente o próprio; curador
-- atribuído ao caso e administrador só leem — nenhuma exceção de escrita
-- para eles (decisão definitiva da Fase 2, item 2: confirmação e qualquer
-- transição são sempre do paciente).
create policy "connection_records_select_own_patient" on public.connection_records
  for select
  to authenticated
  using (patient_profile_id = auth.uid());

create policy "connection_records_select_admin_or_case_curator" on public.connection_records
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = connection_records.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "connection_records_insert_own_patient" on public.connection_records
  for insert
  to authenticated
  with check (
    patient_profile_id = auth.uid()
    and exists (
      select 1 from public.final_curadoria_deliveries d
      where d.id = connection_records.final_curadoria_delivery_id
        and d.case_id = connection_records.case_id
        and d.patient_profile_id = auth.uid()
    )
  );

create policy "connection_records_update_own_patient" on public.connection_records
  for update
  to authenticated
  using (patient_profile_id = auth.uid())
  with check (patient_profile_id = auth.uid());

-- connection_events: mesmo recorte de visibilidade de connection_records;
-- append-only (sem policy de update/delete). Insert restrito a quem é
-- dono do connection_records referenciado, e sempre como autor de si
-- mesmo — nenhuma escrita em nome de outro paciente, curador ou admin.
create policy "connection_events_select_own_patient" on public.connection_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.connection_records cr
      where cr.id = connection_events.connection_id
        and cr.patient_profile_id = auth.uid()
    )
  );

create policy "connection_events_select_admin_or_case_curator" on public.connection_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.connection_records cr
      join public.cases c on c.id = cr.case_id
      where cr.id = connection_events.connection_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "connection_events_insert_own_patient" on public.connection_events
  for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.connection_records cr
      where cr.id = connection_events.connection_id
        and cr.patient_profile_id = auth.uid()
    )
  );
