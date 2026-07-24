-- ÉPICO 1 / SPRINT 3 — EXECUÇÃO CONTROLADA DO ACE: campos estruturados que
-- P006/P007 exigem (ports/provider-repository.ts, ports/provider-profile-
-- repository.ts) e que professional_profiles ainda não tinha. Todos
-- nullable/vazios por padrão — nenhum valor é inventado; um profissional
-- sem esses campos preenchidos simplesmente não é elegível a nenhum
-- domínio (P006 retorna conjunto vazio para ele), nunca aparece com dado
-- fabricado. Preencher esses campos para profissionais existentes é tarefa
-- futura de UI administrativa, fora do escopo desta sprint (orquestração).

alter table public.professional_profiles
  add column experience_level text check (experience_level in ('geral', 'experiente', 'altamente_experiente')),
  add column intake_approach text check (intake_approach in ('conexao_direta', 'aprofundamento_previo', 'avaliacao_inicial', 'ambos')),
  add column offers_continuous_care boolean,
  add column availability_window text check (availability_window in ('flexible', 'limited', 'unavailable_soon'));

comment on column public.professional_profiles.experience_level is 'Nível de experiência estruturado (ACE P006/P007) — null até ser preenchido administrativamente; nunca inferido automaticamente.';
comment on column public.professional_profiles.intake_approach is 'Abordagem de intake estruturada (ACE P007, strategyAlignment) — null até ser preenchida administrativamente.';
comment on column public.professional_profiles.offers_continuous_care is 'Oferece cuidado contínuo (ACE P007, continuityAlignment) — null quando não registrado.';
comment on column public.professional_profiles.availability_window is 'Janela de disponibilidade (ACE P007, contextAlignment) — null quando não registrada.';

-- Um profissional pode ter mais de uma área de competência (domínio+foco).
create table public.professional_competency_areas (
  professional_profile_id uuid not null references public.professional_profiles (id) on delete cascade,
  domain text not null check (domain in ('saude_emocional_mental', 'saude_fisica', 'nao_determinado')),
  focus text not null check (focus in ('avaliacao', 'intervencao', 'acompanhamento_continuo', 'esclarecimento')),
  created_at timestamptz not null default now(),
  primary key (professional_profile_id, domain, focus)
);

comment on table public.professional_competency_areas is 'Áreas de competência estruturadas de um profissional (ACE P006, competencyAreas) — vazio até serem cadastradas administrativamente; nenhum protocolo do ACE considera um profissional sem nenhuma linha aqui.';

create index professional_competency_areas_domain_idx on public.professional_competency_areas (domain);

alter table public.professional_competency_areas enable row level security;

grant select, insert, update, delete on public.professional_competency_areas to authenticated;
grant all on public.professional_competency_areas to service_role;

-- Mesmo recorte de professional_profiles: administrador gerencia; o próprio
-- profissional (quando já houver conta vinculada) só lê o que é seu.
create policy "professional_competency_areas_select_admin_or_own" on public.professional_competency_areas
  for select
  to authenticated
  using (
    public.has_role('administrador')
    or exists (
      select 1 from public.professional_profiles pp
      where pp.id = professional_competency_areas.professional_profile_id and pp.profile_id = auth.uid()
    )
  );

create policy "professional_competency_areas_write_admin_only" on public.professional_competency_areas
  for all
  to authenticated
  using (public.has_role('administrador'))
  with check (public.has_role('administrador'));
