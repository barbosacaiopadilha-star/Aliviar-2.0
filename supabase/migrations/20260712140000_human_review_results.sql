-- FASE BETA / SPRINT P009 — HUMAN REVIEW: primeira etapa verdadeiramente
-- decisória do produto. HumanReviewResult (docs/ace/04-specs/
-- P009-human-review/specification.md) é o primeiro artefato do ACE com
-- autoridade institucional humana real (HumanDecisionArtifact, não
-- AnalysisArtifact) — por isso ganha uma tabela própria em vez de reaproveitar
-- ace_artifacts: cada linha aqui é uma decisão humana completa e
-- estruturada (quem, quando, qual ação, com base em quê), não um payload
-- opaco entre outros artefatos de análise. Um Caso pode acumular várias
-- linhas ao longo do tempo (ex.: REJECT hoje, APPROVE depois de nova
-- informação) — cada uma é a sua própria versão 1, nunca uma edição da
-- anterior (mesmo princípio de case_notes/ace_artifacts).

create table public.human_review_results (
  id uuid primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  execution_id uuid not null references public.ace_executions (id),
  reviewer_id uuid not null references public.profiles (id),
  reviewed_at timestamptz not null,
  review_status text not null check (review_status in ('VALIDATED', 'REJECTED', 'INFORMATION_REQUESTED')),
  review_action text not null check (review_action in ('APPROVE', 'ADJUST', 'REJECT', 'REQUEST_MORE_INFORMATION')),
  original_shortlist_artifact_id uuid not null references public.ace_artifacts (id),
  original_shortlist_artifact_version integer not null,
  compatibility_matrix_artifact_id uuid not null references public.ace_artifacts (id),
  compatibility_matrix_artifact_version integer not null,
  approved_provider_ids uuid[] not null default '{}',
  changes jsonb not null default '[]'::jsonb,
  review_rationale text not null,
  evidence_references text[] not null default '{}',
  return_to_protocol text check (return_to_protocol in ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010')),
  method_version text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

comment on table public.human_review_results is 'Decisões humanas registradas pelo P009 (Human Review) — cada linha é uma decisão completa e imutável (reviewerId, reviewedAt, reviewAction, reviewRationale, evidenceReferences sempre presentes). Um Caso pode ter várias ao longo do tempo; a mais recente é a decisão vigente. Nunca editada ou apagada.';

create index human_review_results_case_id_idx on public.human_review_results (case_id, created_at desc);
create index human_review_results_execution_id_idx on public.human_review_results (execution_id);

alter table public.human_review_results enable row level security;

grant select, insert on public.human_review_results to authenticated;
grant all on public.human_review_results to service_role;

-- Mesmo recorte de ace_executions/ace_artifacts: administrador vê tudo;
-- curador médico só as decisões de um Caso atribuído a ele.
create policy "human_review_results_select_admin_or_case_curator" on public.human_review_results
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = human_review_results.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "human_review_results_insert_admin_or_case_curator" on public.human_review_results
  for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = human_review_results.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- Sem policy de UPDATE/DELETE: uma decisão humana registrada nunca é
-- alterada ou apagada — imutabilidade real, não só disciplina de aplicação.
