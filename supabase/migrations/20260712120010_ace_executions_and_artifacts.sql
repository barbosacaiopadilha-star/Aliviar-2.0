-- ÉPICO 1 / SPRINT 3 — EXECUÇÃO CONTROLADA DO ACE: persistência própria de
-- execuções e artefatos do pipeline P001-P008, vinculados a um Caso. Nunca
-- é o ACE em si que persiste (o módulo ace continua uma biblioteca pura,
-- sem estado) — esta é a camada de orquestração (concierge) por cima dele.
--
-- O ACE nunca inicia sozinho (princípio central desta sprint): toda linha
-- aqui nasce de uma ação explícita de um Administrador ou Curador Médico
-- autorizado, nunca de um job automático ou trigger.

create type public.ace_execution_status as enum (
  'PENDING',
  'RUNNING',
  'BLOCKED',
  'FAILED',
  'COMPLETED',
  'CANCELLED'
);

create table public.ace_executions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  started_by uuid not null references public.profiles (id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.ace_execution_status not null default 'PENDING',
  current_protocol text check (current_protocol in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  method_version text not null,
  failure_code text,
  failure_message text,
  retry_of uuid references public.ace_executions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ace_executions is 'Uma tentativa de execução do pipeline ACE (P001-P008 nesta sprint) sobre um Caso — sempre iniciada explicitamente por um humano autorizado (Administrador ou Curador Médico atribuído). COMPLETED nesta sprint significa apenas "P001-P008 concluídos e Shortlist interna produzida" — nunca curadoria validada ou entregue. failure_message é sempre sanitizada (nunca stack trace ou detalhe de infraestrutura).';

create index ace_executions_case_id_idx on public.ace_executions (case_id, created_at desc);

create trigger set_ace_executions_updated_at
  before update on public.ace_executions
  for each row
  execute function public.set_updated_at();

-- Artefatos imutáveis produzidos por uma execução — nunca sobrescritos;
-- uma nova tentativa (retry) sempre produz um novo artefato, opcionalmente
-- referenciando o que ela substitui via `supersedes`.
create table public.ace_artifacts (
  id uuid primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  execution_id uuid not null references public.ace_executions (id) on delete cascade,
  artifact_type text not null check (artifact_type in (
    'Narrative', 'DecisionCase', 'CaseAudit', 'DecisionContext',
    'CompetencyProfile', 'EligibleProviderSet', 'CompatibilityMatrix', 'Shortlist'
  )),
  version integer not null,
  protocol_id text not null check (protocol_id in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  protocol_version text not null,
  method_version text not null,
  payload jsonb not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  supersedes uuid references public.ace_artifacts (id),
  validation_status text not null default 'valid' check (validation_status in ('valid', 'blocked'))
);

comment on table public.ace_artifacts is 'Artefatos imutáveis do pipeline ACE vinculados a um Caso (ÉPICO 1/SPRINT 3) — nunca sobrescritos; id é o próprio id do artefato do ACE (deep-frozen, ver core/version-manager.ts). payload nunca inclui prompt completo enviado ao modelo de linguagem, só a saída estruturada já validada pelo protocolo.';

create index ace_artifacts_case_id_idx on public.ace_artifacts (case_id, created_at);
create index ace_artifacts_execution_id_idx on public.ace_artifacts (execution_id);

alter table public.ace_executions enable row level security;
alter table public.ace_artifacts enable row level security;

grant select, insert, update on public.ace_executions to authenticated;
grant select, insert on public.ace_artifacts to authenticated;
grant all on public.ace_executions, public.ace_artifacts to service_role;

-- Mesmo recorte de public.cases: administrador vê/opera tudo; curador
-- médico só o que pertence a um Caso atribuído a ele. Paciente e
-- profissional nunca têm policy aqui — RLS nega por padrão.
create policy "ace_executions_select_admin_or_case_curator" on public.ace_executions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = ace_executions.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "ace_executions_insert_admin_or_case_curator" on public.ace_executions
  for insert
  to authenticated
  with check (
    started_by = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = ace_executions.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "ace_executions_update_admin_or_case_curator" on public.ace_executions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = ace_executions.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = ace_executions.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- Sem policy de DELETE em ace_executions: uma execução nunca é apagada,
-- só chega a um status terminal.

create policy "ace_artifacts_select_admin_or_case_curator" on public.ace_artifacts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = ace_artifacts.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "ace_artifacts_insert_admin_or_case_curator" on public.ace_artifacts
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = ace_artifacts.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- Sem policy de UPDATE/DELETE em ace_artifacts: imutabilidade real, não só
-- disciplina de aplicação.
