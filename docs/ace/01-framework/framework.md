# ACE Framework

Define **como o Método Aliviar opera mecanicamente** — o modelo de estágios e protocolos que compõem o ACE (Aliviar Curation Engine). Não redefine princípios (papel da Constituição, `docs/ace/00-constitution/constitution.md`) nem vocabulário (papel da Ontologia, `docs/ace/02-ontology/ontology.md`).

## 1. Modelo de operação

O ACE opera como uma sequência de **protocolos** (P001, P002, P003...), cada um responsável por exatamente uma etapa da jornada de curadoria. Cada protocolo:

- Tem uma única responsabilidade, documentada em sua `specification.md`.
- Recebe uma entrada definida (do cliente ou de um protocolo anterior).
- Produz uma saída definida, consumida pelo próximo protocolo.
- Nunca executa a responsabilidade de outro protocolo.
- Nunca decide sozinho algo que a Constituição reserva a um humano.

## 2. Protocolos conhecidos (a evoluir)

| Protocolo | Nome | Entrada | Saída | Pergunta única | Responsabilidade | Status |
|---|---|---|---|---|---|---|
| P001 | Intake | Cliente (conversa) | Narrative | — (conduz conversa, não transforma um artefato único) | Compreender a história do cliente — o que aconteceu, o que motivou o contato, qual decisão precisa ser tomada, qual resultado é esperado. Produz uma narrativa organizada, nunca uma classificação. | Especificado (`docs/ace/04-specs/P001-intake/`) |
| P002 | Case Builder | Narrative | DecisionCase | Como transformar a narrativa validada em uma representação estruturada da decisão do cliente? | Estruturar a decisão do cliente a partir da Narrative produzida pelo P001, distinguindo fatos relatados de inferências estruturais, sem inferir especialidade, compatibilidade ou diagnóstico. | Especificado (`docs/ace/04-specs/P002-case-builder/`) |
| P003 | Case Audit | DecisionCase | CaseAudit | O DecisionCase possui informações suficientes para prosseguir de forma responsável? | Auditar (nunca alterar) o DecisionCase produzido pelo P002, classificando sua prontidão (READY, READY_WITH_WARNINGS, BLOCKED) e recomendando as perguntas necessárias para resolver bloqueios/avisos — sem diagnosticar, inferir especialidade ou sugerir especialista. | Especificado (`docs/ace/04-specs/P003-case-audit/`) |
| P004 | Decision Context Modeler | DecisionCase + CaseAudit | DecisionContext | Em que contexto esta decisão deve ser tomada? | Modelar o contexto necessário (tipo de decisão, domínio, complexidade, urgência, estratégia) para que protocolos futuros possam identificar competências, elegibilidade e compatibilidade — sem escolher especialista, identificar competência, diagnosticar ou inferir especialidade. | Especificado (`docs/ace/04-specs/P004-decision-context-modeler/`) |
| P005 | Competency Profile Builder | DecisionContext | CompetencyProfile | Que competências são necessárias para apoiar esta decisão com responsabilidade? | Traduzir o Contexto de Decisão em um perfil de competência (foco, nível de experiência) — análise não-decisória (Princípio 9), nunca uma especialidade médica, nunca a escolha de um especialista. | Especificado (`docs/ace/04-specs/P005-competency-profile-builder/`) |
| P006 | Eligible Provider Set Builder | CompetencyProfile + ProviderRepository | EligibleProviderSet | Quais Care Providers atendem aos requisitos mínimos definidos pelo CompetencyProfile? | Identificar, via uma porta de infraestrutura (ProviderRepository), quais Care Providers atendem aos requisitos mínimos do CompetencyProfile — nunca ranqueia, pontua, recomenda ou calcula compatibilidade. | Especificado (`docs/ace/04-specs/P006-eligible-provider-set-builder/`) |
| P007 | Compatibility Matrix Builder | DecisionContext + CompetencyProfile + EligibleProviderSet + ProviderProfileRepository | CompatibilityMatrix | Como cada Care Provider elegível se alinha ao contexto e aos requisitos deste caso? | Avaliar individualmente cada Care Provider elegível em seis dimensões qualitativas — análise comparável e explicável (Princípio 9), nunca shortlist, escolha, ranking ou score. | Especificado (`docs/ace/04-specs/P007-compatibility-matrix-builder/`) |
| P008 | Shortlist Builder | CompatibilityMatrix | Shortlist | Quais três Care Providers representam as opções mais adequadas e justificáveis para este caso? | Selecionar exatamente três Care Providers qualificados, com justificativa individual e de composição — análise não-decisória (Princípio 9), nunca ranking, vencedor, score, ou decisão pelo cliente. Bloqueado e explicável quando não há três opções suficientemente fundamentadas, ou quando há mais de três sem critério legítimo de desempate. | Especificado (`docs/ace/04-specs/P008-shortlist-builder/`) |
| P009 | Human Review | Shortlist + CompatibilityMatrix + identidade do revisor | HumanReviewResult | A proposta de curadoria está suficientemente fundamentada e alinhada ao Método Aliviar para receber validação institucional? | Registrar a decisão de um revisor humano (APPROVE/ADJUST/REJECT/REQUEST_MORE_INFORMATION) de forma estruturada e auditável — primeiro protocolo com autoridade decisória real (`HumanDecisionArtifact`, não `AnalysisArtifact`). A IA nunca aprova, nunca decide em nome do revisor. | Especificado (`docs/ace/04-specs/P009-human-review/`) |
| P010 | Final Curadoria Delivery | HumanReviewResult (VALIDATED) + CompatibilityMatrix + dados de apresentação + DecisionCase/DecisionContext | FinalCuradoria | Como apresentar a curadoria validada de forma clara, fiel e útil para que o cliente possa realizar sua escolha? | Materializar e comunicar a decisão humana já registrada no P009 — nunca uma nova decisão (`DeliveryArtifact`, `decisional: false`, ADR-016). Nunca troca, adiciona ou remove um provider aprovado; nunca ranking, score ou conteúdo clínico. | Especificado (`docs/ace/04-specs/P010-final-curadoria-delivery/`) |

Novos protocolos só entram nesta tabela quando têm `specification.md` própria — nunca antes. **O pipeline do ACE está estruturalmente completo em P001-P010 — nenhum P011 é antecipado ou planejado nesta tabela.**

## 2.1 Visão do pipeline completo (ADR-011)

Registrado oficialmente pelo arquiteto do projeto como visão de longo prazo do ACE — **apenas os nomes e a ordem**, não uma especificação antecipada. Cada estágio só ganha `specification.md` própria (e, com isso, uma entrada na tabela da seção 2) quando for sua vez, seguindo a ordem obrigatória de `docs/ace/06-governance/governance.md`.

```
Narrative → DecisionCase → CaseAudit → DecisionContext → CompetencyProfile
  → EligibleProviderSet → CompatibilityMatrix → Shortlist → HumanReviewResult → FinalCuradoria
```

Nome atualizado (ADR-013, `docs/DECISIONS.md`): o estágio antes chamado "EligibleSpecialists" é `EligibleProviderSet` — o Método usa "Care Provider", nunca "Specialist", para permanecer desacoplado da estrutura atual da Rede.

Regras que já valem para todo o pipeline, mesmo para os estágios ainda não especificados:

- Cada protocolo possui uma única responsabilidade.
- Cada protocolo recebe um artefato definido (um ou mais artefatos de entrada, quando explicitamente especificado, como no P004).
- Cada protocolo produz exatamente um artefato de saída.
- Nenhum protocolo altera artefatos anteriores.

## 2.2 Filosofia do pipeline (ADR-011)

**O ACE não é um pipeline de Inteligência Artificial. O ACE é um pipeline de abstração.** Cada protocolo aumenta o nível de abstração até transformar uma história humana em uma decisão estruturada. A inteligência artificial é a implementação de cada etapa (`prompt.md`), nunca o que define o pipeline em si — a `specification.md` de cada protocolo continuaria válida mesmo trocando o modelo de linguagem, ou removendo IA da etapa por completo (seção 4).

Consequência direta de ADR-011 ("O Método Aliviar modela decisões, não doenças"): todo protocolo do ACE opera sobre abstrações relacionadas à **decisão do cliente** — nunca sobre uma hipótese diagnóstica ou uma condição de saúde específica como unidade central. Por isso o artefato do P004 se chama `DecisionContext`, nunca "Clinical Context".

## 3. Regras de transição entre protocolos

- A saída de um protocolo é sempre a entrada do próximo — nunca dados brutos não processados. Um protocolo pode receber mais de um artefato de entrada quando explicitamente especificado (ex.: P004 recebe DecisionCase + CaseAudit), mas sempre produz exatamente um artefato de saída.
- Nenhum protocolo pode adiantar trabalho de uma etapa posterior (ex.: P001 nunca estrutura o caso nem sugere especialista — isso é do P002 em diante).
- Nenhum protocolo pode refazer silenciosamente o trabalho de uma etapa anterior; se uma informação de uma etapa anterior está incompleta, o protocolo atual sinaliza a lacuna, nunca a preenche por conta própria.

## 4. Agnosticismo de modelo

O ACE é **LLM Agnostic**: nenhuma `specification.md` pode depender de uma capacidade exclusiva de um provedor específico de modelo de linguagem. A `prompt.md` de cada protocolo é uma implementação substituível da especificação — trocar o modelo de linguagem nunca deve exigir mudar a especificação.

## 5. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão — modelo de estágios/protocolos materializado a partir da descrição do ACE e do P001 (Intake) fornecidos pelo arquiteto do projeto. P002 (Case Builder) registrado apenas como nome mencionado, sem especificação própria ainda. |
| 0.2 | 2026-07-12 | P002 (Case Builder) formalmente registrado: entrada (Narrative), saída (DecisionCase) e pergunta única definidas e especificadas em `docs/ace/04-specs/P002-case-builder/`. |
| 0.3 | 2026-07-12 | P003 (Case Audit) formalmente registrado: entrada (DecisionCase), saída (CaseAudit) e pergunta única definidas e especificadas em `docs/ace/04-specs/P003-case-audit/`. |
| 0.4 | 2026-07-12 | P004 (Decision Context Modeler) formalmente registrado; seções 2.1 (visão do pipeline completo) e 2.2 (filosofia do pipeline) adicionadas (ADR-011); regra de transição ajustada para múltiplos artefatos de entrada. Ver detalhes em `changelog.md`. |
| 0.5 | 2026-07-12 | P005 (Competency Profile Builder) formalmente registrado. Nota arquitetural: é o primeiro protocolo do pipeline inteiramente determinístico — sua entrada (DecisionContext) já reduziu tudo a enumerações fechadas, então P005 não depende de classificação semântica pré-computada, apenas de uma tabela de mapeamento auditável. |
| 0.6 | 2026-07-12 | P006 (Eligible Provider Set Builder) formalmente registrado. Visão do pipeline (seção 2.1) atualizada: "EligibleSpecialists" renomeado para `EligibleProviderSet` (ADR-013). P006 recebe dois artefatos de entrada (CompetencyProfile + a porta ProviderRepository) e é o segundo protocolo inteiramente determinístico do pipeline. |
| 0.7 | 2026-07-12 | P007 (Compatibility Matrix Builder) formalmente registrado. Terceiro protocolo inteiramente determinístico do pipeline. Especificado após a refatoração da política de campos em três camadas (ADR-014), que permitiu `compatibility`/`compatibilityMatrix` tornarem-se legítimos a partir deste protocolo sem reabrir seu uso em P002-P006. |
| 0.8 | 2026-07-12 | Sprint 9 (ADR-015): corrigido `constraintAlignment` do P007, antes estruturalmente sempre `NOT_APPLICABLE` — DecisionContext passa a preservar `mandatoryConstraints` do DecisionCase. P008 (Shortlist Builder) formalmente registrado: quarto protocolo inteiramente determinístico do pipeline, único de entrada única (CompatibilityMatrix). |
| 0.9 | 2026-07-12 | Sprint 10: corrigido o P008 — ordenação por `providerId` deixa de decidir a composição quando há mais de três qualificados (agora `BLOCKED`/`AMBIGUOUS_COMPOSITION`). P009 (Human Review) formalmente registrado: primeiro protocolo do pipeline com autoridade decisória humana real, não inteiramente determinístico por natureza (a decisão é sempre de um humano; o protocolo só valida sua consistência estrutural). |
| 0.10 | 2026-07-12 | Sprint 11 (ADR-016): P010 (Final Curadoria Delivery) formalmente registrado — último protocolo do pipeline. Materializa e comunica a decisão do P009, sem tomar uma nova decisão (`DeliveryArtifact`, `decisional: false`). **Pipeline do ACE (P001-P010) estruturalmente completo — nenhum P011 planejado.** |
