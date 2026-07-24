import { createCorrelationId, type EventBus } from "@/alicia/event-bus";

import type {
  ProfileChangedPayload,
  ReviewRequestedPayload,
  VerificationCompletedPayload,
  VerificationFailedPayload,
  VerificationRequestedPayload,
  VerificationStartedPayload,
} from "../verification-events";
import { requiresPublication } from "../verification-decision";
import { VerificationEngine } from "../verification-engine";
import type { VerificationRunResult } from "../types";

type BusPublishInput = {
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  causationId?: string | null;
  source: string;
};

export type VerificationBusBridgeOptions = {
  bus: EventBus;
  engine: VerificationEngine;
};

export class VerificationBusBridge {
  private readonly bus: EventBus;
  private readonly engine: VerificationEngine;
  private started = false;

  private readonly onVerificationRequested = async (
    event: { eventId: string; payload: VerificationRequestedPayload; correlationId: string },
  ) => {
    const { profileId, candidateId } = event.payload;
    const correlationId = event.correlationId;

    await this.publish({
      eventType: "VerificationStarted",
      aggregateId: profileId,
      payload: { profileId, candidateId } satisfies VerificationStartedPayload,
      correlationId,
      causationId: event.eventId,
      source: "verification-bridge",
    });

    try {
      const result = await this.engine.runVerification(profileId, correlationId);
      await this.handleResult(result, correlationId, event.eventId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha na verificação.";
      await this.publish({
        eventType: "VerificationFailed",
        aggregateId: profileId,
        payload: { profileId, candidateId, error: message } satisfies VerificationFailedPayload,
        correlationId,
        causationId: event.eventId,
        source: "verification-bridge",
      });
    }
  };

  constructor(options: VerificationBusBridgeOptions) {
    this.bus = options.bus;
    this.engine = options.engine;
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.bus.subscribe("VerificationRequested", this.onVerificationRequested);
    this.started = true;
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.bus.unsubscribe("VerificationRequested", this.onVerificationRequested);
    this.started = false;
  }

  async requestVerification(
    profileId: string,
    candidateId: string,
    reason: string,
    frequency = "ON_DEMAND",
  ): Promise<void> {
    const correlationId = createCorrelationId(profileId, "verification-request");
    await this.publish({
      eventType: "VerificationRequested",
      aggregateId: profileId,
      payload: { profileId, candidateId, frequency, reason } satisfies VerificationRequestedPayload,
      correlationId,
      source: "verification-bridge",
    });
  }

  private async handleResult(
    result: VerificationRunResult,
    correlationId: string,
    causationId: string,
  ): Promise<void> {
    if (result.status === "FAILED") {
      await this.publish({
        eventType: "VerificationFailed",
        aggregateId: result.profileId,
        payload: {
          profileId: result.profileId,
          candidateId: result.candidateId,
          error: result.error ?? "Falha na verificação.",
        } satisfies VerificationFailedPayload,
        correlationId,
        causationId,
        source: "verification-bridge",
      });
      return;
    }

    await this.publish({
      eventType: "VerificationCompleted",
      aggregateId: result.profileId,
      payload: {
        profileId: result.profileId,
        candidateId: result.candidateId,
        decision: result.decision.outcome,
        classification: result.change.classification,
        protocolOutcome: result.decision.protocolOutcome,
      } satisfies VerificationCompletedPayload,
      correlationId,
      causationId,
      source: "verification-bridge",
    });

    if (result.change.classification !== "NO_CHANGE") {
      await this.publish({
        eventType: "ProfileChanged",
        aggregateId: result.profileId,
        payload: {
          profileId: result.profileId,
          candidateId: result.candidateId,
          classification: result.change.classification,
          changes: result.change.changes,
        } satisfies ProfileChangedPayload,
        correlationId,
        causationId,
        source: "verification-bridge",
      });
    }

    if (
      result.decision.outcome === "REVIEW_REQUIRED" ||
      result.decision.outcome === "UNPUBLISH_RECOMMENDED"
    ) {
      await this.publish({
        eventType: "ReviewRequested",
        aggregateId: result.profileId,
        payload: {
          profileId: result.profileId,
          candidateId: result.candidateId,
          reason: result.decision.outcome,
          summary: result.decision.justification,
        } satisfies ReviewRequestedPayload,
        correlationId,
        causationId,
        source: "verification-bridge",
      });

      await this.publish({
        eventType: "ReviewCaseCreated",
        aggregateId: result.candidateId,
        payload: {
          candidateId: result.candidateId,
          reason: result.decision.outcome,
          summary: result.decision.justification,
        },
        correlationId,
        causationId,
        source: "verification-bridge",
      });
    }

    if (requiresPublication(result.decision.outcome, result.change.classification)) {
      await this.publish({
        eventType: "PublicationRequested",
        aggregateId: result.candidateId,
        payload: {
          candidateId: result.candidateId,
          protocolDecisionId: `pd-verification-${result.profileId}`,
        },
        correlationId,
        causationId,
        source: "verification-bridge",
      });
    }
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
