# P005 — Competency Profile Builder

## Objetivo

Traduzir o DecisionContext produzido pelo P004 em um CompetencyProfile — uma descrição não-decisória do perfil de competência relevante para apoiar a decisão do cliente, em termos já estabelecidos pelo DecisionContext. Este é o primeiro Artefato de Análise cuja construção é inteiramente determinística (ver Nota Arquitetural).

## Responsabilidades

- Traduzir `decisionType` em `focus` (foco de competência), por uma tabela de mapeamento fixa e pública.
- Traduzir `complexity` em `experienceLevel` (nível de experiência), por uma tabela de mapeamento fixa e pública.
- Carregar adiante `clinicalDomain` como `domain`, sem alterá-lo.
- Registrar a justificativa (`rationale`) da tradução realizada — explicabilidade obrigatória (Kernel, seção 4).
- Referenciar o DecisionContext de origem (`sourceArtifacts`), por id e versão, sem copiá-lo ou alterá-lo.

## Não Responsabilidades

O P005 nunca:

- Identifica ou nomeia uma especialidade médica.
- Seleciona ou nomeia um especialista.
- Calcula elegibilidade ou compatibilidade.
- Diagnostica ou interpreta exame.
- Altera o DecisionContext.
- Apresenta o CompetencyProfile como uma decisão ou recomendação final (Constituição, Princípio 9) — é sempre uma análise intermediária.
- Inicia o próximo protocolo.

## Entradas

- DecisionContext (artefato produzido pelo P004).

## Pré-condições

- O DecisionContext de entrada deve existir e ter sido produzido pelo P004.

## Fluxo

1. Receber o DecisionContext.
2. Traduzir `decisionType` em `focus`, usando a tabela de mapeamento fixa (`FOCUS_BY_DECISION_TYPE`).
3. Traduzir `complexity` em `experienceLevel`, usando a tabela de mapeamento fixa (`EXPERIENCE_BY_COMPLEXITY`).
4. Carregar `clinicalDomain` para `domain`, sem alteração.
5. Registrar a justificativa da tradução realizada.
6. Construir e versionar o CompetencyProfile, referenciando o DecisionContext de origem, validando a ausência de campos proibidos.

## Regras

- Este protocolo herda integralmente as restrições do Kernel (`docs/ace/03-kernel/kernel.md`), incluindo a seção 6 (Autoridade decisória dos artefatos).
- `focus` e `experienceLevel` são sempre derivados por tabela de mapeamento fixa — nunca por julgamento livre.
- `domain` nunca é alterado em relação ao `clinicalDomain` do DecisionContext de origem.
- O CompetencyProfile é imutável após criado, e carrega `decisional: false` estrutural (Constituição, Princípio 9).

## Saída

Um CompetencyProfile contendo, no mínimo:

- `domain`
- `focus`
- `experienceLevel`
- `rationale`
- `assumptions`
- `sourceArtifacts`
- `methodVersion`
- `createdAt`

Nunca contém diagnóstico, especialidade inferida, especialista, elegibilidade ou compatibilidade.

## Nota Arquitetural — Determinismo

Diferente de P002, P003 e P004, o P005 **não depende de nenhuma classificação semântica pré-computada** (não existe um parâmetro `modeling` simulando um LLM). Isso é possível porque `decisionType`, `clinicalDomain` e `complexity` — a entrada deste protocolo — já são enumerações fechadas produzidas pelo P004. Traduzir uma enumeração fechada em outra é uma função pura, determinística, auditável e reproduzível por definição (Kernel, seção 4) — não uma tarefa de linguagem natural. Este é o primeiro protocolo do pipeline com essa propriedade.

## Critérios de Aceitação

- [ ] `domain` é idêntico ao `clinicalDomain` do DecisionContext de origem.
- [ ] `focus` corresponde exatamente à tabela de mapeamento a partir de `decisionType`.
- [ ] `experienceLevel` corresponde exatamente à tabela de mapeamento a partir de `complexity`.
- [ ] `sourceArtifacts` referencia o DecisionContext de origem por id e versão.
- [ ] Nenhum campo proibido está presente.
- [ ] O DecisionContext de origem permanece inalterado após a execução.
- [ ] O CompetencyProfile é imutável após a criação, com `decisional: false`.

## Casos de Exceção

- Nenhum: como a tradução é determinística e a entrada (DecisionContext) já foi validada pelo P004, não existe estado de entrada válido que impeça a construção do CompetencyProfile.

## Dependências

- `docs/ace/00-constitution/constitution.md` — Princípio 9 (nenhum artefato intermediário possui valor decisório).
- `docs/ace/02-ontology/ontology.md` — Perfil de Competência, Foco de Competência, Nível de Experiência, Artefato de Análise.
- `docs/ace/03-kernel/kernel.md` — seção 6 (Autoridade decisória dos artefatos).
- P004 — Decision Context Modeler (produz a entrada).
- Protocolo seguinte: P006, ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P005 — Competency Profile Builder, especificada após análise arquitetural que identificou a tensão entre o pipeline original e a Constituição, resolvida pelo arquiteto do projeto com o Princípio 9 (Artefato de Análise). |
