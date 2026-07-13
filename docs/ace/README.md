# O Método ACE — Índice

O **ACE (Aliviar Curation Engine)** é o Método que transforma a história de uma pessoa em uma Curadoria Médica validada por humano. Esta pasta é a fonte de verdade do Método — **congelado na V1.0** (ADR-021, `docs/DECISIONS.md`): nenhum protocolo novo, nenhuma alteração estrutural, apenas correção de bugs.

Para o código que implementa este Método, ver `src/modules/ace/` (puro, sem I/O) e `src/modules/concierge/` (orquestração/persistência) — mapa completo em `docs/CODEBASE_MAP.md`.

## Hierarquia de autoridade (leia nesta ordem)

Cada camada só pode ser contrariada por uma mudança na camada acima dela — nunca o inverso (`docs/ace/00-constitution/constitution.md`, seção 4).

1. **[Constituição](00-constitution/constitution.md)** — princípios permanentes e restrições arquiteturais obrigatórias. Eleva `docs/PRODUCT_VISION.md`/`docs/PRODUCT_PRINCIPLES.md` a regra técnica.
2. **[Framework](01-framework/framework.md)** — como o Método opera mecanicamente: o modelo de estágios e protocolos.
3. **[Ontologia](02-ontology/ontology.md)** — vocabulário oficial e estável. Nenhum protocolo redefine um termo já registrado aqui.
4. **[Kernel](03-kernel/kernel.md)** — regras de comportamento universais e obrigatórias para qualquer protocolo.
5. **Especificações dos protocolos** (`04-specs/`, tabela abaixo) — "especificação sempre vence o prompt": a `specification.md` de cada protocolo é a fonte da verdade; `prompt.md` é uma implementação dela, nunca o contrário.
6. **[Conhecimento](05-knowledge/README.md)** — material de apoio, não normativo.
7. **[Governança](06-governance/governance.md)** — como o Método é criado, versionado e protegido; **leia antes de qualquer trabalho sobre o ACE**.

## Os 10 protocolos

Cada protocolo consome o artefato do anterior e produz exatamente um artefato novo. Só o P009 é decisório (`decisional: true`) — todo o resto é análise (P001–P008) ou entrega de uma decisão já tomada (P010).

| # | Protocolo | Artefato produzido | O que faz | O que nunca faz |
|---|---|---|---|---|
| [P001](04-specs/P001-intake/specification.md) | Intake | `Narrative` | Compreende a história do cliente (implementado como transcrição determinística de `PatientStory`, sem chamada ao modelo de linguagem — ver `docs/CODEBASE_MAP.md`). | Interpretar, diagnosticar ou resumir com IA. |
| [P002](04-specs/P002-case-builder/specification.md) | Case Builder | `DecisionCase` | Estrutura a Narrativa em uma representação imutável da decisão do cliente. | Alterar a Narrativa original. |
| [P003](04-specs/P003-case-audit/specification.md) | Case Audit | `CaseAudit` | Avalia se o DecisionCase tem informação suficiente para prosseguir com responsabilidade. | Alterar o DecisionCase avaliado. |
| [P004](04-specs/P004-decision-context-modeler/specification.md) | Decision Context Modeler | `DecisionContext` | Modela o contexto da decisão (nunca "Clinical Context" — ADR-011). | Escolher especialistas ou identificar competências. |
| [P005](04-specs/P005-competency-profile-builder/specification.md) | Competency Profile Builder | `CompetencyProfile` | Traduz o DecisionContext em perfil de competência relevante — determinístico. | Decidir ou ranquear. |
| [P006](04-specs/P006-eligible-provider-set-builder/specification.md) | Eligible Provider Set Builder | `EligibleProviderSet` | Identifica quais Care Providers atendem aos requisitos mínimos. | Escolher, ranquear ou pontuar entre os elegíveis. |
| [P007](04-specs/P007-compatibility-matrix-builder/specification.md) | Compatibility Matrix Builder | `CompatibilityMatrix` | Avalia cada Care Provider elegível por dimensão, de forma comparável e explicável. | Produzir shortlist, ranking ou escolha. |
| [P008](04-specs/P008-shortlist-builder/specification.md) | Shortlist Builder | `Shortlist` | Compõe uma proposta de exatamente três Care Providers. | Decidir — é proposta, não decisão final. |
| [P009](04-specs/P009-human-review/specification.md) | Human Review | `HumanReviewResult` | Registra a decisão de um Curador Médico (`APPROVE`/`ADJUST`/`REJECT`/`REQUEST_MORE_INFORMATION`). **Primeiro artefato decisório do pipeline.** | A IA nunca aprova nem decide em nome do revisor. |
| [P010](04-specs/P010-final-curadoria-delivery/specification.md) | Final Curadoria Delivery | `FinalCuradoria` | Materializa e comunica ao cliente a decisão já tomada no P009. | Tomar uma nova decisão, reabrir a análise de compatibilidade (ADR-016). |

Cada protocolo tem, na sua pasta em `04-specs/P0XX-*/`: `specification.md` (fonte da verdade), `prompt.md` (implementação do prompt real para o modelo de linguagem), `examples.md`, `tests.md`, `changelog.md`.

## Vocabulário essencial

Ver a Ontologia completa (`02-ontology/ontology.md`); os termos mais frequentemente confundidos:

- **Care Provider**, nunca "Specialist" (ADR-013) — desacopla o Método da estrutura atual da Rede.
- **DecisionContext**, nunca "Clinical Context" (ADR-011) — o Método modela decisões, não doenças.
- **Artefato de Análise** (`decisional: false`, P001–P008) vs. **Artefato de Decisão Humana** (`decisional: true`, só P009) vs. **Artefato de Entrega** (`DeliveryArtifact`, P010 — comunica, nunca decide).

## Quando algo parecer errado

O ACE está congelado — qualquer bug de comportamento é corrigido no protocolo/artefato específico, nunca contornado na camada de orquestração (`concierge`). Para diagnosticar uma execução travada ou uma falha do modelo de linguagem, ver `docs/DEBUGGING.md`.
