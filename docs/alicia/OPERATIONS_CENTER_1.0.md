# Operations Center 1.0

Camada de inteligência operacional da AliCIA — responde em tempo real o que está acontecendo na plataforma, onde estão os gargalos e quais alertas exigem atenção.

**Localização:** `src/alicia/operations/`

---

## Objetivo

Agregar dados de todos os motores existentes (sem alterá-los) para fornecer visibilidade operacional completa:

- O que está acontecendo?
- Onde está o gargalo?
- Qual conector está degradado?
- Qual etapa está lenta?
- Qual etapa gera mais Review Cases?

---

## Arquitetura

```
Studio Adapters (Discovery, Connectors, Evidence, Workflow, Verification)
        ↓
Operations Data Collector
        ↓
┌───────────────────────────────────────────────────┐
│ Pipeline Stage Collector  → Dashboard (5 etapas)  │
│ Pipeline Analytics        → P95, P99, throughput  │
│ Bottleneck Detector       → Gargalos automáticos  │
│ Operational KPIs          → KPIs diários          │
│ Operational Timeline        → Jornada por corrId    │
│ Operational Alerts          → Alertas operacionais  │
│ Operations History          → Snapshots diários   │
└───────────────────────────────────────────────────┘
        ↓
Operations Center (Studio — somente leitura)
```

**Nenhum motor é alterado.** A camada apenas lê snapshots e eventos existentes.

---

## Pipeline Dashboard

Cinco etapas do pipeline:

```
Discovery → Evidence → Protocol → Publication → Verification
```

Cada etapa exibe:

| Métrica | Descrição |
|---------|-----------|
| Entrada | Volume recebido na etapa |
| Saída | Volume processado com sucesso |
| Tempo médio | Latência média (ms) |
| Taxa de sucesso | Proporção de sucessos |
| Fila | Itens pendentes |
| Falhas | Erros registrados |

---

## Analytics

| Métrica | Descrição |
|---------|-----------|
| Latência por etapa | Tempo médio de cada estágio |
| Latência total | Soma das latências |
| P95 / P99 | Percentis de latência |
| Throughput | Eventos/hora no Event Bus |
| Backlog | Total de itens em fila |
| Review Rate | Proporção de review cases |
| Publication Rate | Taxa de publicação bem-sucedida |

---

## Bottleneck Detector

Detecta automaticamente (nunca toma decisões):

| Tipo | Condição |
|------|----------|
| `slow_stage` | Latência média ≥ 5000ms |
| `growing_queue` | Backlog cresceu ≥ 1.5× |
| `degraded_connector` | Health DEGRADED ou disponibilidade < 80% |
| `excessive_retries` | ≥ 5 retries no Event Bus |
| `dlq_growing` | ≥ 3 itens na DLQ |
| `abnormal_latency` | P95 > 2× média |

---

## KPIs Operacionais

Calculados diariamente:

| KPI | Fonte |
|-----|-------|
| Candidates Found | Discovery |
| Evidence Packages | Evidence Acquisition |
| Protocol Approved / Rejected | Protocol Audit Trail |
| Review Cases | Protocol + Publication + Verification |
| Profiles Published | Publication Audit |
| Profiles Updated | Event Bus (ProfileChanged) |
| Profiles Reverified | Verification |
| Connector Availability | Connector Framework |

---

## Operational Timeline

Reconstrói a jornada completa usando `correlationId` do Event Bus:

```
Discovery → Evidence → Protocol → Publication → Verification
```

Cada timeline mostra eventos por etapa, duração por estágio e duração total.

---

## Alertas

| Tipo | Gatilho |
|------|---------|
| `connector_offline` | Conector com health OFFLINE |
| `retry_storm` | ≥ 5 retries |
| `dlq_growth` | Itens na DLQ |
| `publication_failure` | Falhas de publicação |
| `protocol_failure` | Candidatos rejeitados |
| `verification_failure` | Runs de verificação falhos |
| `review_spike` | Review cases ≥ 2× anterior |

Sem notificações externas nesta fase.

---

## Histórico

Snapshots diários armazenados em `OperationsHistory`:

- KPIs do dia
- Analytics
- Review Rate / Publication Rate
- Connector Health
- Stage Metrics

**Append-only** — histórico nunca é apagado. Snapshots do mesmo dia são atualizados in-place.

---

## Studio — Operations Center

Rota: `/alicia/studio/operations`

Somente leitura. Exibe:

- Pipeline Dashboard (5 etapas)
- Analytics (P95, P99, throughput, backlog)
- KPIs diários
- Bottlenecks detectados
- Alertas operacionais
- Operational Timeline
- Health geral (healthy / degraded / critical)
- Histórico diário

---

## Integração

```typescript
import { getOperationsCenterSnapshot } from "@/alicia/operations";

const snapshot = await getOperationsCenterSnapshot({ refresh: true });
console.log(snapshot.health.overall);
console.log(snapshot.bottlenecks);
```

---

## Testes

```bash
npm run test:operations
```

Cobertura mínima: 95% linhas/funções/statements, 80% branches.

---

## Restrições respeitadas

- Nenhuma IA
- Nenhuma alteração dos motores existentes
- Nenhuma alteração do Protocolo
- Nenhuma alteração da UX pública
- Nenhuma API externa
- Nenhum banco novo
- Studio: apenas tela aditiva (Operations Center)
