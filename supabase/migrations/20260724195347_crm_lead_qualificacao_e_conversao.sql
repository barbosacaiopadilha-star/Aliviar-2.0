-- Lead → Patient: o vínculo que faltava.
--
-- Um crm_contact é um LEAD enquanto não foi qualificado e convertido. Depois
-- da conversão ele continua existindo — a origem não se apaga — mas passa a
-- apontar para o Patient que originou. Sem essa coluna não havia como saber
-- de onde um paciente veio, nem impedir que o mesmo lead virasse dois
-- pacientes.

alter table curadoria.crm_contacts
  add column if not exists patient_profile_id uuid references curadoria.profiles(id),
  add column if not exists qualified_at timestamptz,
  add column if not exists qualified_by uuid references curadoria.profiles(id),
  add column if not exists converted_at timestamptz,
  add column if not exists converted_by uuid references curadoria.profiles(id);

comment on column curadoria.crm_contacts.patient_profile_id is
  'Patient originado deste lead. Nulo enquanto o lead não foi convertido. O lead não vira paciente — ele passa a apontar para um.';
comment on column curadoria.crm_contacts.qualified_at is
  'Quando o Atendente qualificou o lead. Sem qualificação não há conversão no fluxo normal.';
comment on column curadoria.crm_contacts.converted_at is
  'Quando o lead virou Patient. Junto com converted_by, é a prova de quem converteu e quando.';

create index if not exists crm_contacts_patient_idx
  on curadoria.crm_contacts (patient_profile_id) where patient_profile_id is not null;

-- Índices de deduplicação. Não são UNIQUE de propósito: duplicidade de lead
-- é um fato do mundo real (a mesma pessoa escreve pelo site e pelo WhatsApp)
-- e deve ser mostrada a um humano, não rejeitada pelo banco.
create index if not exists crm_contacts_phone_norm_idx
  on curadoria.crm_contacts (phone_normalized) where phone_normalized is not null;
create index if not exists crm_contacts_email_norm_idx
  on curadoria.crm_contacts (email_normalized) where email_normalized is not null;

-- Coerência: converted_at e patient_profile_id andam juntos, sempre.
alter table curadoria.crm_contacts
  drop constraint if exists crm_contacts_conversao_coerente;
alter table curadoria.crm_contacts
  add constraint crm_contacts_conversao_coerente
  check ((patient_profile_id is null) = (converted_at is null));

-- O Atendente (Nível 1) é quem trabalha o lead. Ele não existia quando estas
-- policies foram escritas, por isso não estava em nenhuma delas.
create or replace function curadoria.can_access_crm_contact(_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
  select exists (
    select 1
    from curadoria.crm_contacts c
    where c.id = _contact_id
      and (
        curadoria.has_role('administrador')
        -- Nível 1: o lead é o trabalho do Atendente.
        or (curadoria.has_role('atendente') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (curadoria.has_role('concierge') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (
          curadoria.has_role('curador_medico')
          and exists (
            select 1
            from curadoria.crm_cases k
            where k.contact_id = c.id
              and k.responsible_curator_id = auth.uid()
              and k.pipeline_stage in (
                'sent_to_curator', 'curation_in_progress', 'report_ready',
                'report_delivered', 'doctor_selected', 'scheduling_support', 'completed'
              )
          )
        )
      )
  );
$function$;

drop policy if exists crm_contacts_insert on curadoria.crm_contacts;
create policy crm_contacts_insert
  on curadoria.crm_contacts for insert to authenticated
  with check (
    curadoria.has_role('administrador')
    or curadoria.has_role('atendente')
    or curadoria.has_role('concierge')
  );

-- Auditoria escrita pelo servidor, com ator de auth.uid(). O cliente não
-- escreve em crm_audit_log — não existe policy de INSERT para ele.
create or replace function curadoria.record_crm_audit(
  _action text,
  _entity_type text,
  _entity_id uuid,
  _previous jsonb default null,
  _new jsonb default null,
  _context jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare _id uuid;
begin
  if auth.uid() is null then
    raise exception 'Auditoria exige ator autenticado' using errcode = '42501';
  end if;
  insert into curadoria.crm_audit_log (actor_id, action, entity_type, entity_id, previous_values, new_values, context)
  values (auth.uid(), _action, _entity_type, _entity_id, _previous, _new, _context)
  returning id into _id;
  return _id;
end;
$function$;

revoke execute on function curadoria.record_crm_audit(text, text, uuid, jsonb, jsonb, jsonb) from public;
grant execute on function curadoria.record_crm_audit(text, text, uuid, jsonb, jsonb, jsonb) to authenticated;