import type { ChangeClassification, VerificationMetricsSnapshot } from "./types";

export class VerificationMetrics {
  private profilesVerified = 0;
  private noChange = 0;
  private minorChanges = 0;
  private materialChanges = 0;
  private conflicts = 0;
  private totalLatencyMs = 0;
  private updatesRequired = 0;
  private pendingQueue = 0;

  recordRun(classification: ChangeClassification, latencyMs: number, updateRequired: boolean): void {
    this.profilesVerified += 1;
    this.totalLatencyMs += latencyMs;

    switch (classification) {
      case "NO_CHANGE":
        this.noChange += 1;
        break;
      case "MINOR_CHANGE":
        this.minorChanges += 1;
        break;
      case "MATERIAL_CHANGE":
        this.materialChanges += 1;
        break;
      case "CONFLICT":
        this.conflicts += 1;
        break;
    }

    if (updateRequired) {
      this.updatesRequired += 1;
    }
  }

  setPendingQueue(count: number): void {
    this.pendingQueue = count;
  }

  snapshot(): VerificationMetricsSnapshot {
    return {
      profilesVerified: this.profilesVerified,
      noChange: this.noChange,
      minorChanges: this.minorChanges,
      materialChanges: this.materialChanges,
      conflicts: this.conflicts,
      averageLatencyMs:
        this.profilesVerified === 0
          ? 0
          : Math.round(this.totalLatencyMs / this.profilesVerified),
      updateRate:
        this.profilesVerified === 0
          ? 0
          : Math.round((this.updatesRequired / this.profilesVerified) * 1000) / 1000,
      pendingQueue: this.pendingQueue,
    };
  }

  reset(): void {
    this.profilesVerified = 0;
    this.noChange = 0;
    this.minorChanges = 0;
    this.materialChanges = 0;
    this.conflicts = 0;
    this.totalLatencyMs = 0;
    this.updatesRequired = 0;
    this.pendingQueue = 0;
  }
}
