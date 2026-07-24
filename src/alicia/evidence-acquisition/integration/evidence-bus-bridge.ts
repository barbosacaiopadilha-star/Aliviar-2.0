import { createCorrelationId, type EventBus } from "@/alicia/event-bus";

import type {
  EvidenceConflictDetectedPayload,
  EvidencePackageCreatedPayload,
  EvidencePackageRejectedPayload,
  EvidencePackageUpdatedPayload,
} from "../evidence-acquisition-events";
import type { AcquisitionRunResult } from "../types";
import { EvidenceScoreCalculator } from "../evidence-score";

type BusPublishInput = {
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  causationId?: string | null;
  source: string;
};

export type EvidenceBusBridgeOptions = {
  bus: EventBus;
};

export class EvidenceBusBridge {
  private readonly bus: EventBus;
  private readonly scoreCalculator = new EvidenceScoreCalculator();

  constructor(options: EvidenceBusBridgeOptions) {
    this.bus = options.bus;
  }

  async publishRunEvents(
    result: AcquisitionRunResult,
    correlationId?: string,
  ): Promise<void> {
    const baseCorrelationId =
      correlationId ?? createCorrelationId(result.runId, "evidence-acquisition");

    for (const pkg of result.packages) {
      const coverageAverage = this.scoreCalculator.fromPackage(pkg);
      const isUpdate = pkg.metadata.version > 1;

      if (isUpdate) {
        await this.publish({
          eventType: "EvidencePackageUpdated",
          aggregateId: pkg.candidateId,
          payload: {
            packageId: pkg.packageId,
            candidateId: pkg.candidateId,
            version: pkg.metadata.version,
            conflictCount: pkg.conflicts.length,
            coverageAverage,
          } satisfies EvidencePackageUpdatedPayload,
          correlationId: baseCorrelationId,
          source: "evidence-acquisition-bridge",
        });
      } else {
        await this.publish({
          eventType: "EvidencePackageCreated",
          aggregateId: pkg.candidateId,
          payload: {
            packageId: pkg.packageId,
            candidateId: pkg.candidateId,
            sourceCount: pkg.metadata.sourceCount,
            conflictCount: pkg.conflicts.length,
            coverageAverage,
          } satisfies EvidencePackageCreatedPayload,
          correlationId: baseCorrelationId,
          source: "evidence-acquisition-bridge",
        });
      }

      for (const conflict of pkg.conflicts) {
        await this.publish({
          eventType: "EvidenceConflictDetected",
          aggregateId: pkg.candidateId,
          payload: {
            packageId: pkg.packageId,
            candidateId: pkg.candidateId,
            conflictId: conflict.id,
            conflictType: conflict.type,
            field: conflict.field,
          } satisfies EvidenceConflictDetectedPayload,
          correlationId: baseCorrelationId,
          source: "evidence-acquisition-bridge",
        });
      }
    }

    if (result.rejectedCount > 0) {
      await this.publish({
        eventType: "EvidencePackageRejected",
        aggregateId: result.runId,
        payload: {
          candidateId: result.runId,
          reason: `${result.rejectedCount} candidato(s) rejeitado(s) por dados insuficientes.`,
        } satisfies EvidencePackageRejectedPayload,
        correlationId: baseCorrelationId,
        source: "evidence-acquisition-bridge",
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
