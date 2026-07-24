import { FactoryOrchestrator } from "./factory-orchestrator";
import type { FactoryCenterSnapshot, FactorySchedule } from "./types";

let sessionOrchestrator: FactoryOrchestrator | null = null;

function getSession(): FactoryOrchestrator {
  if (!sessionOrchestrator) {
    sessionOrchestrator = new FactoryOrchestrator();
  }
  return sessionOrchestrator;
}

export function resetFactorySession(): void {
  sessionOrchestrator?.reset();
  sessionOrchestrator = null;
}

export async function getFactoryCenterSnapshot(
  options: { refresh?: boolean; dryRun?: boolean } = {},
): Promise<FactoryCenterSnapshot> {
  const orchestrator = getSession();
  const scheduler = orchestrator.getScheduler();

  if (options.refresh || orchestrator.getRuns().length === 0) {
    await orchestrator.startRun({
      schedule: scheduler.getSchedule(),
      dryRun: options.dryRun,
    });

    await waitForRunCompletion(orchestrator, 15_000);
  }

  const runs = orchestrator.getRuns();
  const lastRun = runs[0] ?? null;

  if (lastRun?.finishedAt) {
    orchestrator.finalizeReport(lastRun.runId);
  }

  return {
    runs,
    metrics: orchestrator.getMetrics().snapshot(),
    lastRun,
    lastReport: orchestrator.getLastReport(),
    scheduler: {
      schedule: scheduler.getSchedule(),
      nextRunAt: scheduler.getNextRunAt(),
      due: scheduler.isDue(),
    },
  };
}

async function waitForRunCompletion(
  orchestrator: FactoryOrchestrator,
  timeoutMs: number,
): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const active = orchestrator.getRuns().find((r) => !r.finishedAt);
    if (!active) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export function setFactorySchedule(schedule: FactorySchedule): void {
  getSession().getScheduler().setSchedule(schedule);
}
