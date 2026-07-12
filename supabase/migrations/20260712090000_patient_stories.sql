-- ÉPICO 1 / SPRINT 1 — MÓDULO "SUA HISTÓRIA": fundação de persistência
-- permanente. Substitui localStorage como fonte da verdade (ADR-018).
-- Exige sessão com papel "paciente" (nunca preenchimento anônimo — a conta
-- é sempre criada previamente pela equipe Aliviar, §21 de
-- docs/PRODUCT_ARCHITECTURE.md). Não implementa ACE/Concierge/Casos —
-- apenas a fundação da história em si.

create table public.patient_stories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviada')),
  current_step text not null default 'para-quem',
  data jsonb not null default '{}'::jsonb,
  revision integer not null default 1,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id)
);

comment on table public.patient_stories is 'História permanente do paciente (ÉPICO 1/SPRINT 1) — um paciente pode ter múltiplas linhas ao longo do tempo (preparação para múltiplas histórias futuras, sem implementar o fluxo completo); nunca editada retroativamente depois de "enviada" (trigger abaixo). revision sustenta concorrência otimista: toda escrita informa a revision que leu e é rejeitada, nunca sobrescrita silenciosamente, se a linha já avançou.';

create index patient_stories_profile_id_idx on public.patient_stories (profile_id);
create index patient_stories_profile_id_status_idx on public.patient_stories (profile_id, status);

-- Histórico de versões — append-only, nunca editado ou apagado pela
-- aplicação. Um snapshot é gravado sempre que a etapa (current_step) ou o
-- status mudam — nunca a cada tecla (isso já é coberto pelo autosave em
-- patient_stories.data), para não produzir uma linha por keystroke.
create table public.patient_story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.patient_stories (id) on delete cascade,
  revision integer not null,
  data jsonb not null,
  current_step text not null,
  status text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id)
);

comment on table public.patient_story_versions is 'Histórico imutável de versões de patient_stories — um snapshot por mudança de etapa ou status, nunca por autosave de campo. Escrito só pelo trigger track_patient_story_revision (security definer), nunca diretamente pela aplicação.';

create index patient_story_versions_story_id_idx on public.patient_story_versions (story_id, revision);

alter table public.patient_stories enable row level security;
alter table public.patient_story_versions enable row level security;

grant select, insert, update on public.patient_stories to authenticated;
grant select on public.patient_story_versions to authenticated;
grant all on public.patient_stories, public.patient_story_versions to service_role;

-- Leitura/escrita: só o próprio paciente (dono da história) — nunca outro
-- paciente, nunca profissional. Administrador só lê (oversight), nunca
-- escreve em nome do paciente aqui — a história é sempre autoria do
-- próprio paciente.
create policy "patient_stories_select_own_or_admin" on public.patient_stories
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('administrador'));

create policy "patient_stories_insert_own" on public.patient_stories
  for insert
  to authenticated
  with check (profile_id = auth.uid() and created_by = auth.uid());

create policy "patient_stories_update_own" on public.patient_stories
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Sem policy de DELETE: uma história nunca é apagada pela aplicação —
-- imutabilidade e histórico são o próprio ponto desta fundação.

create policy "patient_story_versions_select_own_or_admin" on public.patient_story_versions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.patient_stories ps
      where ps.id = patient_story_versions.story_id
        and (ps.profile_id = auth.uid() or public.has_role('administrador'))
    )
  );

-- Sem policy de insert/update/delete para authenticated em
-- patient_story_versions: só o trigger (security definer) escreve.

create or replace function public.track_patient_story_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'enviada' and new.data is distinct from old.data then
    raise exception 'Esta história já foi enviada e não pode mais ser editada.';
  end if;

  if tg_op = 'INSERT' then
    new.revision := 1;
  else
    new.revision := old.revision + 1;
  end if;
  new.updated_at := now();

  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status <> 'enviada') then
    new.submitted_at := coalesce(new.submitted_at, now());
  end if;

  if tg_op = 'INSERT' or new.current_step is distinct from old.current_step or new.status is distinct from old.status then
    insert into public.patient_story_versions (story_id, revision, data, current_step, status, created_by)
    values (new.id, new.revision, new.data, new.current_step, new.status, new.profile_id);
  end if;

  return new;
end;
$$;

comment on function public.track_patient_story_revision() is 'Garante revision monotônica (concorrência otimista), bloqueia edição de dado após envio, e grava snapshot de versão a cada mudança de etapa/status.';

create trigger track_patient_story_revision_trigger
  before insert or update on public.patient_stories
  for each row
  execute function public.track_patient_story_revision();
