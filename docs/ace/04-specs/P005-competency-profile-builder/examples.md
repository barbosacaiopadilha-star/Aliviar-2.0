# Exemplos — P005 (Competency Profile Builder)

Reaproveita os DecisionContext de `docs/ace/04-specs/P004-decision-context-modeler/examples.md`. Como a tradução é determinística, o resultado é sempre o mesmo para a mesma entrada — não há "caso complexo" distinto em termos de dificuldade de julgamento, apenas em termos dos valores de entrada.

## Exemplo 1 (a partir do Contexto simples do P004)

**Entrada (DecisionContext):** `decisionType: buscar_acompanhamento`, `clinicalDomain: saude_emocional_mental`, `complexity: baixa`.

**Saída (CompetencyProfile):**

- `domain`: `saude_emocional_mental`
- `focus`: `acompanhamento_continuo`
- `experienceLevel`: `geral`
- `rationale`: "Derivado deterministicamente do Contexto de Decisão: foco 'acompanhamento_continuo' a partir do tipo de decisão ('buscar_acompanhamento'), nível de experiência 'geral' a partir da complexidade ('baixa')."

## Exemplo 2 (a partir do Contexto complexo do P004)

**Entrada (DecisionContext):** `decisionType: decidir_intervencao`, `clinicalDomain: saude_fisica`, `complexity: media`.

**Saída (CompetencyProfile):**

- `domain`: `saude_fisica`
- `focus`: `intervencao`
- `experienceLevel`: `experiente`
- `rationale`: "Derivado deterministicamente do Contexto de Decisão: foco 'intervencao' a partir do tipo de decisão ('decidir_intervencao'), nível de experiência 'experiente' a partir da complexidade ('media')."

## Exemplo 3 (complexidade alta)

**Entrada (DecisionContext):** `decisionType: buscar_avaliacao`, `clinicalDomain: nao_determinado`, `complexity: alta`.

**Saída (CompetencyProfile):**

- `domain`: `nao_determinado`
- `focus`: `avaliacao`
- `experienceLevel`: `altamente_experiente`
- `rationale`: "Derivado deterministicamente do Contexto de Decisão: foco 'avaliacao' a partir do tipo de decisão ('buscar_avaliacao'), nível de experiência 'altamente_experiente' a partir da complexidade ('alta')."
