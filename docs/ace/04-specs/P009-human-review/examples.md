# Exemplos — P009 (Human Review)

## Exemplo 1 — APPROVE de uma Shortlist COMPOSED

Shortlist `COMPOSED` com `selectedProviderIds: ["provider-A", "provider-B", "provider-C"]`.

- `reviewAction`: `"APPROVE"`
- `reviewStatus` resultante: `"VALIDATED"`
- `approvedProviderIds`: `["provider-A", "provider-B", "provider-C"]` (idêntico à Shortlist)
- `changes`: `[]`
- `reviewRationale`: "Os três providers atendem adequadamente ao caso; não há necessidade de ajuste."

## Exemplo 2 — ADJUST resolvendo uma Shortlist BLOCKED (AMBIGUOUS_COMPOSITION)

Shortlist `BLOCKED` (`blockedReason: "AMBIGUOUS_COMPOSITION"`) com `candidateProviderIds: ["provider-A", "provider-B", "provider-C", "provider-D", "provider-E"]`.

- `reviewAction`: `"ADJUST"`
- `changes`: três entradas `type: "added"` (`provider-B`, `provider-D`, `provider-E`) — a base era vazia (Shortlist estava `BLOCKED`), então toda escolha é uma adição, nunca uma remoção.
- `approvedProviderIds`: `["provider-B", "provider-D", "provider-E"]`
- `reviewRationale`: "Escolha baseada em critérios operacionais (ex.: proximidade geográfica) que estão fora do escopo do que o ACE modela — a CompatibilityMatrix já havia confirmado que os cinco são igualmente fundamentados."
- `reviewStatus` resultante: `"VALIDATED"`

## Exemplo 3 — ADJUST substituindo um provider de uma Shortlist COMPOSED

Shortlist `COMPOSED` com `["provider-A", "provider-B", "provider-C"]`. O revisor decide substituir `provider-C` por `provider-D` (também presente e qualificado na CompatibilityMatrix).

- `changes`: `[{ type: "removed", providerId: "provider-C", ... }, { type: "added", providerId: "provider-D", ... }]`
- `approvedProviderIds`: `["provider-A", "provider-B", "provider-D"]`

## Exemplo 4 — tentativa de ADJUST inválida (provider fora da matriz)

O revisor tenta adicionar `provider-Z`, que não aparece em nenhuma entrada da CompatibilityMatrix (foi excluído já pelo P006, ou nunca existiu).

- O P009 rejeita a execução com um erro de protocolo, explicando que o provider não está presente na CompatibilityMatrix e que, se necessário, o caso deve retornar ao estágio apropriado do pipeline (`returnToProtocol: "P006"`, via uma nova chamada com `reviewAction: "REQUEST_MORE_INFORMATION"` ou `"REJECT"`) — nunca inserido informalmente no P009.

## Exemplo 5 — REJECT

Shortlist `COMPOSED`, mas o revisor entende que nenhum dos três providers atende ao caso de forma responsável, apesar da análise do pipeline.

- `reviewAction`: `"REJECT"`
- `reviewStatus` resultante: `"REJECTED"`
- `approvedProviderIds`: `[]`
- `reviewRationale`: obrigatória — "Os três providers, embora tecnicamente qualificados, não têm disponibilidade real compatível com a urgência do caso, segundo verificação externa ao ACE."

## Exemplo 6 — REQUEST_MORE_INFORMATION

Shortlist bloqueada por `INSUFFICIENT_OPTIONS` (menos de três providers avaliados no total).

- `reviewAction`: `"REQUEST_MORE_INFORMATION"`
- `reviewStatus` resultante: `"INFORMATION_REQUESTED"`
- `returnToProtocol`: `"P006"` — o caso deve retomar a busca de Care Providers elegíveis, não prosseguir com poucos candidatos.
