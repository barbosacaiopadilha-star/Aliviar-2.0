-- POLÍTICA DE FONTES E VERIFICAÇÃO
--
-- Encontrar não é verificar. Esta migration grava essa frase em três lugares
-- onde ela não pode ser esquecida.
--
-- 1. PROVENIÊNCIA OBRIGATÓRIA. `verificado` sem fonte, sem data e sem autor
--    passa a ser impossível. Antes era possível — e um dado nesse estado é
--    pior que um não verificado, porque carrega a aparência de conferido sem
--    ninguém por trás para responder por ele.
--
-- 2. DIVERGÊNCIAS PRESERVADAS. Quando duas fontes discordam, as duas versões
--    ficam. O sistema não escolhe. Escolher em silêncio é a forma mais barata
--    de transformar uma dúvida real em um fato falso.
--
-- 3. PUBLICAÇÃO COM REQUISITOS. Publicar deixa de ser um botão e passa a ser
--    uma porta com condições: real, com registro regular verificado, área
--    verificada e nenhuma divergência crítica em aberto.

-- ---------------------------------------------------------------------------
-- Proveniência obrigatória para dizer "verificado"
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'professional_practice_areas',
    'professional_education_entries',
    'professional_experience',
    'professional_career_entries',
    'professional_care_model',
    'professional_communication'
  ] loop
    execute format(
      'alter table curadoria.%I add constraint %I check (
         verification_status <> ''verificado''
         or (source is not null and btrim(source) <> '''' and verified_at is not null and verified_by is not null)
       )',
      t, t || '_verificado_exige_proveniencia');
  end loop;
end $$;

-- O registro profissional segue a mesma regra, em colunas próprias.
alter table curadoria.professional_profiles
  add constraint professional_registro_verificado_exige_proveniencia
  check (
    registration_status is null
    or (registration_source is not null and btrim(registration_source) <> ''
        and registration_verified_at is not null
        and registration_verified_by is not null)
  );

-- ---------------------------------------------------------------------------
-- Divergências — as duas versões sobrevivem
-- ---------------------------------------------------------------------------

create table curadoria.verification_divergences (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references curadoria.professional_profiles (id) on delete cascade,

  -- Que informação está em disputa. Texto livre porque a divergência pode
  -- nascer sobre qualquer campo, inclusive um que ainda não existe.
  subject text not null,

  -- As duas versões. Nenhuma das duas é jamais sobrescrita: quem resolve
  -- escreve em `resolved_version`, e o que estava continua legível.
  declared_version text not null,
  declared_source text,
  found_version text not null,
  found_source text,

  -- `critica` impede publicação. `observacao` fica registrada e não bloqueia:
  -- nem toda discordância é sobre algo que muda a decisão de um paciente.
  severity text not null default 'critica' check (severity in ('critica', 'observacao')),
  status text not null default 'aberta' check (status in ('aberta', 'resolvida')),

  resolution text,
  resolved_version text,
  resolved_by uuid references curadoria.profiles (id),
  resolved_at timestamptz,

  opened_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint divergence_versions_not_blank
    check (btrim(declared_version) <> '' and btrim(found_version) <> ''),

  -- Resolver exige dizer o que se concluiu, com quem e quando. Uma divergência
  -- que fecha sozinha não foi resolvida — foi esquecida.
  constraint divergence_resolution_complete
    check (
      status = 'aberta'
      or (resolution is not null and btrim(resolution) <> ''
          and resolved_by is not null and resolved_at is not null)
    )
);

create index verification_divergences_professional_idx
  on curadoria.verification_divergences (professional_profile_id)
  where status = 'aberta';

comment on table curadoria.verification_divergences is
  'Duas fontes relevantes discordam sobre um dado. As duas versoes ficam registradas; o sistema nunca escolhe uma delas. Resolver exige evidencia, autor e data -- e as versoes originais permanecem legiveis depois.';

create trigger set_divergences_updated_at before update on curadoria.verification_divergences
  for each row execute function curadoria.set_updated_at();

alter table curadoria.verification_divergences enable row level security;

grant select, insert, update on curadoria.verification_divergences to authenticated;
grant all on curadoria.verification_divergences to service_role;

create policy "divergences_admin_all" on curadoria.verification_divergences
  for all to authenticated
  using (curadoria.has_role('administrador'))
  with check (curadoria.has_role('administrador'));

-- O Curador é quem lê o dossiê inteiro; é ele quem percebe que a instituição
-- diz uma coisa e o cadastro diz outra. Pode abrir e ler, não pode resolver.
create policy "divergences_curator_select" on curadoria.verification_divergences
  for select to authenticated
  using (curadoria.has_role('curador_medico'));

create policy "divergences_curator_open" on curadoria.verification_divergences
  for insert to authenticated
  with check (curadoria.has_role('curador_medico') and status = 'aberta');

create policy "divergences_professional_select_own" on curadoria.verification_divergences
  for select to authenticated
  using (exists (
    select 1 from curadoria.professional_profiles pp
     where pp.id = verification_divergences.professional_profile_id
       and pp.profile_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- Publicar é uma porta com condições
-- ---------------------------------------------------------------------------

create function curadoria.assert_publication_requirements()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
begin
  -- Só interessa a transição para publicado. Editar um perfil já publicado
  -- não deve ser bloqueado por um requisito que venceu depois — despublicar
  -- por vencimento é outra decisão, e humana.
  if new.publication_status <> 'publicado' then return new; end if;
  if tg_op = 'UPDATE' and old.publication_status = 'publicado' then return new; end if;

  if new.is_demo then
    raise exception 'Perfil de demonstracao nao pode ser publicado.' using errcode = 'check_violation';
  end if;

  if new.crm is null or new.crm_uf is null then
    raise exception 'Publicacao exige CRM e UF registrados.' using errcode = 'check_violation';
  end if;

  if new.registration_status is distinct from 'regular' then
    raise exception 'Publicacao exige registro profissional verificado como regular no conselho.'
      using errcode = 'check_violation';
  end if;

  if not exists (
    select 1 from curadoria.professional_practice_areas a
     where a.professional_profile_id = new.id and a.verification_status = 'verificado'
  ) then
    raise exception 'Publicacao exige area de atuacao verificada.' using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from curadoria.verification_divergences d
     where d.professional_profile_id = new.id
       and d.status = 'aberta' and d.severity = 'critica'
  ) then
    raise exception 'Ha divergencia critica em aberto neste cadastro. Resolva antes de publicar.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function curadoria.assert_publication_requirements() from public;

comment on function curadoria.assert_publication_requirements() is
  'Publicar deixa de ser um botao e passa a ser uma porta com condicoes. Vive no banco porque a garantia precisa valer para qualquer caminho de escrita, e porque publicar e o momento em que um cadastro passa a poder alcancar um paciente.';

create trigger assert_publication_requirements
  before insert or update of publication_status on curadoria.professional_profiles
  for each row execute function curadoria.assert_publication_requirements();
