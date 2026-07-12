# Changelog — P002 (Case Builder)

## v0.1 — 2026-07-12

- Primeira versão do protocolo, especificado a partir da entrada (Narrative), saída (DecisionCase) e pergunta única definidas pelo arquiteto do projeto.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código (Ciclo 1): modelo `DecisionCase` (imutável, versionado, sem campos proibidos), Core Contracts mínimos (Protocol, Artifact, Validation, Error, Version Manager), e o protocolo P002 como validador/construtor determinístico. A extração real via modelo de linguagem a partir do texto livre da Narrative aguarda o Orchestrator, fora de escopo deste ciclo — nesta fase, o protocolo assume que os campos já vêm estruturados (equivalente ao que um LLM produziria seguindo `prompt.md`).

## v0.2 — 2026-07-12 (ajuste obrigatório, antes do commit do Ciclo 1)

- `decisionStatement.decision` e `decisionStatement.goal` passam de `string` para `string | null` — informação ausente nunca é representada como string vazia.
- Novo tipo `MissingInformationField` (`"decision" | "goal" | "other"`); `MissingInformation` ganhou o campo `relatedField`.
- Nova validação (`assertNullFieldsAreRegisteredAsMissing`): um DecisionCase com `decision`/`goal` nulo sem a entrada correspondente em `missingInformation` é rejeitado na construção.
- Atualizados: `specification.md`, `prompt.md`, `examples.md` (caso complexo), `tests.md` (T08 revisado, T10 adicionado).
- Testes de código atualizados/adicionados em `tests/unit/ace-decision-case.test.ts` e `tests/unit/ace-p002-case-builder.test.ts`.
