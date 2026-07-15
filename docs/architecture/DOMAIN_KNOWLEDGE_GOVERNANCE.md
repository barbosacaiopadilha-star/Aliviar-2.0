# Domínio: Governança do Conhecimento

**Estado**: Conceitual (desenhado na Fase 5 do Compatibility Intelligence). Nenhum código, schema ou processo formal existe ainda.

## Missão

Ser o único ponto em toda a arquitetura onde uma hipótese de compatibilidade humana vira conhecimento aprovado e utilizável — garantindo que essa decisão seja sempre coletiva, clínica, e nunca automática ou unilateral.

## Responsabilidade

- Receber propostas de padrões de compatibilidade exclusivamente de Compatibility Intelligence.
- Fazer a Equipe Clínica aprovar, rejeitar ou retirar um padrão — sempre coletivamente, nunca uma única pessoa sozinha.
- Permitir que a Equipe Técnica vete uma proposta apenas por violação de invariante (nunca por mérito clínico).
- Versionar conhecimento aprovado seguindo o mesmo padrão de proveniência já usado pelo ACE (`methodVersion`/`DeliveryArtifact`).
- Tornar retirada de um padrão imediatamente efetiva operacionalmente, preservando histórico apenas para auditoria.

## Fronteiras

**Pertence a este domínio**: aprovação, rejeição, retirada e versionamento de padrões de compatibilidade humana.
**Não pertence**: gerar a hipótese (Compatibility Intelligence, exclusivo), observar atrito operacional (Observatório da Experiência), qualquer decisão técnica de elegibilidade (ACE).

## Entradas

- Hipóteses de compatibilidade propostas por Compatibility Intelligence.
- Julgamento coletivo da Equipe Clínica.
- Veto técnico da Equipe Técnica (apenas por violação de invariante).

## Saídas

- Conhecimento aprovado, versionado — o único tipo de saída que pode retroalimentar o CI para futuras Curadorias.
- Registro de retirada de padrão (imediatamente efetivo, preservado para auditoria).

## Dependências

- Depende exclusivamente de Compatibility Intelligence como origem de propostas — não aceita propostas de nenhum outro domínio.
- Nenhum outro domínio depende da Governança para operar hoje (ela só existiria uma vez que o CI fosse implementado).

## Fonte oficial da verdade

- **Padrão de compatibilidade aprovado e utilizável**: exclusivamente a Governança do Conhecimento — nem mesmo o CI, que o originou, pode declará-lo aprovado sozinho.

## Invariantes

- Aprovação, rejeição e retirada são sempre coletivas (Equipe Clínica) — nunca decisão de uma única pessoa.
- Veto técnico só pode ocorrer por violação de invariante, nunca por mérito clínico.
- Retirada de um padrão é imediatamente efetiva na operação, independentemente de quando o histórico for auditado.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá aprovar conhecimento por decisão técnica ou automática — sempre clínica e coletiva.
- Nunca poderá aceitar uma proposta de compatibilidade que não venha de Compatibility Intelligence.
- Nunca poderá aprovar um padrão que dependa de um campo permanentemente banido (mesma lista da ADR-014) — isso é motivo automático de veto técnico.

## Documentos relacionados

- `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — única origem de propostas.
- `docs/DECISIONS.md` — ADR-014 (campos banidos, motivo de veto técnico).

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `OBSERVATÓRIO ──▶ GOVERNANÇA DO CONHECIMENTO ──▶ (conhecimento aprovado, versionado) ──▶ volta ao CI`.
