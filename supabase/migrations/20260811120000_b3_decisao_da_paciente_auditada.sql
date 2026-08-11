-- ============================================================================
-- B3 · GAP-B3-1 — A DECISÃO DA PACIENTE PASSA A DEIXAR TRILHA.
--
-- A decisão é o fato que muda a responsabilidade do Case: sem ela o Curador
-- responde, com ela o Concierge assume. Um gate de handoff sem trilha é um
-- gate que ninguém consegue auditar depois.
--
-- O NOME DO VERBO
--
-- A missão sugeriu `patient_curadoria_decision_recorded`. A taxonomia vigente
-- de `curadoria.audit_action` é <entidade>_<particípio> — `curadoria_delivered`,
-- `report_emitted`, `need_acknowledged`, `patient_document_provided`. O nome
-- coerente com ela é `patient_curadoria_decided`, e é o adotado, conforme a
-- própria missão autoriza quando a convenção existente determina outro melhor.
--
-- É o 17º `add value` da série. `add value` convive com transação no PG 12+
-- desde que o valor não seja USADO na mesma transação — e não é: quem o usa é
-- o corpo da função, avaliado só em execução, depois desta migration commitar.
--
-- POR QUE TRIGGER, E NÃO CHAMADA DO WRITER
--
-- Auditoria que depende de o código lembrar de chamá-la é auditoria que um
-- caminho novo esquece. Todo INSERT legítimo no fato canônico deixa rastro,
-- porque quem grava é o banco — precedente de `log_patient_document_provided`.
--
-- O PAYLOAD NÃO CARREGA `note`
--
-- `note` é texto livre dela sobre a própria escolha. A trilha registra QUE a
-- decisão aconteceu e QUAL foi, nunca o que ela escreveu a respeito — mesma
-- regra dos demais verbos, que guardam ids e carimbos, jamais conteúdo.
--
-- ZERO tabela, coluna, writer, regra de handoff, constraint de Segundo
-- Encontro ou mudança de RLS.
--
-- ROLLBACK
--   drop trigger if exists log_patient_curadoria_decided_trigger
--     on curadoria.patient_curadoria_decisions;
--   drop function if exists curadoria.log_patient_curadoria_decided();
--   -- O valor do enum não é removível sem recriar o tipo; inofensivo sem uso.
--   -- Resíduo aceito, mesmo precedente de `case_discarded` e
--   -- `patient_document_provided`. Linhas já gravadas permanecem.
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'patient_curadoria_decided';

create or replace function curadoria.log_patient_curadoria_decided()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _paciente uuid;
begin
  -- A dona do Case é o alvo da trilha. Lida do Case, não do ator: no caminho
  -- autenticado os dois coincidem, e derivar do fato mantém a trilha correta
  -- também quando a escrita vem do bastidor `service_role`.
  select c.patient_profile_id into _paciente
    from curadoria.cases c
   where c.id = new.case_id;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (coalesce(auth.uid(), _paciente), 'patient_curadoria_decided', _paciente,
          jsonb_build_object(
            'decision_id', new.id,
            'case_id', new.case_id,
            'curated_selection_id', new.curated_selection_id,
            'outcome', new.outcome,
            -- Id da opção, nunca o nome do profissional: a trilha referencia,
            -- não descreve.
            'chosen_option_id', new.chosen_option_id,
            'decided_at', new.decided_at));
  return new;
end;
$function$;

comment on function curadoria.log_patient_curadoria_decided() is
  'B3/GAP-B3-1: todo INSERT em patient_curadoria_decisions deixa entrada patient_curadoria_decided em audit_logs — ator, paciente, Case, selecao, outcome, id da opcao e carimbo. Nunca a nota que ela escreveu.';

revoke execute on function curadoria.log_patient_curadoria_decided() from public;

drop trigger if exists log_patient_curadoria_decided_trigger
  on curadoria.patient_curadoria_decisions;
create trigger log_patient_curadoria_decided_trigger
  after insert on curadoria.patient_curadoria_decisions
  for each row execute function curadoria.log_patient_curadoria_decided();
