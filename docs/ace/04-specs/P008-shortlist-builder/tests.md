# Testes — P008 (Shortlist Builder)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Exatamente três providers válidos**
Given uma CompatibilityMatrix com exatamente três providers qualificados,
When o P008 executa,
Then `status` é `COMPOSED` e `selectedProviderIds` contém os três, em ordem alfabética.

**T02 — Mais de três candidatos igualmente fundamentados (corrigido na Sprint 10)**
Given uma CompatibilityMatrix com mais de três providers qualificados,
When o P008 executa,
Then `status` é `BLOCKED` com `blockedReason: "AMBIGUOUS_COMPOSITION"` — o P008 nunca escolhe três deles por ordem alfabética ou qualquer outro critério de desempate.

**T02b — Preservação de todos os candidatos aptos em composição ambígua**
Given o mesmo cenário de T02,
When a Shortlist bloqueada é inspecionada,
Then `candidateProviderIds` contém todos os providers qualificados (não apenas três), cada um com justificativa individual em `providerRationales`.

**T02c — providerId apenas organiza, nunca seleciona**
Given a mesma CompatibilityMatrix de T02, com as entradas apresentadas em ordens diferentes,
When o P008 executa em ambos os casos,
Then `candidateProviderIds` é idêntico (mesmo conjunto, mesma ordem alfabética) em ambas as execuções — a ordem de entrada nunca influencia quais candidatos são preservados.

**T03 — Menos de três candidatos**
Given uma CompatibilityMatrix com menos de três providers avaliados no total,
When o P008 executa,
Then `status` é `BLOCKED`, com o motivo explícito.

**T04 — Menos de três análises suficientemente fundamentadas**
Given uma CompatibilityMatrix com três ou mais providers avaliados, mas menos de três qualificados,
When o P008 executa,
Then `status` é `BLOCKED`, distinguindo esse motivo do caso de poucos candidatos totais.

**T05 — Provider com informação insuficiente em requisito essencial**
Given um provider cujo `competencyAlignment` ou `experienceAlignment` é `INSUFFICIENT`,
When o P008 avalia a qualificação,
Then esse provider é excluído da composição, mesmo que outras dimensões estejam bem avaliadas.

**T06 — Justificativa individual**
Given uma Shortlist `COMPOSED`,
When `providerRationales` é inspecionado,
Then cada provider selecionado tem uma justificativa própria, não vazia.

**T07 — Justificativa da composição**
Given qualquer Shortlist (`COMPOSED` ou `BLOCKED`),
When `compositionRationale` é inspecionado,
Then não está vazio.

**T08 — Limitações preservadas**
Given um provider selecionado com dimensões `PARTIAL`,
When a Shortlist é construída,
Then `relevantLimitations` contém a limitação correspondente, prefixada pelo `providerId`.

**T09 — Informação ausente preservada**
Given um provider selecionado com dimensões `INSUFFICIENT` não essenciais,
When a Shortlist é construída,
Then `missingInformation` contém a lacuna correspondente, prefixada pelo `providerId`.

**T10 — Ausência de ranking**
Given uma Shortlist construída,
When o artefato é inspecionado,
Then não há nenhum campo de posição, rank ou vencedor.

**T11 — Ausência de score**
Given uma Shortlist construída,
When o artefato é inspecionado,
Then não há nenhum campo numérico de pontuação ou percentual.

**T12 — Ordem neutra e determinística**
Given a mesma CompatibilityMatrix, com providers apresentados em ordens diferentes,
When o P008 executa,
Then `selectedProviderIds` é idêntico e sempre em ordem alfabética.

**T13 — Resultado bloqueado sem forçar três nomes**
Given uma CompatibilityMatrix sem exatamente três providers qualificados (seja para menos ou para mais),
When o P008 executa,
Then `selectedProviderIds` está sempre vazio quando `BLOCKED` — nunca uma composição parcial ou arbitrária, e `blockedReason` sempre distingue a causa exata (`INSUFFICIENT_OPTIONS`, `INSUFFICIENT_EVIDENCE` ou `AMBIGUOUS_COMPOSITION`).

**T14 — Imutabilidade**
Given uma Shortlist já construída,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito.

**T15 — producedBy correto**
Given qualquer Shortlist construída,
When o campo `producedBy` é inspecionado,
Then seu valor é sempre `"P008"`.

**T16 — decisional: false**
Given qualquer Shortlist construída,
When o campo `decisional` é inspecionado,
Then seu valor é sempre `false`.

**T17 — Rastreabilidade até a CompatibilityMatrix**
Given uma CompatibilityMatrix com id e versão conhecidos,
When o P008 produz a Shortlist,
Then `sourceArtifact` referencia exatamente essa CompatibilityMatrix, por id e versão.

**T18 — Rejeição de campos reservados de P009 e P010**
Given uma tentativa de construir uma Shortlist cujo payload contenha `validationDecision` (P009) ou `finalCuradoria` (P010),
When a construção é solicitada,
Then a construção falha com um erro de protocolo.

**T19 — Transição P007 → P008**
Given uma CompatibilityMatrix válida produzida pelo P007,
When o protocolo P008 é executado,
Then a CompatibilityMatrix original permanece inalterada, e a Shortlist resultante satisfaz todos os Critérios de Aceitação de `specification.md`.
