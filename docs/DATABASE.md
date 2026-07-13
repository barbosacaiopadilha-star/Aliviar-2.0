# Banco de Dados — Catálogo de Tabelas

Schema versionado em `supabase/migrations/` (Postgres via Supabase), aplicado apenas por CLI — nunca editado manualmente no painel. **Migrations já aplicadas nunca são editadas**; uma correção é sempre uma nova migration. RLS habilitada desde a migration que cria cada tabela — nenhuma tabela "temporariamente aberta" (`docs/CONVENTIONS.md`).

Este catálogo é um **mapa de leitura rápida**; a fonte da verdade do schema é sempre o SQL em `supabase/migrations/`. Para gerar tipos TypeScript atualizados a partir do schema real, use o MCP do Supabase (`generate_typescript_types`) ou `supabase gen types`.

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
