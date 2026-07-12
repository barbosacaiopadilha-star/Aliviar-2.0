# Changelog — P005 (Competency Profile Builder)

## v0.1 — 2026-07-12

- Primeira versão do protocolo, especificada após análise arquitetural (Ciclo 4): identifiquei uma tensão entre continuar o pipeline original (CompetencyProfile → EligibleSpecialists → CompatibilityMatrix → Shortlist) e a restrição constitucional de nunca inferir especialidade/recomendar especialista. O arquiteto do projeto resolveu a tensão introduzindo o Princípio 9 ("nenhum artefato intermediário possui valor decisório") em vez de simplificar o pipeline — mantendo os quatro estágios, agora formalmente como Artefatos de Análise.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código: artefato `CompetencyProfile` (Artefato de Análise, imutável, versionado, sem campos proibidos), e o protocolo P005 — o primeiro do pipeline inteiramente determinístico, sem necessidade de classificação semântica pré-computada.
- Retrofit de governança: `Narrative`, `DecisionCase`, `CaseAudit` e `DecisionContext` (P001-P004) passaram a estender `AnalysisArtifact`, com `decisional: false` estrutural — aplicando o Princípio 9 retroativamente a todo o pipeline já construído, não apenas ao P005.
