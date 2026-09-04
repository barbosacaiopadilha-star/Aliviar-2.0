-- A QUARTA CAMADA — ADR-116, emenda da ADR-115.
--
-- POR QUE ESTA MIGRATION EXISTE. A `anonimizar_titular` (20260904070000) foi
-- chamada em produção contra uma pessoa real e falhou:
--
--   ERROR 23503: update or delete on table "profiles" violates foreign key
--   constraint "connection_records_patient_profile_id_fkey"
--
-- A ADR-115 classificou três camadas — identidade, narrativa, juízo do
-- Curador — e não classificou conexão e relacionamento. A ADR-116 decide:
-- **são trajetória**, e seguem o juízo. Sobrevivem órfãos.
--
-- O MAPA, medido antes de escrever esta linha: das 42 chaves bloqueantes que
-- apontam para `profiles`, apenas SETE tinham linha da pessoa. Duas
-- (`patient_stories`, `patient_documents`) a porta já apaga, e as versões da
-- história cascateiam com ela. Restam as QUATRO tratadas aqui. As outras 35
-- são colunas de autoria da equipe, que numa assistida estão vazias.
--
-- Enumerar antes de consertar é o ponto: as quatro cercas anteriores foram
-- descobertas uma a uma, cada conserto olhando o erro anterior em vez do mapa.

-- ---------------------------------------------------------------------------
-- 1 · As quatro colunas passam a aceitar nulo — com guarda de nascimento.
-- ---------------------------------------------------------------------------
--
-- Soltar o `NOT NULL` sozinho enfraqueceria a invariante para todo mundo: um
-- defeito passaria a criar conexão sem dono em silêncio. No lugar dele entra
-- um gatilho que recusa INSERT com nulo. A linha **nasce com dono e pode
-- perder o dono** — que é exatamente a diferença entre anonimizar e ter bug.

alter table curadoria.connection_records  alter column patient_profile_id drop not null;
alter table curadoria.relationship_records alter column patient_profile_id drop not null;
alter table curadoria.connection_events    alter column actor_id drop not null;
alter table curadoria.relationship_events  alter column actor_id drop not null;

create or replace function curadoria.exige_dono_no_nascimento()
returns trigger
language plpgsql
as $function$
begin
  -- TG_ARGV[0] é o nome da coluna que não pode nascer nula. O nulo continua
  -- alcançável por UPDATE — e só a porta de anonimização faz esse UPDATE.
  if to_jsonb(new) ->> TG_ARGV[0] is null then
    raise exception '%.% não pode nascer sem dono (ADR-116): o nulo só existe depois da anonimização, nunca na criação.',
      TG_TABLE_NAME, TG_ARGV[0] using errcode = '23502';
  end if;
  return new;
end;
$function$;

drop trigger if exists connection_records_exige_dono on curadoria.connection_records;
create trigger connection_records_exige_dono
  before insert on curadoria.connection_records
  for each row execute function curadoria.exige_dono_no_nascimento('patient_profile_id');

drop trigger if exists relationship_records_exige_dono on curadoria.relationship_records;
create trigger relationship_records_exige_dono
  before insert on curadoria.relationship_records
  for each row execute function curadoria.exige_dono_no_nascimento('patient_profile_id');

drop trigger if exists connection_events_exige_ator on curadoria.connection_events;
create trigger connection_events_exige_ator
  before insert on curadoria.connection_events
  for each row execute function curadoria.exige_dono_no_nascimento('actor_id');

drop trigger if exists relationship_events_exige_ator on curadoria.relationship_events;
create trigger relationship_events_exige_ator
  before insert on curadoria.relationship_events
  for each row execute function curadoria.exige_dono_no_nascimento('actor_id');

comment on column curadoria.connection_records.patient_profile_id is
  'Nulo APENAS depois da anonimização (ADR-116). O carimbo que explica o nulo '
  'mora no Case ao qual esta conexão pertence (cases.anonimizado_em). Nascer '
  'nulo é recusado por gatilho.';

comment on column curadoria.relationship_records.patient_profile_id is
  'Nulo APENAS depois da anonimização (ADR-116) — ver o comentário gêmeo em '
  'connection_records.patient_profile_id.';

-- ---------------------------------------------------------------------------
-- 2 · A porta passa a cortar também a trajetória.
-- ---------------------------------------------------------------------------

create or replace function curadoria.anonimizar_titular(
  _profile_id uuid,
  _reason text,
  _executed_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _executor uuid;
  _eh_paciente boolean;
  _casos uuid[];
  _paths text[];
  _orfaos text[];
  _contatos int;
  _historias int;
  _documentos int;
  _consultas int;
  _cascas int;
  _conexoes int;
  _relacoes int;
begin
  if _profile_id is null then
    raise exception 'Anonimização exige o identificador da pessoa.' using errcode = '22023';
  end if;
  if btrim(coalesce(_reason, '')) = '' then
    raise exception 'Anonimização exige motivo. Uma anonimização sem motivo não é auditável.' using errcode = '22023';
  end if;

  _executor := coalesce(auth.uid(), _executed_by);
  if _executor is null then
    raise exception 'Anonimização exige executor identificado.' using errcode = '42501';
  end if;
  if auth.uid() is not null and _executed_by is not null and _executed_by <> auth.uid() then
    raise exception 'Anonimização: o executor informado não é o usuário autenticado.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from curadoria.user_roles ur join curadoria.roles r on r.id = ur.role_id
     where ur.profile_id = _executor and r.slug = 'administrador'
  ) then
    raise exception 'Anonimização exige papel administrador.' using errcode = '42501';
  end if;

  if not exists (select 1 from curadoria.profiles where id = _profile_id) then
    raise exception 'Pessoa % não existe.', _profile_id using errcode = '02000';
  end if;

  select exists (
    select 1 from curadoria.user_roles ur join curadoria.roles r on r.id = ur.role_id
     where ur.profile_id = _profile_id and r.slug = 'paciente'
  ) into _eh_paciente;
  if not _eh_paciente then
    raise exception 'Anonimização pela porta do titular só alcança assistidas. Equipe interna tem responsabilidades a reatribuir antes — é outro procedimento.'
      using errcode = '42501';
  end if;

  -- A cerca do aceite: recusa em voz alta em vez de morrer num erro de
  -- constraint. É o mesmo conflito da ADR-115 aplicado à prova de
  -- consentimento, e ele depende do parecer sobre o art. 16.
  if exists (select 1 from curadoria.legal_acceptances where profile_id = _profile_id) then
    raise exception 'Esta pessoa tem aceite legal registrado, e o aceite é append-only: a prova de que houve base para tratar o dado dela não pode ser apagada por esta porta. É o mesmo conflito da ADR-115, aplicado à prova de consentimento, e ele ainda não foi decidido — depende do parecer sobre o art. 16 da LGPD. Não force: registre o pedido e escale.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(id), '{}') into _casos
    from curadoria.cases where patient_profile_id = _profile_id;

  select coalesce(array_agg(file_path), '{}') into _paths
    from curadoria.patient_documents where profile_id = _profile_id;
  select coalesce(array_agg(o.name), '{}') into _orfaos
    from storage.objects o
   where o.bucket_id = 'patient-documents'
     and o.name like _profile_id::text || '/%'
     and o.name <> all(_paths);

  -- 1 · Auditoria primeiro.
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    _executor,
    'data_subject_request_anonymized',
    _profile_id,
    jsonb_build_object(
      'profile_id', _profile_id,
      'reason', btrim(_reason),
      'cases_anonymized', coalesce(array_length(_casos, 1), 0),
      'documents', coalesce(array_length(_paths, 1), 0),
      'storage_orphans', coalesce(array_length(_orfaos, 1), 0),
      'anonymized_at', now()
    )
  );

  -- 2 · O CORTE, e ele agora tem quatro braços. A ordem continua sendo a
  --     lição: enquanto algo apontar para a pessoa, nada consegue sair.
  update curadoria.cases
     set patient_profile_id = null, source_story_id = null, anonimizado_em = now()
   where id = any(_casos);
  get diagnostics _cascas = row_count;

  --     ADR-116 · a trajetória perde o dono e sobrevive: "houve aproximação
  --     com este profissional, e dela nasceu um relacionamento".
  update curadoria.connection_records set patient_profile_id = null
   where patient_profile_id = _profile_id;
  get diagnostics _conexoes = row_count;

  update curadoria.relationship_records set patient_profile_id = null
   where patient_profile_id = _profile_id;
  get diagnostics _relacoes = row_count;

  update curadoria.connection_events set actor_id = null where actor_id = _profile_id;
  update curadoria.relationship_events set actor_id = null where actor_id = _profile_id;

  -- 3 · CAMADA 1 — identidade direta.
  delete from curadoria.crm_contacts where patient_profile_id = _profile_id;
  get diagnostics _contatos = row_count;
  delete from curadoria.patient_documents where profile_id = _profile_id;
  get diagnostics _documentos = row_count;
  delete from curadoria.patient_notifications where profile_id = _profile_id;

  -- 4 · CAMADA 2 — a narrativa dela.
  delete from curadoria.patient_stories where profile_id = _profile_id;
  get diagnostics _historias = row_count;

  update curadoria.consultation_records
     set narrative = null, motivation = null
   where case_id = any(_casos)
     and (narrative is not null or motivation is not null);
  get diagnostics _consultas = row_count;

  -- 5 · A conta.
  delete from auth.users where id = _profile_id;

  return jsonb_build_object(
    'profile_id', _profile_id,
    'executed_by', _executor,
    'cases_anonymized', _cascas,
    'connections_orphaned', _conexoes,
    'relationships_orphaned', _relacoes,
    'contacts_removed', _contatos,
    'stories_removed', _historias,
    'documents_removed', _documentos,
    'consultations_stripped', _consultas,
    'storage_paths', to_jsonb(_paths || _orfaos),
    'storage_prefix', _profile_id::text || '/'
  );
end;
$function$;

revoke all on function curadoria.anonimizar_titular(uuid, text, uuid) from public, anon, authenticated;
grant execute on function curadoria.anonimizar_titular(uuid, text, uuid) to service_role;
