-- TASK-003: auditoria mínima. Registra apenas eventos sensíveis de
-- autorização por enquanto (concessão/revogação de papel). Não é uma
-- auditoria genérica de toda alteração no banco — isso seria escopo maior
-- do que a fundação desta tarefa.

create type public.audit_action as enum ('role_granted', 'role_revoked');

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action public.audit_action not null,
  target_profile_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Log de auditoria mínimo (append-only, sem update/delete via RLS). actor_id é quem executou a ação (nulo se automatizada); target_profile_id é quem foi afetado.';

create index audit_logs_target_profile_id_idx on public.audit_logs (target_profile_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- Audita automaticamente toda concessão/revogação de papel.
-- security definer: grava no log mesmo que o RLS de audit_logs não conceda
-- INSERT a authenticated (a auditoria não deve depender de o ator ter
-- permissão de escrever no próprio log).
create or replace function public.log_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(), 'role_granted', new.profile_id, jsonb_build_object('role_id', new.role_id));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(), 'role_revoked', old.profile_id, jsonb_build_object('role_id', old.role_id));
    return old;
  end if;
  return null;
end;
$$;

create trigger log_user_roles_insert
  after insert on public.user_roles
  for each row
  execute function public.log_user_role_change();

create trigger log_user_roles_delete
  after delete on public.user_roles
  for each row
  execute function public.log_user_role_change();
