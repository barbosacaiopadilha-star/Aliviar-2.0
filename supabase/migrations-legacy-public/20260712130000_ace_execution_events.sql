-- SPRINT INTERMEDIÁRIA — OBSERVABILIDADE DO ACE: log estruturado e
-- append-only de eventos de uma execução do pipeline P001-P008. Não
-- substitui `ace_executions` (que guarda só o estado atual) nem
-- `ace_artifacts` (que guarda os resultados) — este é o registro
-- cronológico do que aconteceu passo a passo, para permitir auditoria e
-- depuração sem precisar reconstruir a história a partir de outras tabelas.
--
-- Nenhuma linha aqui é editada ou apagada: sem policy de UPDATE/DELETE,
-- mesmo padrão de imutabilidade já usado em ace_artifacts e case_notes.

create table public.ace_execution_events (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.ace_executions (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  event_type text not null check (event_type in (
    'STARTED', 'RESUMED', 'PROTOCOL_STARTED', 'PROTOCOL_COMPLETED',
    'ARTIFACT_REUSED', 'BLOCKED', 'FAILED', 'COMPLETED'
  )),
  protocol_id text check (protocol_id in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.ace_execution_events is 'Log estruturado e append-only de uma execução do ACE (sprint de Observabilidade) — message é sempre sanitizada (mesma regra de ace_executions.failure_message); metadata só guarda referências (artifactType, version, failureCode), nunca prompt ou payload completo.';

create index ace_execution_events_execution_id_idx on public.ace_execution_events (execution_id, created_at);
create index ace_execution_events_case_id_idx on public.ace_execution_events (case_id, created_at);

alter table public.ace_execution_events enable row level security;

grant select, insert on public.ace_execution_events to authenticated;
grant all on public.ace_execution_events to service_role;

-- Mesmo recorte de ace_executions/ace_artifacts: administrador vê tudo;
-- curador médico só os eventos de um Caso atribuído a ele.
create policy "ace_execution_events_select_admin_or_case_curator" on public.ace_execution_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = ace_execution_events.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "ace_execution_events_insert_admin_or_case_curator" on public.ace_execution_events
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = ace_execution_events.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- Sem policy de UPDATE/DELETE: imutabilidade real, não só disciplina de
-- aplicação.
