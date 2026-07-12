# Testes — P006 (Eligible Provider Set Builder)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Todos os requisitos atendidos**
Given um candidato ativo, com domínio, foco e experiência compatíveis com o CompetencyProfile,
When o P006 avalia esse candidato,
Then ele é marcado elegível, com justificativa afirmando que todos os requisitos foram atendidos.

**T02 — Domínio incompatível**
Given um candidato cujas áreas de competência não incluem o domínio exigido,
When o P006 avalia esse candidato,
Then ele é marcado inelegível, com justificativa específica sobre domínio incompatível.

**T03 — Foco incompatível**
Given um candidato com o domínio exigido, mas nenhuma área com o foco exigido,
When o P006 avalia esse candidato,
Then ele é marcado inelegível, com justificativa específica sobre foco incompatível — distinta da mensagem de domínio incompatível.

**T04 — Experiência insuficiente**
Given um candidato com domínio e foco corretos, mas nível de experiência inferior ao exigido,
When o P006 avalia esse candidato,
Then ele é marcado inelegível, com justificativa específica sobre experiência insuficiente.

**T05 — Provider inativo**
Given um candidato com `status: "inactive"`, mesmo que domínio/foco/experiência sejam compatíveis,
When o P006 avalia esse candidato,
Then ele é marcado inelegível, com justificativa sobre inatividade — sem avaliar os demais critérios.

**T06 — Nenhum elegível**
Given um conjunto de candidatos em que nenhum atende a todos os critérios,
When o P006 executa,
Then `eligibleProviderIds` é um array vazio, e `evaluatedCandidates` contém a avaliação de cada candidato considerado.

**T07 — Múltiplos elegíveis**
Given um conjunto de candidatos em que mais de um atende a todos os critérios,
When o P006 executa,
Then todos aparecem em `eligibleProviderIds`, ordenados por `providerId`.

**T08 — Justificativa de cada exclusão**
Given qualquer candidato inelegível,
When o P006 registra sua avaliação,
Then `reason` não está vazio e descreve especificamente qual critério falhou.

**T09 — Ausência de ranking**
Given um EligibleProviderSet com múltiplos elegíveis,
When o artefato é inspecionado,
Then não existe nenhum campo de pontuação, ordem de relevância ou destaque — apenas o conjunto e a ordenação lexicográfica.

**T10 — Ordenação estável somente para serialização**
Given a mesma entrada executada múltiplas vezes,
When `eligibleProviderIds` é comparado entre as execuções,
Then a ordem é idêntica e estritamente por `providerId` — nunca varia entre execuções com os mesmos dados.

**T11 — Imutabilidade**
Given um EligibleProviderSet já construído,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito.

**T12 — producedBy correto**
Given qualquer EligibleProviderSet construído,
When o campo `producedBy` é inspecionado,
Then seu valor é sempre `"P006"`.

**T13 — Referência ao CompetencyProfile**
Given um CompetencyProfile com id e versão conhecidos,
When o P006 produz o EligibleProviderSet,
Then `sourceArtifacts` referencia exatamente esse id e versão, com `artifactType: "CompetencyProfile"`.

**T14 — Rejeição de campos proibidos**
Given uma tentativa de construir um EligibleProviderSet cujo payload contenha um campo proibido (ex.: diagnóstico, especialidade, compatibilidade),
When a construção é solicitada,
Then a construção falha com um erro de protocolo identificando o campo proibido.

**T15 — Independência da implementação do repositório**
Given duas implementações diferentes de `ProviderRepository` (ex.: duas instâncias de `InMemoryProviderRepository` com os mesmos dados) que retornam os mesmos candidatos para o mesmo domínio,
When o P006 é executado com cada uma,
Then o EligibleProviderSet resultante é equivalente — o protocolo não depende de nenhum detalhe de implementação além do contrato.

**T16 — Transição P005 → P006 (ponta a ponta)**
Given um CompetencyProfile válido produzido pelo P005,
When o protocolo P006 é executado com um Provider Repository de teste,
Then o EligibleProviderSet resultante satisfaz todos os Critérios de Aceitação de `specification.md`, e o CompetencyProfile original permanece inalterado.
