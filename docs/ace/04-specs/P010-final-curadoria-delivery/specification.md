# P010 — Final Curadoria Delivery

## Objetivo

Materializar e comunicar ao cliente, de forma clara, fiel e útil, a decisão humana já registrada no P009 (`HumanReviewResult` com `reviewStatus: "VALIDATED"`) — o P010 **não toma uma nova decisão**. A decisão já ocorreu; este protocolo apenas a apresenta.

## Responsabilidades

- Verificar que o `HumanReviewResult` fornecido é elegível para entrega (`reviewStatus: "VALIDATED"`, `reviewAction` `APPROVE` ou `ADJUST`, exatamente três `approvedProviderIds`).
- Verificar a cadeia completa de rastreabilidade: a CompatibilityMatrix corresponde à referenciada pelo HumanReviewResult; o DecisionContext corresponde ao referenciado pela CompatibilityMatrix; o DecisionCase corresponde ao referenciado (indiretamente) pelo DecisionContext.
- Buscar os dados de apresentação institucional dos três providers aprovados via uma porta de leitura dedicada — nunca inventar quando ausentes.
- Compor a `FinalCuradoria`: resumo do caso, resumo do contexto, apresentação de cada um dos três providers (com forças e limitações preservadas fielmente da CompatibilityMatrix), explicação do Método, disclaimer obrigatório, e próximos passos.
- Preservar a proveniência da decisão humana (quem validou, quando, a partir de qual `HumanReviewResult`).

## Não Responsabilidades

O P010 nunca:

- Toma uma nova decisão.
- Troca, adiciona ou remove um provider aprovado.
- Altera uma justificativa já validada.
- Oculta uma limitação relevante.
- Inventa evidência.
- Acrescenta diagnóstico, interpreta exame ou sugere tratamento.
- Reabre a análise de compatibilidade.
- Aceita `REJECT` ou `REQUEST_MORE_INFORMATION` como entrada válida.
- Produz um documento com ranking, score, percentual, "vencedor" ou "melhor opção".

## Entradas

- `HumanReviewResult` com `reviewStatus: "VALIDATED"` (produzido pelo P009).
- `CompatibilityMatrix` (produzida pelo P007) — deve corresponder exatamente à referenciada pelo `HumanReviewResult`.
- `DecisionCase` e `DecisionContext` — usados para compor `decisionSummary`/`clientContextSummary`; devem corresponder à cadeia de origem já registrada (DecisionContext referenciado pela CompatibilityMatrix; DecisionCase referenciado pelo DecisionContext).
- `ProviderPresentationRepository` — porta de leitura dos dados institucionais de apresentação dos três providers aprovados.
- `presentation` — o conteúdo em linguagem natural já produzido (resumos, explicação do Método, disclaimer, próximos passos, e a narrativa de "por que este provider foi incluído" por provider). Ver "Autoria do conteúdo em linguagem natural" abaixo.

## Pré-condições

- `reviewStatus` deve ser `"VALIDATED"`.
- `reviewAction` deve ser `"APPROVE"` ou `"ADJUST"`.
- `approvedProviderIds` deve ter exatamente três entradas.
- Todos os providers aprovados devem existir na CompatibilityMatrix fornecida.
- As referências entre os artefatos de origem devem ser consistentes (rastreabilidade da cadeia completa).
- As informações de apresentação dos três providers devem estar disponíveis via a porta — caso contrário, o P010 bloqueia com erro estruturado, nunca preenche a lacuna.

## Autoria do conteúdo em linguagem natural — alternativa escolhida e motivo

**Alternativa adotada:** o conteúdo em prosa (resumos, explicação do Método, disclaimer, próximos passos, narrativa de inclusão por provider) é recebido já pronto via o parâmetro `presentation` — o mesmo padrão já usado por P002/P003/P004 para conteúdo que exige geração/interpretação de linguagem natural, fora do escopo de código determinístico (Framework, seção 4: "ACE é LLM Agnostic"). O que este protocolo verifica mecanicamente é a **ausência de vocabulário de ranking/vencedor** nesse texto (`assertNoForbiddenLanguage`, `artifacts/final-curadoria.ts`) — nunca a autoria do conteúdo em si.

**Alternativa descartada:** compor a prosa inteiramente em código TypeScript determinístico (templates). Descartada porque geração de linguagem natural de qualidade (tom humano, acolhedor, fiel ao Manual de Voz) não é uma tarefa determinística nem estruturalmente fechada — colocá-la dentro do código do protocolo violaria o mesmo princípio já aplicado a P002-P004.

## Estrutura mínima da FinalCuradoria

- `caseReference` — referência ao DecisionCase de origem.
- `humanReviewReference` — referência ao HumanReviewResult de origem (herdado de `DeliveryArtifact`).
- `validatedBy` / `validatedAt` — proveniência da decisão humana (herdado de `DeliveryArtifact`).
- `generatedAt` — quando esta entrega específica foi gerada.
- `decisionSummary` — resumo, em linguagem simples, da decisão que o cliente busca.
- `clientContextSummary` — resumo, em linguagem simples, do contexto modelado pelo P004.
- `providerPresentations` — exatamente três, em ordem neutra por `providerId`.
- `comparisonSummary` — explica que não há ranking entre os três.
- `relevantLimitations` / `relevantMissingInformation` — preservadas da CompatibilityMatrix, prefixadas por `providerId`.
- `nextSteps` — orientação prática ao cliente.
- `methodExplanation` — o que significa a curadoria da Aliviar.
- `disclaimer` — nunca substitui consulta, diagnóstico ou tratamento médico.
- `producedBy`, `version`, `createdAt` (herdados de `Artifact`), `methodVersion` (herdado de `DeliveryArtifact`).

Cada `ProviderPresentation` contém: `providerId`, `displayName`, `professionalSummary`, `whyIncluded`, `strengthsForThisCase`, `relevantLimitations`, `practicalConsiderations`.

## Arquitetura de autoridade — DeliveryArtifact

`FinalCuradoria` estende **`DeliveryArtifact`** (`core/artifact-contract.ts`), não `HumanDecisionArtifact`: `decisional` é sempre `false` — a decisão já ocorreu no P009; o P010 nunca a replica ou reabre. `DeliveryArtifact` modela, na própria base, a proveniência da decisão humana (`validatedBy`, `validatedAt`, `humanReviewReference`, `methodVersion`) — para que nenhum artefato de entrega possa existir sem apontar exatamente qual decisão humana ele materializa.

## Porta de dados de apresentação — alternativa escolhida e motivo

**Alternativa adotada:** uma porta nova, `ProviderPresentationRepository` (`src/modules/ace/ports/provider-presentation-repository.ts`), retornando `CareProviderPresentation` — apenas `providerId`, `displayName`, `professionalSummary`, `practicalConsiderations`.

**Alternativa descartada:** reaproveitar `ProviderProfileRepository` (P007). Descartada porque seus campos (`competencyAreas`, `experienceLevel`, `intakeApproach`, `offersContinuousCare`, `availabilityWindow`) são dados de **análise**, nunca pensados para exibição ao cliente — reaproveitá-la misturaria dado de análise com dado de apresentação, violando a separação explicitamente exigida nesta sprint. `strengthsForThisCase`/`relevantLimitations` (por provider) continuam vindo da CompatibilityMatrix (análise, já correta), nunca da nova porta.

## Fluxo

1. Validar as pré-condições sobre o `HumanReviewResult`.
2. Validar a cadeia de rastreabilidade (CompatibilityMatrix ↔ HumanReviewResult ↔ DecisionContext ↔ DecisionCase).
3. Verificar que todos os `approvedProviderIds` existem na CompatibilityMatrix.
4. Buscar os dados de apresentação dos três providers aprovados; se algum estiver ausente, bloquear com erro estruturado.
5. Montar cada `ProviderPresentation`, combinando dado de apresentação (porta) com dado de análise (CompatibilityMatrix) e a narrativa de inclusão (`presentation`).
6. Agregar limitações e informações ausentes relevantes dos três providers aprovados.
7. Construir e versionar a `FinalCuradoria`, com verificação mecânica de ausência de vocabulário de ranking/vencedor em todo texto livre.

## Regras

- Este protocolo herda integralmente as restrições do Kernel.
- `providerPresentations` sempre tem exatamente três entradas, em ordem neutra e determinística por `providerId`.
- Nenhum provider fora de `approvedProviderIds` pode aparecer na entrega.
- Nenhum texto pode conter vocabulário de ranking/vencedor (`assertNoForbiddenLanguage`).
- Determinístico: a mesma entrada produz a mesma saída.

## Critérios de Aceitação

- [ ] `FinalCuradoria` só é produzida quando `reviewStatus` é `VALIDATED`.
- [ ] `providerPresentations` contém exatamente os três `approvedProviderIds`, em ordem neutra.
- [ ] Nenhum provider é trocado, adicionado ou removido em relação ao `HumanReviewResult`.
- [ ] Forças e limitações são preservadas fielmente da CompatibilityMatrix.
- [ ] Nenhum vocabulário de ranking/vencedor está presente em nenhum texto.
- [ ] A proveniência da decisão humana (`validatedBy`, `validatedAt`, `humanReviewReference`) está sempre presente.
- [ ] `FinalCuradoria` é imutável após a criação, com `decisional: false`.
- [ ] O resultado é idêntico para a mesma entrada (determinismo).

## Casos de Exceção

- **`reviewStatus` diferente de `VALIDATED`**: a execução é rejeitada antes de qualquer processamento.
- **Provider aprovado ausente na CompatibilityMatrix**: a execução é rejeitada (inconsistência da cadeia).
- **Dados de apresentação ausentes para um provider aprovado**: a execução é rejeitada com erro estruturado — nunca preenchida criativamente.

## Dependências

- `docs/ace/00-constitution/constitution.md` — Princípio 9.
- `docs/ace/03-kernel/kernel.md` — seção 6 (`DeliveryArtifact`) e 1.1 (política de campos).
- `docs/DECISIONS.md` — ADR-015, ADR-016 (DeliveryArtifact).
- P009 (produz o HumanReviewResult de entrada); P007 (produz a CompatibilityMatrix).
- Nenhum protocolo além do P010 é antecipado — o pipeline do ACE está estruturalmente completo em P001-P010.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P010 — Final Curadoria Delivery, especificada na Sprint 11. Último protocolo do pipeline do ACE (P001-P010). |
