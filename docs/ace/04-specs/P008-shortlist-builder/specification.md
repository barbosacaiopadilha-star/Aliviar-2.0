# P008 — Shortlist Builder

## Objetivo

Transformar a CompatibilityMatrix (produzida pelo P007) em uma proposta de Shortlist composta por exatamente três Care Providers — uma análise comparável e explicável, nunca uma decisão, nunca um ranking, nunca uma escolha final.

## Responsabilidades

- Selecionar exatamente três Care Providers, usando exclusivamente informações já presentes na CompatibilityMatrix.
- Justificar individualmente a presença de cada provider selecionado (`providerRationales`).
- Justificar a composição do conjunto como um todo (`compositionRationale`).
- Preservar forças, limitações e informações ausentes relevantes dos providers selecionados — nunca ocultá-las.
- Referenciar a CompatibilityMatrix de origem, por id e versão (`sourceArtifact`).
- Produzir resultado determinístico para as mesmas entradas.
- Preservar imutabilidade, versionamento e rastreabilidade (mesmo padrão de todo artefato do ACE).
- Quando não houver três opções suficientemente fundamentadas, produzir um resultado `BLOCKED`, explicável, em vez de forçar uma composição com providers insuficientemente qualificados.

## Não Responsabilidades

O P008 nunca:

- Apresenta primeiro, segundo ou terceiro lugar.
- Declara um vencedor.
- Utiliza score numérico ou percentual.
- Inventa dados não presentes na CompatibilityMatrix.
- Oculta limitações ou informações ausentes dos providers selecionados.
- Altera a CompatibilityMatrix de origem.
- Decide pelo cliente.
- Produz uma Curadoria Validada.
- Inicia o P009 automaticamente.
- Reduz o padrão de qualidade apenas para completar três nomes quando não há três opções suficientemente fundamentadas.

## Entradas

- CompatibilityMatrix (produzida pelo P007).

## Pré-condições

- Nenhuma além da existência de uma CompatibilityMatrix válida — o P008 não reverifica a cadeia P004→P005→P006→P007 mecanicamente (cada protocolo anterior já garante sua própria consistência).

## Qualificação — critério adotado e motivo

**Alternativa adotada:** um Care Provider é "suficientemente fundamentado" (apto a compor a Shortlist) quando suas duas dimensões essenciais — `competencyAlignment` e `experienceAlignment` — **não** são `INSUFFICIENT`. Essas duas dimensões refletem o próprio critério de elegibilidade já aplicado pelo P006 (domínio/foco de competência e nível de experiência mínimo); `INSUFFICIENT` nelas normalmente só ocorre quando o perfil completo do provider não foi encontrado no repositório (ver P007) — um sinal genuíno de que a avaliação não tem base suficiente, não uma nuance de adequação ao caso. As outras quatro dimensões (contexto, estratégia, restrições, continuidade) refletem disponibilidade/preferência específica do caso, não um requisito de habilitação — por isso não bloqueiam a qualificação.

**Alternativa descartada:** exigir ausência de `INSUFFICIENT` em todas as seis dimensões. Descartada porque, após a correção do `constraintAlignment` (ADR-015, Sprint 9), essa dimensão é `INSUFFICIENT` sempre que o caso tem qualquer Restrição Obrigatória registrada (o perfil do provider ainda não tem dado estruturado para verificá-las) — exigir ausência de `INSUFFICIENT` em todas as dimensões bloquearia a Shortlist quase sempre que houvesse qualquer restrição, o que não reflete a intenção do critério de qualificação.

## Composição — alternativa escolhida e motivo (corrigida na Sprint 10)

**Alternativa adotada:** quando há **exatamente três** providers qualificados, todos os três compõem a Shortlist (`COMPOSED`). Quando há **mais de três**, e a CompatibilityMatrix não contém nenhum critério oficialmente suficiente para reduzir esse conjunto sem arbitrariedade, o resultado é `BLOCKED` com `blockedReason: "AMBIGUOUS_COMPOSITION"` — todos os candidatos aptos são preservados (`candidateProviderIds`), com justificativa individual de cada um, para que a resolução seja feita por revisão humana (P009), nunca pelo P008. Quando há menos de três, o resultado é `BLOCKED` (`INSUFFICIENT_OPTIONS` ou `INSUFFICIENT_EVIDENCE`, ver "Ordenação por providerId").

**Alternativa descartada (versão anterior, corrigida nesta sprint):** desempatar por ordem alfabética de `providerId`, selecionando os três primeiros entre mais de três qualificados. Essa alternativa foi implementada na Sprint 9 e corrigida nesta sprint porque a ordenação por `providerId` é válida apenas para **serialização neutra** de um conjunto já decidido — usá-la para **decidir** quais providers entram na Shortlist significa que a posição no alfabeto determina quem é incluído, o que é, na prática, um critério de seleção arbitrário e não relacionado a nenhuma qualidade do Método. Qualquer critério de desempate baseado em comparação de qualidade entre dimensões (contagem de `STRONG`, ou qualquer agregação, mesmo qualitativa) foi igualmente descartado, pelo mesmo motivo original: equivaleria a um ranking disfarçado.

## Ordenação por providerId — apenas serialização, nunca seleção

`selectedProviderIds` e `candidateProviderIds` nunca representam ranking. A ordem alfabética por `providerId` serve exclusivamente para que a mesma entrada produza sempre a mesma serialização (determinismo/reprodutibilidade) — ela nunca decide, filtra ou reduz o conjunto de providers. A decisão de "quantos e quais providers estão aptos" é tomada inteiramente pela Qualificação (seção acima); a ordenação só se aplica **depois** que esse conjunto já está definido.

## Motivos de bloqueio (`blockedReason`)

Uma Shortlist `BLOCKED` sempre distingue qual das três causas se aplica:

| `blockedReason` | Significado |
|---|---|
| `INSUFFICIENT_OPTIONS` | A CompatibilityMatrix tem menos de três Care Providers avaliados no total — o problema é a falta de candidatos. |
| `INSUFFICIENT_EVIDENCE` | Há três ou mais avaliados, mas menos de três atendem aos requisitos essenciais — o problema é a falta de fundamentação suficiente, não a falta de candidatos. |
| `AMBIGUOUS_COMPOSITION` | Há mais de três candidatos igualmente fundamentados, e nenhum critério legítimo permite reduzir esse conjunto a três sem arbitrariedade — resolver isso é uma decisão humana (P009), nunca um desempate mecânico. |

Em `AMBIGUOUS_COMPOSITION`, todos os candidatos aptos são preservados em `candidateProviderIds`, com justificativa individual em `providerRationales` — a revisão humana (P009) não precisa recomeçar a análise do zero.

## Fluxo

1. Filtrar os providers da CompatibilityMatrix que atendem ao critério de qualificação (ver "Qualificação").
2. Se o número de qualificados for **exatamente três**, todos os três compõem a Shortlist (`COMPOSED`).
3. Se o número de qualificados for **menor que três**, produzir `BLOCKED`, com `blockedReason` distinguindo `INSUFFICIENT_OPTIONS` (total de avaliados na matriz já é menor que três) de `INSUFFICIENT_EVIDENCE` (há três ou mais avaliados, mas poucos qualificam).
4. Se o número de qualificados for **maior que três**, produzir `BLOCKED` com `blockedReason: "AMBIGUOUS_COMPOSITION"`, preservando todos os qualificados em `candidateProviderIds`.
5. Construir a justificativa individual de cada provider em `selectedProviderIds` (COMPOSED) ou `candidateProviderIds` (BLOCKED), a partir de suas próprias forças/limitações/informações ausentes já presentes na CompatibilityMatrix.
6. Construir a justificativa da composição (ou do bloqueio).
7. Agregar (com prefixo do `providerId`) as limitações e informações ausentes relevantes — dos providers selecionados quando `COMPOSED`; de todos os avaliados na matriz quando `BLOCKED`, para máxima transparência sobre o motivo.
8. Ordenar `selectedProviderIds`/`candidateProviderIds` alfabeticamente por `providerId`, apenas para serialização neutra — esta etapa nunca decide quem está no conjunto, apenas como ele é apresentado.
9. Construir e versionar a Shortlist, referenciando a CompatibilityMatrix de origem.

## Regras

- Este protocolo herda integralmente as restrições do Kernel, incluindo a seção 6 (Autoridade decisória) e 1.1 (política de campos).
- Toda Shortlist `COMPOSED` contém exatamente três `selectedProviderIds`, sem duplicatas, em ordem alfabética — e ocorre única e exclusivamente quando exatamente três providers são qualificados.
- Toda Shortlist `BLOCKED` não contém nenhum provider em `selectedProviderIds`, e sempre tem um `blockedReason`.
- A ordenação por `providerId` nunca decide a composição — apenas serializa um conjunto já definido pela Qualificação.
- Nenhum dado é inventado — apenas o que já está na CompatibilityMatrix é usado.
- Nenhuma limitação ou informação ausente relevante é omitida.
- Determinístico: a mesma CompatibilityMatrix produz sempre a mesma Shortlist.

## Saída

Uma Shortlist contendo, no mínimo:

- `status` (`"COMPOSED"` ou `"BLOCKED"`)
- `blockedReason` (`"INSUFFICIENT_OPTIONS"` | `"INSUFFICIENT_EVIDENCE"` | `"AMBIGUOUS_COMPOSITION"` quando `BLOCKED`; `null` quando `COMPOSED`)
- `selectedProviderIds` (exatamente 3 quando `COMPOSED`; vazio quando `BLOCKED`; ordem alfabética, apenas para serialização, nunca ranking)
- `candidateProviderIds` (todos os providers qualificados, preservados quando `BLOCKED`; vazio quando `COMPOSED`)
- `providerRationales` (uma justificativa por provider em `selectedProviderIds` ou `candidateProviderIds`)
- `compositionRationale` (justificativa da composição, ou do bloqueio)
- `relevantLimitations`
- `missingInformation`
- `sourceArtifact` (referência única à CompatibilityMatrix de origem, por id e versão)
- `methodVersion`
- `createdAt`

## Critérios de Aceitação

- [ ] Uma Shortlist `COMPOSED` contém exatamente três `selectedProviderIds`, sem duplicatas, e só ocorre quando exatamente três providers são qualificados.
- [ ] `selectedProviderIds`/`candidateProviderIds` estão sempre em ordem alfabética por `providerId` — apenas para serialização.
- [ ] Todo provider em `selectedProviderIds`/`candidateProviderIds` tem uma justificativa individual não vazia em `providerRationales`.
- [ ] `compositionRationale` nunca está vazio.
- [ ] Nenhum campo de score, percentual, ranking ou vencedor está presente.
- [ ] `sourceArtifact` referencia exatamente a CompatibilityMatrix de origem, por id e versão.
- [ ] A CompatibilityMatrix de origem permanece inalterada após a execução.
- [ ] A Shortlist é imutável após a criação, com `decisional: false`.
- [ ] O resultado é idêntico para a mesma entrada (determinismo).
- [ ] Quando há menos de três providers qualificados, ou mais de três sem critério legítimo de desempate, o resultado é `BLOCKED`, nunca uma composição forçada ou arbitrária.

## Casos de Exceção

- **CompatibilityMatrix com menos de três providers avaliados**: `BLOCKED`, `blockedReason: "INSUFFICIENT_OPTIONS"`.
- **CompatibilityMatrix com três ou mais providers avaliados, mas menos de três qualificados**: `BLOCKED`, `blockedReason: "INSUFFICIENT_EVIDENCE"`.
- **Mais de três providers qualificados**: `BLOCKED`, `blockedReason: "AMBIGUOUS_COMPOSITION"` — todos os qualificados preservados em `candidateProviderIds`, com justificativa individual, para resolução na revisão humana (P009).

## Dependências

- `docs/ace/00-constitution/constitution.md` — Princípio 9.
- `docs/ace/02-ontology/ontology.md` — Shortlist, Status da Shortlist, Justificativa Individual, Justificativa da Composição.
- `docs/ace/03-kernel/kernel.md` — seção 6 e 1.1 (política de campos).
- `docs/DECISIONS.md` — ADR-014 (política de campos em três camadas), ADR-015 (Restrições Obrigatórias no Decision Context).
- P007 (produz a CompatibilityMatrix de entrada).
- Protocolo seguinte: P009 (Human Review), ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P008 — Shortlist Builder, especificada na Sprint 9, após a correção do `constraintAlignment` do P007 (ADR-015). |
| 0.2 | 2026-07-12 | Sprint 10, correção obrigatória: a ordenação por `providerId` deixou de decidir a composição quando há mais de três qualificados — esse caso agora produz `BLOCKED` (`AMBIGUOUS_COMPOSITION`), preservando todos os candidatos aptos para revisão humana. Adicionado `blockedReason` (três causas distintas) e `candidateProviderIds`. |
