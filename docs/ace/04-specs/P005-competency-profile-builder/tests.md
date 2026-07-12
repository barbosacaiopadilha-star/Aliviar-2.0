# Testes — P005 (Competency Profile Builder)

Critérios objetivos de validação, no formato Given/When/Then, derivados de `specification.md`.

**T01 — Tradução de decisionType em focus (todas as combinações)**
Given um DecisionContext com cada um dos quatro valores possíveis de `decisionType`,
When o P005 constrói o CompetencyProfile,
Then `focus` corresponde exatamente à tabela de mapeamento definida em `specification.md`.

**T02 — Tradução de complexity em experienceLevel (todas as combinações)**
Given um DecisionContext com cada um dos três valores possíveis de `complexity`,
When o P005 constrói o CompetencyProfile,
Then `experienceLevel` corresponde exatamente à tabela de mapeamento definida em `specification.md`.

**T03 — Domínio carregado sem alteração**
Given um DecisionContext com um `clinicalDomain` qualquer,
When o P005 constrói o CompetencyProfile,
Then `domain` é idêntico ao `clinicalDomain` de origem.

**T04 — Rastreabilidade**
Given um DecisionContext com id e versão conhecidos,
When o P005 produz o CompetencyProfile,
Then `sourceArtifacts` contém exatamente uma referência, com o id e a versão do DecisionContext.

**T05 — Ausência de especialidade, especialista, elegibilidade ou compatibilidade**
Given qualquer DecisionContext válido,
When o P005 constrói o CompetencyProfile,
Then nenhum campo do artefato resultante contém especialidade médica, nome de especialista, elegibilidade ou compatibilidade.

**T06 — Imutabilidade**
Given um CompetencyProfile já construído,
When qualquer código tenta modificar um de seus campos,
Then a modificação não tem efeito — o artefato permanece no seu estado original.

**T07 — decisional: false estrutural**
Given qualquer CompetencyProfile construído,
When o campo `decisional` é inspecionado,
Then seu valor é sempre `false` — nunca configurável por quem chama o construtor.

**T08 — Rejeição de campos proibidos**
Given uma tentativa de construir um CompetencyProfile cujo payload contenha um campo proibido (ex.: especialidade, especialista, compatibilidade),
When a construção é solicitada,
Then a construção falha com um erro de protocolo identificando o campo proibido, e nenhum CompetencyProfile é retornado.

**T09 — Transição P004 → P005 (ponta a ponta)**
Given um DecisionContext válido produzido pelo P004,
When o protocolo P005 é executado,
Then o CompetencyProfile resultante satisfaz todos os Critérios de Aceitação de `specification.md`, e o DecisionContext original permanece inalterado.
