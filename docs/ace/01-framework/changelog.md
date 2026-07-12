# Changelog — ACE Framework

## v0.1 — 2026-07-12

- Primeira versão — modelo de estágios/protocolos, com P001 (Intake) especificado e P002 (Case Builder) registrado apenas como nome mencionado.

## v0.2 — 2026-07-12

- P002 (Case Builder) formalmente registrado na tabela de protocolos: entrada (Narrative), saída (DecisionCase), pergunta única definida. Tabela de protocolos ganhou colunas "Entrada", "Saída" e "Pergunta única".

## v0.3 — 2026-07-12

- P003 (Case Audit) formalmente registrado: entrada (DecisionCase), saída (CaseAudit), pergunta única definida.

## v0.4 — 2026-07-12

- P004 (Decision Context Modeler) formalmente registrado: entrada (DecisionCase + CaseAudit), saída (DecisionContext), pergunta única definida.
- Adicionada a seção 2.1 (Visão do pipeline completo, ADR-011) — os 10 estágios do ACE registrados como nomes/ordem oficiais, sem antecipar especificação além de P004.
- Adicionada a seção 2.2 (Filosofia do pipeline, ADR-011): "o ACE não é um pipeline de Inteligência Artificial, é um pipeline de abstração" — princípio permanente.
- Regra de transição (seção 3) ajustada para reconhecer que um protocolo pode receber mais de um artefato de entrada quando explicitamente especificado (caso do P004).
- Registrado (ADR-011): o artefato do P004 é oficialmente `DecisionContext`, nunca "Clinical Context" — nome nunca formalizado em nenhum documento antes desta versão, apenas mencionado informalmente no plano original de protocolos.

## v0.5 — 2026-07-12

- Corrigida uma inconsistência: a versão 0.4 tinha entrada aqui, mas não na tabela "Histórico" embutida em `framework.md` — ambas agora sincronizadas.
- P005 (Competency Profile Builder) formalmente registrado: entrada (DecisionContext), saída (CompetencyProfile), pergunta única definida.
- Nota arquitetural registrada: P005 é o primeiro protocolo do pipeline inteiramente determinístico (sem necessidade de classificação semântica simulando um LLM), porque sua entrada já reduziu tudo a enumerações fechadas.

## v0.6 — 2026-07-12

- P006 (Eligible Provider Set Builder) formalmente registrado: entrada (CompetencyProfile + ProviderRepository), saída (EligibleProviderSet), pergunta única definida.
- Visão do pipeline (seção 2.1) atualizada: "EligibleSpecialists" renomeado para `EligibleProviderSet` (ADR-013, Care Provider em vez de Specialist).
- Segundo protocolo inteiramente determinístico do pipeline (depois do P005).
