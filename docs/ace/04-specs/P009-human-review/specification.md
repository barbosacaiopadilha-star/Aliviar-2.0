# P009 — Human Review

## Objetivo

Registrar, de forma estruturada e auditável, a decisão de um revisor humano da equipe Aliviar sobre a Shortlist produzida pelo pipeline — a IA nunca aprova, nunca decide em nome do revisor, nunca simula julgamento humano. O software apresenta evidências, registra a ação tomada, valida sua consistência estrutural, e preserva a trilha de auditoria.

**Princípio central:** o P009 é o primeiro estágio do ACE com autoridade institucional humana real. Todo protocolo anterior (P001–P008) produz apenas análise (`AnalysisArtifact`, `decisional: false`). O P009 produz o primeiro artefato genuinamente decisório do pipeline — mas a decisão em si nunca é do software.

## Responsabilidades

- Apresentar (implicitamente, ao receber como entrada) as evidências já produzidas pelo pipeline: a Shortlist e a CompatibilityMatrix de origem.
- Registrar a ação do revisor humano (`reviewAction`): `APPROVE`, `ADJUST`, `REJECT` ou `REQUEST_MORE_INFORMATION`.
- Validar a consistência estrutural dessa ação — nunca a decisão em si:
  - `APPROVE` só é aceito sobre uma Shortlist `COMPOSED`.
  - `ADJUST` só aceita providers presentes na CompatibilityMatrix e suficientemente fundamentados (mesmo critério do P008 — `isEssentiallyQualified`), e deve sempre resultar em exatamente três `approvedProviderIds`.
  - Toda alteração de `ADJUST` registra providers removidos, providers adicionados, justificativa e evidências, individualmente.
- Preservar a trilha de auditoria completa: quem decidiu (`reviewerId`), quando (`reviewedAt`), com base em quais evidências (`evidenceReferences`), e qual ação foi tomada.
- Produzir o artefato correspondente (`HumanReviewResult`), referenciando a Shortlist e a CompatibilityMatrix de origem, sem alterá-las.

## Não Responsabilidades

O P009 nunca:

- Aprova automaticamente.
- Escolhe em nome do revisor.
- Gera decisão usando um modelo de linguagem.
- Esconde alterações.
- Permite um provider fora da CompatibilityMatrix em `ADJUST`.
- Sobrescreve a Shortlist ou a CompatibilityMatrix.
- Produz uma Curadoria Final.
- Inicia o P010 automaticamente.

## Entradas

- Shortlist (produzida pelo P008).
- CompatibilityMatrix (produzida pelo P007) — deve ser exatamente a que originou a Shortlist fornecida (mesmo id e versão).
- Identidade autenticada do revisor humano (`reviewerId`).
- A ação tomada pelo revisor (`reviewAction`), sua justificativa (`reviewRationale`), evidências citadas (`evidenceReferences`), e — apenas para `ADJUST` — a lista de alterações propostas (`changes`).

## Pré-condições

- A CompatibilityMatrix fornecida deve corresponder exatamente à `sourceArtifact` da Shortlist fornecida (mesmo id e versão) — caso contrário, o P009 rejeita a execução (rastreabilidade da cadeia).

## Autoridade decisória — arquitetura escolhida

`HumanReviewResult` **não é** um `AnalysisArtifact`. É o primeiro `HumanDecisionArtifact` do ACE (`src/modules/ace/core/artifact-contract.ts`) — uma categoria de artefato nova e distinta, com `decisional: true` **estrutural**, nunca uma flag isolada: todo `HumanDecisionArtifact` modela, na própria base do contrato, **quem** decidiu (`reviewerId`) e **quando** (`reviewedAt`). O `HumanReviewResult` acrescenta **qual ação** foi tomada (`reviewAction`) e **com base em quais evidências** (`evidenceReferences`, mais evidência individual por alteração em `changes`).

`HumanReviewResult` ainda passa por `assertFieldPolicy` — não para proteger uma natureza não-decisória que ele não tem, mas porque as proibições permanentes do Kernel (diagnóstico, conduta médica, viés comercial) são absolutas e nunca dependem do tipo do artefato.

## Ações oficiais

| Ação | Significado | `reviewStatus` resultante |
|---|---|---|
| `APPROVE` | Aceita integralmente uma Shortlist `COMPOSED`. | `VALIDATED` |
| `ADJUST` | Altera a composição, usando apenas providers presentes na CompatibilityMatrix e suficientemente fundamentados. | `VALIDATED` |
| `REJECT` | Rejeita a proposta, com justificativa obrigatória. | `REJECTED` |
| `REQUEST_MORE_INFORMATION` | Interrompe o fluxo porque faltam evidências para uma validação responsável. | `INFORMATION_REQUESTED` |

`reviewStatus` é o que o restante do pipeline consulta: **somente `VALIDATED` pode originar uma Curadoria Validada** (P010, ainda não especificado). `REJECTED` e `INFORMATION_REQUESTED` nunca podem.

## Regras para ADJUST

Toda alteração (`ProviderChange`) registra: tipo (`added`/`removed`), `providerId`, `rationale` própria, e `evidenceReferences` próprias — nenhuma alteração pode ficar sem justificativa e evidência individual.

O revisor **não pode** adicionar um provider que:

- Não exista na CompatibilityMatrix.
- Tenha `INSUFFICIENT` em `competencyAlignment` ou `experienceAlignment` (os mesmos "requisitos essenciais" do P008 — `isEssentiallyQualified`, compartilhado entre os dois protocolos para que nunca divirjam).
- Tenha sido excluído pelo P006 — o que já é garantido mecanicamente: um provider excluído pelo P006 nunca chega a ser avaliado pelo P007, logo nunca aparece na CompatibilityMatrix.
- Dependa de informação inventada ou externa não registrada — o P009 verifica mecanicamente que o provider existe e está qualificado na CompatibilityMatrix; a fidelidade do conteúdo textual de `rationale`/`evidenceReferences` ao que a matriz realmente contém é responsabilidade do processo humano de revisão, não algo que o código possa verificar semanticamente (mesmo limite já reconhecido para a extração do P002).

Caso seja necessário considerar um provider fora da CompatibilityMatrix, o caso deve retornar ao estágio apropriado do pipeline (`returnToProtocol`, tipicamente `P006`) — nunca ser inserido informalmente no P009. `returnToProtocol` só é aplicável quando `reviewStatus` não é `VALIDATED`.

`ADJUST` deve sempre resultar em exatamente três `approvedProviderIds` — o mesmo padrão de tamanho da Shortlist original.

## Fluxo

1. Verificar que a CompatibilityMatrix fornecida corresponde à Shortlist fornecida.
2. De acordo com `reviewAction`:
   - `APPROVE`: verificar que a Shortlist está `COMPOSED`; `approvedProviderIds` = `shortlist.selectedProviderIds`; `changes` vazio.
   - `ADJUST`: aplicar as `changes` fornecidas sobre a base (`shortlist.selectedProviderIds` se `COMPOSED`, conjunto vazio se `BLOCKED`); validar cada alteração (provider existe e está qualificado na matriz, para adições; provider estava na base, para remoções); verificar que o resultado final tem exatamente três providers.
   - `REJECT` / `REQUEST_MORE_INFORMATION`: `approvedProviderIds` vazio; `changes` vazio; `returnToProtocol` opcional.
3. Construir e versionar o `HumanReviewResult`, referenciando a Shortlist e a CompatibilityMatrix de origem, com `reviewerId`/`reviewedAt` sempre presentes.

## Saída

Um `HumanReviewResult` contendo, no mínimo:

- `reviewStatus` (`VALIDATED` | `REJECTED` | `INFORMATION_REQUESTED`)
- `reviewAction` (`APPROVE` | `ADJUST` | `REJECT` | `REQUEST_MORE_INFORMATION`)
- `reviewerId`
- `reviewedAt`
- `originalShortlistReference`
- `compatibilityMatrixReference`
- `approvedProviderIds` (exatamente 3 quando `VALIDATED`; vazio caso contrário)
- `changes` (detalhado para `ADJUST`; vazio para as demais ações)
- `reviewRationale`
- `evidenceReferences`
- `returnToProtocol` (apenas quando aplicável; sempre `null` quando `VALIDATED`)
- `producedBy`, `version`, `createdAt`
- `decisional: true`

## Critérios de Aceitação

- [ ] `APPROVE` só é aceito sobre uma Shortlist `COMPOSED`.
- [ ] `ADJUST` nunca aceita um provider ausente da CompatibilityMatrix ou com `INSUFFICIENT` em requisito essencial.
- [ ] `ADJUST` sempre resulta em exatamente três `approvedProviderIds`.
- [ ] Toda alteração em `changes` tem `rationale` e `evidenceReferences` não vazios.
- [ ] `reviewRationale` nunca está vazio, para nenhuma ação.
- [ ] `reviewStatus` é `VALIDATED` se e somente se `reviewAction` é `APPROVE` ou `ADJUST` válido.
- [ ] `approvedProviderIds` está vazio sempre que `reviewStatus` não é `VALIDATED`.
- [ ] A Shortlist e a CompatibilityMatrix de origem permanecem inalteradas após a execução.
- [ ] O `HumanReviewResult` é imutável após a criação, com `decisional: true`.
- [ ] `producedBy` é sempre `"P009"`.

## Casos de Exceção

- **CompatibilityMatrix fornecida não corresponde à Shortlist fornecida**: a execução é rejeitada antes de qualquer processamento da ação.
- **`APPROVE` sobre Shortlist `BLOCKED`**: rejeitado — não há composição para aprovar integralmente.
- **`ADJUST` resolvendo uma Shortlist `BLOCKED` por `AMBIGUOUS_COMPOSITION`**: a base é o conjunto vazio (não havia seleção original); toda alteração é necessariamente `added`.
- **`ADJUST` sem nenhuma alteração registrada**: rejeitado — nesse caso, a ação correta é `APPROVE`.

## Dependências

- `docs/ace/00-constitution/constitution.md` — Princípio 9.
- `docs/ace/03-kernel/kernel.md` — seção 6 (`HumanDecisionArtifact`) e 1.1 (política de campos).
- `docs/DECISIONS.md` — ADR-014 (política de campos), ADR-015 (Restrições Obrigatórias no Decision Context).
- P008 (produz a Shortlist de entrada); P007 (produz a CompatibilityMatrix de entrada).
- Protocolo seguinte: P010 (Curadoria Final), ainda não especificado — não antecipado nesta especificação.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão do protocolo P009 — Human Review, especificada na Sprint 10. Primeiro protocolo do ACE com autoridade decisória humana real (`HumanDecisionArtifact`, distinto de `AnalysisArtifact`). |
