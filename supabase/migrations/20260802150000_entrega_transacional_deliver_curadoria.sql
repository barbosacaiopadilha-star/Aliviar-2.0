-- ============================================================================
-- BLOCO B / E3 — A ENTREGA DA CURADORIA VIRA UM ATO ÚNICO (deliver_curadoria)
-- ============================================================================
--
-- FINALIDADE
--   A entrega era uma sequência de escritas soltas feitas pelo servidor
--   (`deliverSelection` + `getReportBySelection` + `markReportDelivered`):
--   uma falha no meio deixava seleção entregue com Relatório não entregue —
--   a paciente via três nomes e nenhuma explicação (AT-01). Pior:
--   `markReportDelivered` sobrescrevia `emitted_at` com o instante da
--   entrega, destruindo o carimbo real de emissão (IM-03). Esta migration
--   cria a operação oficial `curadoria.deliver_curadoria`, no padrão do
--   gabarito `transfer_case_responsibility`: ator por auth.uid(), validação
--   de papel/relação/estado, FOR UPDATE, tudo numa transação, idempotente,
--   erro de domínio preservado, evento e auditoria no mesmo ato.
--
--   Também fecha a porta lateral (gate B12): nenhuma seleção transita para
--   DELIVERED — por RPC, por PostgREST direto ou por script — sem que exista
--   um Relatório EMITIDO para ela. A recusa é do banco, não da interface.
--
-- PRÉ-CONDIÇÕES
--   - Tabelas `curated_selections`, `curadoria_reports`,
--     `curated_selection_options`, `curadoria_report_options`, `case_events`,
--     `audit_logs` existentes (stages 4a/7/8 + 20260727110000).
--   - Triggers vigentes preservados: `enforce_selection_has_three` (3 opções
--     na entrega), `assert_report_lifecycle` (emitir exige aprovação; emitido
--     congela conteúdo — `delivered_at` continua gravável, de propósito).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada.
--   - Seleções já DELIVERED permanecem como estão; o trigger novo só examina
--     TRANSIÇÕES para DELIVERED (UPDATE), nunca linhas paradas nem INSERTs —
--     fixtures e histórico não são reavaliados.
--   - Estado parcial legado (seleção DELIVERED com Relatório sem
--     `delivered_at`) ganha caminho de reparo: chamar `deliver_curadoria`
--     completa a entrega do Relatório usando o carimbo da seleção, sem tocar
--     `emitted_at`, e registra o reparo em `case_events`.
--
-- PROVA DE FECHAMENTO
--   - Gate B11 (tests/remediacao/atomicidade.integration.test.ts): a função
--     existe e responde com erro de domínio, nunca "function not found".
--   - Gate B12: UPDATE direto DRAFT->DELIVERED sem Relatório emitido, com
--     sessão real de Curador, é recusado e o estado permanece DRAFT.
--   - Conferência manual: select count(*) from curadoria.curated_selections s
--     where s.status='DELIVERED' and not exists (select 1 from
--     curadoria.curadoria_reports r where r.curated_selection_id=s.id and
--     r.emitted_at is not null) — não cresce mais a partir desta migration.
--
-- ROLLBACK
--   drop function if exists curadoria.deliver_curadoria(uuid);
--   drop trigger if exists enforce_delivery_requires_emitted_report_trigger
--     on curadoria.curated_selections;
--   drop function if exists curadoria.enforce_delivery_requires_emitted_report();
--   -- Os valores de enum adicionados ('curadoria_delivered' em
--   -- case_event_type e audit_action) NÃO são removíveis sem recriar os
--   -- tipos; são inofensivos sem uso (nenhuma linha os referencia após o
--   -- rollback das funções). Documentado como resíduo aceito.
-- ============================================================================

-- Evento e auditoria da entrega ganham nomes próprios (aditivo; mesmo
-- precedente de 'case_discarded' em audit_action).
alter type curadoria.case_event_type add value if not exists 'curadoria_delivered';
alter type curadoria.audit_action add value if not exists 'curadoria_delivered';

-- 1) Trava de banco (gate B12): entrega exige Relatório EMITIDO.
--    Só transições para DELIVERED; INSERTs e linhas já entregues não são
--    reavaliados (histórico e fixtures intactos — imutabilidade geral é
--    assunto do Bloco C, não desta trava).
create or replace function curadoria.enforce_delivery_requires_emitted_report()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if new.status = 'DELIVERED' and old.status is distinct from 'DELIVERED' then
    if not exists (
      select 1 from curadoria.curadoria_reports r
      where r.curated_selection_id = new.id
        and r.emitted_at is not null
    ) then
      raise exception
        'A Curadoria só é entregável com Relatório emitido. Escreva, aprove e emita o Relatório antes da entrega.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;

revoke execute on function curadoria.enforce_delivery_requires_emitted_report() from public;

drop trigger if exists enforce_delivery_requires_emitted_report_trigger
  on curadoria.curated_selections;
create trigger enforce_delivery_requires_emitted_report_trigger
  before update on curadoria.curated_selections
  for each row execute function curadoria.enforce_delivery_requires_emitted_report();

-- 2) A operação oficial da entrega.
create or replace function curadoria.deliver_curadoria(_curated_selection_id uuid)
returns curadoria.curated_selections
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _sel curadoria.curated_selections;
  _case curadoria.cases;
  _report curadoria.curadoria_reports;
  _opcoes integer;
  _pareceres integer;
  _now timestamptz := now();
begin
  if _actor is null then
    raise exception 'Entrega exige ator autenticado' using errcode = '42501';
  end if;

  select * into _sel
    from curadoria.curated_selections
   where id = _curated_selection_id
   for update;
  if not found then
    raise exception 'Seleção % não localizada para entrega', _curated_selection_id
      using errcode = 'P0002';
  end if;

  select * into _case from curadoria.cases where id = _sel.case_id for update;
  if not found then
    raise exception 'Case % não localizado', _sel.case_id using errcode = 'P0002';
  end if;

  -- Papel + relação com o objeto: quem entrega é o Curador designado do Case
  -- (ou um administrador). Nunca um papel qualquer com grant de UPDATE.
  if not (curadoria.has_role('administrador') or _case.assigned_curator_id = _actor) then
    raise exception 'Só o Curador responsável pelo Case (ou um administrador) entrega a Curadoria'
      using errcode = '42501';
  end if;

  select * into _report
    from curadoria.curadoria_reports
   where curated_selection_id = _sel.id
   for update;
  if not found then
    raise exception 'Entregar exige Relatório emitido — nenhum Relatório existe para esta seleção'
      using errcode = '23514';
  end if;

  -- Idempotência (ADR-048/050/064): repetir a entrega devolve o MESMO
  -- resultado e não regrava carimbo nenhum. O único caso em que algo é
  -- escrito é o reparo do estado parcial legado (seleção entregue com
  -- Relatório não entregue) — e mesmo aí `emitted_at` não é tocado.
  if _sel.status = 'DELIVERED' then
    if _report.delivered_at is null then
      if _report.emitted_at is null then
        raise exception
          'Estado inconsistente: seleção entregue com Relatório não emitido. Emita o Relatório para concluir o reparo.'
          using errcode = '23514';
      end if;
      update curadoria.curadoria_reports
         set delivered_at = coalesce(_sel.delivered_at, _now)
       where id = _report.id;
      insert into curadoria.case_events (case_id, event_type, actor_id, from_value, to_value, reason)
      values (_case.id, 'curadoria_delivered', _actor, 'PARCIAL', 'DELIVERED',
              'Reparo de entrega parcial legada: Relatório entregue junto da seleção já entregue.');
    end if;
    return _sel;
  end if;

  -- Estado compatível + completude, tudo dentro da MESMA transação.
  if _report.emitted_at is null then
    raise exception 'O Relatório precisa ser emitido antes da entrega' using errcode = '23514';
  end if;

  if coalesce(btrim(_sel.composition_rationale), '') = '' then
    raise exception 'A seleção não tem justificativa de composição' using errcode = '23514';
  end if;

  select count(*) into _opcoes
    from curadoria.curated_selection_options
   where curated_selection_id = _sel.id;
  if _opcoes <> 3 then
    raise exception 'A Curadoria apresenta sempre exatamente três opções (atual: %)', _opcoes
      using errcode = '23514';
  end if;

  -- Pareceres obrigatórios: as três opções do Relatório existem (justificativa,
  -- relação com prioridades e ponto de atenção não-vazios são garantidos pelas
  -- constraints da própria tabela).
  select count(*) into _pareceres
    from curadoria.curadoria_report_options
   where report_id = _report.id;
  if _pareceres <> 3 then
    raise exception 'O Relatório precisa dos três pareceres completos (atual: %)', _pareceres
      using errcode = '23514';
  end if;

  -- O ato: seleção e Relatório entregues com o MESMO carimbo, evento e
  -- auditoria na mesma transação. Falha em qualquer passo => nada persiste.
  update curadoria.curated_selections
     set status = 'DELIVERED', delivered_at = _now
   where id = _sel.id
   returning * into _sel;

  -- `emitted_at` NUNCA é tocado aqui: o carimbo de emissão pertence ao ato
  -- de emitir (fim da sobrescrita do markReportDelivered — IM-03).
  update curadoria.curadoria_reports
     set delivered_at = _now
   where id = _report.id;

  insert into curadoria.case_events (case_id, event_type, actor_id, from_value, to_value, reason)
  values (_case.id, 'curadoria_delivered', _actor, 'DRAFT', 'DELIVERED',
          'Curadoria entregue ao paciente');

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (_actor, 'curadoria_delivered', _case.patient_profile_id,
          jsonb_build_object(
            'case_id', _case.id,
            'curated_selection_id', _sel.id,
            'report_id', _report.id,
            'delivered_at', _now));

  return _sel;
end;
$function$;

comment on function curadoria.deliver_curadoria(uuid) is
  'Entrega transacional da Curadoria (ADR-048/Bloco B). Ator por auth.uid(); exige Curador designado do Case ou administrador; valida seleção com 3 opções, Relatório emitido com 3 pareceres; entrega seleção e Relatório com o mesmo carimbo, sem tocar emitted_at; grava case_event e audit_log no mesmo ato. Idempotente: repetição devolve o mesmo resultado sem regravar carimbos.';

revoke execute on function curadoria.deliver_curadoria(uuid) from public;
grant execute on function curadoria.deliver_curadoria(uuid) to authenticated;
