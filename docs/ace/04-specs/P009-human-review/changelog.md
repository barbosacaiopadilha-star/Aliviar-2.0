# Changelog — P009 (Human Review)

## v0.1 — 2026-07-12 (Sprint 10)

- Primeira versão do protocolo, especificada e implementada após a correção do P008 (ordenação por `providerId` deixa de decidir a composição). Primeiro protocolo do ACE com autoridade decisória humana real.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Arquitetura de autoridade decisória: novo contrato base `HumanDecisionArtifact` (`src/modules/ace/core/artifact-contract.ts`), distinto de `AnalysisArtifact` — `decisional: true` estrutural, com `reviewerId`/`reviewedAt` modelados na própria base, para que nenhum artefato decisório do ACE possa existir sem registrar quem decidiu e quando. `HumanReviewResult` estende esse contrato, acrescentando `reviewAction`/`reviewStatus`/`evidenceReferences`/`changes`.
- Implementação em código:
  - `src/modules/ace/artifacts/human-review-result.ts` — artefato `HumanReviewResult`, com validação de consistência entre `reviewAction`/`reviewStatus`, invariantes por ação (APPROVE sem changes; ADJUST com ao menos uma change, cada uma com rationale+evidência; REJECT/REQUEST_MORE_INFORMATION sem approvedProviderIds), `returnToProtocol` só permitido quando não `VALIDATED`. Ainda passa por `assertFieldPolicy` (as proibições permanentes do Kernel são absolutas, independentemente do artefato ser decisório).
  - `src/modules/ace/protocols/p009-human-review.ts` — valida que a CompatibilityMatrix fornecida corresponde à Shortlist fornecida; para `ADJUST`, valida cada alteração contra a CompatibilityMatrix (provider existe e está qualificado) e garante exatamente três `approvedProviderIds` no resultado. A decisão em si (`reviewAction`) é sempre recebida como entrada, nunca inferida.
  - `src/modules/ace/artifacts/compatibility-matrix.ts` — extraído `isEssentiallyQualified`/`ESSENTIAL_DIMENSIONS` (antes duplicado dentro do P008) para uso compartilhado entre P008 e P009, evitando que os dois protocolos divirjam silenciosamente sobre o que é um provider "suficientemente fundamentado".
  - `src/modules/ace/core/protocol-id.ts` (+P009), `src/modules/ace/core/field-policy.ts` (+7 campos reservados a partir do P009: `reviewStatus`, `reviewAction`, `approvedProviderIds`, `reviewRationale`, `originalShortlistReference`, `compatibilityMatrixReference`, `returnToProtocol`).
- Documentos atualizados: `docs/ace/03-kernel/kernel.md` (seção 6, mecanismo concreto do `HumanDecisionArtifact`), Framework (linha P009), Ontologia (HumanReviewResult e conceitos relacionados).
- Nenhum conceito de P010 (Curadoria Final) foi antecipado.
