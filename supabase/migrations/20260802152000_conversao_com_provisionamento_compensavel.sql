-- ============================================================================
-- BLOCO B / E4 — CONVERSÃO DE LEAD COM SAGA DE PROVISIONAMENTO COMPENSÁVEL
-- ============================================================================
--
-- FINALIDADE
--   A conversão de lead cruza dois sistemas: o Auth (conta) nasce pela Admin
--   API, fora de qualquer transação do banco de negócio; o vínculo
--   lead->paciente é decidido depois, por `convert_lead_to_patient`. Quando a
--   RPC recusava (por design), a conta já existia — órfã, invisível, sem
--   papel de saída pela UI, e o retry travava para sempre no e-mail duplicado
--   (AT-02/AT-05, gate B14). Esta migration cria a saga de provisionamento:
--
--   1. `patient_provisioning` — o estado da operação (operation_key única,
--      REGISTERED -> CONVERTED | COMPENSATED), o registro retomável que
--      torna qualquer resíduo visível e recuperável.
--   2. `register_provisioned_patient` — o núcleo transacional do lado do
--      banco na criação de conta: concede o papel `paciente`, registra a
--      operação e — quando a conta NÃO nasce de um lead — cria a ficha CRM
--      de origem da pessoa. Nenhuma conta de paciente nasce invisível ao
--      CRM: ou aponta para o lead que a originou, ou ganha ficha própria de
--      provisionamento. Tudo numa transação; se ela falha, o chamador
--      compensa a conta (deleteUser) — a conta nunca fica sem papel e sem
--      registro.
--   3. `compensate_patient_provisioning` — marca a compensação executada
--      (idempotente; recusa compensar conversão concluída).
--   4. `convert_lead_to_patient` v2 (CREATE OR REPLACE em migration NOVA):
--      idêntica à de 20260724195421, com dois acréscimos: a checagem de
--      duplicidade ignora fichas de origem de provisionamento (elas não são
--      um "outro lead" — são o registro de nascimento da própria conta), e a
--      conversão concluída resolve a operação de provisionamento pendente.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.crm_contacts` com colunas de conversão (20260724195347).
--   - `curadoria.record_crm_audit` existente.
--   - Papel `atendente` existente (20260724191858).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Contas órfãs criadas ANTES desta migration não ganham
--     registro retroativo (não se inventa história); ficam detectáveis pela
--     consulta de fechamento abaixo e são caso de saneamento operacional.
--   - Leads e conversões já feitas não são tocados.
--
-- PROVA DE FECHAMENTO
--   - Gate B14 (tests/remediacao/atomicidade.integration.test.ts): após a
--     recusa da conversão, a conta criada NÃO está órfã — está vinculada à
--     sua ficha CRM de origem (ou foi compensada pela action).
--   - Consulta de órfãos (não cresce a partir daqui): contas com papel
--     paciente sem NENHUM crm_contact apontando para elas e sem operação em
--     patient_provisioning.
--
-- ROLLBACK
--   drop function if exists curadoria.compensate_patient_provisioning(text);
--   drop function if exists curadoria.register_provisioned_patient(uuid, text, uuid);
--   drop table if exists curadoria.patient_provisioning;
--   -- convert_lead_to_patient: reaplicar o corpo de 20260724195421
--   -- (CREATE OR REPLACE com aquele texto). Fichas de origem já criadas
--   -- (source_detail = 'provisionamento_de_conta') permanecem — são dado
--   -- real de CRM; removê-las seria apagar história.
-- ============================================================================

-- 1) O estado da operação de provisionamento.
create table curadoria.patient_provisioning (
  id uuid primary key default gen_random_uuid(),
  operation_key text not null unique,
  profile_id uuid references curadoria.profiles (id) on delete set null,
  origin_lead_id uuid references curadoria.crm_contacts (id) on delete set null,
  origin_contact_id uuid references curadoria.crm_contacts (id) on delete set null,
  status text not null default 'REGISTERED'
    check (status in ('REGISTERED', 'CONVERTED', 'COMPENSATED')),
  created_by uuid references curadoria.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint provisioning_operation_key_not_blank check (btrim(operation_key) <> ''),
  constraint provisioning_resolucao_coerente check ((status = 'REGISTERED') = (resolved_at is null))
);

comment on table curadoria.patient_provisioning is
  'Saga da criação de conta de paciente (Bloco B/AT-02). A conta nasce no Auth fora de transação; esta tabela é o registro retomável da operação: REGISTERED (conta criada, conversão pendente ou conta direta), CONVERTED (lead vinculado) ou COMPENSATED (conta desfeita após recusa). Escrita apenas pelas funções SECURITY DEFINER.';

create index patient_provisioning_profile_idx
  on curadoria.patient_provisioning (profile_id) where profile_id is not null;

alter table curadoria.patient_provisioning enable row level security;
grant select on curadoria.patient_provisioning to authenticated;
grant all on curadoria.patient_provisioning to service_role;

-- Leitura para a equipe que opera a conversão; nenhuma policy de escrita:
-- INSERT/UPDATE só acontecem por dentro das funções SECURITY DEFINER.
create policy patient_provisioning_select_equipe
  on curadoria.patient_provisioning for select to authenticated
  using (curadoria.has_role('administrador') or curadoria.has_role('atendente'));

-- 2) O núcleo transacional do provisionamento.
create or replace function curadoria.register_provisioned_patient(
  _profile_id uuid,
  _operation_key text,
  _origin_lead_id uuid default null
)
returns curadoria.patient_provisioning
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _op curadoria.patient_provisioning;
  _nome text;
  _origin_contact uuid := null;
  _role_id smallint;
begin
  if _actor is null then
    raise exception 'Provisionamento de conta exige ator autenticado' using errcode = '42501';
  end if;

  if not (curadoria.has_role('atendente') or curadoria.has_role('administrador')) then
    raise exception 'Só o Atendente ou o Administrador provisionam contas de paciente'
      using errcode = '42501';
  end if;

  if coalesce(btrim(_operation_key), '') = '' then
    raise exception 'Chave de operação do provisionamento é obrigatória' using errcode = '23514';
  end if;

  -- Idempotência por operation_key: repetir devolve o MESMO registro, sem
  -- tocar carimbos. Uma operação COMPENSADA (ou cuja conta já foi removida)
  -- pode ser reativada por uma nova tentativa legítima; uma operação viva de
  -- OUTRA conta é conflito, nunca sobrescrita silenciosa.
  select * into _op from curadoria.patient_provisioning
   where operation_key = _operation_key
   for update;
  if found then
    if _op.status <> 'COMPENSATED' and _op.profile_id is not null then
      if _op.profile_id = _profile_id then
        return _op;
      end if;
      raise exception 'A operação % já registrou outra conta (%)', _operation_key, _op.profile_id
        using errcode = '23505';
    end if;
    -- Reativação após compensação: a mesma chave, uma conta nova.
    update curadoria.patient_provisioning
       set profile_id = _profile_id,
           origin_lead_id = _origin_lead_id,
           status = 'REGISTERED',
           resolved_at = null,
           created_by = _actor
     where id = _op.id;
  end if;

  select display_name into _nome from curadoria.profiles where id = _profile_id;
  if not found then
    raise exception 'Paciente % não existe', _profile_id using errcode = 'P0002';
  end if;

  if _origin_lead_id is not null then
    if not exists (select 1 from curadoria.crm_contacts where id = _origin_lead_id) then
      raise exception 'Lead de origem % não existe', _origin_lead_id using errcode = 'P0002';
    end if;
  elsif not exists (
    select 1 from curadoria.crm_contacts where patient_profile_id = _profile_id
  ) then
    -- Conta sem lead de origem: nasce com a própria ficha CRM. Nenhuma conta
    -- de paciente fica invisível — se a conversão que vier depois falhar, a
    -- pessoa continua existindo no CRM, retomável por um humano.
    insert into curadoria.crm_contacts (
      full_name, source, source_detail, initial_reason,
      patient_profile_id, converted_at, converted_by, qualified_at, qualified_by
    ) values (
      coalesce(nullif(btrim(_nome), ''), 'Paciente sem nome'),
      'outro', 'provisionamento_de_conta',
      'Ficha de origem criada no provisionamento da conta — nenhuma conta de paciente nasce invisível ao CRM.',
      _profile_id, now(), _actor, now(), _actor
    )
    returning id into _origin_contact;
  end if;

  -- O papel nasce junto com o registro, na MESMA transação (fim do auth
  -- órfão sem papel — AT-05). O trigger de auditoria de user_roles grava o
  -- rastro da concessão.
  select id into _role_id from curadoria.roles where slug = 'paciente';
  insert into curadoria.user_roles (profile_id, role_id, granted_by)
  values (_profile_id, _role_id, _actor)
  on conflict (profile_id, role_id) do nothing;

  if _op.id is not null then
    update curadoria.patient_provisioning
       set origin_contact_id = coalesce(_origin_contact, origin_contact_id)
     where id = _op.id
     returning * into _op;
  else
    insert into curadoria.patient_provisioning (
      operation_key, profile_id, origin_lead_id, origin_contact_id, created_by
    ) values (
      _operation_key, _profile_id, _origin_lead_id, _origin_contact, _actor
    )
    returning * into _op;
  end if;

  perform curadoria.record_crm_audit(
    'patient_account_provisioned', 'patient_provisioning', _op.id, null,
    jsonb_build_object(
      'profile_id', _profile_id,
      'origin_lead_id', _origin_lead_id,
      'origin_contact_id', _origin_contact),
    jsonb_build_object('operation_key', _operation_key));

  return _op;
end;
$function$;

comment on function curadoria.register_provisioned_patient(uuid, text, uuid) is
  'Núcleo transacional do provisionamento de conta de paciente (Bloco B/AT-02/AT-05). Numa única transação: concede o papel paciente, registra a operação (idempotente por operation_key) e — sem lead de origem — cria a ficha CRM de nascimento da conta. Se esta função falha, o chamador compensa a conta no Auth (deleteUser).';

revoke execute on function curadoria.register_provisioned_patient(uuid, text, uuid) from public;
grant execute on function curadoria.register_provisioned_patient(uuid, text, uuid) to authenticated;

-- 3) O registro da compensação.
create or replace function curadoria.compensate_patient_provisioning(_operation_key text)
returns curadoria.patient_provisioning
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _op curadoria.patient_provisioning;
begin
  if _actor is null then
    raise exception 'Compensação exige ator autenticado' using errcode = '42501';
  end if;

  if not (curadoria.has_role('atendente') or curadoria.has_role('administrador')) then
    raise exception 'Só o Atendente ou o Administrador registram compensação de provisionamento'
      using errcode = '42501';
  end if;

  select * into _op from curadoria.patient_provisioning
   where operation_key = _operation_key
   for update;
  if not found then
    raise exception 'Operação de provisionamento % não existe', _operation_key
      using errcode = 'P0002';
  end if;

  -- Idempotente: compensar de novo devolve o mesmo registro.
  if _op.status = 'COMPENSATED' then
    return _op;
  end if;

  if _op.status = 'CONVERTED' then
    raise exception 'A operação % já converteu o lead — não há o que compensar', _operation_key
      using errcode = '23514';
  end if;

  -- O papel é revogado AQUI, com o perfil ainda de pé — nunca pela cascata
  -- do deleteUser: a cascata dispara o trigger de auditoria de user_roles
  -- quando o profile já foi removido, e o INSERT de auditoria viola a própria
  -- FK, travando a remoção da conta (a mesma armadilha documentada em
  -- tests/integration/limpeza/inventario.ts). Revogando antes, a auditoria é
  -- gravada íntegra e o deleteUser do chamador conclui sem resíduo.
  if _op.profile_id is not null then
    delete from curadoria.user_roles ur
     using curadoria.roles r
    where ur.profile_id = _op.profile_id
      and r.id = ur.role_id
      and r.slug = 'paciente';
  end if;

  update curadoria.patient_provisioning
     set status = 'COMPENSATED', resolved_at = now()
   where id = _op.id
   returning * into _op;

  perform curadoria.record_crm_audit(
    'patient_provisioning_compensated', 'patient_provisioning', _op.id,
    jsonb_build_object('status', 'REGISTERED'),
    jsonb_build_object('status', 'COMPENSATED'),
    jsonb_build_object('operation_key', _operation_key));

  return _op;
end;
$function$;

comment on function curadoria.compensate_patient_provisioning(text) is
  'Registra que a conta de um provisionamento recusado foi desfeita (deleteUser executado pelo servidor). Idempotente; recusa compensar operação já convertida.';

revoke execute on function curadoria.compensate_patient_provisioning(text) from public;
grant execute on function curadoria.compensate_patient_provisioning(text) to authenticated;

-- 4) convert_lead_to_patient v2 — corpo de 20260724195421 com dois acréscimos
--    nomeados (a original permanece intocada no repositório).
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

  if not (curadoria.has_role('atendente') or _is_admin) then
    raise exception 'Só o Atendente converte lead em paciente. O Curador conduz o Case; o Concierge acompanha depois.'
      using errcode = '42501';
  end if;

  select * into _c from curadoria.crm_contacts where id = _contact_id for update;
  if not found then
    raise exception 'Lead % não existe', _contact_id using errcode = 'P0002';
  end if;

  -- Idempotência: "já convertido" para o mesmo Patient não é erro; conversão
  -- para OUTRO Patient é conflito de domínio — nunca sobrescreve.
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

  if _c.qualified_at is null then
    if not (_is_admin and _administrative_exception) then
      raise exception 'Lead ainda não foi qualificado. Qualifique antes de converter, ou registre uma exceção administrativa.'
        using errcode = '23514';
    end if;
    if coalesce(length(btrim(_reason)), 0) = 0 then
      raise exception 'Exceção administrativa exige motivo' using errcode = '23514';
    end if;
  end if;

  -- Duplicidade: o mesmo Patient já veio de outro lead? A ficha de origem de
  -- provisionamento (source_detail = 'provisionamento_de_conta') NÃO conta —
  -- ela é o registro de nascimento da própria conta, não um segundo lead.
  select id into _outro from curadoria.crm_contacts
   where patient_profile_id = _patient_profile_id
     and id <> _contact_id
     and coalesce(source_detail, '') <> 'provisionamento_de_conta'
   limit 1;
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

  -- A conversão concluída resolve a operação de provisionamento pendente —
  -- na MESMA transação do vínculo.
  update curadoria.patient_provisioning
     set status = 'CONVERTED', resolved_at = now()
   where profile_id = _patient_profile_id
     and status = 'REGISTERED';

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

revoke execute on function curadoria.convert_lead_to_patient(uuid, uuid, boolean, text) from public;
grant execute on function curadoria.convert_lead_to_patient(uuid, uuid, boolean, text) to authenticated;
