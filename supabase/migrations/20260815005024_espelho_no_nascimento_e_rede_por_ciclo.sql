-- ---------------------------------------------------------------------------
-- OPS-G5 · CORTE 7 (remediação) — o espelho também vale no nascimento
-- ---------------------------------------------------------------------------
--
-- Duas frestas sobraram da migration anterior, e as duas apareceram ao ligar a
-- Mesa no ciclo.
--
-- **Fresta 1 — o INSERT.** O espelho e a recusa de escrita direta valiam só no
-- `UPDATE`. Uma linha podia NASCER com `publication_status = 'publicado'` e
-- `ciclo_de_vida = 'PREPARACAO'` — divergente no primeiro instante de vida, que
-- é exatamente o defeito que a remediação existe para fechar. É assim que as
-- fixtures de certificação nascem hoje.
--
-- **Fresta 2 — a exclusão absoluta no lugar errado.** A migration anterior
-- impedia `is_test_fixture` de chegar a `PUBLICADO_ATIVO`. Mas a composição de
-- certificação usa fixtures DE PROPÓSITO (`is_test_fixture = isCertification`):
-- é o arnês que prova o ciclo da Curadoria de ponta a ponta sem tocar em gente
-- de verdade. Com a guarda no estado, a certificação deixava de existir.
--
-- A correção põe cada regra no seu lugar: **estar em `PUBLICADO_ATIVO` é uma
-- coisa; ser ELEGÍVEL é outra.** `curadoria.elegibilidade_do_profissional`
-- continua excluindo demo e fixture de forma absoluta — nenhuma delas é
-- apresentada a paciente nenhuma. O que muda é que uma fixture pode ocupar o
-- estado publicado, porque a certificação precisa disso e a elegibilidade
-- continua dizendo não.
--
-- `is_demo` segue barrado no estado, e não por escolha minha: o CHECK
-- `NOT (is_demo AND publication_status = 'publicado')` já existia, e o espelho
-- o violaria. A guarda apenas antecipa a recusa com uma frase legível.

-- ---------------------------------------------------------------------------
-- 1 · O nascimento espelha
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_nascimento_do_ciclo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.ciclo_de_vida is not null and new.ciclo_de_vida <> 'PREPARACAO' then
    raise exception 'Todo profissional começa em preparação. Publicar é um ato com motivo e autoria, não um valor de cadastro.'
      using errcode = 'check_violation';
  end if;

  -- Nascer em preparação e já publicado seria a divergência de novo, no
  -- primeiro instante. Quem quiser publicar transita — e a transição cobra
  -- motivo, autoria e a porta de publicação inteira.
  if new.ciclo_de_vida is not null then
    new.status := 'ativo';
    new.publication_status := 'nao_publicado';
  end if;

  return new;
end;
$$;

revoke execute on function curadoria.assert_nascimento_do_ciclo() from public;

-- ---------------------------------------------------------------------------
-- 2 · A exclusão absoluta volta para onde ela vive: a elegibilidade
-- ---------------------------------------------------------------------------

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

  -- Os campos antigos são ESPELHO. Quem quiser mudá-los muda o ciclo.
  if not mudou_ciclo then
    if new.status is distinct from old.status
       or new.publication_status is distinct from old.publication_status then
      raise exception 'Publicar e despublicar são mudanças de ciclo. Use a transição do ciclo de vida — `status` e `publication_status` apenas a espelham.'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  classificando_legado := old.ciclo_de_vida is null;

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
    if new.ciclo_motivo = 'CLASSIFICACAO_DE_LEGADO' then
      raise exception 'Este cadastro já tem ciclo classificado. Use a transição correspondente, com o motivo dela.'
        using errcode = 'check_violation';
    end if;
  end if;

  if new.ciclo_de_vida is null then
    raise exception 'O ciclo de vida não volta a ser indefinido.'
      using errcode = 'check_violation';
  end if;

  -- Só a demonstração é barrada no ESTADO — e a recusa apenas antecipa, com
  -- frase legível, o CHECK que já existia. A fixture pode ocupar o estado
  -- publicado porque a certificação depende disso; ⛔ elegível ela nunca é, e
  -- quem responde por isso é `elegibilidade_do_profissional`.
  if new.ciclo_de_vida = 'PUBLICADO_ATIVO' and new.is_demo then
    raise exception 'Perfil de demonstração não entra na Rede como publicado.'
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

  new.ciclo_alterado_em := greatest(
    clock_timestamp(),
    coalesce(old.ciclo_alterado_em + interval '1 microsecond', clock_timestamp())
  );

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

-- ---------------------------------------------------------------------------
-- 3 · O que já nasceu torto
-- ---------------------------------------------------------------------------
--
-- Mesma regra da ressincronização anterior, agora alcançando as linhas que
-- entraram publicadas pelo `insert` — as fixtures de certificação são o caso
-- conhecido. ⛔ Nenhum motivo, autoria ou data é fabricado.

alter table curadoria.professional_profiles disable trigger assert_ciclo_do_profissional;
alter table curadoria.professional_profiles disable trigger registrar_trilha_do_ciclo;

update curadoria.professional_profiles
   set ciclo_de_vida = 'PUBLICADO_ATIVO'
 where ciclo_de_vida = 'PREPARACAO'
   and is_demo = false
   and status = 'ativo'
   and publication_status = 'publicado';

alter table curadoria.professional_profiles enable trigger assert_ciclo_do_profissional;
alter table curadoria.professional_profiles enable trigger registrar_trilha_do_ciclo;
