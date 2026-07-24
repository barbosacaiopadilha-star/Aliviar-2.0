import { DiscoveryEngine } from "@/alicia/discovery";
import { PublicationPipeline } from "@/alicia/publication-pipeline";

import { resolveCorrelationId } from "./correlation";
import type {
  CandidateQueuedPayload,
  DiscoveryCompletedPayload,
  EvidenceRequestedPayload,
  ProtocolEvaluatedPayload,
  PublicationRequestedPayload,
} from "./domain-events";
import { DeadLetterQueue } from "./dead-letter-queue";
import { EventBus } from "./event-bus";
import { EventStore } from "./event-store";
import { EventBusMetrics } from "./metrics";
import { RetryQueue } from "./retry-queue";
import type { DomainEvent } from "./types";
import { runDiscoveryWithEvents } from "./integration/discovery-facade";
import { handleEvidenceRequested } from "./integration/evidence-facade";
import { handleEvidenceCollected } from "./integration/protocol-facade";
import { handlePublicationRequested } from "./integration/publication-facade";
import { registerDiscoveredCandidate } from "./integration/workflow-context";

export type WorkflowEngineOptions = {
  bus?: EventBus;
  store?: EventStore;
  metrics?: EventBusMetrics;
  dlq?: DeadLetterQueue;
  retryQueue?: RetryQueue;
  discoveryEngine?: DiscoveryEngine;
  publicationPipeline?: PublicationPipeline;
};

export class WorkflowEngine {
  private readonly bus: EventBus;
  private readonly retryQueue: RetryQueue;
  private readonly dlq: DeadLetterQueue;
  private readonly discoveryEngine: DiscoveryEngine;
  private readonly publicationPipeline: PublicationPipeline;
  private started = false;

  private readonly onDiscoveryCompleted = async (
    event: DomainEvent<DiscoveryCompletedPayload>,
  ) => {
    const correlationId = event.correlationId;
    const queueItems = this.discoveryEngine.getQueue().list();

    const publishInputs: Array<{
      eventType: "CandidateQueued" | "EvidenceRequested";
      aggregateId: string;
      payload: CandidateQueuedPayload | EvidenceRequestedPayload;
      correlationId: string;
      causationId: string;
      source: string;
    }> = [];

    for (const item of queueItems) {
      if (item.status !== "READY_FOR_EVIDENCE" && item.status !== "DISCOVERED") {
        continue;
      }

      registerDiscoveredCandidate(item.candidate);
      const candidateCorrelationId = resolveCorrelationId(
        item.candidate.candidateId,
        correlationId,
      );

      publishInputs.push({
        eventType: "CandidateQueued",
        aggregateId: item.candidate.candidateId,
        payload: {
          candidateId: item.candidate.candidateId,
          nome: item.candidate.nome,
          especialidade: item.candidate.especialidade,
          cidade: item.candidate.cidade,
          fontes: item.candidate.fontesEncontradas,
          queueStatus: item.status,
        },
        correlationId: candidateCorrelationId,
        causationId: event.eventId,
        source: "workflow-engine",
      });

      publishInputs.push({
        eventType: "EvidenceRequested",
        aggregateId: item.candidate.candidateId,
        payload: {
          candidateId: item.candidate.candidateId,
          correlationId: candidateCorrelationId,
        },
        correlationId: candidateCorrelationId,
        causationId: event.eventId,
        source: "workflow-engine",
      });
    }

    if (publishInputs.length > 0) {
      await this.bus.publishBatch(publishInputs);
    }
  };

  private readonly onEvidenceRequested = async (
    event: DomainEvent<EvidenceRequestedPayload>,
  ) => {
    await handleEvidenceRequested(this.bus, event);
  };

  private readonly onEvidenceCollected = async (
    event: DomainEvent<{ candidateId: string; evidenceCount: number }>,
  ) => {
    await handleEvidenceCollected(this.bus, event);
  };

  private readonly onProtocolEvaluated = async (
    event: DomainEvent<ProtocolEvaluatedPayload>,
  ) => {
    if (event.payload.outcome !== "AUTO_PUBLISH") {
      return;
    }

    await this.bus.publish<PublicationRequestedPayload>({
      eventType: "PublicationRequested",
      aggregateId: event.payload.candidateId,
      payload: {
        candidateId: event.payload.candidateId,
        protocolDecisionId: `pd-${event.payload.candidateId}`,
      },
      correlationId: resolveCorrelationId(event.payload.candidateId, event.correlationId),
      causationId: event.eventId,
      source: "workflow-engine",
    });
  };

  private readonly onPublicationRequested = async (
    event: DomainEvent<PublicationRequestedPayload>,
  ) => {
    await handlePublicationRequested(this.bus, this.publicationPipeline, event);
  };

  constructor(options: WorkflowEngineOptions = {}) {
    const store = options.store ?? new EventStore();
    const metrics = options.metrics ?? new EventBusMetrics();
    this.bus = options.bus ?? new EventBus(store, metrics);
    this.dlq = options.dlq ?? new DeadLetterQueue();
    this.retryQueue =
      options.retryQueue ?? new RetryQueue(this.dlq, metrics);
    this.discoveryEngine = options.discoveryEngine ?? new DiscoveryEngine();
    this.publicationPipeline = options.publicationPipeline ?? new PublicationPipeline();
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.bus.subscribe("DiscoveryCompleted", this.onDiscoveryCompleted);
    this.bus.subscribe("EvidenceRequested", this.onEvidenceRequested);
    this.bus.subscribe("EvidenceCollected", this.onEvidenceCollected);
    this.bus.subscribe("ProtocolEvaluated", this.onProtocolEvaluated);
    this.bus.subscribe("PublicationRequested", this.onPublicationRequested);

    this.retryQueue.registerHandler("evidence-requested", async (event) => {
      await handleEvidenceRequested(this.bus, event as DomainEvent<EvidenceRequestedPayload>);
    });

    this.started = true;
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.bus.unsubscribe("DiscoveryCompleted", this.onDiscoveryCompleted);
    this.bus.unsubscribe("EvidenceRequested", this.onEvidenceRequested);
    this.bus.unsubscribe("EvidenceCollected", this.onEvidenceCollected);
    this.bus.unsubscribe("ProtocolEvaluated", this.onProtocolEvaluated);
    this.bus.unsubscribe("PublicationRequested", this.onPublicationRequested);
    this.started = false;
  }

  getBus(): EventBus {
    return this.bus;
  }

  getStore(): EventStore {
    return this.bus.getStore();
  }

  getMetrics(): EventBusMetrics {
    return this.bus.getMetrics();
  }

  getDeadLetterQueue(): DeadLetterQueue {
    return this.dlq;
  }

  getRetryQueue(): RetryQueue {
    return this.retryQueue;
  }

  async runDiscovery(): Promise<void> {
    this.start();
    await runDiscoveryWithEvents(this.bus, this.discoveryEngine);
  }

  async enqueueEvidenceWithRetry(
    event: DomainEvent<EvidenceRequestedPayload>,
  ): Promise<void> {
    this.retryQueue.enqueue(event, "evidence-requested");
    await this.retryQueue.processPending();
  }
}
