# P002 — Case Builder

## Objetivo

Transformar a Narrative validada e produzida pelo P001 (Intake) em uma representação estruturada e imutável da decisão do cliente — o DecisionCase — para uso pelos protocolos seguintes do ACE.

## Responsabilidades

- Extrair da Narrative: a declaração de decisão (decisão + objetivo do cliente), restrições obrigatórias, preferências, e sinalizar informações essenciais ausentes.
- Preservar a Narrative original por referência (nunca por cópia).
- Distinguir, para cada elemento extraído, se é um fato relatado diretamente pelo cliente ou uma inferência estrutural feita ao organizar a narrativa.
- Registrar evidência de origem (trecho da narrativa) para cada elemento extraído, exceto informações ausentes.
- Produzir um DecisionCase versionado e rastreável.

## Não Responsabilidades

O P002 nunca:

- Diagnostica.
- Infere especialidade médica.
- Atribui nível de confiança a qualquer elemento.
- Calcula compatibilidade, competência ou elegibilidade de especialista.
- Modifica a Narrative de origem.
- Sobrescreve uma versão anterior do DecisionCase — sempre cria uma nova versão.
- Inventa decisão, objetivo, restrição ou preferência sem correspondência clara na Narrative.
- Conversa diretamente com o cliente (responsabilidade exclusiva do P001).

## Entradas

- Narrative (artefato produzido pelo P001).

## Pré-condições

- A Narrative de entrada deve existir e ter sido produzida pelo P001.

## Fluxo

1. Receber a Narrative.
2. Identificar a declaração de decisão: qual decisão o cliente precisa tomar e qual objetivo ele espera alcançar.
3. Identificar restrições obrigatórias explicitamente relatadas.
4. Identificar preferências explicitamente relatadas.
5. Identificar informações essenciais ausentes na Narrative.
6. Para cada elemento identificado (exceto informações ausentes), marcar se é fato relatado ou inferência estrutural, e registrar a evidência de origem correspondente.
7. Validar a ausência de campos proibidos antes de finalizar.
8. Construir e versionar o DecisionCase, preservando a referência à Narrative de origem.

## Regras

- Este protocolo herda integralmente as restrições do Kernel (`docs/ace/03-kernel/kernel.md`).
- Nenhuma informação sem correspondência na Narrative pode aparecer no DecisionCase.
- Toda restrição/preferência extraída deve ter evidência de origem rastreável; informações ausentes não têm evidência, por definição.
- O DecisionCase é imutável após criado; qualquer correção gera uma nova versão, nunca uma sobrescrita.
- **Decisão ou objetivo pouco claros nunca são representados como string vazia** — o campo correspondente (`decisionStatement.decision` ou `decisionStatement.goal`) é `null`, e uma entrada correspondente é obrigatoriamente registrada em `missingInformation` (com `relatedField: "decision"` ou `"goal"`, respectivamente). Um DecisionCase com um desses campos `null` sem a entrada correspondente em `missingInformation` é inválido e é rejeitado na construção.

## Saída

Um DecisionCase: artefato estruturado, imutável, versionado, contendo declaração de decisão (`decision`/`goal`, cada um `string | null`), restrições obrigatórias, preferências, informações ausentes, e referência à Narrative de origem. Nunca contém diagnóstico, especialidade inferida, nível de confiança, compatibilidade, competências ou especialistas.

## Critérios de Aceitação

- [ ] O DecisionCase referencia a Narrative de origem, sem copiar seu conteúdo integral.
- [ ] Todo elemento extraído (exceto informação ausente) está marcado como fato relatado ou inferência estrutural.
- [ ] Toda restrição/preferência tem evidência de origem.
- [ ] Nenhum campo proibido está presente.
- [ ] O DecisionCase é imutável após a criação.
- [ ] O DecisionCase possui versão e, quando aplicável, referência à versão anterior.
- [ ] Se `decisionStatement.decision` ou `decisionStatement.goal` é `null`, existe uma entrada correspondente em `missingInformation`.
- [ ] Nenhum campo ausente é representado como string vazia — apenas como `null` com a entrada correspondente em `missingInformation`.

## Casos de Exceção

- **Narrative sinaliza decisão ou objetivo pouco claros**: o P002 registra `decision`/`goal` como `null` e adiciona a entrada correspondente em `missingInformation` — nunca infere um valor não afirmado, e nunca usa string vazia para representar a ausência.
- **Narrative não contém nenhuma restrição ou preferência explícita**: o P002 produz um DecisionCase com essas listas vazias — nunca inventa uma restrição/preferência para preencher.
- **Necessidade de corrigir um DecisionCase já criado**: o P002 cria uma nova versão referenciando a anterior; nunca sobrescreve.

## Dependências

- `docs/ace/00-constitution/constitution.md` — princípios não-negociáveis.
- `docs/ace/02-ontology/ontology.md` — Caso (DecisionCase), Declaração de Decisão, Restrição Obrigatória, Preferência, Informação Ausente, Evidência de Origem.
- `docs/ace/03-kernel/kernel.md` — restrições universais herdadas.
- P001 — Intake (produz a entrada deste protocolo).
- Protocolo seguinte: ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P002 — Case Builder, formalizada a partir da entrada (Narrative), saída (DecisionCase) e pergunta única definidas pelo arquiteto do projeto. |
| 0.2 | 2026-07-12 | Ajuste obrigatório: `decisionStatement.decision`/`goal` passam de `string` para `string \| null` — informação ausente nunca é representada como string vazia. Adicionada a regra de que todo campo `null` correspondente deve ter uma entrada em `missingInformation`. |
