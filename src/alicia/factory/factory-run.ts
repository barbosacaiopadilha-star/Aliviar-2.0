import type { FactoryCheckpoint, FactoryCheckpointStage, FactoryRun, FactoryRunStatus, FactorySchedule } from "./types";

function runId(): string {
  return `factory-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class FactoryRunRegistry {
  private readonly runs = new Map<string, FactoryRun>();
  private activeRunId: string | null = null;

  create(input: {
    schedule: FactorySchedule;
    dryRun: boolean;
    correlationId: string;
  }): FactoryRun {
    const run: FactoryRun = {
      runId: runId(),
      schedule: input.schedule,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationMs: null,
      status: input.dryRun ? "DRY_RUN" : "RUNNING",
      dryRun: input.dryRun,
      candidatesFound: 0,
      evidencePackages: 0,
      published: 0,
      reviewCases: 0,
      errors: [],
      warnings: [],
      checkpoints: [],
      correlationId: input.correlationId,
    };

    this.runs.set(run.runId, run);
    this.activeRunId = run.runId;
    return run;
  }

  get(runId: string): FactoryRun | null {
    return this.runs.get(runId) ?? null;
  }

  getActive(): FactoryRun | null {
    return this.activeRunId ? this.runs.get(this.activeRunId) ?? null : null;
  }

  list(): FactoryRun[] {
    return [...this.runs.values()].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }

  update(runId: string, patch: Partial<FactoryRun>): FactoryRun | null {
    const run = this.runs.get(runId);
    if (!run) {
      return null;
    }
    Object.assign(run, patch);
    return run;
  }

  addCheckpoint(runId: string, checkpoint: FactoryCheckpoint): void {
    const run = this.runs.get(runId);
    if (!run) {
      return;
    }
    const existing = run.checkpoints.findIndex((c) => c.stage === checkpoint.stage);
    if (existing >= 0) {
      run.checkpoints[existing] = checkpoint;
    } else {
      run.checkpoints.push(checkpoint);
    }
  }

  addError(runId: string, error: string): void {
    const run = this.runs.get(runId);
    if (run) {
      run.errors.push(error);
    }
  }

  addWarning(runId: string, warning: string): void {
    const run = this.runs.get(runId);
    if (run) {
      run.warnings.push(warning);
    }
  }

  resume(runId: string, dryRun: boolean): FactoryRun | null {
    const run = this.runs.get(runId);
    if (!run) {
      return null;
    }
    run.status = dryRun ? "DRY_RUN" : "RUNNING";
    run.finishedAt = null;
    run.durationMs = null;
    this.activeRunId = runId;
    return run;
  }

  complete(runId: string, status: FactoryRunStatus = "COMPLETED"): FactoryRun | null {
    const run = this.runs.get(runId);
    if (!run) {
      return null;
    }
    const finishedAt = new Date().toISOString();
    run.finishedAt = finishedAt;
    run.durationMs = new Date(finishedAt).getTime() - new Date(run.startedAt).getTime();
    run.status = status;
    if (this.activeRunId === runId) {
      this.activeRunId = null;
    }
    return run;
  }

  getLastCheckpoint(runId: string): FactoryCheckpoint | null {
    const run = this.runs.get(runId);
    if (!run || run.checkpoints.length === 0) {
      return null;
    }
    return run.checkpoints[run.checkpoints.length - 1]!;
  }

  isStageCompleted(runId: string, stage: FactoryCheckpointStage): boolean {
    const run = this.runs.get(runId);
    return run?.checkpoints.some((c) => c.stage === stage) ?? false;
  }

  reset(): void {
    this.runs.clear();
    this.activeRunId = null;
  }
}
