-- Correções humanas de classificação P002 — append-only, precedência sobre IA.
-- Schema curadoria (alinhado com DB_SCHEMA em src/lib/supabase/env.ts).

create table curadoria.p002_field_corrections (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  decision_case_artifact_id uuid,
  field text not null,
  estado text not null,
  motivo text not null,
  valor_anterior text,
  corrigido_por uuid not null references curadoria.profiles (id),
  corrigido_em timestamptz not null default now(),
  ativo boolean not null default true
);

comment on table curadoria.p002_field_corrections is
  'Correções humanas de classificação de completude P002 — append-only; a correção ativa mais recente por campo prevalece sobre inferência de IA.';

create index p002_field_corrections_case_id_idx
  on curadoria.p002_field_corrections (case_id, field, corrigido_em desc);

alter table curadoria.p002_field_corrections enable row level security;

grant select, insert on curadoria.p002_field_corrections to authenticated;
grant all on curadoria.p002_field_corrections to service_role;

create policy "p002_field_corrections_select_admin_or_case_curator"
  on curadoria.p002_field_corrections for select to authenticated
  using (
    exists (
      select 1 from curadoria.cases c
      where c.id = p002_field_corrections.case_id
        and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );

create policy "p002_field_corrections_insert_admin_or_case_curator"
  on curadoria.p002_field_corrections for insert to authenticated
  with check (
    exists (
      select 1 from curadoria.cases c
      where c.id = p002_field_corrections.case_id
        and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())
    )
  );
