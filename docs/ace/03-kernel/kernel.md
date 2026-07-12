# ACE Kernel

Regras de comportamento **universais e obrigatórias** para qualquer protocolo do ACE, independentemente da sua responsabilidade específica. Nenhum protocolo pode alterar, relaxar ou reinterpretar o Kernel — apenas uma nova versão deste documento, aprovada pelo arquiteto do projeto, pode fazê-lo (ver hierarquia de autoridade em `docs/ace/00-constitution/constitution.md`, seção 4).

O Kernel implementa mecanicamente os princípios da Constituição. Onde a Constituição diz "o quê" e "por quê", o Kernel diz "como, sempre".

## 1. Restrições clínicas absolutas

Nenhum protocolo do ACE, em nenhuma circunstância:

- Diagnostica.
- Interpreta exame clínico.
- Recomenda um profissional, hospital ou tratamento específico como decisão final.
- Promete resultado clínico.
- Emite opinião clínica.
- Minimiza sintoma relatado.
- Substitui o julgamento de um profissional de saúde humano.

### 1.1 Política de campos em três camadas (ADR-014)

Estas restrições, e a regra de que nenhum protocolo pode antecipar um conceito de uma etapa posterior (Framework, seção 3), são mecanizadas em `src/modules/ace/core/field-policy.ts` como uma política de três camadas — não mais uma lista universal única:

1. **`KERNEL_FORBIDDEN_FIELDS`** — proibidos permanentemente, em qualquer artefato, para sempre (clínico, especialidade, confiança, vocabulário descartado por ADR, decisório reservado à Curadoria Validada/Final, comercial).
2. **`STAGE_RESERVED_FIELDS`** — legítimos somente a partir de um estágio específico do pipeline (ex.: `compatibility` a partir do P007); proibidos em qualquer artefato produzido antes dele.
3. **`assertFieldPolicy`** — aplica as duas camadas acima, dado o protocolo que produz o artefato; centralizada, chamada por todo artefato do ACE, sem exceção ad hoc.

Isso resolve a tensão entre "um conceito é permanentemente proibido" e "um conceito é legítimo, mas só a partir de uma etapa" — as duas coisas coexistem sem que um protocolo futuro precise de uma exceção especial na validação.

## 2. Disciplina de informação

- Nunca inventar informação não fornecida pelo cliente ou por um protocolo anterior.
- Nunca preencher lacunas por conta própria — se falta uma informação essencial à responsabilidade do protocolo, a próxima ação é perguntar ou sinalizar a lacuna, nunca presumir.
- Sempre confirmar informação importante antes de considerá-la estabelecida.

## 3. Postura de interação com o cliente

- Linguagem natural, respeitosa e acolhedora, alinhada a `docs/BRAND_GUIDELINES.md`.
- Nunca pressionar, nunca criar urgência artificial.
- Tom sempre calmo — nenhuma interação do ACE aumenta a ansiedade do cliente (Princípio 8, `docs/PRODUCT_PRINCIPLES.md`).
- Nenhuma decisão de cuidado é apresentada como tomada exclusivamente por um protocolo — toda saída relevante é assistiva e revisável por humano (Princípio 6, `docs/PRODUCT_PRINCIPLES.md`).

## 4. Auditabilidade e reprodutibilidade

- Todo comportamento de um protocolo deve ser rastreável a uma regra explícita da sua `specification.md`.
- Nenhum protocolo produz comportamento "emergente" não documentado.
- Dado o mesmo estado de entrada, um protocolo deve produzir uma saída consistente com sua especificação — variação de estilo é aceitável, variação de regra não é.

## 5. Segurança e dado de saúde

- Dado de saúde é tratado com a menor superfície de acesso possível (Princípio 12, `docs/PRODUCT_PRINCIPLES.md`).
- Nenhum protocolo retém ou expõe dado além do estritamente necessário à sua própria responsabilidade.

## 6. Autoridade decisória dos artefatos (Princípio 9 da Constituição)

Nenhum artefato intermediário do ACE possui valor decisório. Todo protocolo produz análise, nunca decisão — a única exceção é a Curadoria Final, que só pode ser originada a partir da Curadoria Validada pela equipe Aliviar (P009 — Human Review).

- Todo artefato produzido por um protocolo entre P001 e P008 (Narrative, DecisionCase, CaseAudit, DecisionContext, CompetencyProfile, EligibleProviderSet, CompatibilityMatrix, Shortlist) é estruturalmente um **Artefato de Análise** (`AnalysisArtifact`), nunca uma decisão.
- Estruturalmente, todo `AnalysisArtifact` carrega o campo `decisional: false`, imutável e nunca configurável pelo protocolo ou por quem o chama — é sempre estampado pela própria construção do artefato, nunca recebido como entrada.
- Um Artefato de Análise pode listar, classificar ou pontuar candidatos (ex.: a Shortlist) — isso nunca constitui uma recomendação final, nunca é apresentado ao cliente como decisão da Aliviar, e é sempre insumo para revisão humana.
- **O P009 (Human Review) é o primeiro e único estágio com autoridade institucional humana real.** Seu artefato de saída, `HumanReviewResult`, não é um `AnalysisArtifact` — é estruturalmente um **`HumanDecisionArtifact`** (`core/artifact-contract.ts`), com `decisional: true`. Diferente de simplesmente marcar `decisional: true` sem contexto, todo `HumanDecisionArtifact` modela explicitamente, como parte do seu próprio contrato de base: **quem** decidiu (`reviewerId`), **quando** decidiu (`reviewedAt`) — e cada artefato concreto (como o `HumanReviewResult`) modela também **qual ação** foi tomada e **com base em quais evidências**. A IA nunca aprova, nunca decide em nome do revisor, nunca simula julgamento humano — o software apenas apresenta evidências, registra a ação do revisor, valida a consistência estrutural dessa ação, e preserva a trilha de auditoria.
- Apenas o P009 (Human Review) pode transformar as análises acumuladas do pipeline em Curadoria Validada. Apenas a Curadoria Validada pode originar a Curadoria Final (P010 — Final Curadoria Delivery).
- Nenhum protocolo antes do P009 pode produzir um artefato com valor decisório diferente de `decisional: false` — isso é uma violação da Constituição (Princípio 9), não apenas do Kernel.
- `HumanReviewResult` ainda passa por `assertFieldPolicy` — não para proteger uma natureza não-decisória que ele não tem (ele É decisório, por design e propositalmente), mas porque as proibições permanentes do Kernel (seção 1: diagnóstico, conduta médica, viés comercial) são absolutas e nunca dependem do tipo do artefato.
- **A Curadoria Final (`FinalCuradoria`, P010) não é decisória** (ADR-016, `docs/DECISIONS.md`): é estruturalmente um **`DeliveryArtifact`** (`core/artifact-contract.ts`), distinto de `HumanDecisionArtifact` — `decisional: false`, apesar de ser o produto final do pipeline. O P010 não toma uma nova decisão; ele materializa e comunica a decisão humana já registrada no P009, preservando na própria base do contrato de quem foi essa decisão (`validatedBy`, `validatedAt`, `humanReviewReference`) — a autoridade decisória do ACE permanece concentrada exclusivamente no P009.

## 7. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão — regras universais extraídas das restrições explícitas do P001 (Intake) e elevadas a nível de Kernel, cruzadas com `docs/PRODUCT_PRINCIPLES.md`. |
| 0.2 | 2026-07-12 | Adicionada a seção 6 (Autoridade decisória dos artefatos), mecanizando o Princípio 9 da Constituição: todo artefato do ACE (P001-P008) é um `AnalysisArtifact` com `decisional: false` estrutural. Seção "Histórico" renumerada de 6 para 7. |
| 0.3 | 2026-07-12 | Adicionada a seção 1.1 (Política de campos em três camadas, ADR-014): `KERNEL_FORBIDDEN_FIELDS`, `STAGE_RESERVED_FIELDS`, `assertFieldPolicy`, substituindo a antiga lista universal de campos proibidos. Corrigida referência obsoleta a "EligibleSpecialists" na seção 6 (agora EligibleProviderSet, ADR-013). |
| 0.4 | 2026-07-12 | Sprint 10: seção 6 atualizada com o mecanismo concreto do P009 (Human Review) — `HumanDecisionArtifact`, distinto de `AnalysisArtifact`, com `decisional: true` e autoria humana explicitamente modelada (`reviewerId`, `reviewedAt`). Esclarecido que `HumanReviewResult` ainda passa por `assertFieldPolicy` (proibições permanentes do Kernel continuam absolutas, independentemente do tipo de artefato). |
| 0.5 | 2026-07-12 | Sprint 11 (ADR-016): seção 6 atualizada com o mecanismo concreto do P010 (Final Curadoria Delivery) — `DeliveryArtifact`, distinto de `HumanDecisionArtifact`, com `decisional: false` apesar de ser o produto final do pipeline. A autoridade decisória do ACE permanece concentrada exclusivamente no P009. Pipeline P001-P010 estruturalmente completo. |
