# Changelog — P006 (Eligible Provider Set Builder)

## v0.1 — 2026-07-12

- Primeira versão do protocolo, especificada com a terminologia Care Provider (ADR-013, `docs/DECISIONS.md`) — o Método permanece desacoplado da estrutura atual da Rede.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código:
  - `src/modules/ace/ports/provider-repository.ts` — porta `ProviderRepository` + `CareProviderCandidate` (dados mínimos: providerId, providerType, status, competencyAreas, experienceLevel, metadata de versionamento/rastreabilidade do registro externo). Vive em `ports/`, não em `core/`, porque é infraestrutura, não contrato universal do Método.
  - `src/modules/ace/ports/in-memory-provider-repository.ts` — implementação apenas para testes; nenhuma persistência real.
  - `src/modules/ace/artifacts/eligible-provider-set.ts` — artefato `EligibleProviderSet` (Artefato de Análise), com validação de consistência entre `eligibleProviderIds` e `evaluatedCandidates`, e validação de ordem estável (nunca ranking).
  - `src/modules/ace/protocols/p006-eligible-provider-set-builder.ts` — o segundo protocolo do pipeline inteiramente determinístico (depois do P005): a regra de elegibilidade é comparação estrutural, não julgamento semântico.
- `ProtocolId` (`core/protocol-id.ts`) estendido para incluir `"P006"`.
- **Risco registrado para o Ciclo 7 (P007)**: a lista compartilhada de campos proibidos (`core/forbidden-fields.ts`) inclui `"compatibility"`/`"compatibilityMatrix"` — campos que o próprio P007 (CompatibilityMatrix) precisará usar legitimamente. A função `assertNoForbiddenFields` compartilhada não poderá ser reaproveitada sem ajuste para o artefato do P007; isso precisará ser resolvido explicitamente antes de implementá-lo, não presumido.
