import type { DiscoveryEngine, DiscoveryRunResult } from "@/alicia/discovery";

import { createCorrelationId } from "../correlation";
import type { DiscoveryCompletedPayload } from "../domain-events";
import type { EventBus } from "../event-bus";
import { registerDiscoveredCandidate } from "./workflow-context";

export async function runDiscoveryWithEvents(
  bus: EventBus,
  engine: DiscoveryEngine,
): Promise<DiscoveryRunResult> {
  const result = await engine.run();

  for (const candidate of result.candidates) {
    createCorrelationId(candidate.candidateId, candidate.hashIdentidade);
    registerDiscoveredCandidate(candidate);
  }

  result.queueItems.forEach((item) => registerDiscoveredCandidate(item.candidate));

  const correlationId = createCorrelationId(result.runId, result.startedAt);

  await bus.publish<DiscoveryCompletedPayload>({
    eventType: "DiscoveryCompleted",
    aggregateId: result.runId,
    payload: {
      runId: result.runId,
      candidateCount: result.candidates.length,
      candidateIds: result.candidates.map((candidate) => candidate.candidateId),
      completedAt: result.completedAt,
    },
    correlationId,
    source: "discovery-engine",
  });

  return result;
}
