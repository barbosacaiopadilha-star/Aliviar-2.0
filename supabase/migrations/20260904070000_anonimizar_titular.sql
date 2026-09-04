-- ANONIMIZAR O TITULAR — ADR-115, nascida do SIM-109.
--
-- POR QUE ESTA PORTA EXISTE. Em 04/09 a `eliminar_titular` foi chamada de
-- verdade, contra uma pessoa real, com autorização do Fundador. Falhou:
--
--   ERROR 23503: update or delete on table "cases" violates foreign key
--   constraint "curator_judgments_case_id_fkey"
--
-- Não é chave esquecida. `curator_judgments` tem o gatilho
-- `curator_judgments_sem_delete`, e ele existe de propósito: um juízo médico
-- que pode ser apagado depois não é juízo, é rascunho. A própria
-- `eliminar_titular` já previa isto no comentário do §3 — a limitação era
-- conhecida e escrita, e mesmo assim a porta foi dada por pronta.
--
-- A ADR-115 concilia as duas regras sem sacrificar nenhuma: a pessoa some por
-- inteiro, o Case sobrevive como CASCA ANÔNIMA, e os julgamentos continuam
-- apontando para ele. **Nenhum julgamento é editado ou apagado, e nenhum
-- gatilho ganha exceção** — o que se corta é o VÍNCULO, não o CONTEÚDO.
--
-- SOB A ADR-073: o congelamento admite "o que a lei exigir", e direito de
-- titular é lei. É a mesma exceção pela qual a `eliminar_titular` nasceu.
--
-- O QUE ESTA MIGRATION **NÃO** DECIDE: se a Aliviar PODE reter o juízo
-- (art. 16 da LGPD). Isso é do advogado, e a pergunta está pendente desde
-- 03/08. Se a resposta for "não pode", a camada 3 também é eliminada e a
-- cerca cede à lei — mas isso é outra migration, com exceção auditada e
-- exclusiva da porta.

-- ---------------------------------------------------------------------------
-- 1 · O Case passa a poder existir sem titular — mas SÓ se anonimizado.
-- ---------------------------------------------------------------------------
--
-- Soltar o `not null` sozinho enfraqueceria a invariante para todo Case: um
-- defeito passaria a criar Case órfão em silêncio. A restrição abaixo devolve
-- a invariante com a exceção nomeada — um Case tem titular, OU tem carimbo de
-- anonimização. Nunca nenhum dos dois.

alter table curadoria.cases
  add column if not exists anonimizado_em timestamptz;

comment on column curadoria.cases.anonimizado_em is
  'Quando o vínculo com a titular foi cortado pela ADR-115. Nulo em Case vivo. '
  'É o que autoriza patient_profile_id nulo — ver a restrição cases_titular_ou_anonimizado.';

alter table curadoria.cases
  alter column patient_profile_id drop not null;

-- E a ORIGEM também precisa poder ficar nula, o que só apareceu ao testar: a
-- história é a origem do Case (`source_story_id`), e a camada 2 da ADR-115
-- manda apagá-la — "não existe anonimizar um relato". Com o Case
-- sobrevivendo, o ponteiro segurava a história e a porta morria em
-- `cases_source_story_id_fkey`. Nulo aqui não perde informação: aponta para
-- uma história que deixou de existir de propósito.
alter table curadoria.cases
  alter column source_story_id drop not null;

alter table curadoria.cases
  drop constraint if exists cases_titular_ou_anonimizado;

-- Uma regra só, cobrindo os dois vínculos: Case VIVO tem titular e tem
-- origem; Case ANONIMIZADO pode não ter nenhum dos dois. O que nunca se
-- admite é um Case órfão sem carimbo — que seria defeito silencioso.
alter table curadoria.cases
  add constraint cases_titular_ou_anonimizado
  check (
    anonimizado_em is not null
    or (patient_profile_id is not null and source_story_id is not null)
  );

-- ---------------------------------------------------------------------------
-- 2 · O ato precisa de nome próprio na auditoria.
-- ---------------------------------------------------------------------------
--
-- `audit_action` é enum fechado — descoberto testando no local, onde a porta
-- morreu com `invalid input value for enum audit_action`. Reaproveitar
-- `data_subject_request_closed` seria mais fácil e seria mentira: quem lesse a
-- auditoria depois não distinguiria uma pessoa ELIMINADA de uma pessoa
-- ANONIMIZADA, que é exatamente a distinção que a ADR-115 criou. Auditoria que
-- não distingue os dois atos não serve para provar nenhum deles.

alter type curadoria.audit_action add value if not exists 'data_subject_request_anonymized';

-- ---------------------------------------------------------------------------
-- 3 · A porta.
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
begin
  -- As mesmas guardas da porta-irmã, e pelas mesmas razões. Repetidas de
  -- propósito: uma porta que confia na outra para validar quem chama é uma
  -- porta sem tranca.
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

  -- A TERCEIRA CERCA, e ela recusa em voz alta em vez de morrer num erro de
  -- constraint. Apagar a conta cascateia para `legal_acceptances`, que é
  -- append-only por `enforce_legal_append_only` — "a prova jurídica depende
  -- da imutabilidade". É o MESMO conflito do juízo do Curador, pela terceira
  -- vez, e a ADR-115 não o cobre: ela decidiu sobre o juízo, não sobre a
  -- prova de consentimento.
  --
  -- Hoje isto não dispara: não há documento legal publicado, logo não há
  -- aceite (ADR-096, `SIM-100`). Vai disparar no dia em que a política for
  -- publicada — ou seja, exatamente quando passar a importar. Deixar a porta
  -- quebrar sozinha naquele dia seria repetir o SIM-99.
  if exists (select 1 from curadoria.legal_acceptances where profile_id = _profile_id) then
    raise exception 'Esta pessoa tem aceite legal registrado, e o aceite é append-only: a prova de que houve base para tratar o dado dela não pode ser apagada por esta porta. É o mesmo conflito da ADR-115, aplicado à prova de consentimento, e ele ainda não foi decidido — depende do parecer sobre o art. 16 da LGPD. Não force: registre o pedido e escale.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(id), '{}') into _casos
    from curadoria.cases where patient_profile_id = _profile_id;

  -- O que o chamador tem de remover do storage: as linhas conhecidas e o que
  -- estiver na pasta da pessoa sem linha (órfãos). Metadado sem byte é índice
  -- apontando para o vazio; byte sem metadado é vazamento em silêncio.
  select coalesce(array_agg(file_path), '{}') into _paths
    from curadoria.patient_documents where profile_id = _profile_id;
  select coalesce(array_agg(o.name), '{}') into _orfaos
    from storage.objects o
   where o.bucket_id = 'patient-documents'
     and o.name like _profile_id::text || '/%'
     and o.name <> all(_paths);

  -- 1 · Auditoria primeiro, como na porta-irmã: o id vai no metadata porque a
  --     coluna com FK vira nula quando a pessoa sai.
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

  -- 2 · O CORTE VEM PRIMEIRO, e a ordem foi aprendida quebrando: enquanto o
  --     Case apontar para a pessoa e para a história dela, nada do que vem
  --     depois consegue sair. Apagar a história antes esbarra em
  --     `cases_source_story_id_fkey`; apagar a conta antes leva o Case junto
  --     no cascade e os julgamentos barram tudo — que foi a falha do SIM-109.
  --
  --     É este UPDATE que separa esta porta da `eliminar_titular`: o Case não
  --     é descartado, ele perde o dono e a origem.
  update curadoria.cases
     set patient_profile_id = null,
         source_story_id = null,
         anonimizado_em = now()
   where id = any(_casos);
  get diagnostics _cascas = row_count;

  -- 3 · CAMADA 1 da ADR-115 — identidade direta. Some, não se mascara.
  delete from curadoria.crm_contacts where patient_profile_id = _profile_id;
  get diagnostics _contatos = row_count;

  delete from curadoria.patient_documents where profile_id = _profile_id;
  get diagnostics _documentos = row_count;

  delete from curadoria.patient_notifications where profile_id = _profile_id;

  -- 4 · CAMADA 2 — a narrativa dela. Não existe anonimizar um relato: tirar o
  --     que identifica é destruir o que ele é.
  delete from curadoria.patient_stories where profile_id = _profile_id;
  get diagnostics _historias = row_count;

  --     A ADR-115 nomeou `patient_stories` e não previu o SEGUNDO lugar onde
  --     as palavras dela moram: `consultation_records.narrative` e
  --     `.motivation`. Aqui o registro NÃO é apagado — o fato de a Consulta
  --     Inicial ter acontecido é do Curador e da Rede, não dela. O que sai é
  --     o que ela disse.
  update curadoria.consultation_records
     set narrative = null, motivation = null
   where case_id = any(_casos)
     and (narrative is not null or motivation is not null);
  get diagnostics _consultas = row_count;

  -- 5 · A conta. Cascateia perfil, papéis, ajustes, pedidos de titular,
  --     aceites e o perfil de assistida. NÃO cascateia mais os Cases, porque
  --     eles deixaram de apontar para ela no passo 4.
  delete from auth.users where id = _profile_id;

  return jsonb_build_object(
    'profile_id', _profile_id,
    'executed_by', _executor,
    'cases_anonymized', _cascas,
    'contacts_removed', _contatos,
    'stories_removed', _historias,
    'documents_removed', _documentos,
    'consultations_stripped', _consultas,
    'storage_paths', to_jsonb(_paths || _orfaos),
    'storage_prefix', _profile_id::text || '/'
  );
end;
$function$;

comment on function curadoria.anonimizar_titular(uuid, text, uuid) is
  'ADR-115: cumpre o direito à eliminação quando o Case tem juízo do Curador. '
  'A pessoa some por inteiro; o Case vira casca anônima e os julgamentos '
  'sobrevivem apontando para ele. Corta o vínculo, nunca o conteúdo.';

revoke all on function curadoria.anonimizar_titular(uuid, text, uuid) from public, anon, authenticated;
grant execute on function curadoria.anonimizar_titular(uuid, text, uuid) to service_role;
