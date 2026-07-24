import { OperationsEngine } from "./operations-engine";
import type { OperationsCenterSnapshot } from "./types";

let sessionEngine: OperationsEngine | null = null;

function getSession(): OperationsEngine {
  if (!sessionEngine) {
    sessionEngine = new OperationsEngine();
  }
  return sessionEngine;
}

export function resetOperationsSession(): void {
  sessionEngine?.reset();
  sessionEngine = null;
}

export async function getOperationsCenterSnapshot(
  options: { refresh?: boolean } = {},
): Promise<OperationsCenterSnapshot> {
  const engine = getSession();

  if (options.refresh || engine.getLastSnapshot() === null) {
    return engine.refresh({ refresh: true });
  }

  return engine.getLastSnapshot()!;
}
