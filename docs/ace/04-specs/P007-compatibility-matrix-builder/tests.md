# Testes — P007 (Compatibility Matrix Builder)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Provider com forte alinhamento**
Given um provider cuja competência, experiência e continuidade excedem ou atendem exatamente aos requisitos,
When o P007 avalia esse provider,
Then as dimensões correspondentes são `STRONG` ou `ADEQUATE`, e ele aparece em `strengths`.

**T02 — Alinhamento adequado**
Given um provider cujo nível de experiência é exatamente igual ao exigido,
When o P007 avalia `experienceAlignment`,
Then o resultado é `ADEQUATE`, não `STRONG`.

**T03 — Alinhamento parcial**
Given um provider cuja abordagem de intake diverge da estratégia do caso,
When o P007 avalia `strategyAlignment`,
Then o resultado é `PARTIAL`, e a limitação correspondente é registrada.

**T04 — Alinhamento insuficiente**
Given um provider cujo `offersContinuousCare` é `null` e o caso busca acompanhamento contínuo,
When o P007 avalia `continuityAlignment`,
Then o resultado é `INSUFFICIENT`, e a limitação registra dado insuficiente.

**T05 — Dimensão não aplicável**
Given um DecisionContext com `decisionType` diferente de "buscar_acompanhamento",
When o P007 avalia `continuityAlignment`,
Then o resultado é `NOT_APPLICABLE`.

**T06 — Dado insuficiente sem invenção**
Given um provider cujo perfil completo não é retornado pelo ProviderProfileRepository,
When o P007 processa esse provider,
Then ele aparece em `assessments` com dimensões `INSUFFICIENT`, nunca com um valor inventado, e uma limitação explícita.

**T07 — Múltiplos providers**
Given um EligibleProviderSet com mais de um provider,
When o P007 executa,
Then `assessments` contém uma avaliação para cada um.

**T08 — Nenhum provider perdido**
Given um EligibleProviderSet com N providers,
When o P007 executa,
Then `assessments` tem exatamente N entradas, cobrindo todos os ids do EligibleProviderSet.

**T09 — Ausência de ranking**
Given uma CompatibilityMatrix construída,
When o artefato é inspecionado,
Then não há nenhum campo que ordene ou classifique providers por relevância.

**T10 — Ausência de score global**
Given uma CompatibilityMatrix construída,
When o artefato é inspecionado,
Then não há nenhum campo numérico de pontuação ou percentual.

**T11 — Forças e limitações**
Given qualquer avaliação de provider,
When `strengths` e `limitations` são inspecionados,
Then eles refletem exatamente as dimensões `STRONG` e `PARTIAL`/`INSUFFICIENT`, respectivamente.

**T12 — Justificativa por dimensão/avaliação**
Given qualquer avaliação de provider,
When `rationale` é inspecionado,
Then não está vazio.

**T13 — Resultado determinístico**
Given a mesma entrada executada múltiplas vezes,
When os resultados são comparados,
Then são idênticos.

**T14 — Imutabilidade**
Given uma CompatibilityMatrix já construída,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito.

**T15 — producedBy correto**
Given qualquer CompatibilityMatrix construída,
When o campo `producedBy` é inspecionado,
Then seu valor é sempre `"P007"`.

**T16 — Referências aos três artefatos de origem**
Given um DecisionContext, um CompetencyProfile e um EligibleProviderSet com ids e versões conhecidos,
When o P007 produz a CompatibilityMatrix,
Then `sourceArtifacts` contém exatamente essas três referências.

**T17 — Rejeição de campos reservados de P008+**
Given uma tentativa de construir uma CompatibilityMatrix cujo payload contenha um campo reservado a um estágio posterior (ex.: `shortlist`),
When a construção é solicitada,
Then a construção falha com um erro de protocolo.

**T18 — Aceitação legítima de campos de compatibilidade no P007**
Given uma CompatibilityMatrix construída normalmente pelo P007 (contendo `competencyAlignment`, `strategyAlignment` etc.),
When a construção é validada,
Then nenhuma exceção ad hoc é necessária — a política de campos permite esses nomes a partir do P007.

**T19 — Bloqueio desses mesmos campos em P002-P006**
Given uma tentativa de incluir `compatibility`/`compatibilityMatrix` em um DecisionCase, CaseAudit, DecisionContext, CompetencyProfile ou EligibleProviderSet,
When a construção é solicitada,
Then a construção falha — os mesmos campos que o P007 usa legitimamente continuam proibidos antes dele.

**T20 — Independência da implementação do repositório**
Given duas implementações diferentes de `ProviderProfileRepository` retornando os mesmos perfis,
When o P007 é executado com cada uma,
Then a CompatibilityMatrix resultante é equivalente.

**T21 — Transição P006 → P007 (ponta a ponta)**
Given um EligibleProviderSet válido produzido pelo P006,
When o protocolo P007 é executado com um ProviderProfileRepository de teste,
Then a CompatibilityMatrix resultante satisfaz todos os Critérios de Aceitação de `specification.md`, e o DecisionContext, CompetencyProfile e EligibleProviderSet originais permanecem inalterados.
