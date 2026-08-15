-- ---------------------------------------------------------------------------
-- OPS-G5 · CORTE 7 (remediação) — uma régua só, um writer só, um relógio só
-- ---------------------------------------------------------------------------
--
-- O 04 VERIFICADOR reprovou o Corte 7 por um achado material: o selo de
-- elegibilidade lia `ciclo_de_vida`, e a Mesa compunha por
-- `status = 'ativo' AND publication_status = 'publicado'`. Duas réguas medindo
-- a mesma coisa, sem nada que as sincronizasse — e a divergência não era
-- hipotética: valia para 100% da rede local.
--
-- A causa não foi o backfill, que acertou no instante em que rodou. Foram dois
-- writers independentes sobre o mesmo fato: o writer do ciclo, e
-- `setProfessionalPublicationStatus`, que grava só `publication_status`. Cada
-- publicação pelo caminho antigo criava uma linha divergente. Reclassificar sem
-- fechar o writer resolveria por um dia.
--
-- Esta migration faz cinco coisas, nesta ordem:
--
--   1. o vocabulário novo (motivo e verbo de auditoria da classificação);
--   2. o predicado único de elegibilidade — a régua que passa a valer;
--   3. o trigger atômico: espelha os campos antigos quando o ciclo muda, e
--      recusa mexer neles quando o ciclo NÃO muda;
--   4. a ressincronização determinística, somente para frente;
--   5. o índice da consulta de elegibilidade e os privilégios.
--
-- ⛔ As duas migrations anteriores não são editadas. ⛔ Nenhum motivo, autoria
-- ou data é fabricado em lugar nenhum.

-- ---------------------------------------------------------------------------
-- 1 · Vocabulário da classificação de legado
-- ---------------------------------------------------------------------------
--
-- Classificar um legado é ATO PRÓPRIO, não transição: não há de onde sair. Por
-- isso ganha motivo exclusivo, que ⛔ nunca entra em `motivos_da_transicao` —
-- se entrasse, viraria um atalho para pular a matriz.

alter type curadoria.motivo_do_ciclo add value if not exists 'CLASSIFICACAO_DE_LEGADO';
alter type curadoria.audit_action add value if not exists 'professional_ciclo_classificacao_de_legado';

-- ---------------------------------------------------------------------------
-- 2 · O predicado único de elegibilidade
-- ---------------------------------------------------------------------------
--
-- A partir daqui existe UMA resposta para "esta pessoa pode ser apresentada a
-- uma paciente agora?". Selo, lista administrativa, Mesa, composição, prévia de
-- impacto, publicação e testes leem daqui. ⛔ Nenhum consumidor implementa
-- regra própria — foi exatamente isso que produziu o achado.
--
-- ⚠️ O que este predicado NÃO faz: decidir se alguém PODE publicar. Isso
-- continua sendo de `assert_publication_requirements` (20260727071000), que
-- responde outra pergunta. Elegibilidade é sobre estar apto agora; requisito de
-- publicação é sobre poder entrar. ⛔ Não duplicar.

create or replace function curadoria.elegibilidade_do_profissional(p_id uuid)
returns table (
  eligible boolean,
  reason_code text,
  blocking_requirements text[],
  ciclo curadoria.ciclo_do_profissional,
  legacy_status text,
  legacy_publication_status text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    -- Elegível é a conjunção inteira, nunca uma parte dela.
    (p.is_demo = false
      and p.is_test_fixture = false
      and p.ciclo_de_vida is not null
      and p.ciclo_de_vida = 'PUBLICADO_ATIVO'
      and coalesce(d.criticas, 0) = 0) as eligible,
    -- O motivo principal segue a ordem em que a pessoa precisa ouvir: primeiro
    -- o que é absoluto, depois o estado, por último o que é corrigível.
    case
      when p.is_demo then 'DEMO'
      when p.is_test_fixture then 'FIXTURE'
      when p.ciclo_de_vida is null then 'LEGADO_NAO_CLASSIFICADO'
      when p.ciclo_de_vida <> 'PUBLICADO_ATIVO' then p.ciclo_de_vida::text
      when coalesce(d.criticas, 0) > 0 then 'DIVERGENCIA_CRITICA'
      else 'ELEGIVEL'
    end as reason_code,
    (select array_remove(array[
       case when p.is_demo then 'Perfil de demonstração' end,
       case when p.is_test_fixture then 'Perfil de teste' end,
       case when p.ciclo_de_vida is null then 'Legado sem ciclo classificado' end,
       case when p.ciclo_de_vida is not null and p.ciclo_de_vida <> 'PUBLICADO_ATIVO'
            then 'Ciclo em ' || p.ciclo_de_vida::text end,
       case when coalesce(d.criticas, 0) > 0 then 'Divergência crítica em aberto' end
     ], null)) as blocking_requirements,
    p.ciclo_de_vida as ciclo,
    -- Compatibilidade temporária: enquanto houver consumidor lendo os campos
    -- antigos, ele os recebe daqui — e não de uma segunda consulta que poderia
    -- discordar desta.
    p.status::text as legacy_status,
    p.publication_status::text as legacy_publication_status
  from curadoria.professional_profiles p
  left join lateral (
    select count(*) as criticas
      from curadoria.verification_divergences vd
     where vd.professional_profile_id = p.id
       and vd.status = 'aberta'
       and vd.severity = 'critica'
  ) d on true
  where p.id = p_id;
$$;

comment on function curadoria.elegibilidade_do_profissional(uuid) is
  'OPS-G5 C7R: régua única de elegibilidade. Selo, lista, Mesa, composição, prévia, publicação e testes leem daqui. Não decide se PODE publicar — isso é assert_publication_requirements.';

-- ---------------------------------------------------------------------------
-- 3 · O trigger atômico
-- ---------------------------------------------------------------------------
--
-- Um só, `BEFORE UPDATE`, responsável por três coisas que precisam acontecer
-- juntas ou não acontecer:
--
--   a) o instante é do banco, estritamente crescente;
--   b) mudou o ciclo → os campos antigos são SOBRESCRITOS pelo destino;
--   c) mexeu nos campos antigos sem mudar o ciclo → recusado.
--
-- ⛔ Sem marcador de sessão, sem GUC, sem variável de ambiente. Qualquer
-- mecanismo desses seria falsificável por quem quisesse contorná-lo, e a
-- guarda existe justamente contra o writer que ninguém revisou. A autorização
-- da sincronização é o próprio fato de o ciclo estar mudando nesta linha.

create or replace function curadoria.assert_ciclo_do_profissional()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  permitidos curadoria.motivo_do_ciclo[];
  conexoes_ativas integer;
  classificando_legado boolean;
  mudou_ciclo boolean;
begin
  mudou_ciclo := new.ciclo_de_vida is distinct from old.ciclo_de_vida;

  -- (c) Os campos antigos são ESPELHO. Quem quiser mudá-los muda o ciclo.
  if not mudou_ciclo then
    if new.status is distinct from old.status
       or new.publication_status is distinct from old.publication_status then
      raise exception 'Publicar e despublicar são mudanças de ciclo. Use a transição do ciclo de vida — `status` e `publication_status` apenas a espelham.'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  classificando_legado := old.ciclo_de_vida is null;

  -- Sair do nulo é ato próprio, com motivo exclusivo. Antes desta migration a
  -- guarda recusava QUALQUER saída — inclusive a revisão que a própria mensagem
  -- prometia. A promessa e a guarda se contradiziam; agora não.
  if classificando_legado then
    if new.ciclo_motivo is distinct from 'CLASSIFICACAO_DE_LEGADO' then
      raise exception 'Este cadastro é legado sem ciclo classificado. A classificação é ato próprio, com o motivo CLASSIFICACAO_DE_LEGADO, autoria e justificativa.'
        using errcode = 'check_violation';
    end if;
    if new.ciclo_nota is null or char_length(btrim(new.ciclo_nota)) < 10 then
      raise exception 'A classificação de legado exige justificativa escrita — pelo menos 10 caracteres.'
        using errcode = 'check_violation';
    end if;
    if char_length(btrim(new.ciclo_nota)) > 280 then
      raise exception 'A justificativa da classificação tem no máximo 280 caracteres.'
        using errcode = 'check_violation';
    end if;
  else
    -- ⛔ Classificação de legado não reclassifica linha já classificada.
    if new.ciclo_motivo = 'CLASSIFICACAO_DE_LEGADO' then
      raise exception 'Este cadastro já tem ciclo classificado. Use a transição correspondente, com o motivo dela.'
        using errcode = 'check_violation';
    end if;
  end if;

  if new.ciclo_de_vida is null then
    raise exception 'O ciclo de vida não volta a ser indefinido.'
      using errcode = 'check_violation';
  end if;

  -- ⛔ EXCLUSÃO ABSOLUTA. Demo e fixture não chegam a `PUBLICADO_ATIVO` por
  -- caminho nenhum — nem por transição, nem por classificação de legado. Se
  -- pudessem, a exclusão deixaria de ser absoluta e viraria uma porta de fundos:
  -- o predicado continuaria dizendo "não elegível", mas o espelho publicaria a
  -- linha, e as duas réguas voltariam a divergir por outro caminho.
  if new.ciclo_de_vida = 'PUBLICADO_ATIVO' and (new.is_demo or new.is_test_fixture) then
    raise exception 'Perfil de demonstração ou de teste não entra na Rede como publicado.'
      using errcode = 'check_violation';
  end if;

  if not classificando_legado then
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
  end if;

  if new.ciclo_alterado_por is null then
    raise exception 'Toda mudança de ciclo tem autor.'
      using errcode = 'check_violation';
  end if;

  -- (a) O INSTANTE É DO BANCO.
  --
  -- A guarda anterior exigia "valor diferente do anterior" e aceitava
  -- retroceder para 2020 — porque o carimbo vinha do cliente. Agora o que veio
  -- do cliente é ignorado, e o valor é estritamente maior que o anterior mesmo
  -- quando duas transições caem na mesma resolução de relógio. `old` nulo é
  -- tratado como ausência de piso, não como erro.
  new.ciclo_alterado_em := greatest(
    clock_timestamp(),
    coalesce(old.ciclo_alterado_em + interval '1 microsecond', clock_timestamp())
  );

  -- GUARDA 11 (D5) · Connection ativa recusa a retirada.
  --
  -- "Ativa" é o vocabulário canônico de `connection_records`, lido pela negativa
  -- do único estado terminal — ⛔ nenhuma segunda definição é criada aqui.
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

  -- (b) ESPELHO ATÔMICO. O que o writer tiver mandado nestes dois campos é
  -- descartado: quem manda é o destino do ciclo, na mesma linha, na mesma
  -- instrução. É isto que impede as duas réguas de divergirem de novo.
  new.status := case new.ciclo_de_vida
    when 'PREPARACAO' then 'ativo'
    when 'PUBLICADO_ATIVO' then 'ativo'
    else 'inativo'
  end;

  new.publication_status := case new.ciclo_de_vida
    when 'PUBLICADO_ATIVO' then 'publicado'
    else 'nao_publicado'
  end;

  return new;
end;
$$;

-- O gatilho passa a escutar os três campos: sem `status` e `publication_status`
-- na lista, a escrita direta neles nunca chegaria a ser examinada.
drop trigger if exists assert_ciclo_do_profissional on curadoria.professional_profiles;
create trigger assert_ciclo_do_profissional
  before update of ciclo_de_vida, status, publication_status on curadoria.professional_profiles
  for each row execute function curadoria.assert_ciclo_do_profissional();

-- A guarda de publicação precisa ENXERGAR o espelho.
--
-- `assert_publication_requirements` era `BEFORE UPDATE OF publication_status`, e
-- no Postgres a lista de colunas é avaliada contra o `SET` da INSTRUÇÃO — não
-- contra o que um trigger anterior escreveu na linha. Como a transição do ciclo
-- só menciona colunas `ciclo_*`, o espelho publicava sem que a guarda fosse
-- sequer chamada: um profissional sem CRM e sem registro verificado entrava na
-- Rede pela porta nova.
--
-- A correção não duplica a regra — faz o gatilho existente ser chamado. A função
-- devolve na primeira linha quando o destino não é `publicado`, então o custo em
-- updates comuns é uma comparação. A ordem alfabética garante que
-- `assert_ciclo_do_profissional` já aplicou o espelho quando esta roda.
drop trigger if exists assert_publication_requirements on curadoria.professional_profiles;
create trigger assert_publication_requirements
  before insert or update on curadoria.professional_profiles
  for each row execute function curadoria.assert_publication_requirements();

-- A trilha aprende o verbo novo. O resto dela não muda.
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
    case
      when old.ciclo_de_vida is null then 'professional_ciclo_classificacao_de_legado'
      else 'professional_ciclo_' || lower(new.ciclo_de_vida::text)
    end::curadoria.audit_action,
    new.profile_id,
    jsonb_build_object(
      'professional_profile_id', new.id,
      'de', old.ciclo_de_vida,
      'para', new.ciclo_de_vida,
      'motivo', new.ciclo_motivo,
      'nota', new.ciclo_nota,
      'em', new.ciclo_alterado_em,
      -- O espelho entra na trilha porque é efeito do ato: quem ler daqui a um
      -- ano precisa saber que a publicação mudou junto, e por causa disto.
      'status', new.status,
      'publication_status', new.publication_status
    )
  );

  return null;
end;
$$;

revoke execute on function curadoria.registrar_trilha_do_ciclo() from public;

-- ---------------------------------------------------------------------------
-- 4 · Ressincronização — determinística e somente para frente
-- ---------------------------------------------------------------------------
--
-- O trigger é desabilitado por duas instruções porque isto NÃO é passagem: é a
-- mesma classificação que a migration 20260814221743 teria feito se estas
-- linhas existissem naquele instante. Passar pelo trigger obrigaria a inventar
-- um ato que ninguém praticou — motivo, autoria e data de uma decisão que não
-- houve. `ciclo_motivo`, `ciclo_alterado_por` e `ciclo_alterado_em` seguem
-- NULOS, e é assim que se reconhece uma linha ressincronizada.
--
-- ⛔ `PAUSADO` e `RETIRADO_ARQUIVADO` nunca são inferidos de campo legado: não
-- existe informação no binário antigo que os distinga.
--
-- ⚠️ Isto NÃO tem inversão exata por predicado. Uma linha que já estivesse em
-- `PREPARACAO` legitimamente e por acaso satisfizesse `ativo/publicado` fica
-- indistinguível das demais depois daqui. Antes de qualquer aplicação futura em
-- Production, os IDs afetados precisam ser inventariados e protegidos por
-- backup. ⛔ Esta missão não aplica nada em Production.

alter table curadoria.professional_profiles disable trigger assert_ciclo_do_profissional;
alter table curadoria.professional_profiles disable trigger registrar_trilha_do_ciclo;

update curadoria.professional_profiles
   set ciclo_de_vida = 'PUBLICADO_ATIVO'
 where ciclo_de_vida = 'PREPARACAO'
   and is_demo = false
   and is_test_fixture = false
   and status = 'ativo'
   and publication_status = 'publicado';

-- Demo e fixture voltam para preparação. Elas são inelegíveis pelo predicado de
-- qualquer forma; isto só impede que o binário antigo as deixe em um estado que
-- diga outra coisa.
update curadoria.professional_profiles
   set ciclo_de_vida = 'PREPARACAO'
 where ciclo_de_vida is distinct from 'PREPARACAO'
   and ciclo_de_vida is not null
   and (is_demo or is_test_fixture);

-- Depois da classificação, o espelho passa a valer para todo mundo — inclusive
-- para as linhas que a ressincronização não moveu. Sem isto, sobreviveriam
-- linhas com ciclo e campos antigos discordando, que é o defeito original.
update curadoria.professional_profiles
   set status = case ciclo_de_vida
         when 'PREPARACAO' then 'ativo'
         when 'PUBLICADO_ATIVO' then 'ativo'
         else 'inativo'
       end,
       publication_status = case ciclo_de_vida
         when 'PUBLICADO_ATIVO' then 'publicado'
         else 'nao_publicado'
       end
 where ciclo_de_vida is not null;

alter table curadoria.professional_profiles enable trigger assert_ciclo_do_profissional;
alter table curadoria.professional_profiles enable trigger registrar_trilha_do_ciclo;

-- ---------------------------------------------------------------------------
-- 5 · Índice e privilégios
-- ---------------------------------------------------------------------------

-- É a consulta feita a cada composição da Curadoria.
create index if not exists professional_profiles_elegiveis_idx
  on curadoria.professional_profiles (ciclo_de_vida)
  where ciclo_de_vida = 'PUBLICADO_ATIVO' and is_demo = false and is_test_fixture = false;

-- `authenticated` porque a lista administrativa e a Mesa rodam sob a sessão de
-- quem opera; `service_role` porque o cliente administrativo e os jobs leem a
-- mesma régua. ⛔ `anon` fora: a porta pública não decide elegibilidade.
revoke execute on function curadoria.elegibilidade_do_profissional(uuid) from public;
grant execute on function curadoria.elegibilidade_do_profissional(uuid) to authenticated, service_role;
