# Exemplos — P003 (Case Audit)

Reaproveita os DecisionCase de `docs/ace/04-specs/P002-case-builder/examples.md`, para manter rastreabilidade entre os protocolos, e adiciona um caso novo para ilustrar `READY_WITH_WARNINGS`.

## READY (caso simples do P002)

**Entrada (DecisionCase):**

- Decisão: "Encontrar um profissional (psicólogo) para conversar sobre a ansiedade atual."
- Objetivo: "Ter um espaço de escuta para lidar com a ansiedade."
- Restrições obrigatórias: nenhuma.
- Preferências: 1 ("prefere um espaço de conversa...").
- Informações ausentes: nenhuma.

**Saída (CaseAudit):**

- status: `READY`
- blockingIssues: []
- warnings: []
- missingInformation: []
- recommendedQuestions: []

## READY_WITH_WARNINGS (caso novo)

**Entrada (DecisionCase):**

- Decisão: "Decidir se inicia um acompanhamento psicológico contínuo."
- Objetivo: "Sentir mais estabilidade emocional no dia a dia."
- Restrições obrigatórias: nenhuma.
- Preferências: nenhuma.
- Informações ausentes: uma entrada com `relatedField: "other"` — "Não ficou claro se o cliente já buscou algum tipo de apoio ou acompanhamento antes."

**Saída (CaseAudit):**

- status: `READY_WITH_WARNINGS`
- blockingIssues: []
- warnings: [{ description: "Não ficou claro se o cliente já buscou algum tipo de apoio ou acompanhamento antes.", category: "insuficiencia" }]
- missingInformation: [a mesma entrada acima, reportada do DecisionCase]
- recommendedQuestions: [{ question: "Você já buscou algum tipo de apoio ou acompanhamento antes deste contato?" }]

## BLOCKED (caso complexo do P002)

**Entrada (DecisionCase):**

- Decisão: `null`
- Objetivo: "Sentir que sua história foi de fato compreendida antes de qualquer indicação."
- Restrições obrigatórias: nenhuma.
- Preferências: 1 ("prefere ser ouvido integralmente...").
- Informações ausentes: uma entrada com `relatedField: "decision"`.

**Saída (CaseAudit):**

- status: `BLOCKED`
- blockingIssues: [{ description: "A decisão que o cliente precisa tomar ainda não está definida.", category: "ausencia" }]
- warnings: []
- missingInformation: [a entrada de decisão ausente, reportada do DecisionCase]
- recommendedQuestions: [{ question: "Qual decisão específica você precisa tomar neste momento?" }]

## Informação contraditória (ilustrativo)

**Entrada (DecisionCase):** decisão e objetivo presentes, mas com duas restrições obrigatórias logicamente incompatíveis entre si (ex.: "só pode em outubro" e "não pode em outubro", ambas relatadas na mesma narrativa).

**Saída (CaseAudit):**

- status: `BLOCKED`
- blockingIssues: [{ description: "Duas restrições obrigatórias relatadas parecem se contradizer quanto ao período disponível.", category: "contradicao" }]
- recommendedQuestions: [{ question: "Você pode confirmar qual período realmente funciona para você?" }]

Este último exemplo ilustra a categoria `contradicao`; a detecção de contradições semânticas depende de análise por modelo de linguagem (ver limitação registrada em `changelog.md`) — nesta fase, o protocolo aceita esse achado já identificado como entrada auxiliar, não o deriva sozinho do texto.
