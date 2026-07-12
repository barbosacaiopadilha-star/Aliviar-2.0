-- ÉPICO 1 / SPRINT 2 (ajuste cirúrgico pós-aprovação): substitui o campo
-- compartilhado e sobrescrevível `cases.notes` por um histórico append-only.
-- Nenhuma escrita anterior existia em ambiente real (Docker local nunca
-- esteve disponível nesta sessão) — não há dado de produção a migrar.

alter table public.cases drop column if exists notes;

create table public.case_notes (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.cases (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint case_notes_body_not_blank check (btrim(body) <> '')
);

comment on table public.case_notes is 'Histórico append-only de notas internas de um Caso (ajuste pós-Sprint 2) — nunca editado ou apagado; cada nota preserva autor, timestamp e conteúdo, sem perda silenciosa de notas anteriores.';

create index case_notes_case_id_idx on public.case_notes (case_id, created_at);

alter table public.case_notes enable row level security;

grant select, insert on public.case_notes to authenticated;
grant all on public.case_notes to service_role;

-- Leitura/escrita: mesmo recorte de cases (administrador vê tudo; curador
-- médico só o caso atribuído a ele). Sem policy de UPDATE/DELETE — o
-- append-only é garantido pela ausência dessas policies, não por
-- disciplina de aplicação.
create policy "case_notes_select_admin_or_case_curator" on public.case_notes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_notes.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "case_notes_insert_admin_or_case_curator" on public.case_notes
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = case_notes.case_id
        and (public.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );
