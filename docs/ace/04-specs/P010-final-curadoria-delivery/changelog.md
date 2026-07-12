# Changelog — P010 (Final Curadoria Delivery)

## v0.1 — 2026-07-12 (Sprint 11)

- Primeira versão do protocolo, especificada e implementada como último protocolo do pipeline do ACE (P001-P010).
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Arquitetura de entrega (ADR-016): novo contrato base `DeliveryArtifact` (`src/modules/ace/core/artifact-contract.ts`), distinto de `HumanDecisionArtifact` — `decisional: false`, mas preservando na base a proveniência da decisão humana (`validatedBy`, `validatedAt`, `humanReviewReference`, `methodVersion`). O P010 comunica; nunca decide.
- Implementação em código:
  - `src/modules/ace/artifacts/final-curadoria.ts` — artefato `FinalCuradoria`, com verificação mecânica de ausência de vocabulário de ranking/vencedor (`assertNoForbiddenLanguage`) em todo texto livre — deliberadamente sem banir termos clínicos ("diagnóstico", "tratamento"), já que o disclaimer obrigatório precisa mencioná-los para dizer que a curadoria não os substitui.
  - `src/modules/ace/protocols/p010-final-curadoria-delivery.ts` — valida elegibilidade do HumanReviewResult (`VALIDATED`, `APPROVE`/`ADJUST`, exatamente três providers), a cadeia completa de rastreabilidade (CompatibilityMatrix ↔ HumanReviewResult ↔ DecisionContext ↔ DecisionCase), busca dados de apresentação (nunca inventa quando ausentes), e monta a entrega.
  - `src/modules/ace/ports/provider-presentation-repository.ts` (+ implementação em memória) — porta nova, deliberadamente separada de `ProviderProfileRepository` (P007), para preservar a separação entre dado de análise e dado de apresentação.
  - `src/modules/ace/core/protocol-id.ts` (+P010), `src/modules/ace/core/field-policy.ts` (+7 campos reservados a partir do P010).
- Documentos atualizados: `docs/DECISIONS.md` (ADR-016), Kernel (seção 6), Framework (linha P010, histórico), Ontologia (FinalCuradoria e conceitos relacionados).
- **Confirmação**: o pipeline do ACE (P001-P010) está estruturalmente completo. Nenhum P011 foi criado; nenhum conceito além do P010 foi antecipado.
