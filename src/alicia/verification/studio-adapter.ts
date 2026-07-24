import { ConnectorManager, defaultConnectors } from "@/alicia/connectors";
import { EventBus, EventStore, EventBusMetrics } from "@/alicia/event-bus";

import { VerificationBusBridge } from "./integration/verification-bus-bridge";
import { mockPublishedProfiles } from "./mocks/published-profiles";
import type { VerificationCenterSnapshot } from "./types";
import { VerificationEngine } from "./verification-engine";
import { VerificationRunner } from "./verification-runner";

let sessionEngine: VerificationEngine | null = null;
let sessionBridge: VerificationBusBridge | null = null;

function buildEngine(): VerificationEngine {
  const connectorManager = new ConnectorManager();
  for (const connector of defaultConnectors) {
    connectorManager.register(connector);
  }

  const engine = new VerificationEngine({
    runner: new VerificationRunner({ connectorManager }),
  });

  for (const profile of mockPublishedProfiles) {
    engine.registerProfile(profile);
  }

  return engine;
}

function getSession(): { engine: VerificationEngine; bridge: VerificationBusBridge } {
  if (!sessionEngine) {
    sessionEngine = buildEngine();
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    sessionBridge = new VerificationBusBridge({ bus, engine: sessionEngine });
    sessionBridge.start();
  }

  return { engine: sessionEngine, bridge: sessionBridge! };
}

export function resetVerificationSession(): void {
  sessionBridge?.stop();
  sessionEngine?.reset();
  sessionEngine = null;
  sessionBridge = null;
}

export async function getVerificationCenterSnapshot(
  options: { refresh?: boolean } = {},
): Promise<VerificationCenterSnapshot> {
  const { engine } = getSession();

  if (options.refresh || engine.getLastRunAt() === null) {
    await engine.runPlanned();
  } else if (engine.getQueue().length === 0) {
    engine.planQueue();
  }

  return {
    queue: engine.getQueue(),
    recentRuns: engine.getRecentRuns(),
    pendingReview: engine.getHistory().listPendingReview(),
    history: engine.getHistory().list(),
    metrics: engine.getMetrics().snapshot(),
    lastRunAt: engine.getLastRunAt(),
  };
}
