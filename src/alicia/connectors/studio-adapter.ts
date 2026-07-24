import { ConnectorManager } from "./connector-manager";
import { defaultConnectors } from "./default-connectors";
import type { ConnectorMonitorSnapshot } from "./types";
let sessionManager: ConnectorManager | null = null;

function getSession(): ConnectorManager {
  if (!sessionManager) {
    sessionManager = new ConnectorManager();
    for (const connector of defaultConnectors) {
      sessionManager.register(connector);
    }
  }
  return sessionManager;
}

export function resetConnectorSession(): void {
  sessionManager?.reset();
  sessionManager = null;
}

export async function getConnectorMonitorSnapshot(
  options: { refresh?: boolean } = {},
): Promise<ConnectorMonitorSnapshot> {
  const manager = getSession();

  if (options.refresh || manager.getLastRunAt() === null) {
    await manager.runAll();
  }

  return {
    connectors: manager.getStatusSnapshots(),
    metrics: manager.getMetrics().snapshot(),
    health: manager.getHealthMonitor().list(),
    retryQueue: manager.getRetryQueue(),
    recentEvents: manager.getEvents().getHistory().slice(-50),
    lastRunAt: manager.getLastRunAt(),
  };
}
