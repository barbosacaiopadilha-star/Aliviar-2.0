# Mapa do Código

Ponto de partida para localizar rapidamente onde algo vive. Não duplica `docs/CONVENTIONS.md` (como o código é escrito) nem `docs/ARCHITECTURE.md` (por que é assim) — aqui é só **onde**.

## `src/modules/*` — módulos de domínio

Cada módulo é isolado: nunca acessa dado de outro módulo diretamente, só por contrato explícito (`docs/CONVENTIONS.md`).

| Módulo | Status | Propósito | Arquivos-chave |
|---|---|---|---|
| `auth` | Ativo | Sessão, papéis, proteção de rota, redirecionamento seguro. | `guard.ts` (`requireRole`/`requireAnyRoleForAction`), `public-paths.ts`, `role-home.ts`, `session.ts` |
| `profiles` | Ativo | Perfil base + conta de paciente + perfil de profissional (incl. documentos, notificações). | `patient-*.ts`, `professional-*.ts`, `types.ts` |
| `story` | Ativo | "Sua História" — wizard de acolhimento, persistido no servidor com concorrência otimista. | `repository.ts`, `use-story-draft.tsx`, `attachment-*.ts` |
| `cases` | Ativo | Entidade Caso — máquina de estados, log de eventos, notas. | `state-machine.ts`, `repository.ts`, `actions.ts` |
| `team` | Ativo | Gestão da equipe Aliviar (Administrador/Curador Médico). | `repository.ts`, `actions.ts` |
| `ace` | Ativo, **congelado (V1.0)** | O Método ACE em si — protocolos P001–P010, puro, sem I/O direto. | ver seção própria abaixo |
| `concierge` | Ativo, **congelado (V1.0)** | Orquestra o ACE: resolve o modelo de linguagem, executa o pipeline, persiste artefatos/eventos, Revisão Humana (P009), Entrega (P010). | `orchestrator.ts`, `language-model.ts`, `human-review-repository.ts`, `delivery-repository.ts` |
| `discovery` | **Reservado, vazio** | Busca/listagem pública de profissionais (plano original de MVP — nunca implementado; ver nota em `docs/ENGINEERING_PLAN.md`). | — |
| `connection` | **Reservado, vazio** | Solicitação de contato paciente→profissional (idem). | — |
| `community`, `institutions`, `benefits`, `programs`, `ai`, `partners` | **Reservado, vazio** | Módulos futuros, fora de escopo até terem ADR próprio (ADR-004). | `README.md` de uma linha cada |

## `src/modules/ace/` — estrutura interna

O ACE é organizado por camada, não por protocolo — ver `docs/ace/README.md` para o catálogo completo do Método.

| Pasta | Conteúdo |
|---|---|
| `core/` | Utilitários transversais: `protocol-id.ts` (union type central), `artifact-contract.ts`/`artifact-reference.ts` (tipos-base de artefato), `field-policy.ts` (campos proibidos por camada — Kernel/Estágio/Artefato, ADR-014), `version-manager.ts`, `deep-freeze.ts`. |
| `artifacts/` | Um arquivo por tipo de artefato (`narrative.ts`, `decision-case.ts`, ..., `final-curadoria.ts`) — construção, validação, nunca lógica de protocolo. |
| `protocols/` | Um arquivo por protocolo (`p002-case-builder.ts` … `p010-final-curadoria-delivery.ts`) — a lógica de cada etapa do pipeline. P001 (Intake) não tem arquivo próprio aqui: a `Narrative` é construída deterministicamente a partir da `PatientStory` já enviada (`buildNarrativeFromStory` em `src/modules/concierge/orchestrator.ts`) — não há chamada ao modelo de linguagem nesta etapa. |
| `ports/` | Contratos de repositório que o ACE consome sem conhecer a implementação (`provider-repository.ts`, `provider-profile-repository.ts`, `provider-presentation-repository.ts`) + implementações in-memory para teste. As implementações reais (Supabase) vivem em `src/modules/concierge/provider-adapters.ts`. |

## `src/app/` — rotas (App Router)

Áreas por papel são **segmentos reais**, nunca route groups (ADR-009). `(public)` e `(auth)` são route groups só para compartilhar layout.

| Segmento | Papel | Conteúdo |
|---|---|---|
| `(public)/` | Visitante | Landing, `sua-historia` (raiz pública) e o wizard `(wizard)/` (motivo, para-quem, história, informações, preferências, revisão) — autenticado, papel paciente. |
| `(auth)/` | Visitante | Login, recuperação/nova senha. |
| `admin/` | Administrador | Dashboard, pacientes, profissionais, equipe, casos, observabilidade do ACE (`admin/ace`). |
| `curador/` | Curador Médico | Dashboard, casos atribuídos, Revisão Humana (`curador/casos/[id]/revisao`). |
| `profissional/` | Profissional | Dashboard mínimo. |
| `paciente/` | Paciente | Dashboard, documentos, linha do tempo, perfil, Curadoria (`paciente/curadoria`, com view de impressão). |
| `acesso-negado/` | Qualquer | Autenticado, mas sem o papel exigido pela rota. |

## `src/components/`

| Pasta | Conteúdo |
|---|---|
| `ui/` | Design system: `Button`, `Card`, `Input`, `Alert`, `Badge`, `Dialog`/`Drawer`/`Tooltip`/`DropdownMenu` (implementações próprias, sem Radix — `docs/CONVENTIONS.md`). |
| `shell/` | `AppShell` compartilhado pelas quatro áreas autenticadas, `nav-items.ts` (itens de navegação por papel). |
| `ace/` | Observabilidade: timeline, health check, métricas, tabela de execuções, viewer/diff de artefatos. |
| `cases/`, `admin/`, `patient/`, `profiles/`, `story/`, `landing/`, `auth/`, `forms/`, `providers/` | Componentes específicos de cada área de produto. |

## `src/lib/supabase/`

`browser.ts`/`server.ts` (clients por contexto), `admin.ts` (service role — nunca no cliente), `middleware.ts` (renovação de sessão, checagem otimista de rota pública), `env.ts` (leitura tipada de variáveis).

## Testes

Ver `docs/CONVENTIONS.md` (camadas) — `tests/unit/`, `tests/components/`, `tests/integration/`, `tests/e2e/`, cada um espelhando a estrutura de `src/` pelo nome do arquivo testado, não por pasta.
