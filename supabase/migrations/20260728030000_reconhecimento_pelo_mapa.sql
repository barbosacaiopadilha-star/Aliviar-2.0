-- RECONHECIMENTO DO PERFIL PELO MAPA DE PRIORIDADES — ADR-042
--
-- O problema que esta migration resolve é de autoridade, não de tela.
--
-- Até aqui o "reconhecimento da paciente" era gravado por
-- `validateProfileAction`, que exigia `requireCurator()`. Ou seja: o ato que o
-- Método define como sendo DELA só podia ser executado pelo Curador, e só
-- depois que os 100 pontos fechassem. Duas coisas erradas de uma vez —
-- o dono do ato e a condição do ato.
--
-- Três mudanças, todas na mesma direção:
--
--  1. O gate deixa de ser a soma de `priority_weights` e passa a ser a
--     completude do `case_priority_map`. É o Mapa que ela reconhece; pedir que
--     ela confirmasse uma soma de 100 pontos era pedir aval a uma conta que
--     nunca foi dela.
--
--  2. Ela ganha como LER o próprio Perfil antes de reconhecê-lo. A policy
--     existente (`priority_profiles_select_patient_validated`) só a deixava
--     ver depois de validado — um Perfil que ela só podia enxergar depois de
--     confirmar. Confirmar às cegas não é consentimento.
--
--  3. Ela ganha como ESCREVER o reconhecimento, por uma função que faz
--     exatamente isso e nada mais.
--
-- O que NÃO muda: a irreversibilidade. `protect_validated_priority_profile`
-- continua intacto — Perfil reconhecido é imutável e corrigir exige construir
-- um novo (Invariante 28 da Ontologia). Auditada e mantida de propósito, não
-- por herança.
--
-- ADITIVA quanto a dados: não altera, converte nem apaga `priority_weights`.

-- ---------------------------------------------------------------------------
-- 1. O gate: completude do Mapa, nunca soma de pontos
-- ---------------------------------------------------------------------------

create or replace function curadoria.priority_map_pending(_case_id uuid)
returns integer language sql stable security definer
set search_path = curadoria, pg_temp as $$
  select count(*)::integer
  from curadoria.method_subcriteria s
  where s.active
    and not exists (
      select 1 from curadoria.case_priority_map m
      where m.case_id = _case_id and m.subcriterion_id = s.id
    );
$$;

comment on function curadoria.priority_map_pending(uuid) is
  'Quantos subcriterios ATIVOS do catalogo ainda nao foram classificados neste Case. Zero significa Mapa completo. E o unico gate do reconhecimento.';

revoke execute on function curadoria.priority_map_pending(uuid) from anon, authenticated;

-- O trigger antigo somava `priority_weights` e exigia exatamente 100. Passa a
-- exigir o Mapa completo. Mesmo nome, mesma posição, autoridade nova.
create or replace function curadoria.enforce_priority_profile_validation()
returns trigger language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare pendentes integer;
begin
  if new.status = 'VALIDATED' and (old.status is distinct from 'VALIDATED') then
    select curadoria.priority_map_pending(new.case_id) into pendentes;
    if pendentes > 0 then
      raise exception 'O Mapa de Prioridades ainda tem % subcriterio(s) sem classificacao. O reconhecimento acontece sobre o Mapa completo.', pendentes;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Ela passa a enxergar o próprio Perfil antes de reconhecê-lo
-- ---------------------------------------------------------------------------

drop policy if exists "priority_profiles_select_patient_validated" on curadoria.priority_profiles;

create policy "priority_profiles_select_patient" on curadoria.priority_profiles
  for select to authenticated
  using (curadoria.is_patient_for_case(case_id));

comment on policy "priority_profiles_select_patient" on curadoria.priority_profiles is
  'A paciente le o proprio Perfil em qualquer estado. A policy anterior exigia status = VALIDATED, o que a obrigava a confirmar as cegas algo que so poderia ver depois de confirmado.';

-- ---------------------------------------------------------------------------
-- 3. O ato dela
-- ---------------------------------------------------------------------------
--
-- Função e não policy de UPDATE: uma policy de UPDATE não consegue limitar
-- QUAIS colunas mudam, e dar à paciente update na tabela inteira abriria mais
-- do que o ato precisa. Aqui ela pode fazer uma coisa só.
--
-- Idempotente por contrato: chamar duas vezes devolve 'JA_RECONHECIDO' em vez
-- de erro. Reconhecer de novo não é falha dela.
create or replace function curadoria.acknowledge_priority_profile(_case_id uuid)
returns text language plpgsql security definer
set search_path = curadoria, pg_temp as $$
declare
  perfil record;
  pendentes integer;
begin
  if not curadoria.is_patient_for_case(_case_id) then
    return 'NAO_AUTORIZADO';
  end if;

  select id, status into perfil
  from curadoria.priority_profiles
  where case_id = _case_id
  order by created_at desc
  limit 1;

  if not found then
    return 'PERFIL_INEXISTENTE';
  end if;

  if perfil.status = 'VALIDATED' then
    return 'JA_RECONHECIDO';
  end if;

  if perfil.status = 'SUPERSEDED' then
    return 'PERFIL_SUBSTITUIDO';
  end if;

  select curadoria.priority_map_pending(_case_id) into pendentes;
  if pendentes > 0 then
    return 'MAPA_INCOMPLETO';
  end if;

  update curadoria.priority_profiles
  set status = 'VALIDATED', validated_at = now()
  where id = perfil.id;

  return 'RECONHECIDO';
end;
$$;

comment on function curadoria.acknowledge_priority_profile(uuid) is
  'O ato da paciente: confirmar que o Mapa de Prioridades reflete o que foi compreendido na Consulta Inicial. Nao valida criterios, nao aprova o Metodo, nao autoriza conclusao clinica. Idempotente.';

revoke execute on function curadoria.acknowledge_priority_profile(uuid) from anon;
grant execute on function curadoria.acknowledge_priority_profile(uuid) to authenticated;
