import { DiscoveryEngine } from "./discovery-engine";
import { DiscoveryMetrics } from "./metrics";
import { DiscoveryQueue } from "./discovery-queue";
import { DiscoveryAuditTrail } from "./audit";
import type { DiscoveryMetricsSnapshot, DiscoveryQueueItem, SourceHealthStatus } from "./types";

type DiscoverySession = {
  engine: DiscoveryEngine;
  lastRunAt: string | null;
  sourceHealth: Record<string, SourceHealthStatus>;
};

let session: DiscoverySession | null = null;

function getSession(): DiscoverySession {
  if (!session) {
    session = {
      engine: new DiscoveryEngine({
        queue: new DiscoveryQueue(),
        metrics: new DiscoveryMetrics(),
        audit: new DiscoveryAuditTrail(),
      }),
      lastRunAt: null,
      sourceHealth: {},
    };
  }
  return session;
}

export function resetDiscoverySession(): void {
  session = null;
}

export type DiscoveryInboxSnapshot = {
  items: DiscoveryQueueItem[];
  metrics: DiscoveryMetricsSnapshot;
  sourceHealth: Record<string, SourceHealthStatus>;
  lastRunAt: string | null;
};

export async function getDiscoveryInboxSnapshot(
  options: { refresh?: boolean } = {},
): Promise<DiscoveryInboxSnapshot> {
  const current = getSession();

  if (options.refresh || current.lastRunAt === null) {
    const result = await current.engine.run();
    current.lastRunAt = result.completedAt;
    current.sourceHealth = result.sourceHealth;
  }

  return {
    items: current.engine.getQueue().list(),
    metrics: current.engine.getMetrics().snapshot(),
    sourceHealth: current.sourceHealth,
    lastRunAt: current.lastRunAt,
  };
}
