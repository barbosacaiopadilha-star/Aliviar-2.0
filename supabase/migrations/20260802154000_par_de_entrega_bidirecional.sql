-- ============================================================================
-- BLOCO B.6 / B1 — O PAR DE ENTREGA VIRA BIDIRECIONAL (gate B17)
-- ============================================================================
--
-- FINALIDADE
--   A migration 20260802150000 fechou UMA direção do par de entrega: nenhuma
--   seleção transita para DELIVERED sem Relatório emitido (trigger em
--   `curated_selections`). A direção INVERSA seguiu aberta (validação
--   arquitetural B.5, item B1 — bloqueante-para-C): `markReportDelivered`,
--   um UPDATE PostgREST direto ou um script ainda gravavam
--   `curadoria_reports.delivered_at` com a seleção parada em DRAFT — o
--   Relatório "entregue" de uma Curadoria que nunca foi entregue, o par de
--   telas inconsistente renascendo pela outra ponta. O Bloco C congelaria
--   estados terminais sobre um par que ainda nasce torto.
--
--   Esta migration fecha a direção que faltava: `delivered_at` de um
--   Relatório só pode SER ESCRITO (transição null -> valor) quando a seleção
--   correspondente já está DELIVERED. A recusa é do banco, não da interface.
--
--   O caminho oficial (`deliver_curadoria`, M150) passa SEM alteração: no
--   corpo daquela RPC a seleção é entregue ANTES do update do Relatório, na
--   MESMA transação (M150 linhas 200-209), e o ramo de reparo só toca o
--   Relatório de uma seleção que já está DELIVERED — nos dois ramos, a
--   checagem deste trigger enxerga a seleção entregue. M150 não é tocada.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.curadoria_reports` e `curadoria.curated_selections`
--     existentes (stage 8 + 20260727110000).
--   - Constraint `report_delivery_requires_emission` vigente (delivered_at
--     exige emitted_at) — este trigger a complementa, não a substitui.
--   - Trigger `enforce_delivery_requires_emitted_report_trigger` (M150)
--     vigente na outra ponta do par.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada.
--   - Só TRANSIÇÕES (UPDATE com delivered_at null -> valor) são examinadas:
--     linhas paradas, INSERTs e reescritas de carimbo já gravado não são
--     reavaliados — simétrico à decisão de M150 (INSERT torto e sobrescrita
--     de carimbo são imutabilidade geral, assunto do Bloco C, gates C6/C7).
--   - Par invertido legado (Relatório entregue com seleção não-DELIVERED),
--     se existir, permanece como está: não se reescreve história. Fica
--     detectável pela consulta de fechamento abaixo.
--
-- PROVA DE FECHAMENTO
--   - Gate B17 (tests/remediacao/atomicidade.integration.test.ts): UPDATE
--     PostgREST direto de delivered_at com a seleção em DRAFT, com sessão
--     real de Curador, é recusado e NENHUMA metade muda; e o caminho oficial
--     `deliver_curadoria` continua entregando as duas metades no mesmo ato.
--   - Conferência manual (não cresce a partir desta migration):
--     select count(*) from curadoria.curadoria_reports r
--     join curadoria.curated_selections s on s.id = r.curated_selection_id
--     where r.delivered_at is not null and s.status <> 'DELIVERED';
--
-- ROLLBACK
--   drop trigger if exists enforce_report_delivery_requires_delivered_selection_trigger
--     on curadoria.curadoria_reports;
--   drop function if exists curadoria.enforce_report_delivery_requires_delivered_selection();
-- ============================================================================

-- Trava de banco (gate B17): Relatório entregue exige seleção DELIVERED.
create or replace function curadoria.enforce_report_delivery_requires_delivered_selection()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if new.delivered_at is not null and old.delivered_at is null then
    if not exists (
      select 1 from curadoria.curated_selections s
      where s.id = new.curated_selection_id
        and s.status = 'DELIVERED'
    ) then
      raise exception
        'O Relatório só é entregável junto da seleção entregue. Use a entrega oficial da Curadoria (deliver_curadoria), que entrega os dois no mesmo ato.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;

revoke execute on function curadoria.enforce_report_delivery_requires_delivered_selection() from public;

drop trigger if exists enforce_report_delivery_requires_delivered_selection_trigger
  on curadoria.curadoria_reports;
create trigger enforce_report_delivery_requires_delivered_selection_trigger
  before update on curadoria.curadoria_reports
  for each row execute function curadoria.enforce_report_delivery_requires_delivered_selection();

comment on function curadoria.enforce_report_delivery_requires_delivered_selection() is
  'Bloco B.6/B1 (gate B17): fecha a direção inversa do par de entrega — curadoria_reports.delivered_at só é gravável (null -> valor) com a seleção correspondente em DELIVERED. Complementa enforce_delivery_requires_emitted_report (M150), que fecha a outra direção. Dentro de deliver_curadoria a seleção é entregue antes do Relatório na mesma transação, então o caminho oficial passa por desenho.';
