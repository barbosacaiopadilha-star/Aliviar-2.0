-- ÚLTIMA SPRINT DO MVP — EXPERIÊNCIA DE ENTREGA DA CURADORIA (P010): a
-- FinalCuradoria (docs/ace/04-specs/P010-final-curadoria-delivery/) é o
-- primeiro artefato do ACE que o paciente de fato vê. Tabela dedicada
-- (mesmo raciocínio de human_review_results): estruturalmente diferente de
-- um artefato de análise, e é a única linha desta sessão de trabalho que a
-- RLS libera para o próprio paciente ler.

-- Dado de apresentação institucional (nunca de análise) exigido pela porta
-- ProviderPresentationRepository do P010 — nullable/vazio até ser
-- preenchido administrativamente; nunca inventado.
alter table public.professional_profiles
  add column practical_considerations text[] not null default '{}';

comment on column public.professional_profiles.practical_considerations is 'Considerações práticas de apresentação ao paciente (ACE P010, ProviderPresentation.practicalConsiderations) — vazio até ser preenchido administrativamente; nunca inferido a partir de dados de análise (competencyAreas, experienceLevel etc.).';

create table public.final_curadoria_deliveries (
  id uuid primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  patient_profile_id uuid not null references public.profiles (id),
  human_review_result_id uuid not null references public.human_review_results (id),
  validated_by uuid not null references public.profiles (id),
  validated_at timestamptz not null,
  delivered_by uuid not null references public.profiles (id),
  delivered_at timestamptz not null default now(),
  generated_at timestamptz not null,
  decision_summary text not null,
  client_context_summary text not null,
  provider_presentations jsonb not null,
  comparison_summary text not null,
  relevant_limitations text[] not null default '{}',
  relevant_missing_information text[] not null default '{}',
  next_steps text[] not null,
  method_explanation text not null,
  disclaimer text not null,
  method_version text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

comment on table public.final_curadoria_deliveries is 'Entrega da Curadoria Validada ao paciente (P010) — cada Caso recebe no máximo uma entrega nesta sprint (reabertura é fluxo próprio, ainda não implementado). Todo o conteúdo aqui já é apropriado para o paciente ler diretamente: nenhuma coluna guarda protocolo, artefato interno, score ou prompt.';

create unique index final_curadoria_deliveries_case_id_key on public.final_curadoria_deliveries (case_id);
create index final_curadoria_deliveries_patient_profile_id_idx on public.final_curadoria_deliveries (patient_profile_id);

alter table public.final_curadoria_deliveries enable row level security;

grant select, insert on public.final_curadoria_deliveries to authenticated;
grant all on public.final_curadoria_deliveries to service_role;

-- Administrador e o curador atribuído ao caso veem a entrega (mesmo
-- recorte de ace_artifacts/human_review_results) — e, pela primeira vez
-- nesta sessão, o PRÓPRIO PACIENTE também, porque todo conteúdo aqui foi
-- desenhado para ele.
create policy "final_curadoria_deliveries_select_admin_or_curator" on public.final_curadoria_deliveries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = final_curadoria_deliveries.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "final_curadoria_deliveries_select_own_patient" on public.final_curadoria_deliveries
  for select
  to authenticated
  using (patient_profile_id = auth.uid());

create policy "final_curadoria_deliveries_insert_admin_or_case_curator" on public.final_curadoria_deliveries
  for insert
  to authenticated
  with check (
    delivered_by = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = final_curadoria_deliveries.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

-- Sem policy de UPDATE/DELETE: a entrega, uma vez feita, é imutável;
-- reabertura é decisão de produto explicitamente fora do escopo desta
-- sprint (fluxo próprio, ainda não especificado).

-- Copy mais acolhedora para o status DELIVERED — "Curadoria", nunca
-- "relatório" (princípio central desta sprint: o paciente recebe uma
-- Curadoria, não uma lista). Mesma view da migration original
-- (20260712100000), só o texto do branch DELIVERED muda.
create or replace view public.patient_case_overview as
select
  c.id as case_id,
  c.patient_profile_id,
  case c.status
    when 'NEW' then 'Recebemos sua história.'
    when 'IN_REVIEW' then 'Nossa equipe está organizando as informações.'
    when 'WAITING_FOR_INFORMATION' then 'Precisamos de uma informação adicional.'
    when 'READY_FOR_CURATION' then 'Sua curadoria está sendo preparada.'
    when 'IN_CURATION' then 'Sua curadoria está em andamento.'
    when 'HUMAN_REVIEW' then 'Sua curadoria está em revisão final.'
    when 'DELIVERED' then 'Sua Curadoria está pronta!'
    when 'CLOSED' then 'Seu acompanhamento foi encerrado.'
    when 'CANCELLED' then 'Não conseguimos avançar com esta curadoria no momento — nossa equipe vai entrar em contato.'
  end as status_label,
  c.updated_at
from public.cases c
where c.patient_profile_id = auth.uid();
