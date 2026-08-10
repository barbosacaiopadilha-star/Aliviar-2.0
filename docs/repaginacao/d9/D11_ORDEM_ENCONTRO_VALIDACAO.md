# D-11 · reclassificada — o bypass era do seed, não do produto

**Status:** **CORRIGIDO** em D-11A. A classificação original estava errada.

---

## O que a auditoria viu

Um Perfil `VALIDATED` sem encontro agendado, sem encontro realizado e sem
história reconhecida — num Case criado já sob D-9.

## A leitura fácil, e por que estava errada

> ~~"a paciente consegue validar o Perfil antes do Primeiro Encontro pela via
> oficial"~~

**Não é reproduzível.** A via oficial de reconhecimento é ato da PACIENTE
(ADR-042): `/paciente` → `ProfileCard` → `PerfilPanel` → `ReconhecerPerfil` →
`acknowledge_priority_profile`, com gate `is_patient_for_case` e auditoria com
`actor_role = paciente`. A antiga `validateProfileAction` do Curador foi
removida deliberadamente, e há guarda impedindo o retorno.

## O que de fato acontecia

`repository.ts::validatePriorityProfile` — um writer que morava no repositório
de **produção**, escrevia `status = VALIDATED` direto na tabela, e tinha
**zero chamadores de produção**. Quinze consumidores, todos em `tests/`.

Foi ele que o seed usou para montar o cenário. **O bypass era do seed.**

## A correção (D-11A)

O writer saiu do produto e virou `tests/apoio/fixture-perfil.ts ::
fixtureValidarPerfil` — nome que declara o que é. Quem monta cenário sintético
agora diz que está montando cenário.

Guardas: nenhum arquivo de `src/` declara ou chama o writer · nenhum grava
`status: "VALIDATED"` direto · nenhum importa a fixture · a RPC oficial segue
viva e chamada · o Curador não tem action equivalente · nenhuma superfície de
Curador ou Admin alcança a RPC. Todas leem o código **sem comentários**.

## O que permanece verdadeiro da regra operacional

O reconhecimento definitivo acontece **no contexto** do Primeiro Encontro. Isso
é orquestração e UX, **não autorização técnica**: `meeting_held_at` não vira
gate do ato dela, e `validated_at` pode cronologicamente preceder
`meeting_held_at` sem violação — é legítimo a paciente reconhecer durante a
conversa e o Curador registrar a realização depois.

**ADR-042 permanece íntegra. Nenhum gate novo foi criado.**

## GAP-A1 preservado

`meeting_scheduled_at` continua sem writer. Não resolvido aqui, e será
necessário para a UX do Primeiro Encontro.
