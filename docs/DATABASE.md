# Banco de Dados — Catálogo de Tabelas

> ## ⚠️ Onde o schema realmente vive (MISSÃO 209, Fase 2)
>
> **O banco de produção usa o schema `curadoria`, não `public`.** O `public` do
> mesmo banco (`aliviar-2-prod`) pertence à **AliCIA**, outro produto — nunca
> escreva nele a partir deste repositório.
>
> **`supabase/migrations/` não descreve produção por completo.** As 7 migrations
> que construíram o schema `curadoria` foram aplicadas fora deste repositório e
> ainda não estão versionadas aqui; o SQL delas está em
> `supabase_migrations.schema_migrations` e é recuperável com
> `supabase db pull --schema curadoria`. Ver
> `supabase/migrations-legacy-public/README.md`.
>
> As 32 migrations que descreviam o schema em `public.` foram **arquivadas** —
> nunca produziram produção e não devem ser aplicadas.
>
> Consequência prática: `supabase db reset` local produz um schema **diferente**
> de produção. É a causa raiz do bloqueador B6 (testes de integração sem valor
> probatório sobre o banco real).

Schema aplicado apenas por CLI ou migration dirigida — nunca editado manualmente no painel. **Migrations já aplicadas nunca são editadas**; uma correção é sempre uma nova migration. RLS habilitada desde a migration que cria cada tabela — nenhuma tabela "temporariamente aberta" (`docs/CONVENTIONS.md`).

Este catálogo é um **mapa de leitura rápida**. Enquanto a reconciliação não estiver completa, a fonte da verdade do schema é o **banco de produção**, não este diretório. Para gerar tipos TypeScript a partir do schema real, use o MCP do Supabase (`generate_typescript_types`).

## Identidade e papéis

| Tabela | Migration | Propósito |
|---|---|---|
| `roles` | `20260712040600` | Catálogo de papéis (`administrador`, `profissional`, `paciente`, `curador_medico` — ADR-006). |
| `profiles` | `20260712040600` | Identidade base, 1:1 com `auth.users` — sem coluna fixa de papel. |
| `user_roles` | `20260712040610` | Associação N:N pessoa↔papel (ADR-006). Adicionar um papel novo é dado, não migration estrutural. |
| `user_settings` | `20260712040630` | Preferências por usuário. |
| `audit_logs` | `20260712040620` | Log de auditoria genérico da fundação de autenticação. |

## Perfis de domínio

| Tabela | Migration | Propósito |
|---|---|---|
| `patient_profiles` | `20260712050000` | Dados complementares do paciente. |
| `professional_profiles` | `20260712050010`, `20260712120000` (colunas de competência) | Dados do profissional — bio, modalidade, e (desde a Sprint ACE) `experience_level`/`intake_approach`/`offers_continuous_care`/`availability_window`/`practical_considerations`, consumidos pelo P005/P006. |
| `professional_competency_areas` | `20260712120000` | Domínio/foco de competência do profissional (entrada real do P005/P006 — nunca inventado pelo ACE). |
| `professional_documents` | `20260712070010` | Documentos do profissional (Storage + metadados). |
| `patient_documents` | `20260712080010` | Documentos do paciente. |
| `patient_notifications` | `20260712080000` | Notificações emitidas por ações administrativas. |

## Sua História

| Tabela | Migration | Propósito |
|---|---|---|
| `patient_stories` | `20260712090000` | Rascunho/história enviada pelo paciente, com `revision` para concorrência otimista (ADR-018). |
| `patient_story_versions` | `20260712090000` | Histórico de versões da história. |
| `patient_story_attachments` | `20260712090010` | Anexos vinculados à história. |

## Caso

| Tabela | Migration | Propósito |
|---|---|---|
| `cases` | `20260712100000`, `20260712100010` (acesso do curador), `20260712120020` (transições + concorrência do ACE) | Entidade operacional que liga a História ao pipeline do ACE — máquina de estados própria (ADR-019, ver `docs/PRODUCT_ARCHITECTURE.md` §14 e `src/modules/cases/state-machine.ts`). |
| `case_events` | `20260712100000` | Log unificado de criação/mudança de status/atribuição de curador. **Append-only.** |
| `case_notes` | `20260712110000` | Notas internas do caso, uma linha por nota, com autoria. **Append-only** (ADR-020 — substituiu um campo `cases.notes` sobrescrevível). |

## ACE (execução do Método)

| Tabela | Migration | Propósito |
|---|---|---|
| `ace_executions` | `20260712120010` | Uma execução do pipeline P001–P010 para um Caso — status, protocolo atual, retomada/idempotência. |
| `ace_artifacts` | `20260712120010` | Artefato produzido por cada protocolo (Narrativa, DecisionCase, CaseAudit, DecisionContext, CompetencyProfile, EligibleProviderSet, CompatibilityMatrix, Shortlist), versionado. |
| `ace_execution_events` | `20260712130000` | Log estruturado de observabilidade (`STARTED`/`RESUMED`/`PROTOCOL_STARTED`/`PROTOCOL_COMPLETED`/`ARTIFACT_REUSED`/`BLOCKED`/`FAILED`/`COMPLETED` — ver `AceExecutionEventType` em `src/modules/concierge/types.ts`). **Append-only.** |

## Decisão humana e entrega (P009/P010)

| Tabela | Migration | Propósito |
|---|---|---|
| `human_review_results` | `20260712140000` | Decisão do Curador Médico (`APPROVE`/`ADJUST`/`REJECT`/`REQUEST_MORE_INFORMATION`) com justificativa obrigatória. **Append-only** — um Caso pode acumular múltiplas revisões ao longo do tempo, cada uma sua própria linha (nunca reutiliza `ace_artifacts`, que assume "última versão vence"; ver ADR de P009). |
| `final_curadoria_deliveries` | `20260712150000` | A Curadoria Final entregue ao paciente. **Append-only.** É a **única tabela cuja RLS concede SELECT direto ao paciente** — todo campo foi desenhado para ser seguro de expor (ver ADR-016: `DeliveryArtifact`, `decisional: false`). |

## View

| View | Migration | Propósito |
|---|---|---|
| `patient_case_overview` | `20260712100000`, recriada em `20260712150000` | Única forma pela qual o paciente lê o estado do próprio Caso — status traduzido para linguagem humana em SQL (nunca em código de aplicação), sem nenhuma coluna de nota, protocolo ou artefato do ACE. |

## Convenções

- Nomenclatura: `snake_case`, plural.
- Tabelas de log/decisão/entrega são **append-only por design** — a garantia é a ausência de policy de `UPDATE`/`DELETE`, não uma trigger que bloqueia a aplicação.
- Toda checagem de papel em RLS passa por uma função/helper genérica (`has_role(...)`, funções `is_case_curator_for_*`) — nunca um valor de enum espalhado pelas policies.
- Migrations são identificadas por timestamp (`YYYYMMDDHHMMSS_descricao.sql`) e nunca reordenadas ou editadas após aplicadas — uma correção de schema é sempre uma nova migration.

## Método de Curadoria Compartilhada (schema `curadoria`)

Aplicado em produção pela MISSÃO 209, Fase 1 — migration `20260724022540_curadoria_stage7_metodo_curadoria_compartilhada`.

| Tabela | Propósito | Invariante que o schema garante |
|---|---|---|
| `priority_profiles` | Perfil de Prioridades — o artefato central do Método. | Validação coerente com status; **um vigente por Caso** (índice parcial). |
| `priority_profile_filters` | Restrições (eliminatórias) e Preferências. | Valor não-vazio. Restrição nunca recebe peso. |
| `priority_weights` | Distribuição de 100 pontos. | **`evidence` NOT NULL e não-vazio** — peso sem Evidência de Curadoria é impossível (Inv. 10). Um por critério. |
| `compatibility_analyses` | Análise por profissional: score interno, faixa, cobertura. | **Nenhuma policy de SELECT para o paciente** — o score interno nunca sai do nível interno (Inv. 26). |
| `compatibility_criterion_results` | Decomposição por critério. | `alignment` nullable = lacuna de cadastro, nunca 0 disfarçado de nota baixa (Inv. 34). |
| `curated_selections` | As três opções escolhidas. | **`selected_by` NOT NULL** — toda seleção tem autoria humana (Inv. 13). Trigger exige **exatamente três** na entrega (Inv. 17). |
| `curated_selection_options` | Uma das três opções. | `position` 1–3; nenhum profissional repetido (Inv. 19). Ordem é apresentação, nunca colocação. |
| `patient_curadoria_decisions` | A escolha do paciente. **Append-only.** | INSERT restrito ao próprio paciente (Inv. 14). `NONE_OF_THEM` é desfecho legítimo. |

### Triggers

- `enforce_priority_profile_validation` — a distribuição precisa somar **exatamente 100** no momento da validação.
- `protect_validated_priority_profile` — Perfil validado é **imutável**; corrigir exige criar um novo (Inv. 28).
- `enforce_selection_has_three` — entrega só acontece com exatamente três opções.

### Funções auxiliares

`curadoria.is_curator_for_case(uuid)` e `curadoria.is_patient_for_case(uuid)` — usadas por toda a RLS do Método. Nascem com `search_path` fixo e `EXECUTE` revogado de `anon`/`authenticated`: são infraestrutura de policy, não RPC.

### Invariantes testados no banco real

Verificados na Fase 1 com transação revertida ao final:

| Teste | Resultado |
|---|---|
| Peso sem evidência | recusado |
| Validar com 60 pontos | recusado |
| Validar com 100 pontos | aceito |
| Alterar Perfil já validado | recusado |
| Entregar com 0 opções | recusado |
