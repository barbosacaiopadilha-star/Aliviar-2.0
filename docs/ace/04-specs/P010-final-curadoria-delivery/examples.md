# Exemplos — P010 (Final Curadoria Delivery)

## Exemplo 1 — entrega após APPROVE

`HumanReviewResult` com `reviewAction: "APPROVE"`, `approvedProviderIds: ["provider-A", "provider-B", "provider-C"]`.

- `providerPresentations` contém exatamente três entradas, em ordem alfabética.
- `comparisonSummary`: "Os três providers foram selecionados por compatibilidade com o seu caso, segundo os critérios do Método Aliviar. A ordem de apresentação é neutra e não representa preferência."
- `disclaimer`: "Esta curadoria não substitui consulta, diagnóstico ou tratamento médico."

## Exemplo 2 — entrega após ADJUST válido

`HumanReviewResult` com `reviewAction: "ADJUST"`, resolvendo uma Shortlist bloqueada por composição ambígua, `approvedProviderIds: ["provider-B", "provider-D", "provider-E"]`.

- `providerPresentations` reflete exatamente esses três — nunca os originalmente sugeridos pelo P008 antes do ajuste humano.
- Cada `whyIncluded` cita as forças já registradas na CompatibilityMatrix para aquele provider específico.

## Exemplo 3 — rejeição de entrada inválida (REJECT)

`HumanReviewResult` com `reviewStatus: "REJECTED"`.

- O P010 rejeita a execução imediatamente — não há decisão validada para materializar.

## Exemplo 4 — dados de apresentação ausentes

Um dos três `approvedProviderIds` não é encontrado pelo `ProviderPresentationRepository` (ex.: falha temporária do repositório institucional).

- O P010 bloqueia a execução com um erro estruturado, citando o `providerId` ausente — nunca preenche `displayName`/`professionalSummary` com um valor inventado.

## Exemplo 5 — preservação de limitações relevantes

Um provider aprovado tem uma limitação registrada na CompatibilityMatrix (ex.: "Alinhamento parcial em estratégia de abordagem").

- Essa limitação aparece tanto em `relevantLimitations` da FinalCuradoria (prefixada pelo `providerId`) quanto em `relevantLimitations` da `ProviderPresentation` daquele provider especificamente — nunca omitida para tornar a apresentação mais atraente.
