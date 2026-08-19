-- AUDITORIA CORRETIVA — ciclo administrativo do lead
--
-- O Administrador passa a ter três atos explícitos e atômicos sobre
-- curadoria.crm_contacts:
--   1. arquivar (reversível e fora das filas);
--   2. restaurar;
--   3. apagar definitivamente (com confirmação nominal e tombstone).
--
-- Nenhum privilégio DELETE é concedido diretamente à tabela. A exclusão
-- permanente atravessa uma única RPC SECURITY DEFINER, fechada ao papel
-- administrador e com search_path fixo. Dependências operacionais com FK
-- ON DELETE CASCADE são contadas antes do ato e registradas no ledger.
-- Patient e Case canônicos não são apagados: são referências de saída do
-- contato e permanecem íntegros.
--
-- Rollback estrutural (não restaura linhas já apagadas):
--   drop function if exists curadoria.delete_lead_permanently(uuid, text, text);
--   drop function if exists curadoria.restore_lead(uuid, text);
--   drop function if exists curadoria.archive_lead(uuid, text);
--   alter table curadoria.crm_contacts drop column if exists archived_from_stage;

alter table curadoria.crm_contacts
  add column if not exists archived_from_stage text;

comment on column curadoria.crm_contacts.archived_from_stage is
  'Etapa operacional anterior ao arquivamento. Permite restaurar o lead sem inventar uma etapa nova.';

create or replace function curadoria.archive_lead(
  _contact_id uuid,
  _reason text
)
returns curadoria.crm_contacts
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _before curadoria.crm_contacts;
  _after curadoria.crm_contacts;
  _reason_clean text := btrim(coalesce(_reason, ''));
begin
  if auth.uid() is null or not curadoria.has_role('administrador') then
    raise exception 'Só o Administrador pode arquivar um lead'
      using errcode = '42501';
  end if;

  if char_length(_reason_clean) < 3 or char_length(_reason_clean) > 500 then
    raise exception 'Informe um motivo entre 3 e 500 caracteres'
      using errcode = '23514';
  end if;

  select * into _before
    from curadoria.crm_contacts
   where id = _contact_id
   for update;

  if not found then
    raise exception 'Lead não encontrado' using errcode = 'P0002';
  end if;

  if _before.status = 'arquivado' then
    return _before;
  end if;

  update curadoria.crm_contacts
     set status = 'arquivado',
         archived_at = clock_timestamp(),
         archived_from_stage = _before.pipeline_stage,
         pipeline_stage = 'archived'
   where id = _contact_id
   returning * into _after;

  perform curadoria.append_crm_audit_log(
    'lead_archived',
    'crm_contact',
    _contact_id,
    jsonb_build_object(
      'status', _before.status,
      'pipeline_stage', _before.pipeline_stage,
      'archived_at', _before.archived_at),
    jsonb_build_object(
      'status', _after.status,
      'pipeline_stage', _after.pipeline_stage,
      'archived_at', _after.archived_at),
    jsonb_build_object('reason', _reason_clean)
  );

  return _after;
end;
$function$;

revoke all on function curadoria.archive_lead(uuid, text) from public;
revoke all on function curadoria.archive_lead(uuid, text) from anon;
grant execute on function curadoria.archive_lead(uuid, text) to authenticated;

create or replace function curadoria.restore_lead(
  _contact_id uuid,
  _reason text
)
returns curadoria.crm_contacts
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _before curadoria.crm_contacts;
  _after curadoria.crm_contacts;
  _reason_clean text := btrim(coalesce(_reason, ''));
begin
  if auth.uid() is null or not curadoria.has_role('administrador') then
    raise exception 'Só o Administrador pode restaurar um lead'
      using errcode = '42501';
  end if;

  if char_length(_reason_clean) < 3 or char_length(_reason_clean) > 500 then
    raise exception 'Informe um motivo entre 3 e 500 caracteres'
      using errcode = '23514';
  end if;

  select * into _before
    from curadoria.crm_contacts
   where id = _contact_id
   for update;

  if not found then
    raise exception 'Lead não encontrado' using errcode = 'P0002';
  end if;

  if _before.status <> 'arquivado' then
    return _before;
  end if;

  update curadoria.crm_contacts
     set status = 'ativo',
         archived_at = null,
         pipeline_stage = coalesce(_before.archived_from_stage, 'new_contact'),
         archived_from_stage = null
   where id = _contact_id
   returning * into _after;

  perform curadoria.append_crm_audit_log(
    'lead_restored',
    'crm_contact',
    _contact_id,
    jsonb_build_object(
      'status', _before.status,
      'pipeline_stage', _before.pipeline_stage,
      'archived_at', _before.archived_at),
    jsonb_build_object(
      'status', _after.status,
      'pipeline_stage', _after.pipeline_stage,
      'archived_at', _after.archived_at),
    jsonb_build_object('reason', _reason_clean)
  );

  return _after;
end;
$function$;

revoke all on function curadoria.restore_lead(uuid, text) from public;
revoke all on function curadoria.restore_lead(uuid, text) from anon;
grant execute on function curadoria.restore_lead(uuid, text) to authenticated;

create or replace function curadoria.delete_lead_permanently(
  _contact_id uuid,
  _reason text,
  _confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _lead curadoria.crm_contacts;
  _reason_clean text := btrim(coalesce(_reason, ''));
  _interaction_count integer;
  _task_count integer;
  _appointment_count integer;
  _impact jsonb;
begin
  if auth.uid() is null or not curadoria.has_role('administrador') then
    raise exception 'Só o Administrador pode apagar definitivamente um lead'
      using errcode = '42501';
  end if;

  if char_length(_reason_clean) < 3 or char_length(_reason_clean) > 500 then
    raise exception 'Informe um motivo entre 3 e 500 caracteres'
      using errcode = '23514';
  end if;

  select * into _lead
    from curadoria.crm_contacts
   where id = _contact_id
   for update;

  if not found then
    raise exception 'Lead não encontrado' using errcode = 'P0002';
  end if;

  if coalesce(_confirmation, '') <> _lead.full_name then
    raise exception 'A confirmação não corresponde ao nome completo do lead'
      using errcode = '23514';
  end if;

  select count(*) into _interaction_count
    from curadoria.crm_interactions where contact_id = _contact_id;
  select count(*) into _task_count
    from curadoria.crm_tasks where contact_id = _contact_id;
  select count(*) into _appointment_count
    from curadoria.crm_appointments where contact_id = _contact_id;

  _impact := jsonb_build_object(
    'interactions_deleted', _interaction_count,
    'tasks_deleted', _task_count,
    'appointments_deleted', _appointment_count,
    'patient_preserved', _lead.patient_profile_id is not null,
    'case_preserved', _lead.active_case_id is not null
  );

  -- Tombstone mínimo e anterior ao DELETE. A transação é única: ou trilha e
  -- remoção acontecem juntas, ou nenhuma das duas acontece.
  perform curadoria.append_crm_audit_log(
    'lead_deleted_permanently',
    'crm_contact',
    _contact_id,
    jsonb_build_object(
      'full_name', _lead.full_name,
      'status', _lead.status,
      'pipeline_stage', _lead.pipeline_stage,
      'patient_profile_id', _lead.patient_profile_id,
      'active_case_id', _lead.active_case_id,
      'created_at', _lead.created_at),
    null,
    jsonb_build_object('reason', _reason_clean, 'impact', _impact)
  );

  delete from curadoria.crm_contacts where id = _contact_id;

  return _impact;
end;
$function$;

revoke all on function curadoria.delete_lead_permanently(uuid, text, text) from public;
revoke all on function curadoria.delete_lead_permanently(uuid, text, text) from anon;
grant execute on function curadoria.delete_lead_permanently(uuid, text, text) to authenticated;

comment on function curadoria.archive_lead(uuid, text) is
  'Auditoria corretiva: arquiva lead atomicamente, apenas para administrador, preservando etapa anterior e trilha.';
comment on function curadoria.restore_lead(uuid, text) is
  'Auditoria corretiva: restaura lead arquivado para sua etapa anterior, apenas para administrador, com trilha.';
comment on function curadoria.delete_lead_permanently(uuid, text, text) is
  'Auditoria corretiva: exclusão definitiva e atômica de lead, apenas para administrador, com confirmação nominal, impacto e tombstone.';
