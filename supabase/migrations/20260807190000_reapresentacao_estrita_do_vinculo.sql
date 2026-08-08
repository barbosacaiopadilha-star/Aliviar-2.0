-- ============================================================================
-- ITEM 1.8-R1-MR1 — REAPRESENTAÇÃO ESTRITA DO VÍNCULO
--
-- Contrato lavrado: docs/curadoria/CONTRATO_1_8_R1.md §22.4/§22.5 (D4/D5).
-- Base: 41d228f sobre 041b423. A migration 20260807120000 é IMUTÁVEL — esta
-- evolui a função por CREATE OR REPLACE, sem tocar coluna, FK ou triggers.
--
-- A LACUNA QUE ISTO FECHA
--   O trigger do R1 recusava manter o vínculo antigo implicitamente numa
--   mudança de status — mas deixava passar `evidence_id = NULL` no mesmo ato,
--   porque NULL "é distinto" do vínculo antigo. Só que o Mapa é UPSERT: não há
--   histórico da confirmação anterior. Zerar o vínculo na mesma gravação que
--   muda o status APAGARIA PARA SEMPRE a sustentação explícita do estado (D5).
--
--   legado sem vínculo  ≠  ato novo removendo vínculo
--
--   O legado é herança de antes do regime; o ato novo acontece sob o regime.
--
-- A MATRIZ COMPLETA (D4), sobre linha JÁ VINCULADA (`OLD.evidence_id IS NOT NULL`):
--   status muda + vínculo antigo mantido implicitamente ... RECUSA (já era)
--   status muda + evidence_id = NULL ...................... RECUSA (o MR1)
--   status muda + NOVO evidence_id válido ................. ACEITA
--                 (a validade é da FK composta e do trigger de conceito —
--                  nada disso é reduplicado aqui)
--   status não muda + revinculação para outro válido ...... PERMITIDO
--   linha legada (OLD.evidence_id IS NULL) ................ intocada (§7.2)
--
-- ROLLBACK — restaurar o corpo do R1 (20260807120000), que difere APENAS por
-- aceitar o NULL nesta borda; nada mais deste pacote é tocado:
--   create or replace function curadoria.exige_vinculo_ao_mudar_status() ...
--     if new.status is distinct from old.status
--        and old.evidence_id is not null
--        and new.evidence_id is not distinct from old.evidence_id then
--       raise exception 'Mudanca de status (% -> %) sem reapresentar a
--         evidencia: o vinculo % sustentava o estado anterior (1.8-R1 §7.2).',
--         old.status, new.status, old.evidence_id
--         using errcode = 'restrict_violation';
--     end if;
--     return new;
--   (coluna, FK, unique habilitador, trigger de conceito, capability, cadeia e
--    Ficha permanecem exatamente como estão.)
-- ============================================================================

create or replace function curadoria.exige_vinculo_ao_mudar_status()
returns trigger
language plpgsql
security invoker
set search_path = curadoria, public
as $$
begin
  if new.status is distinct from old.status and old.evidence_id is not null then
    -- D5: apagar o vínculo no mesmo ato que muda o estado é proibido. O Mapa é
    -- UPSERT — não existe de onde recuperar a sustentação apagada.
    if new.evidence_id is null then
      raise exception
        'Mudanca de status (% -> %) apagando o vinculo de evidencia: a sustentacao explicita do estado nao pode ser removida no mesmo ato (1.8-R1-MR1 §22.5). Legado sem vinculo e heranca; ato novo acontece sob o regime.',
        old.status, new.status
        using errcode = 'restrict_violation';
    end if;

    if new.evidence_id is not distinct from old.evidence_id then
      raise exception
        'Mudanca de status (% -> %) sem reapresentar a evidencia: o vinculo % sustentava o estado anterior (1.8-R1 §7.2).',
        old.status, new.status, old.evidence_id
        using errcode = 'restrict_violation';
    end if;
    -- Novo vínculo, não nulo e diferente: a FK composta arbitra o profissional
    -- e o trigger de conceito arbitra o conceito. Aqui só a reapresentação.
  end if;

  return new;
end;
$$;

comment on function curadoria.exige_vinculo_ao_mudar_status() is
  'ADR-066 / 1.8-R1 §7.2 + 1.8-R1-MR1 §22.4 — mudanca de status numa linha VINCULADA exige NOVO vinculo explicito: manter o antigo implicitamente e RECUSADO, e zerar (NULL) tambem — o Mapa e UPSERT e a sustentacao apagada nao teria de onde voltar (§22.5). Linha legada sem vinculo continua mudando de status (heranca de antes do regime) e permanece nao exibivel. Revincular sem mudar status permanece permitido.';
