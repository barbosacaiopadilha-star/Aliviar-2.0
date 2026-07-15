# Domínio: Aliviar Curation Engine (ACE)

**Estado**: Implementado — P001 a P008.

## Missão

Transformar a história bruta de um paciente em um conjunto de profissionais elegíveis, ordenados por compatibilidade técnica documentada — sem nunca decidir sozinho quem o paciente deve escolher. O ACE implementa o Método Aliviar; não o inverso.

## Responsabilidade

- Executar, em sequência determinística, os protocolos P001–P008: Narrativa → DecisionCase → CaseAudit → DecisionContext → CompetencyProfile → EligibleProviderSet → CompatibilityMatrix → Shortlist.
- Garantir auditabilidade e reprodutibilidade: dado o mesmo estado de entrada, produzir uma saída consistente com a especificação de cada protocolo (variação de estilo é aceitável, variação de regra não é — Kernel §4).
- Impedir bloqueio prático inválido de um Caso (ADR-024, `assertNoInvalidPracticalBlocking`, `src/modules/ace/protocols/p003-case-audit.ts:117-130`, chamado em `:177`).

## Fronteiras

**Pertence a este domínio**: P001 a P008, seus artefatos (`Narrative`, `DecisionCase`, `CaseAudit`, `DecisionContext`, `CompetencyProfile`, `EligibleProviderSet`, `CompatibilityMatrix`, `Shortlist`), a orquestração automática destes oito protocolos.
**Não pertence**: Human Review e Delivery (P009/P010 — deliberadamente separados, gated, nunca auto-executados pelo orquestrador — ver `DOMAIN_CURATION.md`), qualquer coleta de dado do paciente (Jornada), qualquer aprendizado longitudinal entre Casos (Compatibility Intelligence, Governança do Conhecimento).

## Entradas

- História do paciente (via Jornada).
- Perfis de profissionais (via portas de dados, fora do ACE como domínio de ciclo de vida próprio).
- Concordância prévia do Kernel/Ontologia (vocabulário e disciplina compartilhados).

## Saídas

- `Shortlist` — conjunto ordenado de candidatos elegíveis, com `CompatibilityMatrix` documentando 6 dimensões não numéricas (`competencyAlignment`, `experienceAlignment`, `contextAlignment`, `strategyAlignment`, `constraintAlignment`, `continuityAlignment`; taxonomia fechada `STRONG/ADEQUATE/PARTIAL/INSUFFICIENT/NOT_APPLICABLE`; só `competencyAlignment` e `experienceAlignment` são `ESSENTIAL_DIMENSIONS`).
- Transições do Caso: `NEW → IN_REVIEW → WAITING_FOR_INFORMATION → READY_FOR_CURATION`.

## Dependências

- Depende da Jornada para receber a história de entrada.
- Depende do Kernel/Ontologia para vocabulário e disciplina.
- Não depende de Curadoria, Connection, Relationship, CI, Observatório ou Governança — o ACE é hermético por desenho (Fase 0 do CI confirmou: L1/técnica = P007, inalterada, hermética).

## Fonte oficial da verdade

- **Narrativa**: P001 (`src/modules/ace/protocols/p001-*`).
- **Elegibilidade técnica**: P006/P007 — nenhum outro domínio pode declarar um profissional elegível sem passar por aqui.
- **Modelo de linguagem usado pelos protocolos com IA** (P002, P003, P004): `src/modules/concierge/language-model.ts` — `getAceLanguageModel()` usa o modelo real sempre que `CLAUDE_API_KEY` está presente, mesmo em ambiente local; o modelo fake só é usado na ausência da chave, independentemente de `NODE_ENV`.

## Invariantes

- P010 comunica, nunca decide (ADR-016) — este invariante nasce no ACE mas rege a fronteira ACE↔Curadoria.
- Nenhum campo proibido (popularidade, tempo de cadastro, demografia, avaliação por estrelas, volume de atendimentos) pode entrar em `CompatibilityMatrix` (ADR-014).
- P003 nunca pode bloquear um Caso por motivo impraticável ou não documentado (ADR-024).
- Dado o mesmo estado de entrada, mesma saída de regra (Kernel §4) — variação de estilo textual é aceitável, variação de regra não.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá entregar um resultado diretamente ao paciente sem passar por Human Review (P009) — essa fronteira é absoluta.
- Nunca poderá ranquear profissionais de forma a sugerir uma "melhor escolha" única — `CompatibilityMatrix` é deliberadamente não numérica e não ranqueada.
- Nunca poderá incorporar sinais de Compatibility Intelligence (L2/L3/L4) diretamente em P007 — a Fase 0 do CI já estabeleceu que L1 permanece hermética; qualquer integração futura passaria por uma nova camada explícita, nunca por alteração silenciosa de P007.

## Documentos relacionados

- `docs/ace/04-specs/` — especificação e exemplos de cada protocolo.
- `docs/ace/03-kernel/kernel.md`, `docs/ace/02-ontology/ontology.md` — camada de disciplina e vocabulário acima do ACE.
- `docs/DECISIONS.md` — ADR-014, ADR-016, ADR-024, ADR-025.
- `DOMAIN_CURATION.md` — domínio imediatamente a jusante.
- `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — domínio conceitual que futuramente alimentaria sinal para P004/P007, sem nunca tocar P007 diretamente.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `JORNADA ──▶ ACE (P001-8) ──▶ CURADORIA`.
