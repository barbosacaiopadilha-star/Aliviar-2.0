# Changelog — P007 (Compatibility Matrix Builder)

## v0.3 — 2026-07-12 (Sprint 9, ADR-015 — correção obrigatória antes do P008)

- Corrige a lacuna registrada desde a v0.1: `constraintAlignment` deixa de ser estruturalmente sempre `NOT_APPLICABLE`.
- `assessConstraintAlignment` passa a receber o `DecisionContext` e avaliar `decisionContext.mandatoryConstraints` (propagadas do DecisionCase pelo P004, via ADR-015): `NOT_APPLICABLE` quando não há restrições; `INSUFFICIENT` quando há restrições, mas o `CareProviderProfile` não tem dado estruturado para verificá-las (nenhum atributo novo foi adicionado ao perfil do provider nesta correção — nenhuma invenção).
- `buildMissingProfileEntry` (perfil não encontrado) também passa a usar essa mesma avaliação real, em vez de um `NOT_APPLICABLE` fixo.
- Nenhuma outra dimensão foi alterada. Nenhum novo campo foi adicionado ao `CareProviderProfile`/`ProviderProfileRepository`.
- Documentos atualizados: `specification.md` (Dimensões, Limitação arquitetural conhecida, Casos de Exceção, Dependências).
- Código atualizado: `src/modules/ace/protocols/p007-compatibility-matrix-builder.ts`, e os testes correspondentes (novos casos para restrição ausente/presente).
- **Limitação que permanece, registrada como pendência**: como o `CareProviderProfile` ainda não tem nenhum atributo estruturado correspondente a categorias reais de restrição (modalidade, convênio, localização, preço), toda restrição hoje registrada resulta em `INSUFFICIENT` na prática — ver ADR-015, seção "Revisitar quando".

## v0.2 — 2026-07-12 (Sprint 8)

- Refinamento do contrato de saída sobre a arquitetura já aprovada — sem novos conceitos de Método, apenas maior granularidade na explicabilidade já exigida desde a v0.1:
  - `assessments` renomeado para `entries` (`CompatibilityEntry[]`); cada dimensão passou de um valor `AlignmentLevel` solto para um `DimensionResult` (`classification` + `rationale` própria + `evidence`).
  - `missingInformation` passou a ser uma lista própria por entrada, distinta de `limitations`: `limitations` registra alinhamento parcial (dado presente, qualidade fraca); `missingInformation` registra dado ausente (nada a avaliar). Antes, a v0.1 misturava as duas leituras dentro de `limitations`.
  - Cada `CompatibilityEntry` passou a carregar sua própria rastreabilidade (`sourceArtifacts`, `producedBy`, `version`, `createdAt`), idêntica à da matriz que a contém — permite auditar a avaliação de um provider isoladamente.
- Nenhuma mudança de comportamento/classificação: a lógica de decisão por dimensão (ex.: quando `contextAlignment` é `STRONG` vs `PARTIAL`) permanece idêntica à v0.1, apenas com justificativa e evidências explícitas anexadas.
- Documentos atualizados: `specification.md` (seção "Saída", "Fluxo", "Critérios de Aceitação", "Casos de Exceção"). `tests.md` não foi reescrito linha a linha nesta versão — os critérios Given/When/Then continuam válidos com `entries`/`dimensionResults` no lugar de `assessments`/campos soltos.
- Código atualizado: `src/modules/ace/artifacts/compatibility-matrix.ts`, `src/modules/ace/protocols/p007-compatibility-matrix-builder.ts`, e os dois arquivos de teste correspondentes.
- **Risco/pendência ainda aberta** (herdada da v0.1, não resolvida nesta versão): `constraintAlignment` continua estruturalmente sempre `NOT_APPLICABLE`, porque o DecisionCase não é entrada deste protocolo.

## v0.1 — 2026-07-12

- Primeira versão do protocolo, especificada após a refatoração da política de campos em três camadas (ADR-014, `docs/DECISIONS.md`), que resolveu a tensão entre `compatibility` proibido (P002-P006) e legítimo (P007) sem exceções ad hoc.
- Documentos criados: `specification.md`, `prompt.md`, `examples.md`, `tests.md`.
- Implementação em código:
  - `src/modules/ace/ports/provider-profile-repository.ts` — nova porta `ProviderProfileRepository` + `CareProviderProfile` (estende `CareProviderCandidate` do P006 com 3 campos, cada um mapeado a exatamente uma dimensão da CompatibilityMatrix). `CareProviderCandidate` do P006 **não foi alterado**.
  - `src/modules/ace/ports/in-memory-provider-profile-repository.ts` — implementação de testes; nenhuma persistência real.
  - `src/modules/ace/artifacts/compatibility-matrix.ts` — artefato `CompatibilityMatrix`, com validação de "nenhum provider duplicado" e justificativa obrigatória por avaliação.
  - `src/modules/ace/protocols/p007-compatibility-matrix-builder.ts` — o terceiro protocolo do pipeline inteiramente determinístico.
- **Risco/pendência registrado para ciclos futuros**: `constraintAlignment` é estruturalmente sempre `NOT_APPLICABLE` nesta versão, porque o DecisionCase (onde vivem as Restrições Obrigatórias) não é entrada deste protocolo, e o DecisionContext não as carrega adiante. Resolver isso exige uma decisão de arquitetura — levar as restrições adiante via DecisionContext, ou adicionar DecisionCase como entrada direta do P007 — que não foi tomada neste ciclo.
- **Observação de estilo, não uma inconsistência introduzida por este protocolo**: a escala `AlignmentLevel` usa `MAIÚSCULO_COM_UNDERSCORE` em inglês, consistente com `ReadinessStatus` (P003). Os enums do P004/P005 (`DecisionType`, `ClinicalDomain` etc.) usam português minúsculo — essa divergência já existia antes deste ciclo e não foi criada nem corrigida aqui.
