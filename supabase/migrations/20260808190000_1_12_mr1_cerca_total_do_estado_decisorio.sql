-- ============================================================================
-- ITEM 1.12-MR1 — CERCA TOTAL DO ESTADO DECISÓRIO E TERMINALIDADE SISTÊMICA
-- ============================================================================
--
-- ORIGEM: certificação do Agente 05, ressalva F-1.12-1.
--
-- O DEFEITO (reproduzido na base `cdf485d` antes desta correção, como owner):
--   a cerca original exigia o token do ato apenas na transição
--   `PROPOSTA → decisório` — o segundo IF condicionava `old.state = 'PROPOSTA'`.
--   Consequência, provada em transação revertida:
--     1. `SUPERADA → CONFIRMADA` passou, com ATOS = 0 — um estado decisório
--        nasceu sem ato humano;
--     2. `SUPERADA → PROPOSTA` passou — um terminal sistêmico reabriu.
--
-- A CORREÇÃO — a função revisada como MÁQUINA COMPLETA, não como remendo dos
-- dois exemplos:
--
--   REGRA 1 (preservada) · decidida é decidida: `CONFIRMADA`/`RECUSADA` não
--     transiciona para nada (ADR-066 §8).
--   REGRA 2 (nova — Regra B da certificação) · terminal sistêmico é terminal:
--     `SUPERADA`/`RETIRADA` não transiciona para NADA — nem de volta a
--     `PROPOSTA`, nem para decisório, nem entre si.
--   REGRA 3 (alargada — Regra A da certificação) · TODA entrada em
--     `CONFIRMADA`/`RECUSADA` exige o token transacional do ato,
--     INDEPENDENTEMENTE do estado de origem. Com as regras 1 e 2 na frente,
--     hoje ela só é alcançável de `PROPOSTA` — e permanece geral de propósito:
--     se um sexto estado nascer um dia, a entrada decisória continua exigindo
--     o ato, sem depender de alguém lembrar desta borda.
--
-- O que SEGUE LIVRE (preservações): `PROPOSTA → SUPERADA` e
-- `PROPOSTA → RETIRADA` — transições sistêmicas (S1/S2/S5, ADR-066 §9), que
-- não são atos deste contrato. E o no-op (state = state) não é transição.
--
-- MODELO DE AMEAÇA: trigger, não policy — vale para TODO papel, inclusive o
-- dono do banco. Foi exatamente no nível do owner que a certificação detectou
-- o defeito, e é nesse nível que os testes o provam fechado.
--
-- ROLLBACK (executável; volta byte a byte ao comportamento de `cdf485d`):
--   recolar o corpo original da função, que vive na migration
--   20260808150000_mecanismo_de_discordancia.sql (bloco
--   `create or replace function curadoria.protege_estado_decisorio()`).
--   Nenhuma tabela, dado ou trigger é tocado — a MR é só o corpo da função.
-- ============================================================================

create or replace function curadoria.protege_estado_decisorio()
returns trigger language plpgsql as $$
begin
  -- REGRA 1 — decidida é decidida (ADR-066 §8): nenhum estado sai de
  -- CONFIRMADA/RECUSADA.
  if old.state in ('CONFIRMADA', 'RECUSADA') and new.state is distinct from old.state then
    raise exception
      'Proposta decidida nao muda de estado (CONTRATO_1_12 §11): % -> % recusado. A proposta decidida permanece para sempre (ADR-066 §8).',
      old.state, new.state
      using errcode = 'restrict_violation';
  end if;

  -- REGRA 2 — terminal sistêmico é terminal (F-1.12-1, Regra B): SUPERADA e
  -- RETIRADA não reabrem e não viram decisão. O mundo mudou (S1/S2/S5) e a
  -- proposta ficou como registro — reabri-la seria reescrever o que o mundo
  -- já desfez.
  if old.state in ('SUPERADA', 'RETIRADA') and new.state is distinct from old.state then
    raise exception
      'Estado sistemico e terminal (CONTRATO_1_12 §11, F-1.12-1): % -> % recusado. SUPERADA e RETIRADA nao reabrem nem viram decisao.',
      old.state, new.state
      using errcode = 'restrict_violation';
  end if;

  -- REGRA 3 — TODA entrada em estado decisório exige o token do ato
  -- (F-1.12-1, Regra A): sem `old.state = 'PROPOSTA'` na condição. Nenhum
  -- estado decisório nasce com ATOS = 0, venha de onde vier.
  if new.state in ('CONFIRMADA', 'RECUSADA') and new.state is distinct from old.state then
    if coalesce(current_setting('curadoria.projecao_do_ato', true), '') <> new.id::text then
      raise exception
        'Estado decisorio so nasce do ato (CONTRATO_1_12 §10): a projecao e disparada pelo INSERT em derivation_proposal_acts, nunca por UPDATE direto.'
        using errcode = 'restrict_violation';
    end if;
  end if;

  return new;
end;
$$;

comment on function curadoria.protege_estado_decisorio() is
  'CONTRATO_1_12 §10/§11 + MR1 (F-1.12-1) — a cerca COMPLETA do state: (1) CONFIRMADA/RECUSADA nao transiciona para nada; (2) SUPERADA/RETIRADA sao terminais — nao reabrem nem viram decisao; (3) TODA entrada em estado decisorio exige o token transacional do ato, independentemente da origem. PROPOSTA -> SUPERADA/RETIRADA segue livre (transicoes sistemicas S1/S2/S5). Trigger, nao policy: vale para todo papel, inclusive o dono.';
