-- EPIC-22: ferramentas operacionais do curador

create table if not exists public.curator_favorites (
  curator_id uuid not null references public.profiles (id) on delete cascade,
  entity_type text not null check (entity_type in ('JORNADA', 'MEDICO', 'DOCUMENTO')),
  entity_id text not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  primary key (curator_id, entity_type, entity_id)
);

create table if not exists public.curator_private_notes (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references public.profiles (id) on delete cascade,
  jornada_id uuid null references public.journeys (id) on delete set null,
  titulo text not null default '',
  conteudo text not null check (char_length(trim(conteudo)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.curator_checklists (
  curator_id uuid not null references public.profiles (id) on delete cascade,
  jornada_id uuid not null references public.journeys (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (curator_id, jornada_id)
);

create table if not exists public.curator_templates (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references public.profiles (id) on delete cascade,
  categoria text not null check (categoria in ('MENSAGEM', 'JUSTIFICATIVA', 'OBSERVACAO')),
  titulo text not null,
  conteudo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curator_private_notes_curator_idx
  on public.curator_private_notes (curator_id, updated_at desc);

create index if not exists curator_templates_curator_idx
  on public.curator_templates (curator_id, categoria);

alter table public.curator_favorites enable row level security;
alter table public.curator_private_notes enable row level security;
alter table public.curator_checklists enable row level security;
alter table public.curator_templates enable row level security;

create policy "curator_favorites_own"
  on public.curator_favorites for all
  to authenticated
  using (curator_id = auth.uid() and public.is_active_staff())
  with check (curator_id = auth.uid() and public.is_active_staff());

create policy "curator_private_notes_own"
  on public.curator_private_notes for all
  to authenticated
  using (curator_id = auth.uid() and public.is_active_staff())
  with check (curator_id = auth.uid() and public.is_active_staff());

create policy "curator_checklists_own"
  on public.curator_checklists for all
  to authenticated
  using (curator_id = auth.uid() and public.is_active_staff())
  with check (curator_id = auth.uid() and public.is_active_staff());

create policy "curator_templates_own"
  on public.curator_templates for all
  to authenticated
  using (curator_id = auth.uid() and public.is_active_staff())
  with check (curator_id = auth.uid() and public.is_active_staff());
