# FOUNDATION FREEZE — Constituição Técnica da Aliviar 2.0

**Versão:** Aliviar 2.0  
**Branch de referência:** `release/v1.0.0-beta`  
**Commit de referência:** `20eba78`  
**Data do congelamento:** 23 de julho de 2026  
**Status:** **FROZEN**

---

## Declaração

A arquitetura da Aliviar 2.0 entra oficialmente em estado de **congelamento fundacional**.

A partir deste documento, o objetivo da plataforma deixa de ser construir estrutura e passa a ser **preservar** a estrutura existente. Toda evolução futura deve respeitar os princípios, aggregates, fluxos e governança aqui registrados.

---

## 1. Estado atual da Plataforma

### Foundation

| Componente | Pacote / localização | Status |
|------------|----------------------|--------|
| Kernel operacional | `src/kernel/` | ✅ Completo |
| RBAC canônico | `src/kernel/rbac/` | ✅ Completo |
| Máquina de estados da jornada | `src/kernel/jornada/` | ✅ Completo |
| Result / Domain errors | `src/domain/shared/` | ✅ Completo |
| Ports & adapters base | `src/kernel/ports/`, `*/ports/` | ✅ Completo |

### Core Domain

| Bounded context | Pacote | Status |
|-----------------|--------|--------|
| Case Registration | `src/case-registration/` | ✅ Completo |
| Journey Handoff | `src/journey-handoff/` | ✅ Completo |
| Journey Memory | `src/journey-memory/` | ✅ Completo |
| Curation Report | `src/curation-report/` | ✅ Completo |
| Curation Process | `src/curation-process/` | ✅ Completo |
| Report Delivery | `src/report-delivery/` | ✅ Completo |
| Identity & Access | `src/identity/` | ✅ Completo |

### Application Layer

| Camada | Pacote / localização | Status |
|--------|----------------------|--------|
| Vertical Slice (orquestração paciente) | `src/vertical-slice/` | ✅ Completo |
| Curator Workspace | `src/curator-workspace/` | ✅ Completo |
| System Integration | `src/system-integration/` | ✅ Completo |
| Product Experience | `src/product-experience/` | ✅ Completo |
| Application legado (staff API) | `src/application/`, `api/` | ✅ Mantido (caminho paralelo) |

### Persistence

| Componente | Localização | Status |
|------------|-------------|--------|
| Domain snapshots (Supabase) | `src/infrastructure/persistence/` | ✅ Produção |
| Repositórios Supabase | `repositories/supabase-*` | ✅ Produção |
| Migrations | `supabase/migrations/` | ✅ Aplicadas (prod: `awdlmeykminwyifnygkm`) |
| RLS | Supabase policies | ✅ Ativo |
| Storage | bucket `patient-documents` | ✅ Ativo |

### Infrastructure

| Componente | Localização | Status |
|------------|-------------|--------|
| Auth middleware | `src/lib/supabase/middleware.ts` | ✅ Completo |
| Staff / Patient access gates | `src/lib/auth/` | ✅ Completo |
| Composition root | `src/infrastructure/composition-root.ts` | ✅ Completo |
| Persistence stack factory | `create-persistence-stack.ts` | ✅ Completo |
| ACE Melhorado v2 | `src/infrastructure/ace/` | ✅ Completo |

### Observability

| Componente | Localização | Status |
|------------|-------------|--------|
| Structured logs | `src/infrastructure/observability/structured-log.ts` | ✅ Completo |
| Correlation IDs | `src/infrastructure/observability/correlation-id.ts` | ✅ Completo |
| Audit trail | `operational_audit_events` + `supabase-audit-trail.ts` | ✅ Append-only |
| Health / Readiness | `/api/v1/health`, `/api/v1/health/ready` | ✅ Produção verde |
| Recovery runbooks | `recovery.ts`, `docs/observability/RECOVERY.md` | ✅ Documentado |
| Métricas operacionais | `/api/v1/operacao/metricas` | ✅ Implementado |

### Security

| Controle | Status |
|----------|--------|
| JWT / Supabase SSR sessions | ✅ |
| RLS por tabela operacional | ✅ |
| RBAC kernel (`authorize(actor, permission)`) | ✅ |
| Session ≠ Operation Actor | ✅ Auditado e consistente |
| Security headers (Next.js) | ✅ |
| Service role server-only (health/admin) | ✅ |
| Demo modes desligados em produção | ✅ |

### Release Engineering

| Componente | Status |
|------------|--------|
| CI workflow | `.github/workflows/ci.yml` |
| Scripts de validação | `validation:diagnose`, `validation:e2e` |
| Deploy Vercel | `aliviar-os.vercel.app` |
| Release scripts | `scripts/release/` |
| Rollback | `scripts/release/rollback.ps1` |
| Readiness probe | `go-live:readiness` |

### Validação de congelamento

| Validação | Resultado |
|-----------|-----------|
| Build produção (83 rotas) | ✅ |
| Testes (841 passed) | ✅ |
| E2E legado (14 etapas) | ✅ |
| Vertical-slice RC (10/10) | ✅ |
| System-integration RC (3/3) | ✅ |
| Auth consistency audit | ✅ CONSISTENT |
| Readiness produção | ✅ `200 ready` |

---

## 2. Aggregates oficiais

### Journey

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Governar o ciclo de vida operacional da jornada do paciente: etapas, bloqueios, encerramento e transições. |
| **Invariantes** | Nasce em `CADASTRO`; transições seguem `state-machine`; etapa terminal não avança; bloqueio impede avanço; `version` incrementa a cada mutação; paciente só acessa jornada própria. |
| **Dependências** | `Case` (origem via bootstrap), `Identity` (ator e ownership), `JourneyMemory` (projeção de leitura). |
| **Proprietário** | `src/kernel/jornada/journey-kernel-aggregate.ts` |

### JourneyMemory

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Reconstruir a história narrativa da jornada por audiência (PORTAL, CURATORIA) a partir de timeline, notas, anexos e compromissos. |
| **Invariantes** | Somente leitura agregada; mutações entram via `appendTimelineEntry` com `actorId` e `audience`; não substitui estado do kernel. |
| **Dependências** | `Journey` (journeyId), `Identity` (acesso por audiência). |
| **Proprietário** | `src/journey-memory/` |

### Case

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Registrar o caso clínico-operacional, associar paciente, ownership e bootstrap da jornada. |
| **Invariantes** | **Toda Journey nasce de um Case; nunca o contrário**; caso com jornada não permanece `OPEN`; `bootstrapJourney` é idempotente por caso. |
| **Dependências** | `Journey` (kernel `createJourney`), `Identity` (ator da operação), `JourneyHandoff` (origem do intake). |
| **Proprietário** | `src/case-registration/model/case.ts` |

### Identity

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Representar identidade operacional, sessão HTTP, escopo de jornada e matriz de permissões da plataforma. |
| **Invariantes** | Sessão HTTP é gate de boundary; autorização de domínio usa `KernelActor` explícito; paciente só acessa recursos próprios; staff inativo é rejeitado. |
| **Dependências** | Supabase Auth, `profiles`, `patients.auth_user_id`. |
| **Proprietário** | `src/identity/` |

### JourneyHandoff

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Conduzir a transição Experiência Pública → Plataforma Operacional sem ruptura narrativa. |
| **Invariantes** | `shouldRestartExperience` é sempre `false`; bootstrap só quando `canBootstrap`; um handoff bootstrapa no máximo uma jornada; checkpoint narrativo é preservado. |
| **Dependências** | `Case` (via `JourneyBootstrapPort`), `Journey` (resultado do bootstrap). |
| **Proprietário** | `src/journey-handoff/` |

### CurationReport

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Construir, versionar e aprovar o relatório de curadoria de um caso/jornada. |
| **Invariantes** | Transições de status via `report-status-machine`; evidências e candidatos só em estados editáveis; audit trail append-only por versão. |
| **Dependências** | `Case`, `Journey`, `JourneyMemory` (contexto compartilhado). |
| **Proprietário** | `src/curation-report/model/curation-report.ts` |

### CurationProcess

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Conduzir o processo de pesquisa, revisão de candidatos e ciclo de aprovação do relatório. |
| **Invariantes** | Um processo ativo por relatório; transições via `process-status-machine`; investigação antes de revisão final; audit trail versionado. |
| **Dependências** | `CurationReport`, `Journey`. |
| **Proprietário** | `src/curation-process/model/curation-process.ts` |

### ReportDelivery

| Campo | Valor |
|-------|-------|
| **Responsabilidade** | Publicar, entregar e registrar leitura/confirmação do relatório ao paciente. |
| **Invariantes** | Entrega só de relatório aprovado; `published` antes de `firstViewed`; confirmação de leitura é terminal para o ciclo de entrega; audit trail append-only. |
| **Dependências** | `CurationReport`, `Journey`, `Identity` (paciente como leitor). |
| **Proprietário** | `src/report-delivery/model/report-delivery.ts` |

---

## 3. Princípios Arquiteturais

Estes princípios são **imutáveis** durante o período de congelamento, salvo RFC aprovado.

| # | Princípio | Definição operacional |
|---|-----------|----------------------|
| P1 | **Domínio primeiro** | Regras de negócio vivem em aggregates e kernel services. |
| P2 | **Application Services apenas orquestram** | `vertical-slice`, `system-integration` e `curator-workspace` coordenam chamadas; não decidem regras. |
| P3 | **Infraestrutura nunca contém regra de negócio** | Repositórios persistem; middleware autentica; não validam invariantes de domínio. |
| P4 | **Toda mutação passa pelo domínio** | Mutations via aggregate methods ou kernel services com `authorize(actor)`. |
| P5 | **Toda leitura usa projeções** | Views, `JourneyMemory`, `build*View` — nunca leitura direta de estado mutável para UI. |
| P6 | **Session ≠ Operation Actor** | HTTP session é gate; operação usa `KernelActor` / `actorId` explícito. |
| P7 | **Delegação explícita** | Bootstrap e transições privilegiadas usam `systemActor` / `SYSTEM_*_ACTOR` declarados. |
| P8 | **Append-only onde aplicável** | `operational_audit_events`, audit trails de report/process/delivery, timeline kernel. |

### Fluxo canônico de autorização

```
HTTP Request
    → resolvePatientAccess() / resolveStaffAccess()   [Session Gate]
    → Application Service com actorId / KernelActor    [Operation Actor]
    → authorize(actor, permission)                      [RBAC]
    → Aggregate.mutate()                                [Domain]
    → Repository.save()                                 [Persistence]
```

### Regra de handoff (imutável)

> **Journey nasce do handoff. Nunca o contrário.**

---

## 4. RBAC

### Papéis oficiais (Kernel)

`PATIENT` · `CURATOR` · `OPERATION` · `MANAGER` · `ADMIN` · `AUDITOR`

### Matriz: quem inicia · quem executa · quem autoriza · quem audita

| Domínio | Quem inicia | Quem executa | Quem autoriza | Quem audita |
|---------|-------------|--------------|---------------|-------------|
| **Journey (create)** | Handoff / Staff | `systemActor` MANAGER (bootstrap) ou staff | `authorize(actor, journey.create)` | `operational_audit_events` |
| **Journey (advance)** | Paciente / Curador / Sistema | `KernelActor` por etapa (`STAGE_ADVANCE_ROLES`) | `authorizeStageAdvance(actor, stage)` | Timeline kernel + audit |
| **Case (register)** | Handoff completo | `HandoffCaseBootstrapAdapter` → `registerCase` | `input.actor` (delegado MANAGER) | Case registration events |
| **JourneyMemory** | Paciente / Curador | `actorId` na entrada de timeline | Access policy por audiência | Memory entries |
| **CurationReport** | Curador (workspace) | `curatorActorId` | Gate staff + aggregate status machine | Report audit trail |
| **CurationProcess** | Curador | `curatorActorId` | Gate staff + process status machine | Process audit trail |
| **ReportDelivery** | Curador (publish) / Paciente (read) | `curatorActorId` / `patientUserId` | Gate + delivery status machine | Delivery audit trail |
| **Identity / Session** | Visitante / Staff | Supabase Auth | Middleware routing | Auth logs + correlationId |

### Permissões kernel (referência)

Fonte canônica: `src/kernel/rbac/permissions.ts`

| Permissão | Papéis autorizados |
|-----------|-------------------|
| `journey.create` | OPERATION, MANAGER, ADMIN |
| `journey.read` | PATIENT, CURATOR, OPERATION, MANAGER, ADMIN, AUDITOR |
| `journey.advance` | PATIENT, CURATOR, OPERATION, MANAGER, ADMIN |
| `journey.events.write` | CURATOR, OPERATION, MANAGER, ADMIN |
| `journey.close` | OPERATION, MANAGER, ADMIN |

---

## 5. Mudanças proibidas

Sem **Architecture Review + RFC + ADR**, é proibido:

### Domínio

- Criar novo Aggregate oficial
- Alterar invariantes de `Journey`, `Case` ou `JourneyHandoff`
- Alterar máquina de estados operacional (`operational-stage`, `state-machine`)
- Alterar matriz RBAC (`permissions.ts`, `STAGE_ADVANCE_ROLES`)
- Conceder `journey.create` a `PATIENT`
- Inverter a regra "Journey nasce do handoff"
- Duplicar estado entre aggregates (ex.: etapa em dois lugares mutáveis)

### Application / Infraestrutura

- Colocar regra de negócio em repositório, middleware, route handler ou componente React
- Autorizar operação de domínio via sessão HTTP (`deps.authorization.authorize()` sem actor)
- Bypass de aggregate para mutação direta no banco
- Remover audit trail ou permitir UPDATE/DELETE em eventos append-only
- Introduzir runtime demo/in-memory em produção
- Quebrar Event Flow (handoff → bootstrap → portal → curadoria → entrega)

### Persistência / Segurança

- Desabilitar RLS em tabelas operacionais
- Expor `SUPABASE_SERVICE_ROLE_KEY` ao client
- Alterar schema sem migration versionada em `supabase/migrations/`

### Release

- Deploy sem readiness `200`
- Force push em `main` ou `release/*`
- Tag de release sem validação E2E

---

## 6. Processo para evolução futura

Toda nova funcionalidade deve responder **antes da implementação**:

| Pergunta | Se "sim" → |
|----------|-----------|
| Qual Aggregate será utilizado? | Deve ser um dos 8 oficiais (Seção 2) |
| Existe regra nova? | RFC obrigatório; não implementar na infra |
| Pode ser apenas uma projeção? | Preferir projeção/read model; não mutar domínio |
| Existe impacto na arquitetura? | ADR obrigatório antes de qualquer código |

### Fluxo de evolução permitido

```
Ideia → RFC → Architecture Review → ADR → Implementação mínima → Testes RC → Merge
```

### Evolução permitida sem RFC

- Correção de bug que restaura comportamento documentado
- Ajuste de copy/UI sem alterar domínio
- Hardening de infraestrutura (env, health, CI) sem alterar regras
- Performance de queries sem alterar invariantes

---

## 7. Critério para alterar arquitetura

A arquitetura congelada só pode ser alterada quando **ambas** as condições forem atendidas:

1. **Requisito impossível de atender** dentro dos aggregates e projeções existentes, **com evidência documentada**

**OU**

2. **Violação comprovada** de um princípio arquitetural (P1–P8), com impacto em produção ou auditoria

### Processo de descongelamento parcial

1. Abrir RFC com problema, alternativas e impacto nos 8 aggregates
2. Architecture Review com pelo menos 1 revisor de domínio + 1 de infra
3. Registrar ADR em `docs/aliviar-2.0/adr/`
4. Implementar com testes RC do bounded context afetado
5. Atualizar este documento com nova versão (ex.: `FOUNDATION_FREEZE v2.1`)

---

## 8. Governança

### Architecture Review

Obrigatório para qualquer mudança que toque:

- Aggregates oficiais
- RBAC / auth flow
- Migrations de schema
- Novos bounded contexts
- APIs públicas (`/api/v1/*`)

### RFC (Request for Comments)

Obrigatório. Template mínimo:

- Problema
- Aggregate(s) afetado(s)
- Alternativas consideradas
- Impacto em invariantes
- Plano de testes
- Rollback

### ADR (Architecture Decision Record)

Obrigatório para decisões aprovadas. Local: `docs/aliviar-2.0/adr/NNNN-titulo.md`

### Checklist antes de merge

- [ ] Nenhum princípio P1–P8 violado
- [ ] Session ≠ Operation Actor preservado
- [ ] Testes RC do bounded context passando
- [ ] `npm run typecheck` + `npm run test` + `npm run build`
- [ ] Sem regra de negócio em infraestrutura
- [ ] Migration versionada (se schema alterado)
- [ ] ADR referenciado (se arquitetura alterada)

---

## 9. Status

```
Architecture Status: FROZEN
```

| Dimensão | Status |
|----------|--------|
| Foundation | ✅ Complete |
| Core Domain | ✅ Complete |
| Application Layer | ✅ Complete |
| Persistence | ✅ Complete |
| System Integration | ✅ Complete |
| Production Hardening | ✅ Complete |
| Auth Consistency | ✅ CONSISTENT |
| Architecture | **FROZEN** |

---

## 10. Assinatura

| Campo | Valor |
|-------|-------|
| **Versão** | Aliviar 2.0 |
| **Foundation** | Complete |
| **Core Domain** | Complete |
| **Architecture** | **Frozen** |
| **Data do congelamento** | 2026-07-23 |
| **Branch** | `release/v1.0.0-beta` |
| **Commit** | `20eba78` |
| **Documento** | `docs/aliviar-2.0/FOUNDATION_FREEZE.md` |

---

> *Este documento é a Constituição Técnica da Aliviar 2.0. Em caso de conflito entre código e documento, o documento prevalece até que um RFC aprovado atualize ambos.*
