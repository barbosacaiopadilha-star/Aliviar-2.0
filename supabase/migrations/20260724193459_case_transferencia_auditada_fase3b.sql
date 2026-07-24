-- Correção de Domínio — Fase 3b: a passagem de bastão vira operação de
-- servidor. O cliente não escreve responsible_id/responsible_role direto.

-- 1) Trava: qualquer UPDATE que mexa na responsabilidade fora da operação
--    oficial é rejeitado pelo banco, não pela interface.
create or replace function curadoria.guard_case_responsibility()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if (new.responsible_id is distinct from old.responsible_id
      or new.responsible_role is distinct from old.responsible_role)
     and coalesce(current_setting('curadoria.handoff', true), '') <> 'on' then
    raise exception
      'Responsabilidade do Case só muda por curadoria.transfer_case_responsibility(). Escrita direta em responsible_id/responsible_role é proibida.'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;

drop trigger if exists cases_responsibility_guard on curadoria.cases;
create trigger cases_responsibility_guard
  before update on curadoria.cases
  for each row execute function curadoria.guard_case_responsibility();

-- 2) A operação oficial.
create or replace function curadoria.transfer_case_responsibility(
  _case_id uuid,
  _new_responsible_id uuid,
  _new_role text,
  _reason text
)
returns curadoria.cases
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _case curadoria.cases;
  _is_admin boolean;
begin
  if _actor is null then
    raise exception 'Transferência exige ator autenticado' using errcode = '42501';
  end if;

  if coalesce(length(btrim(_reason)), 0) = 0 then
    raise exception 'Motivo da transferência é obrigatório' using errcode = '23514';
  end if;

  if _new_role not in ('atendente', 'curador_medico', 'concierge') then
    raise exception 'Papel inválido: %. O CRM é sistema e a Curadoria é processo — nenhum dos dois é papel responsável.', _new_role
      using errcode = '23514';
  end if;

  select * into _case from curadoria.cases where id = _case_id for update;
  if not found then
    raise exception 'Case % não existe', _case_id using errcode = 'P0002';
  end if;

  _is_admin := curadoria.has_role('administrador');

  -- Quem pode transferir: o administrador, ou quem tem o Case na mão hoje.
  if not (
    _is_admin
    or _case.responsible_id = _actor
    or (_case.responsible_id is null and _case.assigned_curator_id = _actor)
  ) then
    raise exception 'Só o responsável atual pelo Case (ou um administrador) pode transferi-lo'
      using errcode = '42501';
  end if;

  -- Idempotência: transferir para quem já é o responsável não é erro nem
  -- evento novo. O histórico não registra o que não aconteceu.
  if _case.responsible_id is not distinct from _new_responsible_id
     and _case.responsible_role is not distinct from _new_role then
    return _case;
  end if;

  -- O destino precisa realmente ter o papel. Sem isso, "transferir ao
  -- Curador" viraria só um texto.
  if not exists (
    select 1 from curadoria.user_roles ur
    join curadoria.roles r on r.id = ur.role_id
    where ur.profile_id = _new_responsible_id and r.slug = _new_role
  ) then
    raise exception 'Destinatário % não tem o papel %', _new_responsible_id, _new_role
      using errcode = '23514';
  end if;

  -- Transições normais da jornada. Qualquer outra (devolução, reabertura,
  -- salto de nível) é excepcional e exige administrador — nunca acontece
  -- em silêncio.
  if not _is_admin then
    if not (
      (_case.responsible_role is null            and _new_role = 'atendente')
      or (_case.responsible_role = 'atendente'      and _new_role = 'curador_medico')
      or (_case.responsible_role = 'curador_medico' and _new_role = 'concierge')
      or (_case.responsible_role is null            and _new_role = 'curador_medico')
    ) then
      raise exception 'Transição de % para % não é normal na jornada; exige administrador e registro explícito',
        coalesce(_case.responsible_role, 'sem responsável'), _new_role
        using errcode = '42501';
    end if;
  end if;

  insert into curadoria.case_responsibility_changes (
    case_id, previous_responsible_id, previous_role,
    new_responsible_id, new_role, changed_by, reason
  ) values (
    _case_id, _case.responsible_id, _case.responsible_role,
    _new_responsible_id, _new_role, _actor, btrim(_reason)
  );

  perform set_config('curadoria.handoff', 'on', true);
  update curadoria.cases
     set responsible_id = _new_responsible_id,
         responsible_role = _new_role,
         updated_at = now()
   where id = _case_id
   returning * into _case;
  perform set_config('curadoria.handoff', 'off', true);

  return _case;
end;
$function$;

comment on function curadoria.transfer_case_responsibility(uuid, uuid, text, text) is
  'Passagem de bastão do Case. O ator vem de auth.uid(), nunca do cliente. Valida existência, permissão, papel real do destinatário, transição da jornada e motivo; é idempotente; grava a auditoria antes de mover o Case.';

revoke execute on function curadoria.transfer_case_responsibility(uuid, uuid, text, text) from public;
grant execute on function curadoria.transfer_case_responsibility(uuid, uuid, text, text) to authenticated;

revoke execute on function curadoria.guard_case_responsibility() from public;