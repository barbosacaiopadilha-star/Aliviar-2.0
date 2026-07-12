# Testes — P004 (Decision Context Modeler)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Contexto simples**
Given um DecisionCase claro e completo (decisão/objetivo presentes, sem restrições) e uma CaseAudit `READY`,
When o P004 modela o contexto,
Then o DecisionContext resultante tem `strategy: "conexao_direta"` e `complexity: "baixa"`.

**T02 — Contexto complexo**
Given um DecisionCase com uma restrição obrigatória relevante e uma CaseAudit `READY`,
When o P004 modela o contexto,
Then o DecisionContext resultante tem `complexity` maior que `"baixa"`.

**T03 — Urgência a partir de sinal relatado**
Given um DecisionCase cuja restrição obrigatória menciona um prazo,
When o P004 modela o contexto,
Then `urgency` não é `"nao_determinado"`, e `assumptions` ou `rationale` referenciam explicitamente o sinal de prazo que fundamentou essa classificação.

**T04 — Complexidade**
Given DecisionCases com quantidades diferentes de restrições/preferências/lacunas,
When o P004 modela o contexto de cada um,
Then `complexity` reflete a diferença (mais elementos → complexidade igual ou maior).

**T05 — Estratégia**
Given um DecisionCase cuja decisão já é clara e sem lacunas relevantes,
When o P004 modela o contexto,
Then `strategy` é `"conexao_direta"` — nunca uma estratégia que adie a conexão sem motivo correspondente no Caso.

**T06 — Domínio (clinicalDomain nunca é especialidade)**
Given qualquer DecisionCase válido,
When o P004 modela o contexto,
Then `clinicalDomain` pertence a um conjunto fechado de categorias amplas (nunca um nome de especialidade médica como "cardiologia" ou "ortopedia").

**T07 — Ausência de diagnóstico**
Given qualquer DecisionCase válido,
When o P004 modela o contexto,
Then nenhum campo do DecisionContext contém diagnóstico ou hipótese diagnóstica.

**T08 — Ausência de especialidade**
Given qualquer DecisionCase válido,
When o P004 modela o contexto,
Then nenhum campo do DecisionContext contém uma especialidade médica inferida.

**T09 — Imutabilidade**
Given um DecisionContext já construído,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito — o DecisionContext permanece no seu estado original.

**T10 — Rastreabilidade**
Given um DecisionCase e uma CaseAudit com id e versão conhecidos,
When o P004 produz o DecisionContext,
Then `sourceArtifacts` referencia exatamente o id e a versão de ambos.

**T11 — Rejeição de campos proibidos**
Given uma tentativa de construir um DecisionContext cujo payload contenha um campo proibido (ex.: diagnóstico, especialidade, competência, especialista),
When a construção é solicitada,
Then a construção falha com um erro de protocolo identificando o campo proibido, e nenhum DecisionContext é retornado.

**T12 — Transição P003 → P004 (ponta a ponta)**
Given um DecisionCase e sua CaseAudit correspondente com `status: READY` ou `READY_WITH_WARNINGS`,
When o protocolo P004 é executado,
Then o DecisionContext resultante satisfaz todos os Critérios de Aceitação de `specification.md`.

**T13 — Rejeição quando CaseAudit está BLOCKED**
Given uma CaseAudit com `status: "BLOCKED"`,
When o P004 é executado,
Then a execução é rejeitada (nenhum DecisionContext é produzido) com um erro de protocolo identificando a causa.
