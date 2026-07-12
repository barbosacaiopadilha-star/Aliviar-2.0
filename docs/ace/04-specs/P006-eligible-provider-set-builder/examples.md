# Exemplos — P006 (Eligible Provider Set Builder)

Reaproveita o CompetencyProfile do Exemplo 1 de `docs/ace/04-specs/P005-competency-profile-builder/examples.md`: `domain: saude_emocional_mental`, `focus: acompanhamento_continuo`, `experienceLevel: geral`.

## Candidatos consultados (Provider Repository, `findByDomain("saude_emocional_mental")`)

| providerId | status | competencyAreas | experienceLevel |
|---|---|---|---|
| provider-A | active | `[{saude_emocional_mental, acompanhamento_continuo}]` | geral |
| provider-B | active | `[{saude_emocional_mental, avaliacao}]` | altamente_experiente |
| provider-C | inactive | `[{saude_emocional_mental, acompanhamento_continuo}]` | experiente |
| provider-D | active | `[{saude_fisica, intervencao}]` | altamente_experiente |
| provider-E | active | `[{saude_emocional_mental, acompanhamento_continuo}]` | geral |

*(provider-D não apareceria nem seria retornado pela consulta por domínio "saude_emocional_mental" — incluído aqui só para ilustrar por que ele nunca chega a ser avaliado.)*

## Saída (EligibleProviderSet)

- `evaluatedCandidates`:
  - `provider-A`: elegível — "Atende a todos os requisitos: domínio, foco e nível de experiência compatíveis."
  - `provider-B`: inelegível — "Provider possui o domínio exigido, mas não o foco exigido (\"acompanhamento_continuo\")." *(foco incompatível — o provider tem foco "avaliacao")*
  - `provider-C`: inelegível — "Provider inativo — não pode ser considerado elegível."
  - `provider-E`: elegível — "Atende a todos os requisitos: domínio, foco e nível de experiência compatíveis."
- `eligibleProviderIds`: `["provider-A", "provider-E"]` (ordem alfabética — sem qualquer relação com adequação relativa entre os dois)
- `sourceArtifacts`: referência ao CompetencyProfile de origem, por id e versão.

## Exemplo de experiência insuficiente

Reaproveitando o CompetencyProfile do Exemplo 3 de `docs/ace/04-specs/P005-competency-profile-builder/examples.md` (`experienceLevel: altamente_experiente`):

- `provider-A` (geral): inelegível — "Nível de experiência insuficiente — requer \"altamente_experiente\", provider tem \"geral\"."

## Exemplo sem nenhum elegível

Se todos os candidatos retornados forem inativos ou não corresponderem ao domínio/foco/experiência exigidos: `eligibleProviderIds` é `[]`, mas `evaluatedCandidates` continua contendo a avaliação (e o motivo) de cada um — nunca fica vazio se havia candidatos a avaliar.
