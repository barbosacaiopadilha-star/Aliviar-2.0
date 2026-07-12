# Changelog — P004 (Decision Context Modeler)

## v0.2 — 2026-07-12 (Sprint 9, ADR-015)

- Correção obrigatória antes do P008 (Shortlist Builder): `mandatoryConstraints` do DecisionCase passa a ser preservado no DecisionContext, sem adicionar o DecisionCase como entrada direta do P007. O P004 não cria nem interpreta Restrições Obrigatórias — o transporte é mecânico, feito diretamente pelo código do protocolo a partir de `decisionCase.mandatoryConstraints`, nunca via `modeling` (que simula classificação semântica de um LLM).
- `P004Modeling` passou a excluir explicitamente `mandatoryConstraints` do seu tipo, para que a simulação de classificação semântica nunca o produza por engano.
- Resolve a lacuna registrada no changelog do P007 (v0.1): `constraintAlignment` deixa de ser estruturalmente sempre `NOT_APPLICABLE`.
- Documentos atualizados: `specification.md` (Responsabilidades, Não Responsabilidades, Saída, Critérios de Aceitação, Dependências, Histórico).
- Código atualizado: `src/modules/ace/artifacts/decision-context.ts`, `src/modules/ace/protocols/p004-decision-context-modeler.ts`.

## v0.1 — 2026-07-12

- Primeira versão do protocolo, especificada a partir da entrada (DecisionCase + CaseAudit), saída (DecisionContext) e pergunta única definidas pelo arquiteto do projeto.
- Nomenclatura oficial "Decision Context" adotada conforme ADR-011 (`docs/DECISIONS.md`) — o nome "Clinical Context", cogitado informalmente no plano original de protocolos, nunca foi formalizado em nenhum documento antes desta versão, e foi descartado antes de qualquer especificação.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código (Ciclo 3): artefato `DecisionContext` (imutável, versionado, com referência por id+versão ao DecisionCase e à CaseAudit de origem, sem campos proibidos), e o protocolo P004. Rejeita a execução quando a CaseAudit fornecida tem `status: "BLOCKED"`.
- **Limitação deliberada** (mesmo padrão de P002/P003): a classificação semântica (`decisionType`, `clinicalDomain`, `complexity`, `urgency`, `strategy`, `assumptions`, `rationale`) exige análise de linguagem natural, fora de escopo deste ciclo. O protocolo aceita essa classificação já pronta (`modeling`), equivalente ao que um modelo de linguagem produziria seguindo `prompt.md`, e concentra-se em validar consistência, ausência de campos proibidos, e montar/versionar o artefato com rastreabilidade correta às suas fontes.
