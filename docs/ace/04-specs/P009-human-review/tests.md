# Testes — P009 (Human Review)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Aprovação integral**
Given uma Shortlist `COMPOSED`,
When o revisor executa `APPROVE`,
Then `reviewStatus` é `VALIDATED` e `approvedProviderIds` é idêntico a `shortlist.selectedProviderIds`.

**T02 — Ajuste válido**
Given uma Shortlist (`COMPOSED` ou `BLOCKED`) e um conjunto de `changes` que só referencia providers presentes e qualificados na CompatibilityMatrix,
When o revisor executa `ADJUST`,
Then `reviewStatus` é `VALIDATED` e `approvedProviderIds` reflete exatamente a base mais as alterações aplicadas.

**T03 — Rejeição**
Given qualquer Shortlist,
When o revisor executa `REJECT` com justificativa,
Then `reviewStatus` é `REJECTED` e `approvedProviderIds` está vazio.

**T04 — Solicitação de mais informações**
Given qualquer Shortlist,
When o revisor executa `REQUEST_MORE_INFORMATION`,
Then `reviewStatus` é `INFORMATION_REQUESTED` e `approvedProviderIds` está vazio.

**T05 — Justificativa obrigatória**
Given qualquer ação,
When `reviewRationale` está vazio,
Then a construção falha.

**T06 — reviewerId obrigatório**
Given qualquer ação,
When `reviewerId` está vazio,
Then a construção falha.

**T07 — reviewedAt obrigatório**
Given qualquer ação,
When `reviewedAt` está vazio,
Then a construção falha.

**T08 — Alteração sem evidência**
Given uma alteração em `changes` sem `evidenceReferences`,
When o `HumanReviewResult` é construído,
Then a construção falha.

**T09 — Tentativa de incluir provider fora da matriz**
Given um `ADJUST` que tenta adicionar um `providerId` ausente da CompatibilityMatrix,
When o P009 executa,
Then a execução é rejeitada.

**T10 — Tentativa de incluir provider inelegível**
Given um `ADJUST` que tenta adicionar um `providerId` com `INSUFFICIENT` em `competencyAlignment` ou `experienceAlignment`,
When o P009 executa,
Then a execução é rejeitada.

**T11 — Shortlist bloqueada por menos de três opções**
Given uma Shortlist `BLOCKED` (`INSUFFICIENT_OPTIONS` ou `INSUFFICIENT_EVIDENCE`),
When o revisor tenta `APPROVE`,
Then a execução é rejeitada — não há composição para aprovar.

**T12 — Shortlist bloqueada por mais de três opções ambíguas**
Given uma Shortlist `BLOCKED` (`AMBIGUOUS_COMPOSITION`) com `candidateProviderIds` preservados,
When o P009 é inspecionado,
Then todos os candidatos aptos continuam disponíveis para a resolução humana via `ADJUST`.

**T13 — Resolução humana da composição ambígua**
Given o cenário de T12,
When o revisor executa `ADJUST` escolhendo exatamente três dos candidatos preservados,
Then `reviewStatus` é `VALIDATED` e `approvedProviderIds` reflete exatamente os três escolhidos.

**T14 — Preservação da Shortlist original**
Given qualquer execução do P009,
When a Shortlist original é comparada antes e depois,
Then permanece byte-a-byte idêntica.

**T15 — Preservação da CompatibilityMatrix**
Given qualquer execução do P009,
When a CompatibilityMatrix original é comparada antes e depois,
Then permanece byte-a-byte idêntica.

**T16 — Trilha completa das alterações**
Given um `ADJUST` com múltiplas alterações,
When `changes` é inspecionado,
Then cada alteração tem `type`, `providerId`, `rationale` e `evidenceReferences` não vazios.

**T17 — Ausência de aprovação automática**
Given qualquer execução do P009,
When `reviewAction` é inspecionado,
Then é sempre exatamente o que foi fornecido como entrada — nunca inferido ou decidido pelo protocolo.

**T18 — Produção de VALIDATED somente após APPROVE ou ADJUST válido**
Given as quatro ações possíveis executadas sobre o mesmo par Shortlist/CompatibilityMatrix,
When `reviewStatus` é comparado,
Then apenas `APPROVE` e `ADJUST` (válido) produzem `VALIDATED`; `REJECT` e `REQUEST_MORE_INFORMATION` nunca produzem.

**T19 — Imutabilidade**
Given um `HumanReviewResult` já construído,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito.

**T20 — Versionamento**
Given qualquer `HumanReviewResult` construído,
When `version` é inspecionado,
Then é sempre `1` (primeira versão).

**T21 — producedBy correto**
Given qualquer `HumanReviewResult` construído,
When `producedBy` é inspecionado,
Then é sempre `"P009"`.

**T22 — Transição P008 → P009**
Given uma CompatibilityMatrix que não corresponde à Shortlist fornecida (id/versão diferentes),
When o P009 executa,
Then a execução é rejeitada antes de processar qualquer ação.
