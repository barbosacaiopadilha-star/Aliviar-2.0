# Testes — P003 (Case Audit)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — READY**
Given um DecisionCase com decisão e objetivo definidos, sem informações ausentes,
When o P003 audita o DecisionCase,
Then o CaseAudit resultante tem `status: "READY"`, `blockingIssues` e `warnings` vazios.

**T02 — READY_WITH_WARNINGS**
Given um DecisionCase com decisão e objetivo definidos, mas com uma informação ausente não relacionada a decisão/objetivo (`relatedField: "other"`),
When o P003 audita o DecisionCase,
Then o CaseAudit resultante tem `status: "READY_WITH_WARNINGS"`, `blockingIssues` vazio, e exatamente um `Warning` com uma `RecommendedQuestion` correspondente.

**T03 — BLOCKED**
Given um DecisionCase com `decisionStatement.decision` igual a `null`,
When o P003 audita o DecisionCase,
Then o CaseAudit resultante tem `status: "BLOCKED"` e ao menos um `BlockingIssue`.

**T04 — Decisão principal ausente**
Given um DecisionCase com `decisionStatement.decision === null`,
When o P003 audita o DecisionCase,
Then existe um `BlockingIssue` de categoria `ausencia` referente à decisão, com uma `RecommendedQuestion` correspondente que não sugere uma resposta.

**T05 — Objetivo ausente**
Given um DecisionCase com `decisionStatement.goal === null`,
When o P003 audita o DecisionCase,
Then existe um `BlockingIssue` de categoria `ausencia` referente ao objetivo, com uma `RecommendedQuestion` correspondente.

**T06 — Narrativa insuficiente (múltiplas lacunas essenciais)**
Given um DecisionCase com `decision` e `goal` ambos `null`,
When o P003 audita o DecisionCase,
Then o CaseAudit tem `status: "BLOCKED"` com dois `BlockingIssues` (um para cada campo ausente) e duas `RecommendedQuestions` correspondentes.

**T07 — Restrição/preferência opcional ausente**
Given um DecisionCase com decisão e objetivo definidos, e uma entrada de `missingInformation` com `relatedField: "other"` referente a uma restrição não essencial,
When o P003 audita o DecisionCase,
Then o item aparece como `Warning` (nunca `BlockingIssue`), e o `status` não é `BLOCKED` por causa dele.

**T08 — Informação contraditória**
Given um achado adicional de categoria `contradicao` e severidade `blocking` fornecido ao P003,
When o P003 audita o DecisionCase,
Then existe um `BlockingIssue` de categoria `contradicao` com uma `RecommendedQuestion` correspondente, e o `status` é `BLOCKED`.

**T09 — Perguntas não indutivas**
Given qualquer `BlockingIssue` ou `Warning` identificado,
When o P003 gera a `RecommendedQuestion` correspondente,
Then a pergunta é neutra — não sugere uma resposta específica, não sugere um diagnóstico, especialidade ou direção clínica.

**T10 — Imutabilidade do DecisionCase**
Given um DecisionCase válido,
When o P003 o audita,
Then o DecisionCase original permanece com o mesmo id, versão e conteúdo — nenhuma tentativa de modificação é aceita.

**T11 — Rastreabilidade entre artefatos**
Given um DecisionCase com id e versão conhecidos,
When o P003 produz o CaseAudit,
Then `auditedArtifactId` e `auditedArtifactVersion` do CaseAudit correspondem exatamente ao id e versão do DecisionCase auditado.

**T12 — Rejeição de campos proibidos**
Given uma tentativa de construir um CaseAudit cujo payload contenha um campo proibido (ex.: diagnóstico, especialidade, nível de confiança),
When a construção é solicitada,
Then a construção falha com um erro de protocolo identificando o campo proibido, e nenhum CaseAudit é retornado.
