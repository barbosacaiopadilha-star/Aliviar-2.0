-- PACOTE PROFISSIONAIS — Mapa somente leitura, graduação MEC/Enamed e
-- administração do perfil.
--
-- Esta migration não altera dados existentes do Mapa e não publica perfil
-- algum. O histórico das três classificações antigas permanece preservado,
-- embora a interface deixe de oferecê-las como preenchimento manual.

-- ---------------------------------------------------------------------------
-- 1. Projeção pública restrita da Graduação registrada no Protocolo
-- ---------------------------------------------------------------------------

create table curadoria.professional_graduation_facts (
  professional_profile_id uuid primary key
    references curadoria.professional_profiles (id) on delete cascade,
  institution text not null check (btrim(institution) <> '' and char_length(institution) <= 200),
  graduation_year smallint not null check (graduation_year between 1900 and 2100),
  cc smallint check (cc between 1 and 5),
  cc_year smallint check (cc_year between 2000 and 2100),
  enamed smallint check (enamed between 1 and 5),
  enamed_year smallint check (enamed_year between 2025 and 2100),
  source_url text check (source_url is null or char_length(source_url) <= 500),
  updated_by uuid not null references curadoria.profiles (id),
  updated_at timestamptz not null default now(),
  constraint graduation_cc_pair check ((cc is null) = (cc_year is null)),
  constraint graduation_enamed_pair check ((enamed is null) = (enamed_year is null)),
  constraint graduation_source_official check (
    source_url is null
    or btrim(source_url) ~* '^https://([a-z0-9-]+[.])*gov[.]br([/?#]|$)'
  ),
  constraint graduation_indicators_require_source check (
    (cc is null and enamed is null)
    or source_url is not null
  )
);

comment on table curadoria.professional_graduation_facts is
  'Projeção factual da Graduação registrada administrativamente no Protocolo: instituição, ano, CC e Enamed do curso. Não mede desempenho individual e não participa de ranking.';

alter table curadoria.professional_graduation_facts enable row level security;

grant select, insert, update on curadoria.professional_graduation_facts to authenticated;
grant all on curadoria.professional_graduation_facts to service_role;

create policy "professional_graduation_facts_admin_all"
  on curadoria.professional_graduation_facts for all to authenticated
  using (curadoria.has_role('administrador'))
  with check (curadoria.has_role('administrador'));

create policy "professional_graduation_facts_curator_select"
  on curadoria.professional_graduation_facts for select to authenticated
  using (curadoria.has_role('curador_medico'));

create policy "professional_graduation_facts_own_select"
  on curadoria.professional_graduation_facts for select to authenticated
  using (exists (
    select 1
     from curadoria.professional_profiles p
     where p.id = professional_graduation_facts.professional_profile_id
       and auth.uid() = p.profile_id
  ));

create policy "professional_graduation_facts_patient_delivered_select"
  on curadoria.professional_graduation_facts for select to authenticated
  using (exists (
    select 1
      from curadoria.curated_selection_options o
      join curadoria.curated_selections s on s.id = o.curated_selection_id
     where o.professional_profile_id = professional_graduation_facts.professional_profile_id
       and s.status = 'DELIVERED'
       and curadoria.is_patient_for_case(s.case_id)
  ));

-- ---------------------------------------------------------------------------
-- 2. Arquivamento direto também para cadastro ainda em preparação
-- ---------------------------------------------------------------------------

create or replace function curadoria.motivos_da_transicao(
  _de curadoria.ciclo_do_profissional,
  _para curadoria.ciclo_do_profissional
)
returns curadoria.motivo_do_ciclo[]
language sql
immutable
set search_path = ''
as $$
  select case
    when _de = 'PREPARACAO' and _para = 'PUBLICADO_ATIVO'
      then array['CADASTRO_VALIDADO','REATIVACAO_VALIDADA']::curadoria.motivo_do_ciclo[]
    when _de = 'PAUSADO' and _para = 'PUBLICADO_ATIVO'
      then array['CADASTRO_VALIDADO','REATIVACAO_VALIDADA']::curadoria.motivo_do_ciclo[]
    when _de = 'PUBLICADO_ATIVO' and _para = 'PAUSADO'
      then array['INDISPONIBILIDADE_TEMPORARIA','REVISAO_CADASTRAL','SOLICITACAO_DO_PROFISSIONAL','OUTRO']::curadoria.motivo_do_ciclo[]
    when _de in ('PREPARACAO','PUBLICADO_ATIVO','PAUSADO') and _para = 'RETIRADO_ARQUIVADO'
      then array['ENCERRAMENTO_DA_ATUACAO','SOLICITACAO_DO_PROFISSIONAL','IMPEDIMENTO_REGULATORIO','DIVERGENCIA_CRITICA','OUTRO']::curadoria.motivo_do_ciclo[]
    when _de = 'RETIRADO_ARQUIVADO' and _para = 'PREPARACAO'
      then array['RETORNO_SOLICITADO','REGULARIZACAO_CONCLUIDA','REVISAO_CONCLUIDA','OUTRO']::curadoria.motivo_do_ciclo[]
    else array[]::curadoria.motivo_do_ciclo[]
  end;
$$;

revoke all on function curadoria.motivos_da_transicao(
  curadoria.ciclo_do_profissional, curadoria.ciclo_do_profissional
) from public;
grant execute on function curadoria.motivos_da_transicao(
  curadoria.ciclo_do_profissional, curadoria.ciclo_do_profissional
) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Prévia de impacto e exclusão definitiva estreita
-- ---------------------------------------------------------------------------

alter type curadoria.audit_action
  add value if not exists 'professional_deleted_permanently';

create or replace function curadoria.professional_profile_admin_impact(
  _professional_profile_id uuid
)
returns jsonb
language plpgsql
security definer
stable
strict
set search_path = ''
as $$
declare
  _profile curadoria.professional_profiles;
  _connections integer;
  _selection_options integer;
  _report_options integer;
  _map_entries integer;
  _practice_evidence integer;
  _documents integer;
  _education integer;
  _drafts integer;
  _other_curadoria_history integer;
  _legal_acceptances integer;
  _protected_history integer;
begin
  if auth.uid() is null or not curadoria.has_role('administrador') then
    raise exception 'Só o Administrador pode consultar o impacto deste perfil'
      using errcode = '42501';
  end if;

  select * into _profile
    from curadoria.professional_profiles
   where id = _professional_profile_id;
  if not found then
    raise exception 'Profissional não encontrado' using errcode = 'P0002';
  end if;

  select count(*) into _connections
    from curadoria.connection_records where professional_profile_id = _professional_profile_id;
  select count(*) into _selection_options
    from curadoria.curated_selection_options where professional_profile_id = _professional_profile_id;
  select count(*) into _report_options
    from curadoria.curadoria_report_options where professional_profile_id = _professional_profile_id;
  select count(*) into _map_entries
    from curadoria.professional_subcriterion_map where professional_profile_id = _professional_profile_id;
  select count(*) into _practice_evidence
    from curadoria.practice_evidence where professional_profile_id = _professional_profile_id;
  select count(*) into _documents
    from curadoria.professional_documents where professional_profile_id = _professional_profile_id;
  select count(*) into _education
    from curadoria.professional_education_entries where professional_profile_id = _professional_profile_id;
  select count(*) into _drafts
    from curadoria.practice_protocol_drafts where professional_profile_id = _professional_profile_id;
  select
      (select count(*) from curadoria.compatibility_analyses where professional_profile_id = _professional_profile_id)
    + (select count(*) from curadoria.criterion_declarations where professional_profile_id = _professional_profile_id)
    + (select count(*) from curadoria.area_compatibility_declarations where professional_profile_id = _professional_profile_id)
    + (select count(*) from curadoria.curator_judgments where professional_profile_id = _professional_profile_id)
  into _other_curadoria_history;
  select count(*) into _legal_acceptances
    from curadoria.legal_acceptances where professional_profile_id = _professional_profile_id;

  _protected_history := _connections + _selection_options + _report_options
    + _map_entries + _practice_evidence + _other_curadoria_history + _legal_acceptances;

  return jsonb_build_object(
    'professional_profile_id', _profile.id,
    'display_name', _profile.display_name,
    'connections', _connections,
    'selection_options', _selection_options,
    'report_options', _report_options,
    'map_entries', _map_entries,
    'practice_evidence', _practice_evidence,
    'documents', _documents,
    'education_entries', _education,
    'protocol_drafts', _drafts,
    'other_curadoria_history', _other_curadoria_history,
    'legal_acceptances', _legal_acceptances,
    'linked_account_preserved', _profile.profile_id is not null,
    'protected_history', _protected_history,
    -- Documento precisa ser removido pela Storage API antes da exclusão para
    -- não deixar objeto órfão no bucket.
    'deletion_allowed', _protected_history = 0 and _documents = 0
  );
end;
$$;

revoke all on function curadoria.professional_profile_admin_impact(uuid) from public;
revoke all on function curadoria.professional_profile_admin_impact(uuid) from anon;
grant execute on function curadoria.professional_profile_admin_impact(uuid)
  to authenticated;

create or replace function curadoria.delete_professional_profile_permanently(
  _professional_profile_id uuid,
  _reason text,
  _confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _profile curadoria.professional_profiles;
  _reason_clean text := btrim(coalesce(_reason, ''));
  _impact jsonb;
  _professional_role_id uuid;
begin
  if auth.uid() is null or not curadoria.has_role('administrador') then
    raise exception 'Só o Administrador pode excluir definitivamente um perfil profissional'
      using errcode = '42501';
  end if;

  if char_length(_reason_clean) < 3 or char_length(_reason_clean) > 500 then
    raise exception 'Informe um motivo entre 3 e 500 caracteres'
      using errcode = '23514';
  end if;

  select * into _profile
    from curadoria.professional_profiles
   where id = _professional_profile_id
   for update;
  if not found then
    raise exception 'Profissional não encontrado' using errcode = 'P0002';
  end if;

  if coalesce(_confirmation, '') <> _profile.display_name then
    raise exception 'A confirmação não corresponde ao nome completo do profissional'
      using errcode = '23514';
  end if;

  _impact := curadoria.professional_profile_admin_impact(_professional_profile_id);

  if (_impact->>'protected_history')::integer > 0 then
    raise exception 'Este profissional tem histórico operacional e não pode ser excluído. Arquive o perfil para preservar as Curadorias anteriores.'
      using errcode = '23514';
  end if;
  if (_impact->>'documents')::integer > 0 then
    raise exception 'Remova os documentos do perfil antes da exclusão definitiva.'
      using errcode = '23514';
  end if;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    auth.uid(),
    'professional_deleted_permanently',
    _profile.profile_id,
    jsonb_build_object(
      'professional_profile_id', _profile.id,
      'display_name', _profile.display_name,
      'professional_identifier', _profile.professional_identifier,
      'reason', _reason_clean,
      'impact', _impact
    )
  );

  if _profile.profile_id is not null then
    select id into _professional_role_id
      from curadoria.roles where slug = 'profissional';
    delete from curadoria.user_roles
     where profile_id = _profile.profile_id
       and role_id = _professional_role_id;
  end if;

  delete from curadoria.professional_profiles
   where id = _professional_profile_id;

  return _impact;
end;
$$;

revoke all on function curadoria.delete_professional_profile_permanently(uuid, text, text) from public;
revoke all on function curadoria.delete_professional_profile_permanently(uuid, text, text) from anon;
grant execute on function curadoria.delete_professional_profile_permanently(uuid, text, text)
  to authenticated;

comment on function curadoria.professional_profile_admin_impact(uuid) is
  'Prévia administrativa dos vínculos do perfil. Histórico operacional e documentos bloqueiam a exclusão definitiva.';
comment on function curadoria.delete_professional_profile_permanently(uuid, text, text) is
  'Exclusão definitiva estreita: somente Administrador, confirmação nominal, motivo, impacto, tombstone e preservação do histórico.';
