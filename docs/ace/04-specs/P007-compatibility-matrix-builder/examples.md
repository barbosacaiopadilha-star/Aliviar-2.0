# Exemplos — P007 (Compatibility Matrix Builder)

Reaproveita o CompetencyProfile e o EligibleProviderSet do exemplo "Múltiplos elegíveis" de `docs/ace/04-specs/P006-eligible-provider-set-builder/examples.md` (`provider-A`, `provider-E`, domínio `saude_emocional_mental`, foco `acompanhamento_continuo`, experiência `geral`), e o DecisionContext correspondente (`decisionType: buscar_acompanhamento`, `strategy: conexao_direta`, `urgency: nao_determinado`).

## Perfis completos consultados (ProviderProfileRepository)

| providerId | experienceLevel | intakeApproach | offersContinuousCare | availabilityWindow |
|---|---|---|---|---|
| provider-A | geral | conexao_direta | true | flexible |
| provider-E | altamente_experiente | avaliacao_inicial | null | null |

## Avaliação — provider-A (forte alinhamento)

- `competencyAlignment`: `STRONG` — possui a área de competência exigida.
- `experienceAlignment`: `ADEQUATE` — nível de experiência exatamente igual ao exigido (geral).
- `contextAlignment`: `NOT_APPLICABLE` — urgência não determinada no caso.
- `strategyAlignment`: `ADEQUATE` — abordagem de intake ("conexao_direta") corresponde exatamente à estratégia do caso.
- `constraintAlignment`: `NOT_APPLICABLE` — o caso não tem nenhuma restrição obrigatória registrada.
- `continuityAlignment`: `STRONG` — o cliente busca acompanhamento contínuo e o provider oferece.
- `strengths`: ["Forte alinhamento em competência.", "Forte alinhamento em continuidade de cuidado."]
- `limitations`: []
- `rationale`: "Avaliação determinística a partir do Contexto de Decisão e do Perfil de Competência — 2 força(s) e 0 limitação(ões) identificadas."

## Avaliação — provider-E (experiência superior, mas dado insuficiente em duas dimensões)

- `competencyAlignment`: `STRONG`.
- `experienceAlignment`: `STRONG` — nível de experiência (altamente_experiente) excede o exigido (geral).
- `contextAlignment`: `NOT_APPLICABLE` — urgência não determinada.
- `strategyAlignment`: `PARTIAL` — abordagem de intake ("avaliacao_inicial") diverge da estratégia do caso ("conexao_direta"), mas não desqualifica.
- `constraintAlignment`: `NOT_APPLICABLE`.
- `continuityAlignment`: `INSUFFICIENT` — o repositório não tem essa informação registrada (`offersContinuousCare: null`) e o caso busca acompanhamento contínuo.
- `strengths`: ["Forte alinhamento em competência.", "Forte alinhamento em experiência."]
- `limitations`: ["Alinhamento parcial em estratégia de abordagem.", "Dado insuficiente para avaliar em continuidade de cuidado."]

## Exemplo — restrição obrigatória registrada (ADR-015, Sprint 9)

Se o DecisionCase de origem registrou uma Restrição Obrigatória (ex.: "Não pode ser presencial"), ela chega ao P007 via `decisionContext.mandatoryConstraints`. Como o `CareProviderProfile` ainda não tem nenhum campo estruturado sobre modalidade de atendimento, `constraintAlignment` é `INSUFFICIENT` para todo provider, com a restrição registrada em `missingInformation` (nunca inventada uma verificação):

- `constraintAlignment`: `INSUFFICIENT` — existe restrição obrigatória, mas o perfil do provider não tem dado estruturado para verificá-la.
- `evidence`: [`Restrição obrigatória: "Não pode ser presencial.".`]
- `missingInformation` (da entrada): inclui `"Dado insuficiente para avaliar restrições."`.

## Exemplo de perfil completo ausente

Se o ProviderProfileRepository não retornar o perfil de um provider presente no EligibleProviderSet (ex.: falha temporária de disponibilidade do repositório), esse provider **continua aparecendo em `assessments`**, com todas as dimensões dependentes de perfil marcadas `INSUFFICIENT`, `constraintAlignment` como `NOT_APPLICABLE`, e uma limitação explícita registrando que o perfil completo não foi encontrado — nunca removido, nunca com dado inventado.
