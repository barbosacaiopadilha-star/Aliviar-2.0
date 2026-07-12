-- ÉPICO 1 / SPRINT 3: (1) estende a máquina de estados do Caso — um
-- CaseAudit (P003) BLOCKED durante a execução do ACE agora pode levar
-- IN_CURATION -> WAITING_FOR_INFORMATION (faltam informações básicas do
-- paciente, a curadoria não pode nem começar). `create or replace
-- function` — nunca editamos a migration original (20260712100000), só
-- substituímos a função nela definida, prática já usada nesta sessão.
-- (2) impede duas execuções RUNNING simultâneas do ACE para o mesmo Caso
-- (concorrência).

create or replace function public.enforce_case_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    allowed := case old.status
      when 'NEW' then new.status in ('IN_REVIEW', 'CANCELLED')
      when 'IN_REVIEW' then new.status in ('WAITING_FOR_INFORMATION', 'READY_FOR_CURATION', 'CANCELLED')
      when 'WAITING_FOR_INFORMATION' then new.status in ('IN_REVIEW', 'CANCELLED')
      when 'READY_FOR_CURATION' then new.status in ('IN_CURATION', 'CANCELLED')
      when 'IN_CURATION' then new.status in ('HUMAN_REVIEW', 'WAITING_FOR_INFORMATION', 'CANCELLED')
      when 'HUMAN_REVIEW' then new.status in ('DELIVERED', 'WAITING_FOR_INFORMATION', 'CANCELLED')
      when 'DELIVERED' then new.status in ('CLOSED')
      else false
    end;

    if not allowed then
      raise exception 'Transição de status inválida: % -> %', old.status, new.status;
    end if;

    if new.status = 'IN_CURATION' and old.started_at is null then
      new.started_at := now();
    end if;

    if new.status in ('CLOSED', 'CANCELLED') then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  end if;

  return new;
end;
$$;

-- Concorrência: nunca mais de uma execução RUNNING por Caso ao mesmo tempo.
create unique index ace_executions_one_running_per_case_idx
  on public.ace_executions (case_id)
  where status = 'RUNNING';
