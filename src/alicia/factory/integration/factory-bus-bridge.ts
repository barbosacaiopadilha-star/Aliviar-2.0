import { createCorrelationId, type EventBus } from "@/alicia/event-bus";
import type { WorkflowEngine } from "@/alicia/event-bus/workflow-engine";
import { VerificationBusBridge } from "@/alicia/verification/integration/verification-bus-bridge";

import type {
  FactoryCheckpointPayload,
  FactoryDryRunPayload,
  FactoryFailedPayload,
  FactoryFinishedPayload,
  FactoryResumedPayload,
  FactoryStartedPayload,
} from "../factory-events";
import { FailureIsolation } from "../failure-isolation";
import { FactoryCheckpointManager } from "../factory-checkpoint";
import { FactoryRunRegistry } from "../factory-run";
import type { FactoryCheckpointStage, FactoryRun } from "../types";

type BusPublishInput = {
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  causationId?: string | null;
  source: string;
};

export type FactoryBusBridgeOptions = {
  bus: EventBus;
  workflow: WorkflowEngine;
  verificationBridge: VerificationBusBridge;
  runs: FactoryRunRegistry;
  failures: FailureIsolation;
  checkpoints: FactoryCheckpointManager;
  onOperationsRefresh?: () => Promise<void>;
};

export class FactoryBusBridge {
  private readonly bus: EventBus;
  private readonly workflow: WorkflowEngine;
  private readonly verificationBridge: VerificationBusBridge;
  private readonly runs: FactoryRunRegistry;
  private readonly failures: FailureIsolation;
  private readonly checkpoints: FactoryCheckpointManager;
  private readonly onOperationsRefresh?: () => Promise<void>;
  private started = false;
  private pendingCandidates = new Set<string>();
  private processedCandidates = new Set<string>();

  constructor(options: FactoryBusBridgeOptions) {
    this.bus = options.bus;
    this.workflow = options.workflow;
    this.verificationBridge = options.verificationBridge;
    this.runs = options.runs;
    this.failures = options.failures;
    this.checkpoints = options.checkpoints;
    this.onOperationsRefresh = options.onOperationsRefresh;
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.bus.subscribe("FactoryStarted", this.onFactoryStarted);
    this.bus.subscribe("DiscoveryCompleted", this.onDiscoveryCompleted);
    this.bus.subscribe("EvidenceCollected", this.onEvidenceCollected);
    this.bus.subscribe("EvidenceFailed", this.onEvidenceFailed);
    this.bus.subscribe("ProtocolEvaluated", this.onProtocolEvaluated);
    this.bus.subscribe("PublicationSucceeded", this.onPublicationSucceeded);
    this.bus.subscribe("PublicationFailed", this.onPublicationFailed);
    this.bus.subscribe("PublicationRolledBack", this.onPublicationRolledBack);
    this.bus.subscribe("ReviewCaseCreated", this.onReviewCaseCreated);
    this.bus.subscribe("VerificationCompleted", this.onVerificationCompleted);
    this.bus.subscribe("VerificationFailed", this.onVerificationFailed);

    this.verificationBridge.start();
    this.workflow.start();
    this.started = true;
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.bus.unsubscribe("FactoryStarted", this.onFactoryStarted);
    this.bus.unsubscribe("DiscoveryCompleted", this.onDiscoveryCompleted);
    this.bus.unsubscribe("EvidenceCollected", this.onEvidenceCollected);
    this.bus.unsubscribe("EvidenceFailed", this.onEvidenceFailed);
    this.bus.unsubscribe("ProtocolEvaluated", this.onProtocolEvaluated);
    this.bus.unsubscribe("PublicationSucceeded", this.onPublicationSucceeded);
    this.bus.unsubscribe("PublicationFailed", this.onPublicationFailed);
    this.bus.unsubscribe("PublicationRolledBack", this.onPublicationRolledBack);
    this.bus.unsubscribe("ReviewCaseCreated", this.onReviewCaseCreated);
    this.bus.unsubscribe("VerificationCompleted", this.onVerificationCompleted);
    this.bus.unsubscribe("VerificationFailed", this.onVerificationFailed);

    this.verificationBridge.stop();
    this.started = false;
  }

  private readonly onFactoryStarted = async (
    event: { eventId: string; payload: FactoryStartedPayload; correlationId: string },
  ) => {
    const { runId, dryRun } = event.payload;
    const run = this.runs.get(runId);
    if (!run) {
      return;
    }

    this.pendingCandidates.clear();
    this.processedCandidates.clear();

    const completedStages = run.checkpoints.map((c) => c.stage);
    const resumeStage = this.checkpoints.getResumeStage(completedStages);

    if (resumeStage && resumeStage !== "discovery") {
      await this.publish({
        eventType: "FactoryResumed",
        aggregateId: runId,
        payload: { runId, fromStage: resumeStage } satisfies FactoryResumedPayload,
        correlationId: event.correlationId,
        causationId: event.eventId,
        source: "factory-bridge",
      });

      if (dryRun) {
        await this.publish({
          eventType: "FactoryDryRun",
          aggregateId: runId,
          payload: {
            runId,
            wouldPublish: 0,
            skippedPublication: true,
          } satisfies FactoryDryRunPayload,
          correlationId: event.correlationId,
          causationId: event.eventId,
          source: "factory-bridge",
        });
      }

      await this.resumeFromStage(run, resumeStage, event.correlationId, event.eventId);
      return;
    }

    if (dryRun) {
      await this.publish({
        eventType: "FactoryDryRun",
        aggregateId: runId,
        payload: {
          runId,
          wouldPublish: 0,
          skippedPublication: true,
        } satisfies FactoryDryRunPayload,
        correlationId: event.correlationId,
        causationId: event.eventId,
        source: "factory-bridge",
      });
    }

    await this.workflow.runDiscovery();
  };

  private async resumeFromStage(
    run: FactoryRun,
    stage: FactoryCheckpointStage,
    correlationId: string,
    causationId: string,
  ): Promise<void> {
    if (stage === "discovery") {
      await this.workflow.runDiscovery();
    } else if (stage === "operations") {
      await this.completeOperations(run, correlationId, causationId);
    }
  }

  private readonly onDiscoveryCompleted = async (
    event: { eventId: string; payload: { candidateIds: string[]; candidateCount: number }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    run.candidatesFound = event.payload.candidateCount;
    event.payload.candidateIds.forEach((id) => this.pendingCandidates.add(id));

    await this.recordCheckpoint(run, "discovery", event.payload.candidateIds, event, event.correlationId);

    if (this.pendingCandidates.size === 0) {
      await this.tryFinalizeRun(run, event.correlationId, event.eventId);
    }
  };

  private readonly onEvidenceCollected = async (
    event: { eventId: string; payload: { candidateId: string }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    run.evidencePackages += 1;
    await this.recordCheckpoint(run, "evidence", [event.payload.candidateId], event, event.correlationId);
  };

  private readonly onEvidenceFailed = async (
    event: { eventId: string; payload: { candidateId: string; reason: string }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    this.failures.record(run.runId, {
      candidateId: event.payload.candidateId,
      stage: "evidence",
      error: event.payload.reason,
    });
    run.errors.push(`Evidence: ${event.payload.candidateId} — ${event.payload.reason}`);
    this.pendingCandidates.delete(event.payload.candidateId);
    await this.tryFinalizeRun(run, event.correlationId, event.eventId);
  };

  private readonly onProtocolEvaluated = async (
    event: {
      eventId: string;
      payload: { candidateId: string; outcome: string };
      correlationId: string;
    },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    await this.recordCheckpoint(run, "protocol", [event.payload.candidateId], event, event.correlationId);

    if (event.payload.outcome === "HUMAN_REVIEW" || event.payload.outcome === "REJECT") {
      run.reviewCases += 1;
      this.pendingCandidates.delete(event.payload.candidateId);
      await this.tryFinalizeRun(run, event.correlationId, event.eventId);
    }
  };

  private readonly onPublicationSucceeded = async (
    event: { eventId: string; payload: { candidateId: string }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    if (!run.dryRun) {
      run.published += 1;
    } else {
      run.warnings.push(`Dry run: publicação simulada para ${event.payload.candidateId}`);
    }

    await this.recordCheckpoint(run, "publication", [event.payload.candidateId], event, event.correlationId);

    await this.verificationBridge.requestVerification(
      `profile-${event.payload.candidateId}`,
      event.payload.candidateId,
      run.dryRun ? "factory-dry-run" : "factory-auto",
      "ON_DEMAND",
    );
  };

  private readonly onPublicationFailed = async (
    event: { eventId: string; payload: { candidateId: string; message?: string }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    this.failures.record(run.runId, {
      candidateId: event.payload.candidateId,
      stage: "publication",
      error: event.payload.message ?? "Falha na publicação",
    });
    run.errors.push(`Publication: ${event.payload.candidateId}`);
    await this.tryCompleteCandidate(run, event.payload.candidateId);
  };

  private readonly onPublicationRolledBack = async () => {
    const run = this.runs.getActive();
    if (run) {
      run.warnings.push("Rollback de publicação executado.");
    }
  };

  private readonly onReviewCaseCreated = async (
    event: { payload: { candidateId: string } },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    run.reviewCases += 1;
    run.warnings.push(`Review case criado para ${event.payload.candidateId}`);
    this.pendingCandidates.delete(event.payload.candidateId);
    await this.tryFinalizeRun(run, createCorrelationId(run.runId), "");
  };

  private readonly onVerificationCompleted = async (
    event: { eventId: string; payload: { candidateId: string }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    await this.recordCheckpoint(
      run,
      "verification",
      [event.payload.candidateId],
      event,
      event.correlationId,
    );
    await this.tryCompleteCandidate(run, event.payload.candidateId);
  };

  private readonly onVerificationFailed = async (
    event: { eventId: string; payload: { candidateId: string; error: string }; correlationId: string },
  ) => {
    const run = this.runs.getActive();
    if (!run) {
      return;
    }

    this.failures.record(run.runId, {
      candidateId: event.payload.candidateId,
      stage: "verification",
      error: event.payload.error,
    });
    run.errors.push(`Verification: ${event.payload.candidateId}`);
    await this.tryCompleteCandidate(run, event.payload.candidateId);
  };

  private async tryCompleteCandidate(run: FactoryRun, candidateId: string): Promise<void> {
    this.processedCandidates.add(candidateId);
    this.pendingCandidates.delete(candidateId);
    await this.tryFinalizeRun(run, run.correlationId, "");
  }

  private async tryFinalizeRun(
    run: FactoryRun,
    correlationId: string,
    causationId: string,
  ): Promise<void> {
    if (this.pendingCandidates.size > 0) {
      return;
    }

    await this.completeOperations(run, correlationId, causationId);
  }

  private async completeOperations(
    run: FactoryRun,
    correlationId: string,
    causationId: string,
  ): Promise<void> {
    if (this.runs.isStageCompleted(run.runId, "operations")) {
      return;
    }

    await this.onOperationsRefresh?.();

    await this.recordCheckpoint(run, "operations", [], { eventId: causationId }, correlationId);

    const completed = this.runs.complete(run.runId, run.dryRun ? "DRY_RUN" : "COMPLETED");
    if (!completed) {
      return;
    }

    await this.publish({
      eventType: "FactoryFinished",
      aggregateId: run.runId,
      payload: {
        runId: run.runId,
        durationMs: completed.durationMs ?? 0,
        candidatesFound: completed.candidatesFound,
        evidencePackages: completed.evidencePackages,
        published: completed.published,
        reviewCases: completed.reviewCases,
        dryRun: completed.dryRun,
      } satisfies FactoryFinishedPayload,
      correlationId,
      causationId: causationId || undefined,
      source: "factory-bridge",
    });
  }

  private async recordCheckpoint(
    run: FactoryRun,
    stage: FactoryCheckpointStage,
    candidateIds: string[],
    event: { eventId: string },
    correlationId: string,
  ): Promise<void> {
    if (this.runs.isStageCompleted(run.runId, stage) && stage !== "evidence") {
      return;
    }

    const checkpoint = {
      stage,
      completedAt: new Date().toISOString(),
      candidateIds,
    };

    this.runs.addCheckpoint(run.runId, checkpoint);

    await this.publish({
      eventType: "FactoryCheckpoint",
      aggregateId: run.runId,
      payload: {
        runId: run.runId,
        stage,
        completedAt: checkpoint.completedAt,
        candidateCount: candidateIds.length,
      } satisfies FactoryCheckpointPayload,
      correlationId,
      causationId: event.eventId,
      source: "factory-bridge",
    });
  }

  async publishFailure(runId: string, reason: string, stage?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) {
      return;
    }

    this.runs.complete(runId, "FAILED");
    await this.publish({
      eventType: "FactoryFailed",
      aggregateId: runId,
      payload: { runId, reason, stage } satisfies FactoryFailedPayload,
      correlationId: run.correlationId,
      source: "factory-bridge",
    });
  }

  private async publish(input: BusPublishInput): Promise<void> {
    await this.bus.publish({
      eventType: input.eventType as Parameters<EventBus["publish"]>[0]["eventType"],
      aggregateId: input.aggregateId,
      payload: input.payload,
      correlationId: input.correlationId,
      causationId: input.causationId ?? null,
      source: input.source,
    });
  }
}
