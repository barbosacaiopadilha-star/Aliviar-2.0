# Baseline da Arquitetura Canônica

**Referência oficial do projeto a partir de 2026-07-27.** Este documento descreve o que existe, não o que se pretende. Antes de propor qualquer mudança estrutural, leia-o: uma proposta que contradiga o que está aqui precisa primeiro explicar por que a realidade descrita mudou.

Autoridade: ADR-035, ADR-036 e ADR-037 (`docs/DECISIONS.md`). Este documento não decide nada — ele registra o resultado daquelas decisões, já publicado em produção.

---

## 1. Fluxo oficial

```
Paciente conta sua história
  → Case
  → Curador conduz a Curadoria (critérios, Mesa, seleção humana)
  → Relatório emitido e entregue          ← ENTREGA CANÔNICA
  → o paciente escolhe um dos três caminhos
  → Connection
  → Concierge acompanha
  → Relationship
```

Duas afirmações que sustentam tudo o mais:

- **A Curadoria tem uma única autoridade decisória: o Curador**, exercida na Mesa.
- **A decisão sobre qual caminho seguir é do paciente**, e de mais ninguém — nem do Curador, nem do Concierge, nem do Administrador. Isso é reforçado no banco, não só na interface.

## 2. A entrega canônica

Uma Curadoria só está entregue quando **todas** estas condições valem ao mesmo tempo:

- o Relatório foi **emitido** (`emitted_at`) e **entregue** (`delivered_at`);
- a seleção que ele materializa também está entregue (`curated_selections.status = 'DELIVERED'`);
- Relatório, seleção e Case são o **mesmo** Case — nenhum vínculo cruzado;
- a seleção tem **autoria humana** (`selected_by` preenchido);
- há **exatamente três** opções, de três profissionais **distintos**.

Essa regra vive num só lugar — `curadoria.canonical_delivery_matches` — e é reusada por todos os consumidores. Nunca reescrita.

O jusante nunca pergunta "existe linha em tal tabela?". Pergunta **"existe uma Curadoria validamente entregue para este Case?"** ao contrato em [`src/modules/curadoria/delivery-contract.ts`](../src/modules/curadoria/delivery-contract.ts), que não expõe P008/P009/P010, ACE, `curated_selections`, `curadoria_reports` nem detalhe de persistência.

**Janela de compatibilidade:** o contrato reconhece duas fontes com precedência explícita — entrega do Método primeiro, entrega legada do ACE **somente** quando não existir entrega canônica para o Case. Nunca combinadas; nunca mais de uma reconhecida por Case.

## 3. Módulos e responsabilidades

| Módulo | Responsabilidade |
|---|---|
| `src/platform/**` | Capacidades de engenharia puras: erro codificado, congelamento profundo, estado de informação, política de campos, vocabulário proibido, registro versionado com proveniência, contrato de validação. **Nunca importa `modules/*`** (ADR-030). Não conhece Curadoria, Mesa, paciente ou Concierge. |
| `modules/story` | A história da pessoa: rascunho, autosave, envio. |
| `modules/cases` | O Case — registro único da jornada, máquina de estados, responsabilidade auditada. |
| `modules/curadoria` | A Curadoria do Método: prioridades, Mesa, seleção, Relatório. Contém o **contrato canônico de entrega**. |
| `modules/connection` | A escolha da pessoa, ancorada no Relatório entregue. |
| `modules/relationship` | O acompanhamento depois do primeiro atendimento. |
| `modules/crm` | Leads, contatos, funil, tarefas, agenda e a projeção do quadro operacional. |
| `modules/profiles` | Pacientes, profissionais e a rede. |
| `modules/team` | Papéis internos (Administrador, Curador Médico). |
| `modules/auth` | Sessão, papéis, guardas de rota, home por papel. |
| `modules/ace` | Protocolos P001–P008 e artefatos. **Motor histórico sob observação** — ver §7. |
| `modules/concierge` | Orquestração e leitura do histórico do ACE. Somente leitura sobre `human_review_results` e `final_curadoria_deliveries`. |

## 4. Tabelas principais (schema `curadoria`, 49 tabelas)

**Jornada:** `profiles`, `patient_profiles`, `patient_stories`, `cases`, `case_events`, `case_notes`, `case_responsibility_changes`

**Curadoria do Método:** `priority_profiles`, `priority_profile_filters`, `priority_weights`, `compatibility_analyses`, `compatibility_criterion_results`, `curated_selections`, `curated_selection_options`, `curadoria_reports`, `curadoria_report_options`, `patient_curadoria_decisions`, `consultation_records`, `curator_observations`, `case_clinical_context`

**Escolha e acompanhamento:** `connection_records`, `connection_events`, `relationship_records`, `relationship_events`, `devolutiva_records`

**CRM:** `crm_contacts`, `crm_interactions`, `crm_tasks`, `crm_appointments`, `crm_audit_log`

**Histórico do ACE (íntegro, somente leitura):** `ace_executions`, `ace_artifacts`, `ace_execution_events`, `human_review_results`, `final_curadoria_deliveries`

### A âncora de Connection

`connection_records` tem **duas** colunas de âncora e uma constraint que garante **exatamente uma** delas preenchida:

- `curadoria_report_id` — **canônica**. Índice único parcial: uma Connection por Relatório.
- `final_curadoria_delivery_id` — **legada** (ACE/P010), anulável. Preservada para registros históricos; nenhum registro novo deve usá-la.

## 5. Funções principais

| Função | Segurança | Papel |
|---|---|---|
| `canonical_delivery_matches(uuid, uuid, uuid)` | DEFINER | A regra da entrega canônica. Devolve booleano, nunca dado. |
| `canonical_delivery_has_professional(uuid, uuid)` | DEFINER | O profissional escolhido pertence às três opções entregues. |
| `canonical_delivery_target(uuid)` | DEFINER | Deriva Case e paciente a partir do Relatório. **Não autoriza nada** — quem autoriza é a policy de INSERT. |
| `create_connection_from_report(...)` | INVOKER | Nascimento transacional e idempotente da Connection. Identidade vem de `auth.uid()`, nunca do parâmetro. |
| `case_has_delivered_curadoria(uuid)` | DEFINER | "Houve entrega?" para quem tem vínculo com o Case. Sem vínculo responde `false` — igual a Case inexistente, para não permitir enumeração. |

Todas com `search_path` fixo (`curadoria, public`).

## 6. Superfícies

**Públicas (sem sessão):** `/` (Landing), `/login`, `/recuperar-senha`, `/nova-senha`, `/sua-historia` (só a raiz explicativa — ADR-018 proíbe preenchimento anônimo), `/robots.txt`, `/sitemap.xml`, `/auth/callback`

**Privadas:** `/paciente/**` (Jornada), `/coa/**` (Centro de Operações: Atendimento, Curadoria, Concierge), `/admin/**`, `/profissional`, `/atendimento`, `/acompanhamento`, `/sua-historia/**` (wizard)

O middleware faz a checagem **otimista** (existe sessão?); a autoritativa de papel acontece em cada layout via `requireRole()`, e no banco pela RLS. O matcher exclui `_next/*`, `_vercel/*`, `favicon.ico` e assets estáticos — `/_vercel/*` é servido pela plataforma e nunca deve ser interceptado.

## 7. O ACE hoje

**Não é motor de Curadoria.** Não seleciona profissionais, não produz shortlist definitiva, não aprova Curadoria, não produz entrega concorrente e não desencadeia o Concierge por caminho paralelo.

**Preservado:** as tabelas históricas, íntegras e legíveis; `/admin/ace` como observabilidade; Golden Set; governança de modelos; a leitura legada encapsulada no contrato de entrega.

**Removido:** as rotas `/admin/casos/[id]/revisao` e `/curador/casos/[id]/revisao`; `FinalCuradoriaDeliveryPanel`, `HumanReviewForm`, `AceExecutionPanel`; as Server Actions correspondentes; e os escritores `submitHumanReview` e `deliverFinalCuradoria`. Nenhuma superfície da aplicação consegue inserir ou alterar `human_review_results` ou `final_curadoria_deliveries`.

**`runAceExecution` continua existindo** (ADR-037), exclusivamente como motor histórico sob observação: certificação, Golden Set, governança do modelo, métricas. **Não pode ter rota, Server Action, painel operacional, botão, fluxo de paciente ou de Curador, nem dependência da Curadoria canônica.** Seu único chamador é `tests/integration/ace-observabilidade.integration.test.ts`.

## 8. Grants

As cinco funções canônicas são executáveis **apenas por `authenticated`**. `PUBLIC`, `anon` e `service_role` não têm `EXECUTE`.

Isso não é o padrão do PostgreSQL: `create function` concede `EXECUTE` a `PUBLIC` automaticamente, e `PUBLIC` alcança `anon`. As migrations de endurecimento revogam esse padrão explicitamente. O teste `tests/integration/canonical-function-grants.integration.test.ts` consulta os privilégios reais no banco — não procura `revoke` no texto da migration —, porque é justamente uma migration futura que recrie a função a regressão que precisa ser pega.

**Limite conhecido:** 31 das 44 funções do schema `curadoria` ainda são executáveis por `anon`. É dívida anterior a esta release, com auditoria própria no backlog.

## 9. Migrations da arquitetura canônica

| Versão | Nome | O que faz |
|---|---|---|
| `20260725234500` | `connection_ancora_canonica` | Coluna âncora, índice único parcial, CHECK validada, três funções, policy de INSERT, RPC de nascimento |
| `20260726001500` | `connection_ancora_derivacao` | `canonical_delivery_target`; identidade passa a exigir `auth.uid()` |
| `20260726010000` | `fato_entrega_canonica` | `case_has_delivered_curadoria` |
| `20260727040000` | `canonical_function_grants_hardening` | Revoga `PUBLIC` das quatro funções; concede a `authenticated` |
| `20260727041000` | `fato_entrega_grants_hardening` | Idem para `case_has_delivered_curadoria` |

Aplicadas em produção em 2026-07-27. Nenhum dado alterado.

## 10. Limites desta arquitetura

Fatos, não promessas:

- **Sem CI.** Não existe `.github/workflows`. Toda certificação é local; um PR não tem checks a aguardar.
- **Sem backup gerenciado.** A organização Supabase está no plano `free`: sem PITR e sem backup automático. O único ponto de recuperação é um dump lógico manual.
- **Sem conta de smoke test.** As 40 contas sintéticas em produção não têm papel atribuído, então não alcançam superfícies autenticadas. Validar o fluxo canônico em produção hoje exigiria criar dados reais.
- **Grants históricos abertos.** Ver §8.
- **A âncora legada ainda existe.** `final_curadoria_delivery_id` permanece na tabela, e o contrato ainda reconhece a fonte legada. A janela de compatibilidade só fecha quando nenhum Case ativo depender dela.
- **O ledger de migrations diverge se aplicado por ferramenta que gera timestamp próprio.** Foi reconciliado manualmente nesta release; o próximo ciclo deve usar `supabase db push` ou reconciliar de novo.
