import type { EvidenceMetricsSnapshot } from "./types";

export class EvidenceMetrics {
  private packagesCreated = 0;
  private packagesUpdated = 0;
  private packagesRejected = 0;
  private conflictsDetected = 0;
  private candidatesProcessed = 0;
  private coverageTotal = 0;
  private coverageSamples = 0;
  private lastRunAt: string | null = null;

  recordCreated(conflictCount: number, coverageAverage: number): void {
    this.packagesCreated += 1;
    this.conflictsDetected += conflictCount;
    this.coverageTotal += coverageAverage;
    this.coverageSamples += 1;
  }

  recordUpdated(conflictCount: number, coverageAverage: number): void {
    this.packagesUpdated += 1;
    this.conflictsDetected += conflictCount;
    this.coverageTotal += coverageAverage;
    this.coverageSamples += 1;
  }

  recordRejected(): void {
    this.packagesRejected += 1;
  }

  recordCandidates(count: number): void {
    this.candidatesProcessed += count;
  }

  setLastRunAt(timestamp: string): void {
    this.lastRunAt = timestamp;
  }

  snapshot(): EvidenceMetricsSnapshot {
    return {
      packagesCreated: this.packagesCreated,
      packagesUpdated: this.packagesUpdated,
      packagesRejected: this.packagesRejected,
      conflictsDetected: this.conflictsDetected,
      candidatesProcessed: this.candidatesProcessed,
      averageCoverage:
        this.coverageSamples === 0
          ? 0
          : Math.round(this.coverageTotal / this.coverageSamples),
      lastRunAt: this.lastRunAt,
    };
  }

  reset(): void {
    this.packagesCreated = 0;
    this.packagesUpdated = 0;
    this.packagesRejected = 0;
    this.conflictsDetected = 0;
    this.candidatesProcessed = 0;
    this.coverageTotal = 0;
    this.coverageSamples = 0;
    this.lastRunAt = null;
  }
}
