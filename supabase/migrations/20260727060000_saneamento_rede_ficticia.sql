-- SANEAMENTO DA REDE FICTÍCIA
--
-- Produção tem seis profissionais e os seis se declaram inexistentes no
-- próprio resumo ("perfil fictício", "não representa profissional real"). Os
-- seis estavam `publicado`.
--
-- Nenhum Relatório foi entregue e nenhum paciente recebeu seleção, então nada
-- chegou a ninguém. Mas perfil fictício publicado é uma porta que só se
-- descobre aberta depois — e o custo de descobrir tarde recai sobre uma pessoa
-- que confiou numa indicação.
--
-- Três camadas, da mais forte para a mais fraca:
--
-- 1. `is_demo` — o fato, gravado uma vez. A partir daqui a distinção entre
--    real e demonstração é um booleano, nunca uma leitura de texto em tempo de
--    execução. Análise de texto acerta hoje e erra no dia em que alguém
--    escrever "atendo casos de demonstração de força muscular".
--
-- 2. CHECK — demonstração e publicado não coexistem. Não há caminho de código,
--    console ou script que consiga publicar um perfil de demonstração, porque
--    a proibição não está no código.
--
-- 3. Gatilhos — demonstração não entra em seleção nem em conexão. Mesmo lugar:
--    o banco, não a aplicação.
--
-- Os seis continuam no banco. São o único material de teste que existe, e
-- apagá-los para "limpar" destruiria a única rede com que se pode exercitar o
-- fluxo antes de haver profissionais reais.

-- ---------------------------------------------------------------------------
-- O fato
-- ---------------------------------------------------------------------------

alter table curadoria.professional_profiles
  add column is_demo boolean not null default false;

comment on column curadoria.professional_profiles.is_demo is
  'Perfil de demonstracao: existe para exercitar o fluxo, nunca para ser oferecido a um paciente. Padrao false -- profissional cadastrado e real ate que alguem declare o contrario.';

-- ---------------------------------------------------------------------------
-- Regularidade profissional — identidade verificável, com proveniência
-- ---------------------------------------------------------------------------

-- O cadastro já tinha `crm` e `crm_uf`, mas nada dizia se alguém conferiu.
-- Um CRM digitado e um CRM verificado no conselho são a mesma string e coisas
-- inteiramente diferentes; sem estas colunas a distinção não existia.
alter table curadoria.professional_profiles
  add column registration_status text,
  add column registration_source text,
  add column registration_verified_at timestamptz,
  add column registration_verified_by uuid references curadoria.profiles (id);

alter table curadoria.professional_profiles
  add constraint professional_registration_status_known
  check (registration_status is null or registration_status = any (array['regular', 'irregular', 'nao_localizado']));

comment on column curadoria.professional_profiles.registration_status is
  'Situacao do registro conforme consulta ao conselho. null = ninguem consultou ainda, e nunca deve ser lido como "regular".';

-- ---------------------------------------------------------------------------
-- A proibição que o código não pode contornar
-- ---------------------------------------------------------------------------

alter table curadoria.professional_profiles
  add constraint professional_demo_never_published
  check (not (is_demo and publication_status = 'publicado'));

-- ---------------------------------------------------------------------------
-- Marcar os atuais — pelo que o cadastro declara, não pelo nome
-- ---------------------------------------------------------------------------

-- Esta é a única vez em que o texto decide. Daqui em diante decide `is_demo`.
-- A despublicação vai no MESMO update: separá-los deixaria uma janela em que a
-- linha é demonstração e ainda está publicada, e o CHECK acima recusaria.
update curadoria.professional_profiles
   set is_demo = true,
       publication_status = 'nao_publicado'
 where professional_summary ilike '%demonstra%'
    or professional_summary ilike '%fictí%'
    or professional_summary ilike '%ficti%';

-- ---------------------------------------------------------------------------
-- Demonstração não entra em Curadoria real
-- ---------------------------------------------------------------------------

create function curadoria.reject_demo_professional()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
begin
  if exists (
    select 1 from curadoria.professional_profiles p
     where p.id = new.professional_profile_id and p.is_demo
  ) then
    raise exception
      'Perfil de demonstracao nao participa de Curadoria real.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function curadoria.reject_demo_professional() from public;

comment on function curadoria.reject_demo_professional() is
  'Recusa perfil de demonstracao nos dois pontos em que ele alcancaria um paciente: a selecao e a conexao. Vive no banco porque a garantia precisa valer para qualquer caminho de escrita, inclusive console e script.';

-- O prefixo `assert_` não é estilo: gatilhos BEFORE disparam em ordem
-- alfabética, e `connection_records_assert_professional_in_delivery` responderia
-- primeiro, recusando por "não pertence à entrega" um perfil que deveria ser
-- recusado por não ser ninguém. A pergunta "esta pessoa existe?" vem antes de
-- "esta pessoa pertence a este Relatório?".
create trigger assert_not_demo_professional
  before insert or update on curadoria.curated_selection_options
  for each row execute function curadoria.reject_demo_professional();

create trigger assert_not_demo_professional
  before insert or update on curadoria.connection_records
  for each row execute function curadoria.reject_demo_professional();
