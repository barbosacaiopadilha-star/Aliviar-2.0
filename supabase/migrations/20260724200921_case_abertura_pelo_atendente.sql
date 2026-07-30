-- Abertura do Case pelo Atendente (Nível 1).
--
-- O Case exige uma História (source_story_id NOT NULL) porque no Método
-- nenhum Case nasce sem que alguém tenha contado alguma coisa. No fluxo do
-- Atendente essa História é o que a pessoa disse no primeiro contato — o
-- `initial_reason` do lead. Ela nasce como rascunho, para o Curador
-- aprofundar; o que não pode é o Case nascer sem nada escrito.

create or replace function curadoria.open_case_from_lead(
  _contact_id uuid,
  _initial_story text default null
)
returns curadoria.cases
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _c curadoria.crm_contacts;
  _existing curadoria.cases;
  _story uuid;
  _case curadoria.cases;
  _texto text;
begin
  if _actor is null then
    raise exception 'Abertura de Case exige ator autenticado' using errcode = '42501';
  end if;

  if not (curadoria.has_role('atendente') or curadoria.has_role('administrador')) then
    raise exception 'Quem abre o Case é o Atendente. O Curador recebe o Case já aberto; o Concierge acompanha depois.'
      using errcode = '42501';
  end if;

  select * into _c from curadoria.crm_contacts where id = _contact_id for update;
  if not found then
    raise exception 'Lead % não existe', _contact_id using errcode = 'P0002';
  end if;

  if _c.patient_profile_id is null then
    raise exception 'Converta o lead em paciente antes de abrir o Case' using errcode = '23514';
  end if;

  -- Idempotência: o lead já aponta para um Case aberto? Devolve o mesmo.
  -- Sem isto, um duplo clique criaria o segundo Case da mesma pessoa — a
  -- duplicação que a Correção de Domínio existe para impedir.
  if _c.active_case_id is not null then
    select * into _existing from curadoria.cases where id = _c.active_case_id;
    if found then
      return _existing;
    end if;
  end if;

  _texto := coalesce(nullif(btrim(_initial_story), ''), nullif(btrim(_c.initial_reason), ''));
  if _texto is null then
    raise exception 'Registre o que a pessoa contou antes de abrir o Case' using errcode = '23514';
  end if;

  insert into curadoria.patient_stories (profile_id, status, current_step, data, created_by)
  values (
    _c.patient_profile_id, 'rascunho', 'motivo',
    jsonb_build_object(
      'motivo', _texto,
      'origem', 'atendimento_inicial',
      'lead_id', _contact_id,
      'registrado_por', _actor
    ),
    _actor
  )
  returning id into _story;

  insert into curadoria.cases (patient_profile_id, source_story_id, status, created_by, responsible_id, responsible_role)
  values (_c.patient_profile_id, _story, 'NEW', _actor, _actor, 'atendente')
  returning * into _case;

  update curadoria.crm_contacts
     set active_case_id = null, updated_at = now()
   where id = _contact_id;

  perform curadoria.record_crm_audit(
    'case_opened_from_lead', 'case', _case.id, null,
    jsonb_build_object('case_id', _case.id, 'patient_profile_id', _c.patient_profile_id, 'opened_by', _actor),
    jsonb_build_object('lead_id', _contact_id, 'source', _c.source, 'story_id', _story));

  return _case;
end;
$function$;

comment on function curadoria.open_case_from_lead(uuid, text) is
  'Abre o Case a partir de um lead já convertido. O Case nasce com o Atendente como responsável — nunca sem dono. Idempotente por lead.';

revoke execute on function curadoria.open_case_from_lead(uuid, text) from public;
grant execute on function curadoria.open_case_from_lead(uuid, text) to authenticated;

-- O Atendente precisa criar a História junto com o Case.
drop policy if exists patient_stories_insert_atendente on curadoria.patient_stories;
create policy patient_stories_insert_atendente
  on curadoria.patient_stories for insert to authenticated
  with check (curadoria.has_role('atendente') or curadoria.has_role('administrador'));