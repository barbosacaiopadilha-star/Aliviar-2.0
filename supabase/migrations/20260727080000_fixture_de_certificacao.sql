-- FIXTURE DE CERTIFICAÇÃO — exercitar o ciclo inteiro sem tocar em ninguém
--
-- A Rede real está vazia e vai continuar vazia até alguém fornecer médicos de
-- verdade. Mas o ciclo da Curadoria precisa ser certificado antes disso, e
-- certificar contra mocks em memória provaria pouco: os contratos que podem
-- quebrar são os do banco.
--
-- Daí um terceiro tipo de perfil. São três agora, e a distinção entre eles é
-- o que esta migration existe para tornar impossível de confundir:
--
--   real          — pode ser oferecido a um paciente.
--   demonstração  — existiu para exercitar telas; não participa de nada.
--   fixture       — existe para exercitar CONTRATOS; percorre o caminho
--                   técnico inteiro, e só dentro de um Case de certificação.
--
-- A regra central é um emparelhamento estrito: fixture só entra em Case de
-- certificação, e Case de certificação só aceita fixture. Nas duas direções.
-- Uma regra que valesse só num sentido deixaria a porta perigosa aberta —
-- a de um profissional sintético num Case real.

alter table curadoria.professional_profiles
  add column is_test_fixture boolean not null default false;

comment on column curadoria.professional_profiles.is_test_fixture is
  'Perfil sintetico de certificacao. Percorre cadastro, verificacao, publicacao e selecao pelos contratos reais, mas somente dentro de um Case marcado como certificacao. Nunca alcanca paciente.';

alter table curadoria.cases
  add column is_certification boolean not null default false;

comment on column curadoria.cases.is_certification is
  'Case sintetico de certificacao. Nao pertence a nenhuma pessoa real e nao entra em indicador operacional.';

-- Demonstração e fixture são coisas diferentes. Um perfil que fosse as duas
-- herdaria as permissões da fixture e a origem da demonstração, e ninguém
-- saberia dizer o que ele é.
alter table curadoria.professional_profiles
  add constraint fixture_nao_e_demonstracao
  check (not (is_demo and is_test_fixture));

-- Registro sintético só existe em fixture. Um `CRM-TEST-...` num perfil real
-- seria um cadastro que parece verificável e não é.
alter table curadoria.professional_profiles
  add constraint crm_sintetico_apenas_em_fixture
  check (crm is null or is_test_fixture or crm not like 'CRM-TEST-%');

-- ---------------------------------------------------------------------------
-- O emparelhamento
-- ---------------------------------------------------------------------------

create function curadoria.assert_professional_allowed_in_selection()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
declare
  perfil record;
  caso record;
begin
  select p.is_demo, p.is_test_fixture into perfil
    from curadoria.professional_profiles p where p.id = new.professional_profile_id;

  if perfil.is_demo then
    raise exception 'Perfil de demonstracao nao participa de Curadoria real.'
      using errcode = 'check_violation';
  end if;

  select c.is_certification into caso
    from curadoria.curated_selections s
    join curadoria.cases c on c.id = s.case_id
   where s.id = new.curated_selection_id;

  if perfil.is_test_fixture and not caso.is_certification then
    raise exception 'Perfil sintetico de certificacao nao entra em Case real.'
      using errcode = 'check_violation';
  end if;

  if caso.is_certification and not perfil.is_test_fixture then
    raise exception 'Case de certificacao aceita apenas perfis sinteticos de certificacao.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function curadoria.assert_professional_allowed_in_selection() from public;

drop trigger if exists assert_not_demo_professional on curadoria.curated_selection_options;

create trigger assert_professional_allowed_in_selection
  before insert or update on curadoria.curated_selection_options
  for each row execute function curadoria.assert_professional_allowed_in_selection();

-- ---------------------------------------------------------------------------
-- Conexão é sempre real
-- ---------------------------------------------------------------------------

-- Não existe conexão de certificação. Connection é o momento em que uma
-- pessoa decide procurar um médico; sintético nenhum chega aqui, e é por isso
-- que a fixture pode percorrer todo o resto sem risco.
create or replace function curadoria.reject_demo_professional()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
begin
  if exists (
    select 1 from curadoria.professional_profiles p
     where p.id = new.professional_profile_id and (p.is_demo or p.is_test_fixture)
  ) then
    raise exception
      'Perfil de demonstracao ou de certificacao nao gera conexao real.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

comment on function curadoria.reject_demo_professional() is
  'Nenhum perfil sintetico -- demonstracao ou certificacao -- vira conexao. Connection e o momento em que uma pessoa decide procurar um medico, e ali so cabe gente que existe.';
