-- ============================================================================
-- BLOCO C / ETAPA 6 — OS CARIMBOS DO RELATÓRIO SÃO DEFINITIVOS (gates C5 e C6)
-- ============================================================================
--
-- FINALIDADE
--   O Relatório é o documento que a paciente relê sozinha. O trigger
--   `assert_report_lifecycle` (20260727110000) já congelava PARTE do conteúdo
--   após a emissão (composition_rationale, aprovação, origem assistida,
--   draft_version) — mas deixava soltos exatamente os dois FATOS do
--   documento: `emitted_at` e `delivered_at` eram sobrescrevíveis por
--   qualquer UPDATE com sessão real (gate C5: reescrever a hora da emissão;
--   gate C6: "reentregar" com outro carimbo). E a lista congelada era
--   parcial: reviewed_at/reviewed_by, generator_version, os vínculos
--   (case_id, curated_selection_id) e created_at seguiam editáveis num
--   documento já emitido.
--
--   Esta migration ESTENDE o gabarito no mesmo trigger (create or replace,
--   mesmo nome, mesma voz):
--
--   1. `emitted_at` é monotônico e imutável: transiciona null -> valor UMA
--      vez (a emissão, que continua exigindo aprovação prévia); qualquer
--      sobrescrita — outro instante ou null — é recusada.
--   2. `delivered_at` idem: null -> valor é a entrega (a legitimidade da
--      transição continua com o par B17/M154 — seleção DELIVERED — e com a
--      RPC oficial `deliver_curadoria`/M150); gravado, não muda nem some.
--   3. A lista congelada pós-emissão fica COMPLETA: composition_rationale,
--      approved_at/by, assisted_generated_at, draft_version (já congelados)
--      + reviewed_at/reviewed_by, generator_version, case_id,
--      curated_selection_id e created_at. Um Relatório ENTREGUE está, por
--      construção, coberto: a CHECK `report_delivery_requires_emission`
--      garante que todo entregue foi emitido — o congelamento da emissão o
--      alcança inteiro. Só `updated_at` (carimbo técnico do
--      set_updated_at) e a própria transição de entrega ficam de fora.
--
--   OS DOIS CAMINHOS DE M150 CONTINUAM PASSANDO, por desenho:
--   - entrega normal: UPDATE de delivered_at null -> valor (transição
--     legítima, regra 2 não dispara);
--   - ramo de reparo (seleção DELIVERED com Relatório não entregue): também
--     é null -> valor, com `emitted_at` intocado. Nenhum ramo de M150
--     sobrescreve carimbo já gravado — era exatamente esse o contrato.
--
--   A EMISSÃO GANHA TRILHA (Etapa 10): `report_emitted` em audit_logs, por
--   trigger AFTER UPDATE na própria transição null -> valor — infalsificável
--   e válido para qualquer via (action, PostgREST, fixture). Metadata só com
--   identificadores e carimbos, nunca o texto do documento.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.curadoria_reports` (stage 8 + 20260727110000) com o trigger
--     `assert_report_lifecycle` vigente (substituído aqui por versão
--     estendida, mesmo nome — nenhum trigger novo de UPDATE).
--   - Triggers vigentes preservados: `enforce_report_has_three` (emissão com
--     3 pareceres), `enforce_report_delivery_requires_delivered_selection`
--     (M154/B17), `set_curadoria_reports_updated_at`.
--   - `curadoria.audit_logs` + enum `curadoria.audit_action` (stage 1).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada ou reavaliada.
--   - Estado local verificado (2026-08-02): 4 Relatórios (3 emitidos, 1
--     entregue — o resíduo E2E conhecido). Linhas paradas nunca são
--     examinadas: a proteção é de transição futura. Nenhum par torto novo
--     nasce daqui; nenhuma consolidação necessária.
--
-- PROVA DE FECHAMENTO
--   - Gate C5 (tests/remediacao/imutabilidade.integration.test.ts):
--     sobrescrever emitted_at de Relatório emitido, com sessão real de
--     Curador, é recusado e o carimbo original sobrevive.
--   - Gate C6: reescrever delivered_at de Relatório e seleção já entregues
--     não muda carimbo nenhum.
--   - Gates B11/B12/B17 continuam verdes (deliver_curadoria inteira, as duas
--     direções do par, ramo de reparo).
--   - Fixture `relatorioDaSelecao` (tests/remediacao/apoio.ts) continua
--     passando: ela só aplica carimbos FALTANTES (transições null -> valor).
--   - Ajuste justificado de teste (mesmo padrão da Frente 1):
--     tests/integration/connection-canonica.integration.test.ts revertia
--     `delivered_at -> null` via service para simular "emitido, não
--     entregue" — fato de entrega apagado, exatamente o que este trigger
--     proíbe. O cenário passa a ser CONSTRUÍDO honestamente (cadeia parada
--     antes da entrega), sem afrouxar produção.
--
-- ROLLBACK
--   drop trigger if exists log_report_emitted_trigger
--     on curadoria.curadoria_reports;
--   drop function if exists curadoria.log_report_emitted();
--   create or replace function curadoria.assert_report_lifecycle()
--   returns trigger language plpgsql security definer
--   set search_path = curadoria, pg_catalog as $rollback$
--   begin
--     if new.emitted_at is not null and old.emitted_at is null then
--       if new.approved_at is null or new.approved_by is null then
--         raise exception
--           'Emitir exige aprovacao previa do Curador — um rascunho nao vira documento sem autoria humana.'
--           using errcode = 'check_violation';
--       end if;
--     end if;
--     if old.emitted_at is not null then
--       if new.composition_rationale is distinct from old.composition_rationale
--          or new.approved_at is distinct from old.approved_at
--          or new.approved_by is distinct from old.approved_by
--          or new.assisted_generated_at is distinct from old.assisted_generated_at
--          or new.draft_version is distinct from old.draft_version then
--         raise exception
--           'Relatorio emitido e um documento congelado. Alteracao posterior exige novo documento.'
--           using errcode = 'check_violation';
--       end if;
--     end if;
--     return new;
--   end;
--   $rollback$;
--   -- O valor 'report_emitted' em curadoria.audit_action não é removível sem
--   -- recriar o tipo; inofensivo sem uso (mesmo resíduo aceito de M150).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'report_emitted';

-- ---------------------------------------------------------------------------
-- 1. O lifecycle estendido — carimbos definitivos, conteúdo congelado inteiro
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_report_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
begin
  -- Emitir exige aprovação prévia, com autor (regra original de 20260727110000).
  if new.emitted_at is not null and old.emitted_at is null then
    if new.approved_at is null or new.approved_by is null then
      raise exception
        'Emitir exige aprovacao previa do Curador — um rascunho nao vira documento sem autoria humana.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Carimbo de emissão é fato: null -> valor uma vez; depois, definitivo.
  if old.emitted_at is not null and new.emitted_at is distinct from old.emitted_at then
    raise exception
      'O carimbo de emissao do Relatorio e definitivo: ele registra quando o documento passou a existir e nao se reescreve.'
      using errcode = 'check_violation';
  end if;

  -- Carimbo de entrega idem: a transição null -> valor é a entrega (par
  -- B17/M154 + deliver_curadoria); gravado, não muda nem volta a null.
  if old.delivered_at is not null and new.delivered_at is distinct from old.delivered_at then
    raise exception
      'O carimbo de entrega do Relatorio e definitivo: reentregar nunca reescreve o instante em que a paciente recebeu.'
      using errcode = 'check_violation';
  end if;

  -- Depois de emitido, o conteúdo congela INTEIRO — texto, autoria, origem,
  -- revisão, versão do gerador, vínculos e nascimento. Só a transição de
  -- entrega (acima) e o carimbo técnico updated_at ficam de fora. O Relatório
  -- entregue está coberto por construção (entregue => emitido, CHECK
  -- report_delivery_requires_emission).
  if old.emitted_at is not null then
    if new.composition_rationale is distinct from old.composition_rationale
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
       or new.assisted_generated_at is distinct from old.assisted_generated_at
       or new.draft_version is distinct from old.draft_version
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.generator_version is distinct from old.generator_version
       or new.case_id is distinct from old.case_id
       or new.curated_selection_id is distinct from old.curated_selection_id
       or new.created_at is distinct from old.created_at then
      raise exception
        'Relatorio emitido e um documento congelado. Alteracao posterior exige novo documento (errata — create_report_errata).'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

comment on function curadoria.assert_report_lifecycle() is
  'Bloco C/C5+C6 (ADR-048/050), estendendo 20260727110000: emitir exige aprovacao; emitted_at e delivered_at sao monotonicos e imutaveis (null -> valor uma vez, sobrescrita recusada); apos a emissao o conteudo congela inteiro (texto, autoria, origem, revisao, gerador, vinculos, created_at) — so a transicao de entrega e updated_at seguem gravaveis. Correcao pos-entrega = errata (create_report_errata).';

revoke execute on function curadoria.assert_report_lifecycle() from public;

-- ---------------------------------------------------------------------------
-- 2. A emissão deixa rastro (Etapa 10) — na própria transição, qualquer via
-- ---------------------------------------------------------------------------

create or replace function curadoria.log_report_emitted()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _patient uuid;
begin
  if new.emitted_at is not null and old.emitted_at is null then
    select c.patient_profile_id into _patient
      from curadoria.cases c
     where c.id = new.case_id;

    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (auth.uid(), 'report_emitted', _patient,
            jsonb_build_object(
              'report_id', new.id,
              'case_id', new.case_id,
              'curated_selection_id', new.curated_selection_id,
              'emitted_at', new.emitted_at,
              'approved_by', new.approved_by));
  end if;
  return new;
end;
$function$;

comment on function curadoria.log_report_emitted() is
  'Bloco C/Etapa 10 (ADR-055): a emissao do Relatorio (emitted_at null -> valor) grava report_emitted em audit_logs na propria transicao — vale para action, PostgREST direto e fixture. Metadata so com identificadores e carimbos, nunca o texto do documento.';

revoke execute on function curadoria.log_report_emitted() from public;

drop trigger if exists log_report_emitted_trigger
  on curadoria.curadoria_reports;
create trigger log_report_emitted_trigger
  after update on curadoria.curadoria_reports
  for each row execute function curadoria.log_report_emitted();
