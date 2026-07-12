# Testes — P010 (Final Curadoria Delivery)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Entrega após APPROVE**
Given um HumanReviewResult VALIDATED com reviewAction APPROVE,
When o P010 executa,
Then a FinalCuradoria é produzida com os três approvedProviderIds.

**T02 — Entrega após ADJUST válido**
Given um HumanReviewResult VALIDATED com reviewAction ADJUST,
When o P010 executa,
Then a FinalCuradoria reflete exatamente os providers ajustados, nunca os originalmente sugeridos pelo P008.

**T03 — Rejeição de REJECT**
Given um HumanReviewResult com reviewStatus REJECTED,
When o P010 executa,
Then a execução é rejeitada antes de qualquer processamento.

**T04 — Rejeição de REQUEST_MORE_INFORMATION**
Given um HumanReviewResult com reviewStatus INFORMATION_REQUESTED,
When o P010 executa,
Then a execução é rejeitada.

**T05 — Exatamente três providers**
Given um HumanReviewResult (hipoteticamente) com approvedProviderIds de tamanho diferente de três,
When o P010 executa,
Then a execução é rejeitada.

**T06 — Provider aprovado ausente na matriz**
Given um approvedProviderId que não existe na CompatibilityMatrix fornecida,
When o P010 executa,
Then a execução é rejeitada.

**T07 — Dados de apresentação ausentes**
Given um approvedProviderId sem dado correspondente no ProviderPresentationRepository,
When o P010 executa,
Then a execução é rejeitada com erro estruturado, nunca preenchida criativamente.

**T08 — Fidelidade aos approvedProviderIds**
Given qualquer HumanReviewResult válido,
When a FinalCuradoria é inspecionada,
Then providerPresentations contém exatamente os mesmos providerIds de approvedProviderIds, nunca mais, nunca menos, nunca diferentes.

**T09 — Preservação das justificativas**
Given qualquer provider aprovado,
When strengthsForThisCase é inspecionado,
Then reflete exatamente entry.strengths da CompatibilityMatrix, sem reinterpretação.

**T10 — Preservação das limitações**
Given um provider aprovado com limitações registradas,
When relevantLimitations é inspecionado (na FinalCuradoria e na ProviderPresentation),
Then as limitações aparecem, prefixadas pelo providerId quando agregadas.

**T11 — Preservação das informações ausentes**
Given um provider aprovado com informações ausentes registradas,
When relevantMissingInformation é inspecionado,
Then as informações ausentes aparecem, prefixadas pelo providerId.

**T12 — Ordem neutra**
Given os mesmos três approvedProviderIds em qualquer ordem de entrada,
When a FinalCuradoria é produzida,
Then providerPresentations está sempre em ordem alfabética por providerId.

**T13 — Ausência de ranking**
Given qualquer FinalCuradoria produzida,
When o texto é inspecionado,
Then nenhuma expressão de ranking/vencedor está presente.

**T14 — Ausência de score**
Given qualquer FinalCuradoria produzida,
When o texto é inspecionado,
Then nenhum percentual ou nota numérica está presente.

**T15 — Ausência de diagnóstico como campo estrutural**
Given qualquer FinalCuradoria produzida,
When o artefato é inspecionado,
Then não há nenhum campo "diagnosis" ou "treatment".

**T16 — Ausência de tratamento como campo estrutural**
Given o mesmo cenário de T15,
Then idem — nenhum campo estrutural de tratamento.

**T17 — Ausência de nova decisão**
Given qualquer FinalCuradoria produzida,
When decisional é inspecionado,
Then é sempre false — a decisão já ocorreu no P009.

**T18 — DeliveryArtifact com decisional false**
Given qualquer FinalCuradoria produzida,
Then estende DeliveryArtifact, nunca HumanDecisionArtifact.

**T19 — Proveniência da decisão humana**
Given um HumanReviewResult com reviewerId e reviewedAt conhecidos,
When a FinalCuradoria é produzida,
Then validatedBy e validatedAt correspondem exatamente, e humanReviewReference aponta para o HumanReviewResult correto.

**T20 — validatedBy e validatedAt**
Given o mesmo cenário de T19,
Then ambos os campos estão sempre presentes e não vazios.

**T21 — Imutabilidade**
Given uma FinalCuradoria já construída,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito.

**T22 — Versionamento**
Given qualquer FinalCuradoria construída,
When version é inspecionado,
Then é sempre 1.

**T23 — producedBy P010**
Given qualquer FinalCuradoria construída,
When producedBy é inspecionado,
Then é sempre "P010".

**T24 — Rastreabilidade completa P009 → P010**
Given uma CompatibilityMatrix que não corresponde à referenciada pelo HumanReviewResult,
When o P010 executa,
Then a execução é rejeitada.

**T25 — Independência da implementação da porta de dados**
Given duas implementações diferentes de ProviderPresentationRepository retornando os mesmos dados,
When o P010 é executado com cada uma,
Then a FinalCuradoria resultante é equivalente.

**T26 — Resultado determinístico**
Given a mesma entrada executada múltiplas vezes,
When os resultados são comparados,
Then são idênticos (exceto o `id`, gerado por versão).
