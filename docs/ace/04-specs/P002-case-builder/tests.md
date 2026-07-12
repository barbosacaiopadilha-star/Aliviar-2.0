# Testes — P002 (Case Builder)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Referência à Narrative, não cópia**
Given uma Narrative válida produzida pelo P001,
When o P002 constrói o DecisionCase,
Then o DecisionCase armazena o id da Narrative como referência (`sourceNarrativeId`), nunca uma cópia do seu texto integral.

**T02 — Toda restrição/preferência tem evidência de origem**
Given uma extração com ao menos uma restrição obrigatória ou preferência,
When o DecisionCase é construído,
Then cada restrição e preferência possui um campo de evidência de origem não vazio.

**T03 — Distinção entre fato relatado e inferência estrutural**
Given qualquer elemento extraído da narrativa (exceto informação ausente),
When o DecisionCase é construído,
Then o elemento é marcado explicitamente como fato relatado ou inferência estrutural.

**T04 — Ausência de campos proibidos**
Given uma tentativa de construir um DecisionCase cujo payload de extração contenha um campo proibido (ex.: diagnóstico, especialidade, nível de confiança, matriz de compatibilidade),
When a construção é solicitada,
Then a construção falha com um erro de protocolo identificando o campo proibido, e nenhum DecisionCase é retornado.

**T05 — Imutabilidade**
Given um DecisionCase já construído,
When qualquer código tenta modificar um de seus campos (incluindo campos aninhados, como a lista de restrições obrigatórias),
Then a modificação não tem efeito — o DecisionCase permanece no seu estado original.

**T06 — Versionamento inicial**
Given a primeira construção de um DecisionCase para uma Narrative,
When o DecisionCase é criado,
Then sua versão é 1 e não possui referência a uma versão anterior.

**T07 — Nova versão nunca sobrescreve**
Given um DecisionCase já existente (versão N),
When uma correção é necessária,
Then uma nova versão é criada (versão N+1, referenciando a versão anterior) e a versão anterior permanece inalterada e acessível.

**T08 — Informação ausente nunca é inventada, e nunca é string vazia**
Given uma extração em que a decisão do cliente não está clara na narrativa,
When o DecisionCase é construído,
Then `decisionStatement.decision` é `null` (nunca string vazia ou um valor fabricado), e a lacuna aparece explicitamente na lista de informações ausentes com `relatedField: "decision"`.

**T10 — Campo null sem entrada correspondente em missingInformation é rejeitado**
Given uma tentativa de construir um DecisionCase com `decisionStatement.decision` ou `decisionStatement.goal` igual a `null`,
When a lista `missingInformation` não contém nenhuma entrada com `relatedField` correspondente a esse campo,
Then a construção falha com um erro de protocolo, e nenhum DecisionCase é retornado.

**T09 — Transformação P001 → P002 (ponta a ponta)**
Given uma Narrative de exemplo (caso simples de `docs/ace/04-specs/P001-intake/examples.md`) e sua extração estruturada correspondente,
When o protocolo P002 é executado,
Then o DecisionCase resultante satisfaz todos os Critérios de Aceitação de `specification.md`.
