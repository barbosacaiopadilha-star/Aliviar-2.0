-- CRM — auditoria imutável via função segura
--
-- O insert direto em crm_audit_log permitia que o cliente informasse actor_id
-- arbitrariamente. A partir desta migration, usuários autenticados só gravam
-- auditoria via append_crm_audit_log(), que fixa actor_id = auth.uid().
--
-- service_role continua podendo inserir diretamente (leads do site sem sessão).

create or replace function curadoria.append_crm_audit_log(
  _action text,
  _entity_type text,
  _entity_id uuid,
  _previous_values jsonb default null,
  _new_values jsonb default null,
  _context jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;

  if not (curadoria.has_role('administrador') or curadoria.has_role('concierge')) then
    raise exception 'Não autorizado.';
  end if;

  if btrim(coalesce(_action, '')) = '' or btrim(coalesce(_entity_type, '')) = '' then
    raise exception 'Ação ou entidade inválida.';
  end if;

  insert into curadoria.crm_audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    previous_values,
    new_values,
    context
  ) values (
    auth.uid(),
    _action,
    _entity_type,
    _entity_id,
    _previous_values,
    _new_values,
    _context
  )
  returning id into _id;

  return _id;
end;
$$;

comment on function curadoria.append_crm_audit_log(text, text, uuid, jsonb, jsonb, jsonb)
  is 'Grava auditoria CRM com actor_id sempre auth.uid(). Não permite falsificação de ator.';

revoke all on function curadoria.append_crm_audit_log(text, text, uuid, jsonb, jsonb, jsonb) from public;
grant execute on function curadoria.append_crm_audit_log(text, text, uuid, jsonb, jsonb, jsonb) to authenticated;

-- Remove insert direto para authenticated; leitura continua só administrador.
drop policy if exists crm_audit_log_insert on curadoria.crm_audit_log;
