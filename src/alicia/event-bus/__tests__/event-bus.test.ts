import { describe, expect, it, beforeEach } from "vitest";

import { resetCorrelationRegistry, createCorrelationId } from "../correlation";
import { DeadLetterQueue } from "../dead-letter-queue";
import { EventBus } from "../event-bus";
import { EventStore } from "../event-store";
import { EventBusMetrics } from "../metrics";
import { RetryQueue } from "../retry-queue";
import { WorkflowEngine } from "../workflow-engine";
import { resetWorkflowContext } from "../integration/workflow-context";
import { resetWorkflowSession } from "../studio-adapter";
import type { DomainEvent, EventHandler } from "../types";

describe("Event Bus", () => {
  let store: EventStore;
  let metrics: EventBusMetrics;
  let bus: EventBus;

  beforeEach(() => {
    store = new EventStore();
    metrics = new EventBusMetrics();
    bus = new EventBus(store, metrics);
  });

  it("publica e entrega eventos a subscribers", async () => {
    const received: string[] = [];
    const handler: EventHandler<{ message: string }> = (event) => {
      received.push(event.payload.message);
    };

    bus.subscribe("DiscoveryCompleted", handler);
    await bus.publish({
      eventType: "DiscoveryCompleted",
      aggregateId: "run-1",
      payload: { message: "ok", runId: "run-1", candidateCount: 1, candidateIds: [], completedAt: "" },
      correlationId: "corr-1",
      source: "test",
    });

    expect(received).toEqual(["ok"]);
    expect(store.size()).toBe(1);
  });

  it("suporta unsubscribe", async () => {
    const handler: EventHandler = () => {
      throw new Error("não deveria ser chamado");
    };

    bus.subscribe("CandidateQueued", handler);
    bus.unsubscribe("CandidateQueued", handler);

    await bus.publish({
      eventType: "CandidateQueued",
      aggregateId: "c1",
      payload: {
        candidateId: "c1",
        nome: "Test",
        especialidade: "Ortopedia",
        cidade: "Vitória",
        fontes: [],
        queueStatus: "DISCOVERED",
      },
      correlationId: "corr",
      source: "test",
    });

    expect(metrics.snapshot().eventsProcessed).toBe(0);
  });

  it("publica batch preservando ordem", async () => {
    const order: string[] = [];
    bus.subscribe("CandidateQueued", () => {
      order.push("a");
    });
    bus.subscribe("EvidenceRequested", () => {
      order.push("b");
    });

    await bus.publishBatch([
      {
        eventType: "CandidateQueued",
        aggregateId: "c1",
        payload: {
          candidateId: "c1",
          nome: "A",
          especialidade: "Ortopedia",
          cidade: "Vitória",
          fontes: [],
          queueStatus: "DISCOVERED",
        },
        correlationId: "corr",
        source: "test",
      },
      {
        eventType: "EvidenceRequested",
        aggregateId: "c1",
        payload: { candidateId: "c1", correlationId: "corr" },
        correlationId: "corr",
        source: "test",
      },
    ]);

    expect(order).toEqual(["a", "b"]);
    expect(store.size()).toBe(2);
  });

  it("suporta handlers async e múltiplos listeners", async () => {
    const results: number[] = [];

    bus.subscribe("ProtocolEvaluated", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      results.push(1);
    });
    bus.subscribe("ProtocolEvaluated", () => {
      results.push(2);
    });

    await bus.publish({
      eventType: "ProtocolEvaluated",
      aggregateId: "c1",
      payload: { candidateId: "c1", outcome: "HUMAN_REVIEW", suggestedNivel: "B" },
      correlationId: "corr",
      source: "test",
    });

    expect(results.sort()).toEqual([1, 2]);
    expect(metrics.snapshot().listenerCount).toBe(2);
  });

  it("mantém event store append-only com correlation", async () => {
    createCorrelationId("cand-1", "seed");
    const corr = createCorrelationId("cand-2", "seed-2");

    await bus.publish({
      eventType: "DiscoveryCompleted",
      aggregateId: "run",
      payload: { runId: "run", candidateCount: 0, candidateIds: [], completedAt: "" },
      correlationId: corr,
      source: "test",
    });

    expect(store.listByCorrelationId(corr)).toHaveLength(1);
    expect(store.listByAggregateId("run")).toHaveLength(1);
  });

  it("registra falhas de handler sem interromper outros listeners", async () => {
    const failing: EventHandler = () => {
      throw new Error("handler falhou");
    };
    const ok: EventHandler = () => undefined;

    bus.subscribe("PublicationSucceeded", failing);
    bus.subscribe("PublicationSucceeded", ok);

    await bus.publish({
      eventType: "PublicationSucceeded",
      aggregateId: "c1",
      payload: { candidateId: "c1", status: "PUBLISHED", snapshotId: "snap" },
      correlationId: "corr",
      source: "test",
    });

    expect(metrics.snapshot().handlerFailures).toBe(1);
    expect(metrics.snapshot().eventsProcessed).toBe(1);
  });
});

describe("Retry e DLQ", () => {
  it("reenfileira falhas e move para DLQ após limite", async () => {
    const metrics = new EventBusMetrics();
    const dlq = new DeadLetterQueue();
    const retry = new RetryQueue(dlq, metrics, 2);

    let attempts = 0;
    retry.registerHandler("failing", async () => {
      attempts += 1;
      throw new Error("falha simulada");
    });

    const event: DomainEvent = {
      eventId: "evt-1",
      eventType: "EvidenceRequested",
      aggregateId: "c1",
      payload: { candidateId: "c1", correlationId: "corr" },
      timestamp: new Date().toISOString(),
      correlationId: "corr",
      causationId: null,
      source: "test",
      version: 1,
    };

    retry.enqueue(event, "failing");
    await retry.processPending();
    await retry.processPending();

    expect(attempts).toBe(2);
    expect(dlq.size()).toBe(1);
    expect(metrics.snapshot().dlqCount).toBe(1);
  });
});

describe("Workflow Engine", () => {
  beforeEach(() => {
    resetWorkflowSession();
    resetWorkflowContext();
    resetCorrelationRegistry();
  });

  it("orquestra DiscoveryCompleted → CandidateQueued → EvidenceRequested", async () => {
    const workflow = new WorkflowEngine();
    workflow.start();
    await workflow.runDiscovery();

    const store = workflow.getStore();
    const types = store.list().map((event) => event.eventType);

    expect(types).toContain("DiscoveryCompleted");
    expect(types).toContain("CandidateQueued");
    expect(types).toContain("EvidenceRequested");
  });

  it("propaga fluxo até ProtocolEvaluated", async () => {
    const workflow = new WorkflowEngine();
    workflow.start();
    await workflow.runDiscovery();

    const types = workflow.getStore().list().map((event) => event.eventType);
    expect(types).toContain("EvidenceCollected");
    expect(types).toContain("ProtocolStarted");
    expect(types).toContain("ProtocolEvaluated");
  });

  it("reconstrói jornada por correlationId", async () => {
    const workflow = new WorkflowEngine();
    workflow.start();
    await workflow.runDiscovery();

    const first = workflow.getStore().list()[0];
    expect(first).toBeDefined();

    const timeline = workflow.getStore().listByCorrelationId(first!.correlationId);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline.every((event) => event.correlationId === first!.correlationId)).toBe(true);
  });

  it("para listeners com stop()", () => {
    const workflow = new WorkflowEngine();
    workflow.start();
    workflow.stop();
    expect(workflow.getBus().listenerCount()).toBe(0);
  });

  it("processa eventos de forma sequencial sob concorrência simples", async () => {
    const store = new EventStore();
    const metrics = new EventBusMetrics();
    const bus = new EventBus(store, metrics);
    const sequence: number[] = [];

    bus.subscribe("CandidateQueued", async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      sequence.push(1);
    });

    await Promise.all([
      bus.publish({
        eventType: "CandidateQueued",
        aggregateId: "c1",
        payload: {
          candidateId: "c1",
          nome: "A",
          especialidade: "Ortopedia",
          cidade: "Vitória",
          fontes: [],
          queueStatus: "DISCOVERED",
        },
        correlationId: "corr",
        source: "test",
      }),
      bus.publish({
        eventType: "CandidateQueued",
        aggregateId: "c2",
        payload: {
          candidateId: "c2",
          nome: "B",
          especialidade: "Ortopedia",
          cidade: "Serra",
          fontes: [],
          queueStatus: "DISCOVERED",
        },
        correlationId: "corr",
        source: "test",
      }),
    ]);

    expect(sequence).toEqual([1, 1]);
  });
});
