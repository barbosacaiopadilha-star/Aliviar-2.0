# Catalog Factory 2.0

Orquestrador automatizado da cadeia completa AliCIA — executa Discovery → Evidence → Protocol → Publication → Verification → Operations sem intervenção humana, exceto quando há Review Case.

**Localização:** `src/alicia/factory/`

---

## Objetivo

Transformar toda a plataforma em uma **fábrica totalmente automatizada**, coordenando os motores existentes exclusivamente via **Event Bus**.

**Nenhum motor é alterado.** O Factory é uma camada de orquestração nova.

---

## Arquitetura

```
Factory Scheduler
       ↓
Factory Orchestrator
       ↓ (FactoryStarted via Event Bus)
Factory Bus Bridge
       ↓
WorkflowEngine (Event Bus compartilhado)
  Discovery → Evidence → Protocol → Publication
       ↓
Verification Bus Bridge
       ↓
Operations Refresh
       ↓
FactoryFinished
```

---

## Scheduler

| Modo | Comportamento |
|------|---------------|
| `MANUAL` | Nunca dispara automaticamente |
| `HOURLY` | A cada hora |
| `DAILY` | A cada 24h |
| `WEEKLY` | A cada 7 dias |
| `ON_DEMAND` | Sempre disponível |

Cada execução gera um **FactoryRun**.

---

## FactoryRun

| Campo | Descrição |
|-------|-----------|
| `runId` | Identificador único |
| `startedAt` / `finishedAt` | Timestamps |
| `durationMs` | Duração total |
| `status` | RUNNING, COMPLETED, FAILED, DRY_RUN, PAUSED |
| `candidatesFound` | Candidatos descobertos |
| `evidencePackages` | Packages gerados |
| `published` | Perfis publicados |
| `reviewCases` | Casos de revisão humana |
| `errors` / `warnings` | Falhas e avisos |
| `checkpoints` | Progresso por etapa |

---

## Checkpoints

Etapas com checkpoint:

1. Discovery
2. Evidence
3. Protocol
4. Publication
5. Verification
6. Operations

Cada checkpoint registra `stage`, `completedAt` e `candidateIds`.

---

## Resume

Quando uma execução para, `startRun({ resumeRunId })` reinicia do **último checkpoint** sem reprocessar etapas concluídas.

Publica evento `FactoryResumed`.

---

## Dry Run

`startRun({ dryRun: true })` executa toda a cadeia **sem publicar**:

- Usa `DryRunPublicationPipeline` (wrapper, não altera o motor)
- Publica `FactoryDryRun`
- Status final: `DRY_RUN`

---

## Failure Isolation

Falha em um candidato **não interrompe** os demais:

- Erro registrado por `candidateId` + `stage`
- Execução continua
- Relatório final lista todas as falhas isoladas

---

## FactoryRunReport

Gerado automaticamente ao finalizar:

- Tempo total e por etapa
- KPIs (candidatos, evidence, publicados, reviews)
- Review Rate / Publication Rate
- Connector Health
- Bottlenecks
- Failures e Warnings

---

## Eventos

| Evento | Quando |
|--------|--------|
| `FactoryStarted` | Início do run |
| `FactoryFinished` | Conclusão com sucesso |
| `FactoryFailed` | Falha fatal do run |
| `FactoryCheckpoint` | Etapa concluída |
| `FactoryResumed` | Retomada de checkpoint |
| `FactoryDryRun` | Dry run iniciado |

---

## Factory Metrics

- Total runs / completed / failed / dry runs
- Tempo médio
- Perfis publicados
- Review cases
- Falhas, retries, rollbacks, verifications

---

## Studio — Factory

Rota: `/alicia/studio/factory`

Somente leitura. Exibe últimos runs, status, tempo, KPIs, falhas e review cases.

---

## Uso programático

```typescript
import { FactoryOrchestrator } from "@/alicia/factory";

const factory = new FactoryOrchestrator();

// Run completo
const run = await factory.startRun({ schedule: "ON_DEMAND" });

// Dry run
const dryRun = await factory.startRun({ dryRun: true });

// Resume
const resumed = await factory.startRun({ resumeRunId: run.runId });

// Relatório
const report = factory.finalizeReport(run.runId);
```

---

## Testes

```bash
npm run test:factory
```

Cobertura mínima: 95% linhas/funções/statements, 80% branches.

---

## Restrições respeitadas

- Nenhuma IA
- Nenhum banco novo
- Nenhuma alteração dos motores existentes
- Nenhuma alteração do Protocolo
- Nenhuma alteração da UX pública
- Comunicação via Event Bus (sem chamadas diretas entre etapas)
- Studio: apenas tela aditiva (Factory)
