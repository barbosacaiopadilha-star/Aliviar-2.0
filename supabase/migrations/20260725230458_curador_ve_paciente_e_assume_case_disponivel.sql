-- O CURADOR PRECISA VER QUEM ELE ATENDE, E PODER PEGAR O QUE ESTÁ PARADO.
--
-- Dois achados do teste em produção:
--   1. A fila mostrava "Paciente" no lugar do nome — a RLS de `profiles` só
--      permitia ler o próprio perfil. Numa plataforma cuja tese é a pessoa no
--      centro, o Curador não sabia o nome de quem estava atendendo.
--   2. Um Case sem curador era invisível para todos os curadores, e ninguém
--      além do administrador podia assumi-lo. Trabalho parado sem dono e sem
--      caminho.

-- ---------------------------------------------------------------------------
-- 1 — O nome de quem ele atende
-- ---------------------------------------------------------------------------
-- Escopo deliberadamente estreito: apenas perfis que SÃO paciente de algum
-- Case. `profiles` guarda só display_name e avatar_url — nenhum contato,
-- documento ou dado clínico — então isto expõe o nome, e nada além dele.
-- A leitura vale para qualquer Case, e não só os dele, porque a fila de
-- Curadorias disponíveis precisa dizer de quem é cada caso.
create policy profiles_select_paciente_por_curador on curadoria.profiles
  for select to authenticated
  using (
    curadoria.has_role('curador_medico')
    and exists (
      select 1 from curadoria.cases c where c.patient_profile_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- 2 — Enxergar o que está sem dono
-- ---------------------------------------------------------------------------
-- Um Case sem responsável E sem curador atribuído não é de ninguém. Deixá-lo
-- invisível não protege o paciente — só garante que ele espere mais.
create policy cases_select_disponivel_para_curador on curadoria.cases
  for select to authenticated
  using (
    curadoria.has_role('curador_medico')
    and responsible_id is null
    and assigned_curator_id is null
  );

-- ---------------------------------------------------------------------------
-- 3 — Assumir para si, e só para si
-- ---------------------------------------------------------------------------
-- A Convergência de Domínio deixou esta função como ÚNICO caminho de escrita
-- de responsabilidade. Por isso a autoassunção entra aqui dentro, e não numa
-- segunda porta: duas portas para o mesmo invariante são duas regras que
-- podem divergir.
--
-- A cláusula nova é a mais estreita possível: só um Curador, só sobre um Case
-- que não é de ninguém, e só atribuindo a SI MESMO. Continua impossível pegar
-- o caso de outra pessoa ou empurrar um caso para um colega.
create or replace function curadoria.transfer_case_responsibility(
  _case_id uuid, _new_responsible_id uuid, _new_role text, _reason text
)
returns curadoria.cases
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _case curadoria.cases;
  _is_admin boolean;
  _is_self_claim boolean;
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

  -- Autoassunção: Curador pegando para si um Case que não é de ninguém.
  _is_self_claim :=
    _case.responsible_id is null
    and _case.assigned_curator_id is null
    and _new_responsible_id = _actor
    and _new_role = 'curador_medico'
    and curadoria.has_role('curador_medico');

  -- Quem pode transferir: o administrador, quem tem o Case na mão hoje, ou
  -- um Curador assumindo um Case livre para si.
  if not (
    _is_admin
    or _case.responsible_id = _actor
    or (_case.responsible_id is null and _case.assigned_curator_id = _actor)
    or _is_self_claim
  ) then
    raise exception 'Só o responsável atual pelo Case (ou um administrador) pode transferi-lo'
      using errcode = '42501';
  end if;

  -- Idempotência: transferir para quem já é o responsável não é erro nem
  -- evento novo. O histórico não registra o que não aconteceu.
  if _case.responsible_id is not distinct from _new_responsible_id
     and _case.responsible_role is not distinct from _new_role then
    return _case;
  end if;

  -- O destino precisa realmente ter o papel. Sem isso, "transferir ao
  -- Curador" viraria só um texto.
  if not exists (
    select 1 from curadoria.user_roles ur
    join curadoria.roles r on r.id = ur.role_id
    where ur.profile_id = _new_responsible_id and r.slug = _new_role
  ) then
    raise exception 'Destinatário % não tem o papel %', _new_responsible_id, _new_role
      using errcode = '23514';
  end if;

  -- Transições normais da jornada. Qualquer outra (devolução, reabertura,
  -- salto de nível) é excepcional e exige administrador — nunca acontece
  -- em silêncio.
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
         -- Quando o Case passa a ser de um Curador e ainda não tinha um
         -- atribuído, os dois campos passam a apontar para a mesma pessoa.
         -- Sem isto, o Case ficaria "com ele" sem aparecer no portal dele.
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
$function$;
