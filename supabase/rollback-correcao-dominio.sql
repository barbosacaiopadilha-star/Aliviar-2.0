-- ROLLBACK da Correção de Domínio — Fases 1, 2, 3a e 3b
--
-- NÃO EXECUTAR sem decisão explícita. Este arquivo existe para que a decisão
-- de voltar atrás seja possível, não para que seja fácil.
--
-- Contexto: docs/CORRECAO_DOMINIO_PAPEIS_E_CASE.md
-- Aplicado em produção (aliviar-2-prod, schema `curadoria`) em 2026-07-24.
--
-- Migrations correspondentes, na ordem em que foram aplicadas:
--   papel_atendente_nivel1
--   case_responsavel_fase1
--   case_auditoria_troca_responsavel_fase2
--   case_rls_responsavel_atual_fase3a
--   case_transferencia_auditada_fase3b
--
-- ============================================================================
-- O QUE ESTE ROLLBACK CUSTA
-- ============================================================================
--
-- Tudo abaixo é reversível MENOS uma coisa: derrubar
-- `case_responsibility_changes` apaga o histórico de passagens de bastão.
-- Esse histórico é append-only justamente porque não deveria desaparecer.
--
-- Antes de rodar o passo 5, exporte:
--   copy (select * from curadoria.case_responsibility_changes)
--     to stdout with (format csv, header);
--
-- Contagem no momento em que este arquivo foi escrito: 0 registros.
-- Confira a contagem atual antes de decidir — se não for mais 0, o rollback
-- destrói auditoria de operação real.
--
-- ============================================================================

-- 1) Devolver a escrita direta na responsabilidade
drop trigger if exists cases_responsibility_guard on curadoria.cases;
drop function if exists curadoria.guard_case_responsibility();

-- 2) Remover a operação de transferência
drop function if exists curadoria.transfer_case_responsibility(uuid, uuid, text, text);

-- 3) Voltar a RLS ao estado anterior
--    ATENÇÃO: isso volta a trancar Atendente e Concierge para fora do Case.
drop policy if exists cases_select_responsavel_atual on curadoria.cases;
drop policy if exists cases_update_responsavel_atual on curadoria.cases;
drop policy if exists cases_insert_atendente_curador_admin on curadoria.cases;
drop policy if exists case_events_select_responsavel_atual on curadoria.case_events;
drop function if exists curadoria.can_access_case(uuid);

create policy cases_select_admin_or_assigned_curator
  on curadoria.cases for select to authenticated
  using (curadoria.has_role('administrador') or assigned_curator_id = auth.uid());

create policy cases_update_admin_or_assigned_curator
  on curadoria.cases for update to authenticated
  using (curadoria.has_role('administrador') or assigned_curator_id = auth.uid())
  with check (curadoria.has_role('administrador') or assigned_curator_id = auth.uid());

create policy cases_insert_admin_or_curator
  on curadoria.cases for insert to authenticated
  with check (curadoria.has_role('administrador') or curadoria.has_role('curador_medico'));

create policy case_events_select_admin_or_case_curator
  on curadoria.case_events for select to authenticated
  using (exists (
    select 1 from curadoria.cases c
    where c.id = case_events.case_id
      and (curadoria.has_role('administrador') or c.assigned_curator_id = auth.uid())
  ));

-- 4) Remover os campos de responsabilidade atual
--    Perde-se quem é o responsável hoje de cada Case.
alter table curadoria.cases
  drop column if exists responsible_id,
  drop column if exists responsible_role;

-- 5) Remover o histórico  <<< DESTRUTIVO — exporte antes (ver cabeçalho)
drop trigger if exists case_responsibility_changes_append_only
  on curadoria.case_responsibility_changes;
drop trigger if exists case_responsibility_changes_coherence
  on curadoria.case_responsibility_changes;
drop table if exists curadoria.case_responsibility_changes;
drop function if exists curadoria.enforce_responsibility_log_append_only();
drop function if exists curadoria.enforce_responsibility_change_coherence();

-- 6) Remover o papel Atendente
--    Só rode se ninguém tiver o papel. Se alguém tiver, esta linha falha por
--    FK — e é bom que falhe: significa que existe um Atendente de verdade.
delete from curadoria.roles where slug = 'atendente';
