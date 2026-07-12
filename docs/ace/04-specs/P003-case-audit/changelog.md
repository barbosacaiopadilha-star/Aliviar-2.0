# Changelog — P003 (Case Audit)

## v0.1 — 2026-07-12

- Primeira versão do protocolo, especificada a partir da entrada (DecisionCase), saída (CaseAudit) e pergunta única definidas pelo arquiteto do projeto.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código (Ciclo 2): artefato `CaseAudit` (com validação de consistência entre status e achados, correspondência 1:1 entre item e pergunta recomendada, e ausência de campos proibidos), e o protocolo P003.
- **Limitação deliberada**: a detecção real de informação contraditória e ambígua exige análise semântica (LLM), fora de escopo deste ciclo. O protocolo audita deterministicamente o que é estruturalmente conhecível a partir do DecisionCase (decisão/objetivo nulos, entradas de `missingInformation`) e aceita achados adicionais de contradição/ambiguidade como entrada auxiliar (`additionalFindings`), equivalente ao que um LLM identificaria seguindo `prompt.md`.
