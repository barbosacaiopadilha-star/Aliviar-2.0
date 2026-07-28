-- DESCARTE ADMINISTRATIVO INTEGRAL DE CASE — ADR-038
--
-- A migration 20260724192608 declarou, na mesma tela, duas coisas
-- incompatíveis: `case_id ... on delete cascade` e um gatilho
-- `BEFORE UPDATE OR DELETE` que recusa qualquer DELETE sem perguntar de onde
-- ele veio. O gatilho recusa a própria cascata que a tabela declara — e um
-- Case que trocou de responsável ficou indestrutível por acidente, não por
-- decisão.
--
-- A ADR-038 separa as duas garantias que estavam coladas:
--
--   1. Enquanto o Case existe, seu histórico de responsabilidade é imutável.
--      Nenhum UPDATE, nunca. Nenhum DELETE de linha avulsa, nunca.   [MANTIDA]
--   2. Um Case e sua história nunca podem ser eliminados.            [RECUSADA]
--
-- Esta migration é ADITIVA: não descarta Case nenhum, não altera linha
-- nenhuma, não concede DELETE a ninguém, não mexe em RLS e não muda o
-- comportamento de nenhum usuário da aplicação. Depois de aplicada, o efeito
-- imediato é NENHUM — porque nada chama a função nova.
--
-- Rollback: ver o fim do arquivo.

-- ---------------------------------------------------------------------------
-- 0. O vocabulário da auditoria ganha o descarte
-- ---------------------------------------------------------------------------
--
-- `curadoria.audit_action` é um ENUM fechado (`role_granted`, `role_revoked`)
-- — auditoria com vocabulário controlado, não texto livre. O descarte precisa
-- do próprio verbo, e ele entra aqui.
--
-- `add value` pode conviver com transação no PG 12+ desde que o valor novo
-- não seja USADO na mesma transação. Não é: quem o usa é o corpo da função,
-- avaliado só em tempo de execução, depois desta migration commitar.
alter type curadoria.audit_action add value if not exists 'case_discarded';

-- ---------------------------------------------------------------------------
-- 1. O gatilho passa a distinguir a ORIGEM do DELETE
-- ---------------------------------------------------------------------------
--
-- Duas condições, ambas obrigatórias. Uma sozinha não libera nada.
--
-- (a) ESTRUTURAL — o Case pai já não existe.
--     Verificado no banco: num DELETE avulso da linha do log, o Case ainda
--     está lá quando o BEFORE DELETE dispara; numa cascata vinda de
--     `delete from cases`, o Case já saiu. É a diferença entre "estão
--     apagando o rastro" e "o Case inteiro deixou de existir" — e ela não
--     depende de nada que um cliente possa afirmar sobre si mesmo.
--
-- (b) AUTORIZAÇÃO — a transação corrente carrega a marca do descarte para
--     ESTE case_id, colocada por `curadoria.discard_case_admin` com
--     `is_local => true` (morre no fim da transação, não vaza para outra
--     sessão, não sobrevive ao commit).
--
-- Por que as duas: (a) sozinha permitiria que qualquer detentor de DELETE em
-- `cases` — hoje só `service_role` — apagasse um Case por fora da porta
-- auditada. (b) sozinha seria uma variável de sessão como única defesa, que a
-- ADR-038 recusa explicitamente. Juntas, a única forma de remover o histórico
-- é o Case inteiro sendo descartado pela função, e por mais nenhum caminho.
create or replace function curadoria.enforce_responsibility_log_append_only()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _autorizado text;
begin
  if tg_op = 'UPDATE' then
    raise exception 'curadoria.case_responsibility_changes é append-only: UPDATE não é permitido';
  end if;

  -- (a) o Case pai ainda existe? então isto é remoção de rastro.
  if exists (select 1 from curadoria.cases c where c.id = old.case_id) then
    raise exception 'curadoria.case_responsibility_changes é append-only: DELETE não é permitido';
  end if;

  -- (b) a transação carrega a autorização do descarte deste Case?
  _autorizado := current_setting('curadoria.descarte_autorizado', true);
  if _autorizado is null or _autorizado <> old.case_id::text then
    raise exception
      'curadoria.case_responsibility_changes: exclusão só é permitida pelo descarte administrativo autorizado do Case (ADR-038)';
  end if;

  return old;
end;
$$;

comment on function curadoria.enforce_responsibility_log_append_only() is
  'ADR-038. Recusa UPDATE sempre. Recusa DELETE, exceto quando o Case pai já não existe (cascata) E a transação carrega a autorização de curadoria.discard_case_admin para aquele case_id. As duas condições são obrigatórias.';

-- ---------------------------------------------------------------------------
-- 2. A porta única: descarte administrativo integral
-- ---------------------------------------------------------------------------
--
-- `security definer` é necessário: a função precisa apagar o Case (nenhum
-- papel de aplicação tem DELETE em `cases`) e gravar auditoria. `search_path`
-- fixo, como toda função definer deste schema.
--
-- A autorização é verificada AQUI DENTRO. `service_role` é transporte, nunca
-- justificativa: quando existe usuário autenticado, ele precisa ter papel
-- `administrador`; quando não existe (chamada técnica de servidor, como a
-- limpeza da suíte local), o executor precisa ser informado explicitamente e
-- é validado do mesmo jeito. Não há caminho que dispense a checagem de papel.
create or replace function curadoria.discard_case_admin(
  _case_id uuid,
  _reason text,
  _executed_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _executor uuid;
  _case record;
  _trocas int;
  _resumo jsonb;
begin
  if _case_id is null then
    raise exception 'Descarte de Case exige o identificador do Case.' using errcode = '22023';
  end if;

  if btrim(coalesce(_reason, '')) = '' then
    raise exception 'Descarte de Case exige motivo. Um descarte sem motivo não é auditável.' using errcode = '22023';
  end if;

  -- Quem está executando. Sessão autenticada tem precedência: ninguém se
  -- passa por outro informando `_executed_by`.
  _executor := coalesce(auth.uid(), _executed_by);

  if _executor is null then
    raise exception 'Descarte de Case exige executor identificado.' using errcode = '42501';
  end if;

  if auth.uid() is not null and _executed_by is not null and _executed_by <> auth.uid() then
    raise exception 'Descarte de Case: o executor informado não é o usuário autenticado.' using errcode = '42501';
  end if;

  if not exists (
    select 1
      from curadoria.user_roles ur
      join curadoria.roles r on r.id = ur.role_id
     where ur.profile_id = _executor
       and r.slug = 'administrador'
  ) then
    raise exception 'Descarte de Case exige papel administrador.' using errcode = '42501';
  end if;

  select c.id, c.patient_profile_id, c.status, c.is_certification
    into _case
    from curadoria.cases c
   where c.id = _case_id;

  if not found then
    raise exception 'Case % não existe.', _case_id using errcode = '02000';
  end if;

  select count(*) into _trocas
    from curadoria.case_responsibility_changes
   where case_id = _case_id;

  -- Auditoria ANTES da exclusão, e sem FK para `cases`: `audit_logs` referencia
  -- apenas `profiles`, então o registro sobrevive ao descarte. Só o mínimo —
  -- nenhum conteúdo clínico, nenhuma narrativa, nenhum documento.
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    _executor,
    'case_discarded',
    _case.patient_profile_id,
    jsonb_build_object(
      'case_id', _case_id,
      'case_status', _case.status,
      'is_certification', _case.is_certification,
      'responsibility_changes_discarded', _trocas,
      'reason', btrim(_reason),
      'discarded_at', now()
    )
  );

  _resumo := jsonb_build_object(
    'case_id', _case_id,
    'patient_profile_id', _case.patient_profile_id,
    'responsibility_changes_discarded', _trocas,
    'executed_by', _executor
  );

  -- A marca que destrava o gatilho, restrita a ESTE case_id e local à
  -- transação. Se qualquer etapa adiante falhar, a transação inteira volta
  -- atrás — inclusive a auditoria e a marca.
  perform set_config('curadoria.descarte_autorizado', _case_id::text, true);

  delete from curadoria.cases where id = _case_id;

  perform set_config('curadoria.descarte_autorizado', '', true);

  return _resumo;
end;
$$;

comment on function curadoria.discard_case_admin(uuid, text, uuid) is
  'ADR-038. Porta única de descarte integral de um Case. Exige motivo não vazio e executor com papel administrador (verificado aqui dentro; service_role é transporte, não autorização). Grava auditoria sobrevivente antes de apagar. Tudo numa transação: qualquer falha desfaz o descarte inteiro.';

-- ---------------------------------------------------------------------------
-- 3. Exposição
-- ---------------------------------------------------------------------------
--
-- A função NÃO é chamável por `anon` nem por `authenticated`. Não há rota,
-- Server Action, botão ou painel nesta missão. A superfície de RPC do
-- PostgREST fica fechada por ausência de EXECUTE — e, mesmo que um dia seja
-- aberta, a checagem de papel continua obrigatória dentro do corpo.
revoke all on function curadoria.discard_case_admin(uuid, text, uuid) from public;
revoke all on function curadoria.discard_case_admin(uuid, text, uuid) from anon;
revoke all on function curadoria.discard_case_admin(uuid, text, uuid) from authenticated;
grant execute on function curadoria.discard_case_admin(uuid, text, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop function if exists curadoria.discard_case_admin(uuid, text, uuid);
--
--   create or replace function curadoria.enforce_responsibility_log_append_only()
--   returns trigger language plpgsql security definer
--   set search_path = curadoria, pg_temp as $$
--   begin
--     raise exception 'curadoria.case_responsibility_changes é append-only: % não é permitido', tg_op;
--   end; $$;
--
-- O rollback devolve o comportamento anterior (Case indestrutível) e remove a
-- porta. NÃO recria Cases já descartados: DESCARTE EXECUTADO É IRREVERSÍVEL.
-- O que resta deles é o registro `case_discarded` em `audit_logs`, que
-- sobrevive de propósito.
