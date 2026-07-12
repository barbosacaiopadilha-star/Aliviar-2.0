# Exemplos — P008 (Shortlist Builder)

## Exemplo 1 — exatamente três providers qualificados

CompatibilityMatrix com três entradas (`provider-A`, `provider-B`, `provider-C`), todas com `competencyAlignment` e `experienceAlignment` diferentes de `INSUFFICIENT`.

- `status`: `"COMPOSED"`
- `selectedProviderIds`: `["provider-A", "provider-B", "provider-C"]`
- `providerRationales`: uma entrada por provider, citando as dimensões `STRONG`, limitações e informações ausentes de cada um.
- `compositionRationale`: "Os 3 Care Providers elegíveis atendem aos requisitos essenciais de competência e experiência."

## Exemplo 2 — mais de três providers qualificados (bloqueado por composição ambígua, corrigido na Sprint 10)

CompatibilityMatrix com cinco entradas qualificadas: `provider-D`, `provider-B`, `provider-A`, `provider-E`, `provider-C`.

- `status`: `"BLOCKED"`
- `blockedReason`: `"AMBIGUOUS_COMPOSITION"`
- `selectedProviderIds`: `[]` — o P008 nunca escolhe três entre eles por ordem alfabética ou qualquer outro critério de desempate, pois isso seria um ranking disfarçado.
- `candidateProviderIds`: `["provider-A", "provider-B", "provider-C", "provider-D", "provider-E"]` — todos os cinco preservados, em ordem alfabética apenas para serialização.
- `providerRationales`: uma entrada por candidato, com a mesma justificativa individual que teriam se tivessem sido selecionados.
- `compositionRationale`: "5 Care Providers atendem igualmente aos requisitos essenciais, e a CompatibilityMatrix não contém critério legítimo para reduzir esse conjunto a três sem arbitrariedade. Todos os 5 candidatos aptos foram preservados para revisão humana (P009) — o Método nunca desempata por ordem alfabética ou qualquer outro critério que equivalha a um ranking disfarçado."
- A resolução (qual/quais três compõem a Shortlist final) é uma decisão humana, feita no P009 — nunca mecânica.

## Exemplo 3 — menos de três providers avaliados (bloqueado por opções insuficientes)

CompatibilityMatrix com apenas duas entradas.

- `status`: `"BLOCKED"`
- `blockedReason`: `"INSUFFICIENT_OPTIONS"`
- `selectedProviderIds`: `[]`
- `compositionRationale`: "A CompatibilityMatrix contém apenas 2 Care Provider(s) avaliado(s) — são necessários ao menos 3 para compor uma Shortlist."

## Exemplo 4 — providers suficientes, mas poucos qualificados (bloqueado por evidências insuficientes)

CompatibilityMatrix com quatro entradas, mas apenas um provider com `competencyAlignment`/`experienceAlignment` diferentes de `INSUFFICIENT` (os outros três tiveram o perfil completo não encontrado no P007).

- `status`: `"BLOCKED"`
- `blockedReason`: `"INSUFFICIENT_EVIDENCE"`
- `candidateProviderIds`: `["provider-A"]` — o único qualificado é preservado, mesmo sem atingir três.
- `compositionRationale`: "Apenas 1 de 4 Care Providers avaliados atendem aos requisitos essenciais de competência e experiência — são necessários ao menos 3 para compor uma Shortlist. O Método nunca reduz o padrão de qualidade apenas para completar três nomes."
- `relevantLimitations`/`missingInformation`: agregam as limitações/lacunas de todos os quatro providers avaliados, prefixadas pelo `providerId` — transparência total sobre por que a Shortlist não pôde ser composta.

## Exemplo 5 — restrição obrigatória registrada não impede a qualificação

Mesmo quando `constraintAlignment` é `INSUFFICIENT` para todos os providers (porque o caso tem uma Restrição Obrigatória e o perfil dos providers ainda não tem dado estruturado para verificá-la — ver P007, ADR-015), a qualificação para a Shortlist não é bloqueada por isso: `constraintAlignment` não é uma das duas dimensões essenciais. A informação ausente é preservada em `missingInformation` da Shortlist, nunca ocultada.
