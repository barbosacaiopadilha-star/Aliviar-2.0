# P007 — Compatibility Matrix Builder

## Objetivo

Avaliar individualmente cada Care Provider elegível (EligibleProviderSet) em relação ao caso, produzindo uma análise comparável e explicável por dimensão — nunca um shortlist, nunca uma escolha, nunca um ranking, nunca uma decisão institucional.

## Responsabilidades

- Avaliar **todos** os providers do EligibleProviderSet — nenhum é removido ou descartado.
- Para cada provider, avaliar seis dimensões (ver "Dimensões") usando uma taxonomia qualitativa fechada — nunca um score numérico. Cada dimensão produz um `DimensionResult` (classificação + justificativa própria + evidências utilizadas), nunca apenas um rótulo solto.
- Registrar forças (`strengths`), limitações (`limitations`) e lacunas de informação (`missingInformation`) por provider — três listas distintas: `limitations` é uma qualidade parcialmente atendida (dado presente, alinhamento fraco); `missingInformation` é dado ausente (nada a avaliar).
- Justificar cada avaliação (`rationale` geral por provider, além do `rationale` de cada dimensão) em linguagem simples.
- Referenciar os três artefatos de origem (DecisionContext, CompetencyProfile, EligibleProviderSet), por id e versão — tanto no nível da CompatibilityMatrix quanto em cada `CompatibilityEntry`, para permitir auditar um provider isoladamente.
- Quando faltar dado para avaliar uma dimensão, usar `INSUFFICIENT` (dado insuficiente, registrado em `missingInformation`) ou `NOT_APPLICABLE` (dimensão não pertinente ao caso) — nunca inventar.

## Não Responsabilidades

O P007 nunca:

- Remove um provider elegível do conjunto avaliado.
- Cria um shortlist.
- Escolhe ou destaca um número específico de providers.
- Ordena por relevância.
- Produz um vencedor.
- Emite recomendação ao cliente.
- Altera o DecisionContext, o CompetencyProfile ou o EligibleProviderSet.
- Usa interesse comercial em qualquer avaliação (Constituição, Princípio 2).
- Inventa um atributo de provider ausente no repositório.
- Produz score final único ou percentual global.

## Entradas

- DecisionContext (produzido pelo P004).
- CompetencyProfile (produzido pelo P005).
- EligibleProviderSet (produzido pelo P006).
- ProviderProfileRepository — porta de infraestrutura que retorna o perfil completo de cada Care Provider elegível (`findByIds`). O protocolo conhece apenas a interface, nunca uma implementação concreta.

## Pré-condições

- O EligibleProviderSet deve ter sido produzido a partir do CompetencyProfile fornecido, e este a partir do DecisionContext fornecido (rastreabilidade da cadeia, não reverificada mecanicamente por este protocolo — cada protocolo anterior já garante a sua própria consistência).

## Dados do Provider — alternativa escolhida e motivo

**Alternativa adotada:** uma porta nova, `ProviderProfileRepository` (`src/modules/ace/ports/provider-profile-repository.ts`), retornando um tipo novo, `CareProviderProfile`, que **estende** `CareProviderCandidate` (usado pelo P006) com exatamente 3 campos:

- `intakeApproach` (para `strategyAlignment`) — reaproveita o próprio tipo `Strategy` do DecisionContext, mais `"ambos"`.
- `offersContinuousCare` (para `continuityAlignment`) — booleano ou `null` quando desconhecido.
- `availabilityWindow` (para `contextAlignment`) — enumeração fechada ou `null` quando desconhecido.

**Alternativa descartada:** aumentar `CareProviderCandidate` (usado pelo P006) com esses mesmos campos. Descartada porque o P006 não precisa deles — aumentá-lo violaria a instrução de não crescer silenciosamente esse tipo, e acoplaria a responsabilidade de elegibilidade (P006) a dados que só a compatibilidade (P007) usa.

## Dimensões

Cada uma das seis dimensões usa a escala `AlignmentLevel`:

| Nível | Significado |
|---|---|
| `STRONG` | Alinhamento forte — o provider excede o requisito mínimo. |
| `ADEQUATE` | Alinhamento adequado — o provider atende exatamente ao requisito. |
| `PARTIAL` | Alinhamento parcial — há alguma correspondência, mas não completa. |
| `INSUFFICIENT` | Não atende ao requisito, **ou** não há dado suficiente para confirmar que atende — a distinção entre as duas leituras fica sempre na justificativa textual (`rationale`/`limitations`), nunca no valor do enum. |
| `NOT_APPLICABLE` | A dimensão não é pertinente a este caso especificamente (ex.: continuidade não é relevante quando o cliente não busca acompanhamento contínuo). |

**Nomenclatura validada contra a Ontologia:** o padrão `MAIÚSCULO_COM_UNDERSCORE` em inglês já existe no ACE — é o mesmo estilo do `ReadinessStatus` do P003 (`READY`/`READY_WITH_WARNINGS`/`BLOCKED`). P004/P005 adotaram um estilo diferente (português, minúsculo) para suas próprias enumerações; essa divergência já existia antes deste protocolo e não é resolvida aqui (fora de escopo — ver Riscos no changelog).

As seis dimensões:

- **`competencyAlignment`** — o provider possui a área de competência (domínio + foco) exigida pelo CompetencyProfile.
- **`experienceAlignment`** — o nível de experiência do provider comparado ao exigido (`STRONG` se excede, `ADEQUATE` se exatamente igual).
- **`contextAlignment`** — a disponibilidade do provider comparada à urgência do DecisionContext. `NOT_APPLICABLE` quando a urgência não foi determinada.
- **`strategyAlignment`** — a abordagem de intake do provider comparada à Estratégia do DecisionContext.
- **`constraintAlignment`** — avalia as Restrições Obrigatórias do cliente (`decisionContext.mandatoryConstraints`, propagadas do DecisionCase via ADR-015). `NOT_APPLICABLE` quando o caso não tem nenhuma restrição registrada. `INSUFFICIENT` quando há restrições, mas o `CareProviderProfile` ainda não possui dado estruturado para verificá-las (ver "Limitação arquitetural conhecida" abaixo) — nunca inventa a verificação.
- **`continuityAlignment`** — se o provider oferece cuidado contínuo, relevante apenas quando o Tipo de Decisão é "buscar acompanhamento contínuo"; `NOT_APPLICABLE` nos demais tipos de decisão.

## Limitação arquitetural conhecida

**Resolvida parcialmente na Sprint 9 (ADR-015):** as Restrições Obrigatórias do cliente agora chegam a este protocolo via `decisionContext.mandatoryConstraints`. A lacuna que restava — `constraintAlignment` sempre `NOT_APPLICABLE` independentemente do caso — foi corrigida.

**Limitação que permanece:** o `CareProviderProfile` ainda não possui nenhum atributo estruturado (preço, convênio, localização, modalidade de atendimento etc.) capaz de verificar o conteúdo em texto livre de uma restrição obrigatória. Por isso, na prática, toda restrição hoje registrada resulta em `INSUFFICIENT` — não porque o Método falhe em modelar a restrição, mas porque a infraestrutura de dados do provider ainda não tem como respondê-la. Resolver isso é uma decisão de arquitetura futura (ADR-015, seção "Revisitar quando"): adicionar atributos estruturados ao perfil do provider, um de cada vez, cada um justificado por uma categoria específica de restrição.

## Fluxo

1. Consultar `providerProfileRepository.findByIds(eligibleProviderSet.eligibleProviderIds)`.
2. Para cada id do EligibleProviderSet (todos, sem exceção):
   1. Se o perfil completo não for encontrado no repositório, preservar o provider com todas as dimensões dependentes de perfil marcadas `INSUFFICIENT` — nunca removê-lo.
   2. Caso contrário, avaliar as seis dimensões determinísticamente, cada uma produzindo um `DimensionResult` (classificação, justificativa, evidências).
3. Derivar, por provider: `strengths` (dimensões `STRONG`), `limitations` (dimensões `PARTIAL`) e `missingInformation` (dimensões `INSUFFICIENT`).
4. Construir e versionar a CompatibilityMatrix, referenciando os três artefatos de origem tanto na matriz quanto em cada `CompatibilityEntry`.

## Regras

- Este protocolo herda integralmente as restrições do Kernel, incluindo a seção 6 (Autoridade decisória) e 1.1 (política de campos).
- Todo provider do EligibleProviderSet recebe exatamente uma avaliação — nunca zero, nunca mais de uma.
- Nenhuma dimensão é inventada quando falta dado — usa `INSUFFICIENT` ou `NOT_APPLICABLE`, sempre com a limitação registrada.
- A CompatibilityMatrix nunca contém score numérico, percentual, ou qualquer campo que implique ranking.
- Determinístico: a mesma entrada produz a mesma saída.

## Saída

Uma CompatibilityMatrix contendo, no mínimo:

- `entries` (uma `CompatibilityEntry` por provider do EligibleProviderSet), cada uma com:
  - `providerId`
  - `dimensionResults` (as seis dimensões, cada uma um `DimensionResult`: `classification` + `rationale` + `evidence`)
  - `strengths`, `limitations`, `missingInformation` (três listas distintas)
  - `rationale` (justificativa geral da avaliação do provider)
  - `sourceArtifacts`, `producedBy`, `version`, `createdAt` (rastreabilidade própria da entrada, idêntica à da matriz que a contém)
- `sourceArtifacts` (referência aos três artefatos de origem, no nível da matriz)
- `methodVersion`
- `createdAt`

## Critérios de Aceitação

- [ ] Todo provider do EligibleProviderSet aparece em `entries` — nenhum é perdido.
- [ ] Nenhum provider aparece mais de uma vez em `entries`.
- [ ] Toda avaliação tem `rationale` não vazio, geral e por dimensão.
- [ ] Toda dimensão aplicável tem `evidence` não vazio.
- [ ] Nenhum campo de score, percentual ou ranking está presente.
- [ ] `sourceArtifacts` referencia exatamente os três artefatos de origem, por id e versão — na matriz e em cada entrada.
- [ ] O DecisionContext, o CompetencyProfile e o EligibleProviderSet permanecem inalterados após a execução.
- [ ] A CompatibilityMatrix é imutável após a criação, com `decisional: false`.
- [ ] O resultado é idêntico para a mesma entrada (determinismo), ignorando os campos voláteis de carimbo temporal.

## Casos de Exceção

- **EligibleProviderSet vazio**: `entries` é um array vazio — resultado válido, não um erro.
- **Perfil completo do provider não encontrado no repositório**: o provider é preservado em `entries` com todas as dimensões dependentes de perfil `INSUFFICIENT` e registradas em `missingInformation`, nunca removido.
- **Urgência não determinada no DecisionContext**: `contextAlignment` é `NOT_APPLICABLE`.
- **Tipo de decisão diferente de "buscar acompanhamento"**: `continuityAlignment` é `NOT_APPLICABLE`.
- **Nenhuma Restrição Obrigatória registrada no caso**: `constraintAlignment` é `NOT_APPLICABLE`.
- **Restrições Obrigatórias registradas, sem dado estruturado no perfil do provider para verificá-las**: `constraintAlignment` é `INSUFFICIENT`, com cada restrição registrada em `missingInformation` — nunca inventado.

## Dependências

- `docs/ace/00-constitution/constitution.md` — Princípio 9.
- `docs/ace/02-ontology/ontology.md` — Matriz de Compatibilidade, Nível de Alinhamento, e as seis dimensões.
- `docs/ace/03-kernel/kernel.md` — seção 6 e 1.1 (política de campos, ADR-014).
- `docs/DECISIONS.md` — ADR-013 (Care Provider), ADR-014 (política de campos em três camadas), ADR-015 (Restrições Obrigatórias propagadas ao Decision Context).
- P004, P005, P006 (produzem as três entradas).
- Protocolo seguinte: P008, ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P007 — Compatibility Matrix Builder, especificada após a refatoração da política de campos (ADR-014) que resolveu a tensão entre "compatibility" proibido e "compatibility" legítimo a partir deste protocolo. |
