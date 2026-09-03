-- ============================================================================
-- AUDITORIA ADVERSARIAL DE ACESSO (03/09) · três consertos, um por seção
-- ============================================================================
--
-- A primeira auditoria hostil de RLS da Aliviar: cada papel entrou com o
-- PRÓPRIO token e a chave pública — nunca a service role — e tentou cada
-- leitura e escrita que não deveria conseguir. 92 tabelas, 156 funções, dois
-- buckets, seis papéis mais o anônimo. O resultado geral é bom: nenhuma tabela
-- vaza linha de outra pessoa, nenhuma escrita cruzada passa, o storage segura
-- pasta por pasta. Sobraram três coisas, e a primeira é grave.
--
-- ============================================================================
-- §1 · transfer_case_responsibility: a lógica de três valores abria a porta
-- ============================================================================
--
-- O predicado de autoridade era:
--
--   if not ( _is_admin
--            or _case.responsible_id = _actor
--            or (_case.responsible_id is null and _case.assigned_curator_id = _actor)
--            or _is_self_claim ) then raise ...
--
-- Quando `responsible_id` é NULO — o formato dos Cases anteriores à Correção
-- de Domínio, que o próprio comentário de `can_access_case` descreve —,
-- `_case.responsible_id = _actor` não é falso: é NULO. E em SQL,
-- `false OR NULL OR false OR false` é NULO, `NOT NULL` é NULO, e um `IF NULL`
-- **não executa o RAISE**. O portão ficava aberto exatamente para os Cases
-- que ele mais precisava proteger.
--
-- PROVADO NO AMBIENTE LOCAL, com o token de uma PACIENTE sem Case nenhum:
-- ela redirecionou o Case de OUTRA paciente, atribuído a OUTRO curador, para
-- um terceiro curador — e o banco gravou a transferência com o histórico. A
-- transição `null → curador_medico` é "normal" para a função, e o destino
-- tinha o papel; nada mais barrava. O mesmo caminho serve a um profissional,
-- a um atendente tomando o Case para si, e a qualquer sessão autenticada.
--
-- O conserto é tornar cada comparação nula-segura. A regra não muda; ela
-- passa a valer também quando o campo está vazio.
--
-- ROLLBACK: reaplicar a versão anterior da função (migration
-- 20260825064137 e anteriores). Nenhum dado é tocado por esta seção.
-- ============================================================================

create or replace function curadoria.transfer_case_responsibility(
  _case_id uuid,
  _new_responsible_id uuid,
  _new_role text,
  _reason text
)
returns curadoria.cases
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := auth.uid();
  _case curadoria.cases;
  _is_admin boolean;
  _is_self_claim boolean;
  _autorizado boolean;
begin
  if _actor is null then
    raise exception 'Transferência exige ator autenticado' using errcode = '42501';
  end if;
  if coalesce(length(btrim(_reason)), 0) = 0 then
    raise exception 'Motivo da transferência é obrigatório' using errcode = '23514';
  end if;
  if _new_role not in ('atendente', 'curador_medico', 'concierge') then
    raise exception 'Papel inválido: %. O CRM é sistema e a Curadoria é processo — nenhum dos dois é papel responsável.', _new_role
      using errcode = '23514';
  end if;

  select * into _case from curadoria.cases where id = _case_id for update;
  if not found then
    raise exception 'Case % não existe', _case_id using errcode = 'P0002';
  end if;

  _is_admin := curadoria.has_role('administrador');

  -- Autoassunção: Curador pegando para si um Case que não é de ninguém —
  -- nem responsável atual, nem Curador designado.
  _is_self_claim :=
    _case.responsible_id is null
    and _case.assigned_curator_id is null
    and _new_responsible_id = _actor
    and _new_role = 'curador_medico'
    and curadoria.has_role('curador_medico');

  -- Quem pode transferir: o administrador, quem tem o Case na mão hoje, o
  -- Curador designado de um Case ainda sem responsável, ou um Curador
  -- assumindo um Case livre para si.
  --
  -- CADA COMPARAÇÃO É NULA-SEGURA. `x = y` com x nulo não é falso, é nulo —
  -- e `if not (… or null or …)` não dispara o RAISE. Foi assim que uma
  -- paciente transferiu o Case de outra (auditoria de 03/09). `coalesce`
  -- fecha a porta: nulo passa a contar como "não autorizado".
  _autorizado :=
    coalesce(_is_admin, false)
    or coalesce(_case.responsible_id = _actor, false)
    or coalesce(_case.responsible_id is null and _case.assigned_curator_id = _actor, false)
    or coalesce(_is_self_claim, false);

  if not _autorizado then
    raise exception 'Só o responsável atual pelo Case (ou um administrador) pode transferi-lo'
      using errcode = '42501';
  end if;

  -- Idempotência: transferir para quem já é o responsável não é erro nem
  -- evento novo. O histórico não registra o que não aconteceu.
  if _case.responsible_id is not distinct from _new_responsible_id
     and _case.responsible_role is not distinct from _new_role then
    return _case;
  end if;

  -- O destino precisa realmente ter o papel.
  if not exists (
    select 1 from curadoria.user_roles ur
    join curadoria.roles r on r.id = ur.role_id
    where ur.profile_id = _new_responsible_id and r.slug = _new_role
  ) then
    raise exception 'Destinatário % não tem o papel %', _new_responsible_id, _new_role
      using errcode = '23514';
  end if;

  -- Transições normais da jornada. Qualquer outra exige administrador.
  if not _is_admin then
    if not (
      (_case.responsible_role is null            and _new_role = 'atendente')
      or (_case.responsible_role = 'atendente'      and _new_role = 'curador_medico')
      or (_case.responsible_role = 'curador_medico' and _new_role = 'concierge')
      or (_case.responsible_role is null            and _new_role = 'curador_medico')
    ) then
      raise exception 'Transição de % para % não é normal na jornada; exige administrador e registro explícito',
        coalesce(_case.responsible_role, 'sem responsável'), _new_role
        using errcode = '42501';
    end if;
  end if;

  insert into curadoria.case_responsibility_changes (
    case_id, previous_responsible_id, previous_role,
    new_responsible_id, new_role, changed_by, reason
  ) values (
    _case_id, _case.responsible_id, _case.responsible_role,
    _new_responsible_id, _new_role, _actor, btrim(_reason)
  );

  perform set_config('curadoria.handoff', 'on', true);
  update curadoria.cases
     set responsible_id = _new_responsible_id,
         responsible_role = _new_role,
         assigned_curator_id = case
           when _new_role = 'curador_medico' and _case.assigned_curator_id is null
             then _new_responsible_id
           else _case.assigned_curator_id
         end,
         updated_at = now()
   where id = _case_id
   returning * into _case;
  perform set_config('curadoria.handoff', 'off', true);

  return _case;
end;
$$;

comment on function curadoria.transfer_case_responsibility(uuid, uuid, text, text) is
  'Único caminho para mudar o responsável por um Case. Predicado de autoridade nulo-seguro desde 03/09: Case sem responsável só é tomado pelo Curador designado, por um Curador quando está realmente livre, ou por administrador.';

-- ============================================================================
-- §2 · relational_needs_pending era executável pelo ANÔNIMO
-- ============================================================================
--
-- Sem sessão nenhuma, qualquer um que conhecesse o id de um Case obtinha a
-- contagem de necessidades relacionais ainda não declaradas nele. O app não
-- chama esta função de fora do banco — ela existe para uso interno em SQL.
-- Não há razão para o anônimo executá-la; o `authenticated` fica, porque os
-- helpers que dependem dela rodam com sessão.
--
-- POR QUE `from public`, e não `from anon`: o acesso do anônimo não era um
-- grant a ele — era o EXECUTE padrão que o Postgres dá a PUBLIC em toda
-- função nova (`=X/postgres` na ACL). `revoke … from anon` é um no-op nesse
-- caso: revoga um grant que nunca existiu, e o anônimo continua entrando por
-- PUBLIC. Foi assim que a primeira versão desta seção passou pelo banco sem
-- mudar nada, e o teste de integração é que apontou. O revoke certo é de
-- PUBLIC, com o grant explícito a `authenticated` logo em seguida.
--
-- ROLLBACK: grant execute on function curadoria.relational_needs_pending(uuid) to public;
-- ============================================================================

revoke execute on function curadoria.relational_needs_pending(uuid) from public;
grant execute on function curadoria.relational_needs_pending(uuid) to authenticated;

-- ============================================================================
-- §3 · profiles: a própria pessoa reescrevia created_at e deleted_at
-- ============================================================================
--
-- `profiles_update_own_or_admin` autoriza a linha inteira. O app só lê
-- `profiles` de cliente — nunca escreve —, mas pela API uma paciente conseguiu
-- alterar o próprio `created_at` e marcar o próprio `deleted_at`. Hoje nada lê
-- `deleted_at`; no dia em que ele for o sinal de exclusão, uma pessoa poderia
-- "se apagar" fora do fluxo de `data_subject_requests`, sem auditoria. Guarda
-- de coluna: quem não é administrador só altera o que é seu de editar
-- (display_name, avatar_url). Identidade e datas são do sistema.
--
-- ROLLBACK: drop trigger profiles_guard_self_update on curadoria.profiles;
--           drop function curadoria.guard_profile_self_update();
-- ============================================================================

create or replace function curadoria.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  if curadoria.has_role('administrador') then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.created_at is distinct from old.created_at
     or new.deleted_at is distinct from old.deleted_at then
    raise exception
      'Identidade e datas do perfil são do sistema: só um administrador altera id, created_at ou deleted_at.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update on curadoria.profiles;
create trigger profiles_guard_self_update
  before update on curadoria.profiles
  for each row execute function curadoria.guard_profile_self_update();
