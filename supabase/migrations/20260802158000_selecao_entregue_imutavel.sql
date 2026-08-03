-- ============================================================================
-- BLOCO C / ETAPA 5 — SELEÇÃO ENTREGUE É FATO IMUTÁVEL (gates C4 e C7)
-- ============================================================================
--
-- FINALIDADE
--   A entrega da Curadoria é o fato que a paciente viu: três opções, com
--   justificativa, num instante nomeado. Hoje esse fato era apagável — o
--   Curador com sessão real "desentregava" (DELIVERED -> DRAFT +
--   delivered_at nulo, a CHECK de coerência aceita o par), trocava opção e
--   parecer depois da entrega, e uma seleção podia NASCER 'DELIVERED' com
--   zero opções (o INSERT nunca passou pelas barreiras, que são todas de
--   UPDATE).
--
--   Três fechos, todos de transição:
--
--   1. INSERT: seleção NÃO nasce entregue. A entrega é uma transição
--      (DRAFT -> DELIVERED) do ato oficial `deliver_curadoria` (M150) — que
--      entrega por UPDATE dentro da própria transação e portanto NUNCA passa
--      por aqui. Fecha o gate C7 na raiz: sem nascimento em DELIVERED não
--      existe nascimento em DELIVERED com 0 opções. Sem exceção de bastidor,
--      de propósito: as fixtures da casa que nasciam entregues foram
--      ajustadas para percorrer o caminho real (ver PROVA).
--
--   2. UPDATE: DELIVERED é terminal e congelado — status não regride,
--      delivered_at não muda (nem para nulo, nem para outro instante),
--      conteúdo (composition_rationale, vínculos, autoria, created_at) não
--      muda. A transição DRAFT -> DELIVERED continua passando: é ela que a
--      RPC oficial executa (as barreiras de completude — Relatório emitido,
--      três opções — seguem com os triggers B12/`enforce_selection_has_three`).
--
--   3. OPTIONS: as três opções congelam junto com a entrega (INSERT/UPDATE/
--      DELETE recusados com a seleção DELIVERED) — mesmo gabarito de
--      `assert_report_options_frozen` (20260727110000), inclusive na
--      semântica de cascata: quando a seleção some (descarte do Case), a
--      consulta não encontra o pai e as opções caem junto.
--
--   DELETE da própria seleção entregue: recusado para sessões de usuário
--   com o Case vivo; passa no bastidor (auth.uid() nulo — limpeza por
--   inventário) e na cascata do descarte administrativo (Case já removido),
--   mesmas duas passagens documentadas em 20260802157000.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.curated_selections` + `curated_selection_options` (stage 7)
--     com CHECK `selection_delivery_coherent` ((status='DELIVERED') =
--     (delivered_at is not null)) — é ela que impede o INSERT de driblar o
--     fecho 1 com status DRAFT + delivered_at preenchido.
--   - Triggers vigentes preservados: `enforce_selection_has_three` (três
--     opções na entrega), `enforce_delivery_requires_emitted_report` (M150),
--     `enforce_report_delivery_requires_delivered_selection` (M154).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada ou reavaliada.
--   - A seleção DELIVERED local (1) e as DRAFT (3, duas com Relatório emitido
--     — resíduo E2E conhecido) ficam como estão: linhas paradas nunca são
--     examinadas. Verificado (2026-08-02): não existe par entregue-torto
--     local (toda seleção DELIVERED tem Relatório entregue e 3 opções) —
--     nada a consolidar, nada a abortar.
--
-- PROVA DE FECHAMENTO
--   - Gate C4: "desentregar" com sessão real de Curador é recusado; status e
--     carimbo sobrevivem. Gate C7: INSERT já-DELIVERED com 0 opções é
--     recusado.
--   - Gates B11/B12/B17 continuam verdes: a RPC oficial entrega por UPDATE
--     (fecho 2 permite a transição) e o ramo idempotente/reparo de M150 não
--     toca a seleção entregue.
--   - Fixtures ajustadas para o caminho real (DRAFT + opções + Relatório
--     emitido + transição), sem afrouxar produção:
--     tests/remediacao/apoio.ts (selecaoComOpcoes/relatorioDaSelecao),
--     tests/integration/approach-attempts.integration.test.ts,
--     tests/integration/connection-contact-mode.integration.test.ts.
--
-- ROLLBACK
--   drop trigger if exists assert_delivered_selection_immutable_trigger
--     on curadoria.curated_selections;
--   drop function if exists curadoria.assert_delivered_selection_immutable();
--   drop trigger if exists assert_selection_options_frozen
--     on curadoria.curated_selection_options;
--   drop function if exists curadoria.assert_selection_options_frozen();
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 + 2. A linha da seleção: não nasce entregue; entregue, congela
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_delivered_selection_immutable()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if tg_op = 'INSERT' then
    if new.status = 'DELIVERED' then
      raise exception
        'Seleção não nasce entregue: a entrega é o ato oficial da Curadoria (deliver_curadoria), sobre uma seleção completa.'
        using errcode = '23514';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'DELIVERED'
       and auth.uid() is not null
       and exists (select 1 from curadoria.cases c where c.id = old.case_id) then
      raise exception
        'Curadoria entregue é fato: a linha da entrega não é apagável.'
        using errcode = '23514';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.status = 'DELIVERED' then
    if new.status is distinct from old.status
       or new.delivered_at is distinct from old.delivered_at then
      raise exception
        'Entrega é fato: a seleção entregue não regride nem perde o carimbo de entrega.'
        using errcode = '23514';
    end if;
    if new.composition_rationale is distinct from old.composition_rationale
       or new.case_id is distinct from old.case_id
       or new.priority_profile_id is distinct from old.priority_profile_id
       or new.selected_by is distinct from old.selected_by
       or new.created_at is distinct from old.created_at then
      raise exception
        'Curadoria entregue é um documento congelado — o que a paciente viu não muda depois.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

comment on function curadoria.assert_delivered_selection_immutable() is
  'Bloco C/C4+C7 (ADR-048): seleção não nasce DELIVERED (a entrega é transição do ato oficial deliver_curadoria); entregue, é terminal e congelada (status, delivered_at e conteúdo imutáveis); a linha entregue não é apagável por sessão de usuário com o Case vivo. A transição DRAFT->DELIVERED continua passando — é o que a RPC oficial executa.';

revoke execute on function curadoria.assert_delivered_selection_immutable() from public;

drop trigger if exists assert_delivered_selection_immutable_trigger
  on curadoria.curated_selections;
create trigger assert_delivered_selection_immutable_trigger
  before insert or update or delete on curadoria.curated_selections
  for each row execute function curadoria.assert_delivered_selection_immutable();

-- ---------------------------------------------------------------------------
-- 3. As opções congelam junto com a entrega
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_selection_options_frozen()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _status text;
begin
  select s.status into _status
    from curadoria.curated_selections s
   where s.id = coalesce(new.curated_selection_id, old.curated_selection_id);

  if _status = 'DELIVERED' then
    raise exception
      'Curadoria entregue é um documento congelado — as três opções apresentadas não mudam mais.'
      using errcode = '23514';
  end if;

  return coalesce(new, old);
end;
$function$;

comment on function curadoria.assert_selection_options_frozen() is
  'Bloco C/C4 (ADR-048): com a seleção DELIVERED, as opções congelam (INSERT/UPDATE/DELETE recusados). Mesmo gabarito de assert_report_options_frozen: quando a seleção já saiu (cascata do descarte), a consulta não encontra o pai e as opções caem junto.';

revoke execute on function curadoria.assert_selection_options_frozen() from public;

drop trigger if exists assert_selection_options_frozen
  on curadoria.curated_selection_options;
create trigger assert_selection_options_frozen
  before insert or update or delete on curadoria.curated_selection_options
  for each row execute function curadoria.assert_selection_options_frozen();
