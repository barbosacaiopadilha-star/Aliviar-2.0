# Domínio: Curadoria (Human Review + Entrega)

**Estado**: Implementado — P009 e P010.

## Missão

Garantir que nenhuma Shortlist gerada pelo ACE chegue ao paciente sem julgamento humano responsável, e entregar o resultado final ao paciente em linguagem que ensina sem explicar — nunca ranqueando, sempre deixando a escolha final com o paciente.

## Responsabilidade

- **P009 (Human Review)**: um Curador humano revisa a `Shortlist`, valida ou ajusta, produz `HumanReviewResult`. Cada Caso tem no máximo um Human Review validado (ADR-025, índice único parcial).
- **P010 (Final Curadoria Delivery)**: constrói o `FinalCuradoria`/`DeliveryArtifact` a partir do `HumanReviewResult`. `comparisonSummary` deve declarar explicitamente que não existe ranking; `methodExplanation` deve declarar explicitamente que a escolha final pertence ao cliente (`docs/ace/04-specs/P010-final-curadoria-delivery/specification.md`/`prompt.md`).
- Transicionar o Caso por `HUMAN_REVIEW → DELIVERED`.

## Fronteiras

**Pertence a este domínio**: revisão humana da Shortlist, construção e entrega do artefato final ao paciente.
**Não pertence**: gerar a Shortlist (ACE), o primeiro contato entre paciente e profissional após a entrega (Connection), qualquer acompanhamento posterior (Relationship).

## Entradas

- `Shortlist` e `CompatibilityMatrix` (do ACE).
- Julgamento humano do Curador (ação manual, gated, nunca automática).

## Saídas

- `HumanReviewResult`.
- `FinalCuradoria` / `DeliveryArtifact`, visível ao paciente via `patient_case_overview`.
- Transição de Caso para `DELIVERED`.

## Dependências

- Depende do ACE para a Shortlist de entrada.
- Depende da Jornada apenas como consumidora a jusante (a Jornada lê o resultado, a Curadoria não depende da Jornada).
- Não depende de Connection, Relationship, CI, Observatório ou Governança — hoje a Curadoria termina no `DELIVERED`, sem visibilidade sobre o que acontece depois.

## Fonte oficial da verdade

- **Validação humana de um Caso**: `HumanReviewResult`, unicidade garantida por índice único parcial (ADR-025).
- **Conteúdo entregue ao paciente**: `FinalCuradoria`/`DeliveryArtifact`, único lugar que define o que o paciente lê.
- **Regra de que "não existe ranking" e "a escolha é do cliente"**: `docs/ace/04-specs/P010-final-curadoria-delivery/specification.md` e `prompt.md` — texto normativo, não apenas boa prática.

## Invariantes

- P010 comunica, nunca decide (ADR-016).
- Um Caso não pode ter mais de um Human Review validado (ADR-025).
- `comparisonSummary` nunca pode ranquear; `methodExplanation` sempre atribui a escolha final ao paciente.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá pular a revisão humana — não existe caminho de entrega direta ACE → paciente.
- Nunca poderá apresentar um "melhor profissional" ou ordenação implícita de preferência.
- Nunca poderá reabrir ou alterar um Caso já `DELIVERED` para incorporar aprendizado de Compatibility Intelligence — isso exigiria um novo Caso ou uma extensão de domínio explicitamente desenhada, nunca uma reescrita silenciosa do artefato entregue.

## Documentos relacionados

- `docs/ace/04-specs/P009-*/`, `docs/ace/04-specs/P010-final-curadoria-delivery/`.
- `docs/DECISIONS.md` — ADR-016, ADR-025.
- `DOMAIN_ACE.md` — domínio imediatamente a montante.
- `DOMAIN_CONNECTION_RELATIONSHIP.md` — domínio conceitual imediatamente a jusante.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `ACE ──▶ CURADORIA (P009+P010) ──▶ CONNECTION`.
