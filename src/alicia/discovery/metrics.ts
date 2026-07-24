import type { DiscoveryMetricsSnapshot } from "./types";

type MetricsState = {
  candidatesFound: number;
  duplicates: number;
  ignored: number;
  queued: number;
  readyForEvidence: number;
  sourcesExecuted: number;
  sourceFailures: number;
  totalDurationMs: number;
  runCount: number;
  lastRunAt: string | null;
};

export class DiscoveryMetrics {
  private state: MetricsState = {
    candidatesFound: 0,
    duplicates: 0,
    ignored: 0,
    queued: 0,
    readyForEvidence: 0,
    sourcesExecuted: 0,
    sourceFailures: 0,
    totalDurationMs: 0,
    runCount: 0,
    lastRunAt: null,
  };

  recordRun(input: {
    found: number;
    duplicates: number;
    ignored: number;
    queued: number;
    readyForEvidence: number;
    sourcesExecuted: number;
    sourceFailures: number;
    durationMs: number;
    at: string;
  }): void {
    this.state.candidatesFound += input.found;
    this.state.duplicates += input.duplicates;
    this.state.ignored += input.ignored;
    this.state.queued += input.queued;
    this.state.readyForEvidence += input.readyForEvidence;
    this.state.sourcesExecuted += input.sourcesExecuted;
    this.state.sourceFailures += input.sourceFailures;
    this.state.totalDurationMs += input.durationMs;
    this.state.runCount += 1;
    this.state.lastRunAt = input.at;
  }

  snapshot(): DiscoveryMetricsSnapshot {
    const averageDurationMs =
      this.state.runCount === 0 ? 0 : Math.round(this.state.totalDurationMs / this.state.runCount);

    return {
      candidatesFound: this.state.candidatesFound,
      duplicates: this.state.duplicates,
      ignored: this.state.ignored,
      queued: this.state.queued,
      readyForEvidence: this.state.readyForEvidence,
      sourcesExecuted: this.state.sourcesExecuted,
      sourceFailures: this.state.sourceFailures,
      averageDurationMs,
      lastRunAt: this.state.lastRunAt,
    };
  }

  reset(): void {
    this.state = {
      candidatesFound: 0,
      duplicates: 0,
      ignored: 0,
      queued: 0,
      readyForEvidence: 0,
      sourcesExecuted: 0,
      sourceFailures: 0,
      totalDurationMs: 0,
      runCount: 0,
      lastRunAt: null,
    };
  }
}

export const globalDiscoveryMetrics = new DiscoveryMetrics();
