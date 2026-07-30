-- Qualificação do lead pelo Atendente (Nível 1).
create or replace function curadoria.qualify_lead(_contact_id uuid, _notes text default null)
returns curadoria.crm_contacts
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare _actor uuid := auth.uid(); _c curadoria.crm_contacts;
begin
  if _actor is null then
    raise exception 'Qualificação exige ator autenticado' using errcode = '42501';
  end if;

  if not (curadoria.has_role('atendente') or curadoria.has_role('administrador')) then
    raise exception 'Só o Atendente qualifica o lead. O Curador e o Concierge recebem o Case já aberto.'
      using errcode = '42501';
  end if;

  select * into _c from curadoria.crm_contacts where id = _contact_id for update;
  if not found then
    raise exception 'Lead % não existe', _contact_id using errcode = 'P0002';
  end if;

  -- Idempotente: qualificar duas vezes não reescreve quem qualificou primeiro.
  if _c.qualified_at is not null then
    return _c;
  end if;

  update curadoria.crm_contacts
     set qualified_at = now(), qualified_by = _actor, updated_at = now()
   where id = _contact_id
   returning * into _c;

  perform curadoria.record_crm_audit(
    'lead_qualified', 'crm_contact', _contact_id, null,
    jsonb_build_object('qualified_by', _actor), jsonb_build_object('notes', _notes));

  return _c;
end;
$function$;

-- Conversão do lead em Patient.
--
-- Não cria o Patient: o Patient nasce fora do banco (conta de autenticação +
-- profile). Esta função é a que TORNA a conversão um fato — valida o direito
-- de fazê-la, impede duplicidade e grava a auditoria. Chamar isto é o que
-- significa "converter".
create or replace function curadoria.convert_lead_to_patient(
  _contact_id uuid,
  _patient_profile_id uuid,
  _administrative_exception boolean default false,
  _reason text default null
)
returns curadoria.crm_contacts
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _c curadoria.crm_contacts;
  _is_admin boolean;
  _outro uuid;
begin
  if _actor is null then
    raise exception 'Conversão exige ator autenticado' using errcode = '42501';
  end if;

  _is_admin := curadoria.has_role('administrador');

  -- Quem converte no fluxo normal é o Atendente. O Curador e o Concierge
  -- recebem o Case pronto — converter lead não é trabalho deles.
  if not (curadoria.has_role('atendente') or _is_admin) then
    raise exception 'Só o Atendente converte lead em paciente. O Curador conduz o Case; o Concierge acompanha depois.'
      using errcode = '42501';
  end if;

  select * into _c from curadoria.crm_contacts where id = _contact_id for update;
  if not found then
    raise exception 'Lead % não existe', _contact_id using errcode = 'P0002';
  end if;

  -- Idempotência: se já foi convertido para o mesmo Patient, nada acontece.
  -- Se foi convertido para OUTRO, é conflito e para aqui — nunca sobrescreve.
  if _c.patient_profile_id is not null then
    if _c.patient_profile_id = _patient_profile_id then
      return _c;
    end if;
    raise exception 'Lead já foi convertido no paciente %; converter de novo criaria duplicidade', _c.patient_profile_id
      using errcode = '23505';
  end if;

  if not exists (select 1 from curadoria.profiles where id = _patient_profile_id) then
    raise exception 'Paciente % não existe', _patient_profile_id using errcode = 'P0002';
  end if;

  -- Qualificação é pré-requisito do fluxo normal. A exceção administrativa
  -- existe, mas é explícita e fica registrada como exceção — nunca silenciosa.
  if _c.qualified_at is null then
    if not (_is_admin and _administrative_exception) then
      raise exception 'Lead ainda não foi qualificado. Qualifique antes de converter, ou registre uma exceção administrativa.'
        using errcode = '23514';
    end if;
    if coalesce(length(btrim(_reason)), 0) = 0 then
      raise exception 'Exceção administrativa exige motivo' using errcode = '23514';
    end if;
  end if;

  -- Duplicidade: o mesmo Patient já veio de outro lead?
  select id into _outro from curadoria.crm_contacts
   where patient_profile_id = _patient_profile_id and id <> _contact_id limit 1;
  if _outro is not null and not _is_admin then
    raise exception 'O paciente % já foi originado do lead %. Um administrador precisa resolver a duplicidade.', _patient_profile_id, _outro
      using errcode = '23505';
  end if;

  update curadoria.crm_contacts
     set patient_profile_id = _patient_profile_id,
         converted_at = now(),
         converted_by = _actor,
         updated_at = now()
   where id = _contact_id
   returning * into _c;

  perform curadoria.record_crm_audit(
    'lead_converted_to_patient', 'crm_contact', _contact_id,
    jsonb_build_object('patient_profile_id', null),
    jsonb_build_object('patient_profile_id', _patient_profile_id, 'converted_by', _actor),
    jsonb_build_object(
      'source', _c.source,
      'source_detail', _c.source_detail,
      'qualified_at', _c.qualified_at,
      'administrative_exception', (_c.qualified_at is null),
      'reason', _reason,
      'duplicate_of_lead', _outro
    ));

  return _c;
end;
$function$;

revoke execute on function curadoria.qualify_lead(uuid, text) from public;
grant execute on function curadoria.qualify_lead(uuid, text) to authenticated;
revoke execute on function curadoria.convert_lead_to_patient(uuid, uuid, boolean, text) from public;
grant execute on function curadoria.convert_lead_to_patient(uuid, uuid, boolean, text) to authenticated;