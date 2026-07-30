-- Correção de Domínio (docs/CORRECAO_DOMINIO_PAPEIS_E_CASE.md) — Fase 2.
-- Toda passagem de bastão deixa rastro: quem entregou, quem recebeu, quando,
-- por ordem de quem, e por quê. Append-only.

create table if not exists curadoria.case_responsibility_changes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases(id) on delete cascade,
  previous_responsible_id uuid references curadoria.profiles(id),
  previous_role text check (previous_role in ('atendente','curador_medico','concierge')),
  new_responsible_id uuid not null references curadoria.profiles(id),
  new_role text not null check (new_role in ('atendente','curador_medico','concierge')),
  changed_by uuid not null references curadoria.profiles(id),
  reason text not null check (length(btrim(reason)) > 0),
  changed_at timestamptz not null default now()
);

comment on table curadoria.case_responsibility_changes is
  'Auditoria da troca de responsável pelo Case. Append-only: nunca UPDATE, nunca DELETE. O motivo é obrigatório — uma passagem de bastão sem motivo não é rastreável.';

create index if not exists case_responsibility_changes_case_idx
  on curadoria.case_responsibility_changes (case_id, changed_at desc);

-- Append-only imposto pelo banco, não pela disciplina de quem escreve código.
create or replace function curadoria.enforce_responsibility_log_append_only()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  raise exception 'curadoria.case_responsibility_changes é append-only: % não é permitido', tg_op;
end;
$$;

drop trigger if exists case_responsibility_changes_append_only
  on curadoria.case_responsibility_changes;
create trigger case_responsibility_changes_append_only
  before update or delete on curadoria.case_responsibility_changes
  for each row execute function curadoria.enforce_responsibility_log_append_only();

-- Coerência: o registro não pode contradizer o estado anterior do Case.
create or replace function curadoria.enforce_responsibility_change_coherence()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  if new.previous_responsible_id is not distinct from new.new_responsible_id
     and new.previous_role is not distinct from new.new_role then
    raise exception 'Troca de responsável sem troca: responsável e papel são idênticos aos anteriores';
  end if;
  return new;
end;
$$;

drop trigger if exists case_responsibility_changes_coherence
  on curadoria.case_responsibility_changes;
create trigger case_responsibility_changes_coherence
  before insert on curadoria.case_responsibility_changes
  for each row execute function curadoria.enforce_responsibility_change_coherence();

alter table curadoria.case_responsibility_changes enable row level security;

-- Leitura espelha a do Case: administrador, ou quem é/foi responsável por ele.
create policy case_responsibility_changes_select
  on curadoria.case_responsibility_changes for select to authenticated
  using (
    curadoria.has_role('administrador')
    or previous_responsible_id = auth.uid()
    or new_responsible_id = auth.uid()
    or exists (
      select 1 from curadoria.cases c
      where c.id = case_responsibility_changes.case_id
        and (c.assigned_curator_id = auth.uid() or c.responsible_id = auth.uid())
    )
  );

-- Só registra a troca quem tem o Case na mão hoje (ou o administrador).
create policy case_responsibility_changes_insert
  on curadoria.case_responsibility_changes for insert to authenticated
  with check (
    changed_by = auth.uid()
    and (
      curadoria.has_role('administrador')
      or exists (
        select 1 from curadoria.cases c
        where c.id = case_responsibility_changes.case_id
          and (c.assigned_curator_id = auth.uid() or c.responsible_id = auth.uid())
      )
    )
  );