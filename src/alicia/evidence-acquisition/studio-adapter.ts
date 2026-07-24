import { ConnectorManager, defaultConnectors } from "@/alicia/connectors";
import { EventBus, EventBusMetrics, EventStore } from "@/alicia/event-bus";

import { EvidenceAcquisitionEngine } from "./evidence-acquisition-engine";
import { EvidenceBusBridge } from "./integration/evidence-bus-bridge";
import type { ConnectorEvidenceInput, EvidenceExplorerSnapshot } from "./types";

let sessionEngine: EvidenceAcquisitionEngine | null = null;
let sessionBridge: EvidenceBusBridge | null = null;
let sessionConnectorRunId: string | null = null;

function buildEngine(): EvidenceAcquisitionEngine {
  return new EvidenceAcquisitionEngine();
}

function getSession(): {
  engine: EvidenceAcquisitionEngine;
  bridge: EvidenceBusBridge;
} {
  if (!sessionEngine) {
    sessionEngine = buildEngine();
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    sessionBridge = new EvidenceBusBridge({ bus });
  }

  return { engine: sessionEngine, bridge: sessionBridge! };
}

function toConnectorInputs(
  manager: ConnectorManager,
  runResults: Awaited<ReturnType<ConnectorManager["runAll"]>>,
): ConnectorEvidenceInput[] {
  return runResults.results.map((result) => {
    const connector = manager.getRegistry().get(result.connectorId);
    return {
      connectorId: result.connectorId,
      connectorVersion: connector?.version ?? "0.0.0",
      connectorName: connector?.name ?? result.connectorId,
      success: result.success,
      records: result.records,
      fetchedAt: runResults.completedAt,
    };
  });
}

export function resetEvidenceSession(): void {
  sessionEngine?.reset();
  sessionEngine = null;
  sessionBridge = null;
  sessionConnectorRunId = null;
}

export async function getEvidenceExplorerSnapshot(
  options: { refresh?: boolean } = {},
): Promise<EvidenceExplorerSnapshot> {
  const { engine, bridge } = getSession();

  if (options.refresh || engine.getLastRunAt() === null) {
    const manager = new ConnectorManager();
    for (const connector of defaultConnectors) {
      manager.register(connector);
    }

    const runResults = await manager.runAll();
    sessionConnectorRunId = runResults.runId;

    const inputs = toConnectorInputs(manager, runResults);
    const result = engine.acquire(inputs);
    await bridge.publishRunEvents(result);
  }

  return {
    packages: engine.getPackages(),
    history: engine.getHistory().list(),
    metrics: engine.getMetrics().snapshot(),
    lastRunAt: engine.getLastRunAt(),
    connectorRunId: sessionConnectorRunId,
  };
}
