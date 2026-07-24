# Event Bus & Workflow Engine 1.0 — AliCIA

Conecta os motores AliCIA via arquitetura orientada a eventos, eliminando acoplamento direto entre Discovery, Evidence, Protocol e Publication.

**Versão:** 1.0  
**Localização:** `src/alicia/event-bus/`

---

## Princípio central

Cada motor **publica eventos**. O **Workflow Engine** decide os próximos passos. Nenhum motor chama outro diretamente.

```
Discovery Engine  ──publish──▶  DiscoveryCompleted
                                      │
Workflow Engine  ◀──subscribe─────────┘
       │
       ├──▶ CandidateQueued
       ├──▶ EvidenceRequested
       │         │
Evidence Facade ◀─┘ (via evento)
       │
       ├──▶ EvidenceCollected / EvidenceFailed
       │
Protocol Facade ◀── EvidenceCollected
       │
       ├──▶ ProtocolEvaluated
       │
Workflow ◀── AUTO_PUBLISH
       │
       ├──▶ PublicationRequested
       │
Publication Facade ◀── PublicationRequested
       │
       └──▶ PublicationSucceeded / Failed / RolledBack
```

---

## Módulos

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Domain Events | `domain-events.ts` | Payloads tipados por evento |
| Event Bus | `event-bus.ts` | `publish`, `subscribe`, `unsubscribe`, `publishBatch` |
| Event Store | `event-store.ts` | Registro append-only de todos os eventos |
| Correlation | `correlation.ts` | `CorrelationId` por candidato/fluxo |
| Retry Queue | `retry-queue.ts` | Reprocessamento com estados |
| DLQ | `dead-letter-queue.ts` | Eventos que excederam tentativas |
| Métricas | `metrics.ts` | Observabilidade operacional |
| Workflow Engine | `workflow-engine.ts` | Orquestração reativa |
| Integração | `integration/*` | Facades que envolvem motores existentes |

---

## Domain Events

| Evento | Descrição |
|--------|-----------|
| `DiscoveryCompleted` | Discovery finalizou uma execução |
| `CandidateQueued` | Candidato entrou na fila |
| `EvidenceRequested` | Workflow solicitou coleta |
| `EvidenceCollected` | Evidências disponíveis |
| `EvidenceFailed` | Coleta falhou |
| `ProtocolStarted` | Protocol Engine iniciou avaliação |
| `ProtocolEvaluated` | Decisão do protocolo disponível |
| `PublicationRequested` | Workflow autorizou publicação |
| `PublicationStarted` | Pipeline iniciou |
| `PublicationSucceeded` | Publicação concluída |
| `PublicationFailed` | Publicação bloqueada/falhou |
| `PublicationRolledBack` | Rollback executado |
| `ReviewCaseCreated` | Exceção para o Studio |
| `ReviewCaseResolved` | Review resolvido (futuro) |

---

## Event Store

Campos de cada evento:

- `eventId`, `eventType`, `aggregateId`
- `payload`, `timestamp`
- `correlationId`, `causationId`
- `source`, `version`

**Nunca apaga** eventos. Permite reconstrução completa da jornada via `listByCorrelationId`.

---

## Correlation

Todo candidato recebe um `CorrelationId` no primeiro contato. Todos os eventos subsequentes do mesmo fluxo compartilham esse identificador.

```typescript
createCorrelationId(candidateId, seed?)
resolveCorrelationId(candidateId, fallback?)
```

---

## Retry

Estados: `Pending` → `Processing` → `Succeeded` | `Failed` | `Retrying` → `DeadLetter`

Configurável via `DEFAULT_MAX_RETRY_ATTEMPTS` (padrão: 3).

---

## Dead Letter Queue (DLQ)

Eventos que excedem o limite de tentativas são movidos para a DLQ com motivo. **Nunca descartados.**

---

## Observabilidade

`EventBusMetrics` registra:

- eventos emitidos / processados
- tempo médio de processamento
- falhas de handlers
- listeners ativos
- retries e DLQ

---

## Workflow Engine

Responsável por:

1. Escutar `DiscoveryCompleted` → publicar `CandidateQueued` + `EvidenceRequested`
2. Escutar `EvidenceCollected` → acionar Protocol Facade
3. Escutar `ProtocolEvaluated` com `AUTO_PUBLISH` → publicar `PublicationRequested`
4. Escutar `PublicationRequested` → acionar Publication Facade

**Motores existentes não foram alterados.** A integração ocorre via facades em `integration/`.

---

## Studio — Workflow Monitor

**Rota:** `/alicia/studio/workflow`

Exibe (somente leitura):

- timeline de eventos
- `correlationId`
- status de retry
- DLQ
- métricas

---

## API pública

```typescript
import {
  EventBus,
  EventStore,
  WorkflowEngine,
  runDiscoveryWithEvents,
  getWorkflowMonitorSnapshot,
} from "@/alicia/event-bus";
```

---

## Testes

```bash
npm run test:event-bus
npx vitest run src/alicia/event-bus
```

Cenários: publish, subscribe, unsubscribe, batch, async, múltiplos listeners, retry, DLQ, workflow, correlation, event store, ordenação, concorrência simples.

---

## Limitações (MVP)

- Event bus, store, retry e DLQ **em memória**
- Sem persistência em banco
- Sem message broker externo (Kafka, RabbitMQ, etc.)
- Evidence Facade simula coleta a partir dos dados do Discovery
- Sessão do Workflow Monitor não sobrevive a reload

---

## Integração futura

1. **Persistência** — Event Store em Postgres/Supabase
2. **Message broker** — adapter para fila distribuída
3. **Evidence Engine real** — substituir `evidence-facade.ts`
4. **Outbox pattern** — garantia de entrega transacional
5. **ReviewCaseResolved** — fluxo de resolução humana no Studio

---

## Restrições respeitadas

- Motores existentes (Discovery, Protocol, Publication) **não alterados funcionalmente**
- Acoplamento direto substituído por eventos via facades
- Sem banco novo, sem APIs externas
