# P006 — Eligible Provider Set Builder

## Objetivo

Identificar, dentro de um Provider Repository, quais Care Providers atendem aos requisitos mínimos (domínio, foco, nível de experiência) definidos pelo CompetencyProfile — sem escolher, ranquear, pontuar ou comparar entre os elegíveis.

## Responsabilidades

- Consultar o Provider Repository por domínio (`domain` do CompetencyProfile) — única interação com dado externo.
- Aplicar a regra determinística de elegibilidade sobre cada candidato retornado: status ativo, domínio e foco correspondentes, nível de experiência suficiente.
- Registrar a avaliação de **todo** candidato considerado — elegível ou não — com justificativa (`reason`).
- Produzir um conjunto (não uma lista ordenada por relevância) de providers elegíveis.
- Referenciar o CompetencyProfile de origem, por id e versão.

## Não Responsabilidades

O P006 nunca:

- Ranqueia, pontua, ou destaca um provider específico.
- Recomenda ou seleciona um shortlist.
- Calcula compatibilidade (protocolo futuro).
- Considera critérios ausentes do CompetencyProfile (preço, localização, agenda, convênio, reputação).
- Conhece a implementação do Provider Repository (banco, Supabase, API, cache).
- Modifica o CompetencyProfile ou qualquer artefato anterior.
- Inicia o próximo protocolo.

## Entradas

- CompetencyProfile (artefato produzido pelo P005).
- ProviderRepository (porta de infraestrutura — `src/modules/ace/ports/provider-repository.ts`). O protocolo conhece apenas a interface, nunca uma implementação concreta.

## Pré-condições

- O CompetencyProfile de entrada deve existir e ter sido produzido pelo P005.

## Fluxo

1. Consultar `providerRepository.findByDomain(competencyProfile.domain)`.
2. Para cada candidato retornado, avaliar, em ordem:
   1. Está ativo? Se não, inelegível.
   2. Possui alguma área de competência com o domínio exigido? Se não, inelegível.
   3. Dentre as áreas com o domínio exigido, alguma tem o foco exigido? Se não, inelegível.
   4. O nível de experiência é igual ou superior ao exigido? Se não, inelegível.
   5. Se todos os critérios acima passarem, elegível.
3. Registrar a avaliação de todo candidato (elegível ou não) com a justificativa correspondente.
4. Construir o conjunto de ids elegíveis, ordenado por `providerId` — apenas para determinismo, nunca ranking.
5. Construir e versionar o EligibleProviderSet, referenciando o CompetencyProfile de origem.

## Regras

- Este protocolo herda integralmente as restrições do Kernel (`docs/ace/03-kernel/kernel.md`), incluindo a seção 6 (Autoridade decisória dos artefatos).
- A ordem de `eligibleProviderIds` é sempre por `providerId` (ordem lexicográfica) — nunca por relevância, adequação ou qualquer sinal de preferência. Nenhum consumidor futuro deve interpretar a posição como sinal decisório.
- Todo candidato retornado pelo repositório é avaliado e registrado, elegível ou não — nunca descartado silenciosamente.
- O EligibleProviderSet é imutável após criado, e carrega `decisional: false` estrutural (Constituição, Princípio 9).
- O protocolo nunca importa nem referencia uma implementação concreta de `ProviderRepository` — apenas o tipo da interface.

## Saída

Um EligibleProviderSet contendo, no mínimo:

- `eligibleProviderIds` (array ordenado por `providerId`, semanticamente um conjunto)
- `evaluatedCandidates` (avaliação de cada candidato considerado, com `reason`)
- `sourceArtifacts` (referência ao CompetencyProfile de origem)
- `methodVersion`
- `createdAt`

Nunca contém pontuação, ranking, compatibilidade, ou qualquer atributo de protocolos futuros.

## Critérios de Aceitação

- [ ] Todo candidato retornado pelo repositório aparece em `evaluatedCandidates`, com `reason` não vazio.
- [ ] `eligibleProviderIds` corresponde exatamente aos candidatos marcados `eligible: true` em `evaluatedCandidates`.
- [ ] `eligibleProviderIds` está ordenado por `providerId` (ordem estável, verificável).
- [ ] `sourceArtifacts` referencia o CompetencyProfile de origem por id e versão.
- [ ] Nenhum campo proibido está presente.
- [ ] O CompetencyProfile de origem permanece inalterado após a execução.
- [ ] O EligibleProviderSet é imutável após a criação, com `decisional: false`.
- [ ] O resultado é idêntico para a mesma entrada (determinismo).

## Casos de Exceção

- **Nenhum candidato elegível**: `eligibleProviderIds` é um array vazio; `evaluatedCandidates` ainda contém a avaliação (inelegível, com motivo) de todo candidato considerado.
- **Provider Repository não retorna nenhum candidato para o domínio**: `evaluatedCandidates` e `eligibleProviderIds` são ambos vazios — não é um erro, é um resultado válido.

## Dependências

- `docs/ace/00-constitution/constitution.md` — Princípio 9.
- `docs/ace/02-ontology/ontology.md` — Care Provider, Provider Repository, Conjunto de Providers Elegíveis, Avaliação de Elegibilidade.
- `docs/ace/03-kernel/kernel.md` — seção 6.
- `docs/DECISIONS.md` — ADR-013 (Care Provider, desacoplamento da Rede).
- P005 — Competency Profile Builder (produz a entrada).
- Protocolo seguinte: P007, ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P006 — Eligible Provider Set Builder, especificada com a terminologia Care Provider (ADR-013) e o Provider Repository como porta de infraestrutura desacoplada do Método. |
