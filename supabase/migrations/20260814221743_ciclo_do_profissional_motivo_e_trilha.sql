-- OPS-G5 · CORTE 7 — O CICLO DE VIDA DO PROFISSIONAL.
--
-- Hoje o ciclo é um toggle binário sem memória: `setProfessionalStatus` grava
-- `status` + `updated_by`, e mais nada. Não há motivo, não há trilha, não há
-- recusa — e "retirar da rede" um profissional que está atendendo alguém é um
-- clique sem atrito nenhum. Esta migration dá ao ciclo os quatro estados que o
-- Método reconhece, e transforma cada passagem entre eles num ato com autor,
-- razão e registro.
--
-- ⛔ O QUE ESTA MIGRATION NÃO FAZ:
--   · não altera `status` nem `publication_status` — as colunas antigas ficam
--     exatamente como estão, e a elegibilidade canônica segue lendo as delas;
--   · não infere `PAUSADO` nem `RETIRADO_ARQUIVADO` a partir do binário antigo;
--   · não fabrica motivo, autoria ou data retroativos para linha nenhuma;
--   · não apaga profissional algum;
--   · não replica as guardas de publicação — quem as detém é
--     `assert_publication_requirements`, e ela continua sendo a única.
--
-- A FRONTEIRA DE REATIVAÇÃO. `RETIRADO_ARQUIVADO` volta **só** por
-- `PREPARACAO`. Um arquivado que voltasse direto a `PUBLICADO_ATIVO` entraria
-- na Rede sem passar de novo pelas verificações de publicação — e foi
-- exatamente para impedir isso que a microerrata corrigiu o desenho original.

-- ---------------------------------------------------------------------------
-- 1 · Os quatro estados e os motivos canônicos
-- ---------------------------------------------------------------------------
--
-- Domínios, e não `text` livre: motivo é vocabulário fechado. Texto livre como
-- motivo principal seria a mesma ausência de razão, escrita com mais letras.

create type curadoria.ciclo_do_profissional as enum (
  'PREPARACAO',
  'PUBLICADO_ATIVO',
  'PAUSADO',
  'RETIRADO_ARQUIVADO'
);

create type curadoria.motivo_do_ciclo as enum (
  -- publicação
  'CADASTRO_VALIDADO',
  'REATIVACAO_VALIDADA',
  -- pausa
  'INDISPONIBILIDADE_TEMPORARIA',
  'REVISAO_CADASTRAL',
  -- retirada
  'ENCERRAMENTO_DA_ATUACAO',
  'IMPEDIMENTO_REGULATORIO',
  'DIVERGENCIA_CRITICA',
  -- retorno à preparação
  'RETORNO_SOLICITADO',
  'REGULARIZACAO_CONCLUIDA',
  'REVISAO_CONCLUIDA',
  -- compartilhados entre transições (ver a matriz na função de validação)
  'SOLICITACAO_DO_PROFISSIONAL',
  'OUTRO'
);

comment on type curadoria.ciclo_do_profissional is
  'OPS-G5 C7: os quatro estados do ciclo. Convive com status/publication_status; não os substitui nesta migration.';
comment on type curadoria.motivo_do_ciclo is
  'OPS-G5 C7: vocabulário fechado de motivos. A compatibilidade motivo×transição é validada em curadoria.assert_ciclo_do_profissional.';

-- ---------------------------------------------------------------------------
-- 2 · O estado atual, e por que ele chegou aqui
-- ---------------------------------------------------------------------------

alter table curadoria.professional_profiles
  add column if not exists ciclo_de_vida curadoria.ciclo_do_profissional,
  add column if not exists ciclo_motivo curadoria.motivo_do_ciclo,
  add column if not exists ciclo_nota text,
  add column if not exists ciclo_alterado_por uuid references curadoria.profiles(id),
  add column if not exists ciclo_alterado_em timestamptz;

comment on column curadoria.professional_profiles.ciclo_de_vida is
  'OPS-G5 C7. NULO = legado ambíguo: inelegível e pendente de revisão. Nunca inferido a partir do binário antigo.';
comment on column curadoria.professional_profiles.ciclo_nota is
  'Obrigatória entre 10 e 280 caracteres quando o motivo é OUTRO. Nunca substitui o motivo canônico.';

-- ---------------------------------------------------------------------------
-- 3 · Legado — só o que é inequívoco
-- ---------------------------------------------------------------------------
--
-- Duas combinações, e apenas duas, têm leitura única:
--   · ativo E publicado          → está na Rede agora            → PUBLICADO_ATIVO
--   · nunca publicado            → nunca esteve na Rede          → PREPARACAO
--
-- ⛔ Tudo mais fica NULO. Em especial `inativo ∧ publicado`: um binário antigo
-- não distingue "pausado" de "retirado", e escolher um dos dois seria inventar
-- um ato que ninguém praticou. Linha nula é **identificável, inelegível e
-- pendente de revisão** — e é assim que ela deve permanecer até alguém decidir,
-- com motivo e autoria, para onde ela vai.
--
-- ⛔ Nenhum `ciclo_motivo`, `ciclo_alterado_por` ou `ciclo_alterado_em` é
-- preenchido aqui: não houve transição, houve classificação. Fabricar autoria
-- retroativa seria mentir sobre quem decidiu.

update curadoria.professional_profiles
   set ciclo_de_vida = 'PUBLICADO_ATIVO'
 where ciclo_de_vida is null
   and status = 'ativo'
   and publication_status = 'publicado';

update curadoria.professional_profiles
   set ciclo_de_vida = 'PREPARACAO'
 where ciclo_de_vida is null
   and publication_status = 'nao_publicado';

-- O default entra **depois** do backfill, de propósito: aplicado antes, o
-- Postgres teria preenchido as linhas existentes e apagado a distinção entre
-- "nasce em preparação" e "legado que ninguém classificou".
alter table curadoria.professional_profiles
  alter column ciclo_de_vida set default 'PREPARACAO';

-- ---------------------------------------------------------------------------
-- 4 · A matriz de transições, e a recusa
-- ---------------------------------------------------------------------------
--
-- `security invoker` (o padrão): a função roda com o privilégio de quem a
-- disparou, a RLS de `professional_profiles` continua valendo, e nada aqui
-- precisa de poder que o autor da transição já não tenha.

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
    -- Toda cláusula nomeia origem E destino. Escrever só o destino aqui abriu,
    -- em silêncio, uma sétima transição: retirar direto da preparação. Só quem
    -- chegou a estar na rede pode ser retirado dela; cadastro em preparação que
    -- não vai adiante simplesmente fica onde está.
    when _de in ('PUBLICADO_ATIVO','PAUSADO') and _para = 'RETIRADO_ARQUIVADO'
      then array['ENCERRAMENTO_DA_ATUACAO','SOLICITACAO_DO_PROFISSIONAL','IMPEDIMENTO_REGULATORIO','DIVERGENCIA_CRITICA','OUTRO']::curadoria.motivo_do_ciclo[]
    when _de = 'RETIRADO_ARQUIVADO' and _para = 'PREPARACAO'
      then array['RETORNO_SOLICITADO','REGULARIZACAO_CONCLUIDA','REVISAO_CONCLUIDA','OUTRO']::curadoria.motivo_do_ciclo[]
    else array[]::curadoria.motivo_do_ciclo[]
  end;
$$;

comment on function curadoria.motivos_da_transicao is
  'OPS-G5 C7: motivos aceitos por transição. Array vazio = transição proibida. Fonte única — a UI lê daqui, nunca duplica a lista.';

create or replace function curadoria.assert_ciclo_do_profissional()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  permitidos curadoria.motivo_do_ciclo[];
  conexoes_ativas integer;
begin
  -- Só o que mexe no ciclo é examinado aqui. Editar telefone não é transição.
  if new.ciclo_de_vida is not distinct from old.ciclo_de_vida then
    return new;
  end if;

  -- Classificar um legado ambíguo é transição como qualquer outra: exige de
  -- onde. Sair do nulo sem origem conhecida não é passagem, é invenção.
  if old.ciclo_de_vida is null then
    raise exception 'Este cadastro é legado sem ciclo classificado. A revisão registra o estado com motivo e autoria antes de qualquer transição.'
      using errcode = 'check_violation';
  end if;

  if new.ciclo_de_vida is null then
    raise exception 'O ciclo de vida não volta a ser indefinido.'
      using errcode = 'check_violation';
  end if;

  permitidos := curadoria.motivos_da_transicao(old.ciclo_de_vida, new.ciclo_de_vida);

  if array_length(permitidos, 1) is null then
    raise exception 'Transição de ciclo não permitida: % para %.', old.ciclo_de_vida, new.ciclo_de_vida
      using errcode = 'check_violation';
  end if;

  if new.ciclo_motivo is null then
    raise exception 'Toda mudança de ciclo exige um motivo.'
      using errcode = 'check_violation';
  end if;

  if not (new.ciclo_motivo = any (permitidos)) then
    raise exception 'O motivo % não vale para a transição de % para %.', new.ciclo_motivo, old.ciclo_de_vida, new.ciclo_de_vida
      using errcode = 'check_violation';
  end if;

  -- `OUTRO` é a válvula de escape, e escape sem explicação não é motivo.
  if new.ciclo_motivo = 'OUTRO' then
    if new.ciclo_nota is null or char_length(btrim(new.ciclo_nota)) < 10 then
      raise exception 'Quando o motivo é OUTRO, escreva o que aconteceu — pelo menos 10 caracteres.'
        using errcode = 'check_violation';
    end if;
    if char_length(btrim(new.ciclo_nota)) > 280 then
      raise exception 'A nota do motivo tem no máximo 280 caracteres.'
        using errcode = 'check_violation';
    end if;
  end if;

  if new.ciclo_alterado_por is null then
    raise exception 'Toda mudança de ciclo tem autor.'
      using errcode = 'check_violation';
  end if;

  if new.ciclo_alterado_em is null or new.ciclo_alterado_em is not distinct from old.ciclo_alterado_em then
    raise exception 'Toda mudança de ciclo tem data própria.'
      using errcode = 'check_violation';
  end if;

  -- GUARDA 11 (D5) · Connection ativa recusa a retirada.
  --
  -- "Ativa" é o vocabulário canônico de `connection_records`, lido pela negativa
  -- do único estado terminal — ⛔ nenhuma segunda definição é criada aqui. Quem
  -- está sendo atendido não pode ser arquivado por baixo do atendimento.
  --
  -- ⚠️ A pausa NÃO é bloqueada: pausar tira das composições novas e preserva o
  -- acompanhamento em curso, que é precisamente para isso que ela serve.
  if new.ciclo_de_vida = 'RETIRADO_ARQUIVADO' then
    select count(*) into conexoes_ativas
      from curadoria.connection_records c
     where c.professional_profile_id = new.id
       and c.status <> 'ENCERRADO_SEM_RELACIONAMENTO';

    if conexoes_ativas > 0 then
      raise exception 'Este profissional tem acompanhamento em curso. Encerre ou substitua antes de retirar da rede.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assert_ciclo_do_profissional on curadoria.professional_profiles;
create trigger assert_ciclo_do_profissional
  before update of ciclo_de_vida on curadoria.professional_profiles
  for each row execute function curadoria.assert_ciclo_do_profissional();

-- Toda a matriz acima vale para quem já existe. Faltava a porta de entrada:
-- sem esta guarda, um `insert` faria um profissional NASCER publicado — sem
-- motivo, sem autor e sem trilha —, e a matriz inteira viraria decoração.
-- Ninguém entra pelo meio: todo cadastro começa em PREPARACAO e sobe pela
-- porta da frente. O nulo continua aceito porque é o legado sendo migrado, e
-- legado nulo não participa de nada: é inelegível e não transita sem revisão.
create or replace function curadoria.assert_nascimento_do_ciclo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ciclo_de_vida is not null and new.ciclo_de_vida <> 'PREPARACAO' then
    raise exception 'Todo profissional começa em preparação. Publicar é um ato com motivo e autoria, não um valor de cadastro.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function curadoria.assert_nascimento_do_ciclo() from public;

drop trigger if exists assert_nascimento_do_ciclo on curadoria.professional_profiles;
create trigger assert_nascimento_do_ciclo
  before insert on curadoria.professional_profiles
  for each row execute function curadoria.assert_nascimento_do_ciclo();

-- ---------------------------------------------------------------------------
-- 5 · A trilha
-- ---------------------------------------------------------------------------
--
-- `audit_logs.action` é o enum `curadoria.audit_action`, não texto livre: a
-- trilha tem vocabulário fechado. Os quatro verbos do ciclo entram nele, no
-- mesmo estilo de `professional_published` e `professional_unpublished`, que já
-- moram lá. Sem isso, toda transição bem-sucedida quebraria ao gravar a trilha.
alter type curadoria.audit_action add value if not exists 'professional_ciclo_preparacao';
alter type curadoria.audit_action add value if not exists 'professional_ciclo_publicado_ativo';
alter type curadoria.audit_action add value if not exists 'professional_ciclo_pausado';
alter type curadoria.audit_action add value if not exists 'professional_ciclo_retirado_arquivado';

-- `security definer` porque `audit_logs` não é escrita por quem opera — trilha
-- que o autor do ato pode não gravar não é trilha. `search_path` fixo, sem SQL
-- dinâmico, e a função não recebe nada do cliente: lê `old`/`new` da própria
-- linha. Não há superfície para forjar registro.

create or replace function curadoria.registrar_trilha_do_ciclo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.ciclo_de_vida is not distinct from old.ciclo_de_vida then
    return null;
  end if;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    new.ciclo_alterado_por,
    ('professional_ciclo_' || lower(new.ciclo_de_vida::text))::curadoria.audit_action,
    -- `target_profile_id` aponta para `profiles`, a CONTA — não para o perfil
    -- profissional. Nem todo profissional tem conta, então o alvo é a conta
    -- vinculada quando existe e o perfil vai na metadata. É exatamente o que
    -- `log_professional_publication_transition` já faz desde 20260802162000:
    -- duas trilhas do mesmo objeto não podem ser lidas de formas diferentes.
    new.profile_id,
    jsonb_build_object(
      'professional_profile_id', new.id,
      'de', old.ciclo_de_vida,
      'para', new.ciclo_de_vida,
      'motivo', new.ciclo_motivo,
      -- A nota entra porque é parte do motivo quando ele é OUTRO. Nada
      -- clínico passa por aqui: o ciclo não sabe nada sobre pacientes.
      'nota', new.ciclo_nota,
      'em', new.ciclo_alterado_em
    )
  );

  return null;
end;
$$;

revoke execute on function curadoria.registrar_trilha_do_ciclo() from public;

drop trigger if exists registrar_trilha_do_ciclo on curadoria.professional_profiles;
create trigger registrar_trilha_do_ciclo
  after update of ciclo_de_vida on curadoria.professional_profiles
  for each row execute function curadoria.registrar_trilha_do_ciclo();

-- ---------------------------------------------------------------------------
-- 6 · Hard delete — só sem história
-- ---------------------------------------------------------------------------
--
-- A regra é a mais conservadora possível: **qualquer** vestígio operacional
-- recusa a exclusão. Um profissional que apareceu numa seleção, ainda que ela
-- nunca tenha sido entregue, já faz parte de uma decisão que alguém tomou —
-- apagá-lo reescreveria o passado de um Case.
--
-- Retirar da rede é o caminho normal; apagar é para o cadastro que nunca
-- chegou a existir para ninguém.

create or replace function curadoria.assert_exclusao_sem_historia()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  vestigios integer;
begin
  select
      (select count(*) from curadoria.connection_records where professional_profile_id = old.id)
    + (select count(*) from curadoria.curated_selection_options where professional_profile_id = old.id)
    + (select count(*) from curadoria.curadoria_report_options where professional_profile_id = old.id)
    + (select count(*) from curadoria.professional_subcriterion_map where professional_profile_id = old.id)
    + (select count(*) from curadoria.practice_evidence where professional_profile_id = old.id)
  into vestigios;

  if vestigios > 0 then
    raise exception 'Este profissional tem histórico operacional e não pode ser excluído. Retire da rede — o histórico permanece.'
      using errcode = 'check_violation';
  end if;

  return old;
end;
$$;

drop trigger if exists assert_exclusao_sem_historia on curadoria.professional_profiles;
create trigger assert_exclusao_sem_historia
  before delete on curadoria.professional_profiles
  for each row execute function curadoria.assert_exclusao_sem_historia();

-- ---------------------------------------------------------------------------
-- 7 · Privilégio
-- ---------------------------------------------------------------------------

revoke execute on function curadoria.motivos_da_transicao(
  curadoria.ciclo_do_profissional, curadoria.ciclo_do_profissional
) from public;

-- `authenticated` porque a interface precisa oferecer os motivos válidos antes
-- de pedir a confirmação. `service_role` porque o trigger de validação roda
-- como SECURITY INVOKER e chama esta função: sem o privilégio, todo writer que
-- não seja um usuário logado — o cliente administrativo, um job, uma migration
-- futura — seria barrado por `permission denied` em vez de pela regra real.
-- A função não lê tabela alguma: devolve a mesma lista de motivos que já viaja
-- no bundle da interface. Não há segredo aqui para proteger.
grant execute on function curadoria.motivos_da_transicao(
  curadoria.ciclo_do_profissional, curadoria.ciclo_do_profissional
) to authenticated, service_role;
