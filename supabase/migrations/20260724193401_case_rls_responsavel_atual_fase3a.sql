-- Correção de Domínio — Fase 3a: a RLS do Case passa a refletir a
-- responsabilidade operacional ATUAL, não o Curador designado.
--
-- Antes: using (has_role('administrador') or assigned_curator_id = auth.uid())
-- Um Atendente ou Concierge não enxergava Case nenhum.

create or replace function curadoria.can_access_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
  select exists (
    select 1
    from curadoria.cases c
    where c.id = _case_id
      and (
        curadoria.has_role('administrador')
        -- responsável atual, seja qual for o nível
        or c.responsible_id = auth.uid()
        -- Curador designado: vínculo histórico, mantido porque os Cases
        -- anteriores à Correção de Domínio têm responsible_id nulo e o
        -- Curador não pode perder o Case que já conduz.
        or c.assigned_curator_id = auth.uid()
      )
  );
$function$;

comment on function curadoria.can_access_case(uuid) is
  'Autorização do Case pela responsabilidade ATUAL. Quem já entregou o Case não continua enxergando: o histórico em case_responsibility_changes registra a passagem, não devolve acesso.';

revoke execute on function curadoria.can_access_case(uuid) from public;
grant execute on function curadoria.can_access_case(uuid) to authenticated;

drop policy if exists cases_select_admin_or_assigned_curator on curadoria.cases;
drop policy if exists cases_update_admin_or_assigned_curator on curadoria.cases;
drop policy if exists cases_insert_admin_or_curator on curadoria.cases;

create policy cases_select_responsavel_atual
  on curadoria.cases for select to authenticated
  using (curadoria.can_access_case(id));

create policy cases_update_responsavel_atual
  on curadoria.cases for update to authenticated
  using (curadoria.can_access_case(id))
  with check (curadoria.can_access_case(id));

-- Quem abre o Case é o Atendente (Nível 1). Administrador e Curador seguem
-- podendo abrir — o Curador porque hoje é o único caminho real em produção,
-- enquanto nenhum Atendente existe.
create policy cases_insert_atendente_curador_admin
  on curadoria.cases for insert to authenticated
  with check (
    curadoria.has_role('administrador')
    or curadoria.has_role('atendente')
    or curadoria.has_role('curador_medico')
  );

-- Espelha o Case: o mesmo critério vale para os eventos dele.
drop policy if exists case_events_select_admin_or_case_curator on curadoria.case_events;
create policy case_events_select_responsavel_atual
  on curadoria.case_events for select to authenticated
  using (curadoria.can_access_case(case_id));