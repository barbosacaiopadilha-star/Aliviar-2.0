-- =============================================================================
-- ROLLBACK COMPATÍVEL DO CORTE 7 — script EMERGENCIAL, fora do ledger.
--
-- O que ele faz: reaplica `assert_ciclo_do_profissional` IGUAL à versão 127,
-- MENOS a recusa de escrita direta em `status`/`publication_status` — para que
-- a aplicação antiga (`732d063`) volte a publicar/despublicar enquanto o app
-- novo está fora do ar. O ciclo NÃO é derivado da escrita legada: derivar
-- exigiria gravar CADASTRO_VALIDADO sem ato humano — história fabricada.
-- O desvio fica DERIVÁVEL pela comparação dos dois eixos (ver README).
--
-- Uso (psql, superusuário/owner do banco alvo):
--   psql ... -v confirmo=COMPENSAR-C7 -v banco=postgres -f rollback-compativel-c7.sql
--
-- ⛔ NUNCA entra em supabase/migrations. ⛔ Não altera dados. ⛔ Não mexe em
-- motivos, autoria, relógio, classificação de legado, exclusão nem trilha.
-- =============================================================================

\set ON_ERROR_STOP on

begin;

-- Execução concorrente incompatível: o advisory lock transacional serializa;
-- a transação única garante tudo-ou-nada.
select pg_advisory_xact_lock(hashtext('curadoria.rollback-compativel-c7'));

-- G1 · CONFIRMAÇÃO DO OPERADOR — separada das verificações objetivas.
--
-- As variáveis psql são exigidas ANTES de qualquer alteração e entram na
-- transação por set_config, fora de corpo dollar-quoted: a guarda PL/pgSQL
-- as lê por current_setting e aborta com RAISE EXCEPTION nomeado — nunca por
-- artifício aritmético. ⚠️ Estes valores vêm do operador e NÃO provam a
-- identidade do banco: a prova objetiva são as guardas G2–G4 (ledger, a
-- migration de autoria e a forma da função), metadados que o operador não
-- controla por parâmetro.
-- Variável ausente vira valor vazio — e cai na MESMA recusa nomeada da guarda,
-- com código de saída de erro (⛔ `\quit` sai com 0 e mascararia a recusa).
\if :{?confirmo}
\else
  \set confirmo ''
\endif
\if :{?banco}
\else
  \set banco ''
\endif

select set_config('rollback_c7.confirmo', :'confirmo', true);
select set_config('rollback_c7.banco', :'banco', true);

do $$
begin
  if current_setting('rollback_c7.confirmo', true) is distinct from 'COMPENSAR-C7' then
    raise exception 'RECUSADO (G1): confirmação do operador ausente ou diferente de COMPENSAR-C7.'
      using errcode = 'P0001';
  end if;
  if current_setting('rollback_c7.banco', true) is distinct from current_database() then
    raise exception 'RECUSADO (G1): o banco declarado (%) não é o banco conectado (%).',
      current_setting('rollback_c7.banco', true), current_database()
      using errcode = 'P0001';
  end if;
end $$;

do $$
declare
  v_ledger integer;
  v_def text;
  v_ja_compensado boolean;
begin
  -- G2 · O banco é o compensável: ledger EXATAMENTE 127 e a migration de
  -- autoria presente. Um banco em 121 não tem o que compensar; um em outra
  -- contagem não é o contrato testado.
  select count(*) into v_ledger from supabase_migrations.schema_migrations;
  if v_ledger <> 127 then
    raise exception 'RECUSADO: ledger é %, o contrato compensável é exatamente 127.', v_ledger;
  end if;
  if not exists (
    select 1 from supabase_migrations.schema_migrations
     where version = '20260815021141'
  ) then
    raise exception 'RECUSADO: a migration de autoria (20260815021141) não está no ledger — este banco não é o compensável.';
  end if;

  -- G3 · A função alvo existe, é SECURITY INVOKER e tem search_path fixo vazio.
  select pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'curadoria' and p.proname = 'assert_ciclo_do_profissional'
     and p.prosecdef = false
     and coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=%';
  if v_def is null then
    raise exception 'RECUSADO: curadoria.assert_ciclo_do_profissional ausente ou fora do modo de segurança esperado (INVOKER + search_path fixo).';
  end if;

  -- G4 · A coluna do ciclo existe.
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'curadoria' and table_name = 'professional_profiles'
       and column_name = 'ciclo_de_vida'
  ) then
    raise exception 'RECUSADO: professional_profiles.ciclo_de_vida não existe — schema inesperado.';
  end if;

  -- G5 · Idempotência: se a recusa de escrita legada JÁ não está no corpo, o
  -- modo compatível está ativo. Segunda execução é no-op, sem marcador novo.
  v_ja_compensado := position('Publicar e despublicar são mudanças de ciclo' in v_def) = 0;
  if v_ja_compensado then
    raise notice 'MODO COMPATÍVEL JÁ ATIVO — nada a fazer (idempotente).';
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- A COMPENSAÇÃO — o corpo da 127, palavra por palavra, MENOS o bloco:
  --     if not mudou_ciclo then
  --       if new.status is distinct from old.status or ... then raise ...
  -- Tudo o mais é preservado: matriz, motivos, OUTRO com nota, autoria por
  -- auth.uid()/ator técnico, relógio monotônico do banco, guarda 11, espelho
  -- atômico quando o ciclo muda, e a recusa de sair de NULL fora da
  -- classificação de legado.
  -- ---------------------------------------------------------------------------
  execute $fn$
create or replace function curadoria.assert_ciclo_do_profissional()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $body$
declare
  permitidos curadoria.motivo_do_ciclo[];
  conexoes_ativas integer;
  classificando_legado boolean;
  mudou_ciclo boolean;
  v_uid uuid;
  v_role text;
  v_ator_txt text;
  v_ator uuid;
begin
  mudou_ciclo := new.ciclo_de_vida is distinct from old.ciclo_de_vida;

  -- MODO COMPATÍVEL (rollback do Corte 7): a escrita legada em
  -- status/publication_status NÃO é recusada aqui. O ciclo não a acompanha —
  -- o desvio é derivável comparando os dois eixos, e será re-sincronizado na
  -- migration de republicação. Nenhuma transição é derivada: derivar exigiria
  -- fabricar CADASTRO_VALIDADO sem ato humano.
  if not mudou_ciclo then
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

  v_uid := auth.uid();
  v_role := auth.role();

  if v_uid is not null then
    new.ciclo_alterado_por := v_uid;
    new.updated_by := v_uid;
  elsif v_role = 'service_role' then
    v_ator_txt := nullif(btrim(coalesce(current_setting('curadoria.actor_id', true), '')), '');
    if v_ator_txt is null then
      raise exception 'Transição por serviço exige ator técnico: defina curadoria.actor_id (set_config, mesma transação) com o perfil responsável.'
        using errcode = 'check_violation';
    end if;
    begin
      v_ator := v_ator_txt::uuid;
    exception when others then
      raise exception 'curadoria.actor_id não é um UUID válido.'
        using errcode = 'check_violation';
    end;
    if not exists (select 1 from curadoria.profiles p where p.id = v_ator) then
      raise exception 'curadoria.actor_id não corresponde a nenhum perfil conhecido.'
        using errcode = 'check_violation';
    end if;
    new.ciclo_alterado_por := v_ator;
    new.updated_by := v_ator;
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
$body$;
  $fn$;

  -- Marcador auditável: o rollback é um ato como qualquer outro.
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    null,
    'professional_ciclo_pausado'::curadoria.audit_action,  -- verbo existente; o fato está na metadata
    null,
    jsonb_build_object(
      'evento', 'modo_compativel_ativado',
      'script', 'scripts/emergencia/rollback-compativel-c7.sql',
      'ledger', 127,
      'em', clock_timestamp()
    )
  );

  raise notice 'MODO COMPATÍVEL ATIVADO — escrita legada permitida; ciclo intacto; desvio derivável.';
end $$;

commit;
