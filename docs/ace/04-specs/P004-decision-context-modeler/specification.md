# P004 — Decision Context Modeler

## Objetivo

Transformar um DecisionCase validado (e sua CaseAudit) em um DecisionContext estruturado — organizando o contexto necessário para que os protocolos seguintes do ACE possam identificar competências, elegibilidade e compatibilidade. O P004 nunca escolhe especialistas, nunca identifica competências: apenas modela o contexto da decisão.

**Nomenclatura (ADR-011, `docs/DECISIONS.md`):** este artefato se chama oficialmente `DecisionContext`, nunca "Clinical Context". O Método Aliviar modela decisões, não doenças — este protocolo, como todos os demais, trabalha sobre abstrações relacionadas à decisão do cliente, nunca sobre uma hipótese diagnóstica ou condição de saúde como unidade central.

## Responsabilidades

- Classificar o tipo de decisão (`decisionType`) que o cliente enfrenta.
- Carregar adiante o objetivo (`objective`) já estabelecido no DecisionCase.
- Atribuir um domínio amplo de vida/saúde (`clinicalDomain`) já evidente na História — nunca uma especialidade médica.
- Estimar a complexidade (`complexity`) do Caso a partir de sinais estruturais (quantidade de restrições, preferências, lacunas).
- Estimar a urgência (`urgency`) **apenas** a partir de sinais já relatados pelo cliente (ex.: uma restrição de prazo) — nunca fabricada.
- Recomendar uma estratégia (`strategy`) de alto nível para a curadoria prosseguir — nunca especifica quem, apenas como.
- Registrar as premissas (`assumptions`) assumidas ao modelar o contexto, e a justificativa (`rationale`) da classificação escolhida — explicabilidade obrigatória (Kernel, seção 4).
- Referenciar o DecisionCase e a CaseAudit de origem (`sourceArtifacts`), por id e versão, sem copiá-los ou alterá-los.
- **Preservar (nunca criar ou interpretar) as Restrições Obrigatórias (`mandatoryConstraints`) já existentes no DecisionCase** (ADR-015, `docs/DECISIONS.md`) — transporte mecânico e rastreável, necessário para que o P007 possa avaliar `constraintAlignment` com dado real.

## Não Responsabilidades

O P004 nunca:

- Interpreta exames.
- Emite hipótese diagnóstica.
- Gera diagnóstico.
- Infere especialidade médica.
- Identifica competências.
- Seleciona especialistas.
- Calcula compatibilidade.
- Cria ou interpreta Restrições Obrigatórias — apenas as preserva tal como já existem no DecisionCase.
- Altera o DecisionCase.
- Altera a CaseAudit.
- Inicia o próximo protocolo.

## Entradas

- DecisionCase (artefato produzido pelo P002).
- CaseAudit (artefato produzido pelo P003, auditando o DecisionCase acima).

## Pré-condições

- O DecisionCase e a CaseAudit devem existir, e a CaseAudit deve auditar exatamente o DecisionCase fornecido (mesmo id e versão).
- **A CaseAudit não pode ter `status: "BLOCKED"`.** Modelar um contexto de decisão sobre um Caso que a própria auditoria classificou como bloqueado contradiria o propósito do P003 — o P004 rejeita a execução nesse caso, sinalizando que o Caso precisa ser resolvido primeiro (ver Casos de Exceção).

## Fluxo

1. Receber o DecisionCase e a CaseAudit correspondente.
2. Verificar a pré-condição de status (rejeitar se `BLOCKED`).
3. Classificar o tipo de decisão a partir da declaração de decisão do Caso.
4. Carregar o objetivo do Caso para o Contexto.
5. Atribuir o domínio amplo de vida/saúde evidente na História, nunca uma especialidade.
6. Estimar complexidade e urgência a partir dos sinais estruturais já presentes no Caso e na Auditoria.
7. Recomendar uma estratégia de alto nível.
8. Registrar premissas e justificativa da classificação.
9. Construir e versionar o DecisionContext, referenciando o DecisionCase e a CaseAudit de origem, validando a ausência de campos proibidos.

## Regras

- Este protocolo herda integralmente as restrições do Kernel (`docs/ace/03-kernel/kernel.md`).
- `clinicalDomain` nunca é uma especialidade médica — permanece em um nível de abstração amplo (ex.: "saúde emocional/mental", "saúde física"), nunca uma taxonomia clínica granular.
- `urgency` só reflete sinais já relatados pelo cliente — nunca cria senso de urgência artificial (`docs/BRAND_GUIDELINES.md`).
- `strategy` nunca nomeia um especialista, competência ou instituição — apenas uma orientação estrutural de como prosseguir.
- O DecisionContext é imutável após criado.
- O DecisionCase e a CaseAudit de origem nunca são modificados.

## Saída

Um DecisionContext contendo, no mínimo:

- `decisionType`
- `objective`
- `clinicalDomain`
- `complexity`
- `urgency`
- `strategy`
- `mandatoryConstraints` (preservadas do DecisionCase, ADR-015 — nunca criadas ou reinterpretadas aqui)
- `assumptions`
- `rationale`
- `sourceArtifacts`
- `methodVersion`
- `createdAt`

Nunca contém diagnóstico, especialidade inferida, competência, especialista ou matriz de compatibilidade.

## Critérios de Aceitação

- [ ] O DecisionContext referencia o DecisionCase e a CaseAudit de origem por id e versão, sem copiá-los.
- [ ] `objective` corresponde ao objetivo já estabelecido no DecisionCase (nunca um valor novo).
- [ ] `clinicalDomain` nunca corresponde a uma especialidade médica.
- [ ] `urgency` está sempre acompanhada de uma justificativa rastreável a um sinal já presente no Caso.
- [ ] `rationale` explica em linguagem simples a classificação escolhida.
- [ ] Nenhum campo proibido está presente.
- [ ] O DecisionCase e a CaseAudit de origem permanecem inalterados após a execução.
- [ ] `mandatoryConstraints` do DecisionContext é idêntico ao `mandatoryConstraints` do DecisionCase de origem — nunca recriado, nunca reinterpretado.
- [ ] O DecisionContext é imutável após a criação.

## Casos de Exceção

- **CaseAudit com status `BLOCKED`**: o P004 rejeita a execução — não produz um DecisionContext, e sinaliza que o Caso precisa ser resolvido (perguntas recomendadas da CaseAudit) antes de prosseguir.
- **Urgência não determinável a partir do Caso**: `urgency` recebe o valor `"nao_determinado"` — nunca uma estimativa inventada.
- **Domínio não determinável a partir da História**: `clinicalDomain` recebe o valor `"nao_determinado"` — nunca uma suposição.

## Dependências

- `docs/ace/00-constitution/constitution.md` — princípios não-negociáveis.
- `docs/ace/02-ontology/ontology.md` — Contexto de Decisão, Tipo de Decisão, Domínio, Complexidade, Urgência, Estratégia.
- `docs/ace/03-kernel/kernel.md` — restrições universais herdadas.
- `docs/DECISIONS.md` (ADR-011) — nomenclatura "Decision Context", nunca "Clinical Context".
- `docs/DECISIONS.md` (ADR-015) — propagação de `mandatoryConstraints` ao DecisionContext.
- P002 — Case Builder (produz o DecisionCase).
- P003 — Case Audit (produz a CaseAudit).
- Protocolo seguinte: P005, ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P004 — Decision Context Modeler, formalizada a partir da entrada (DecisionCase + CaseAudit), saída (DecisionContext) e pergunta única definidas pelo arquiteto do projeto, junto com ADR-011. |
| 0.2 | 2026-07-12 | Sprint 9 (ADR-015): `mandatoryConstraints` do DecisionCase passa a ser preservado no DecisionContext — transporte mecânico, nunca via `modeling` (que simula classificação semântica). Corrige a lacuna que fazia `constraintAlignment` do P007 ser estruturalmente sempre `NOT_APPLICABLE`. |
