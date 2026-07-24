import type { ConnectorHealthSnapshot, ConnectorHealthStatus } from "./types";

type HealthRecord = {
  status: ConnectorHealthStatus;
  lastExecutionAt: string | null;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalLatencyMs: number;
};

export class HealthMonitor {
  private readonly records = new Map<string, HealthRecord>();

  private getOrCreate(connectorId: string): HealthRecord {
    const existing = this.records.get(connectorId);
    if (existing) {
      return existing;
    }

    const created: HealthRecord = {
      status: "UNKNOWN",
      lastExecutionAt: null,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalLatencyMs: 0,
    };
    this.records.set(connectorId, created);
    return created;
  }

  register(connectorId: string, initialHealth: ConnectorHealthStatus = "UNKNOWN"): void {
    const record = this.getOrCreate(connectorId);
    record.status = initialHealth;
  }

  setStatus(connectorId: string, status: ConnectorHealthStatus): ConnectorHealthStatus {
    const record = this.getOrCreate(connectorId);
    const previous = record.status;
    record.status = status;
    return previous;
  }

  recordSuccess(connectorId: string, latencyMs: number): void {
    const record = this.getOrCreate(connectorId);
    record.lastExecutionAt = new Date().toISOString();
    record.totalExecutions += 1;
    record.successfulExecutions += 1;
    record.totalLatencyMs += latencyMs;

    if (record.status === "OFFLINE" || record.status === "UNKNOWN") {
      record.status = "ONLINE";
    }
  }

  recordFailure(connectorId: string, latencyMs: number): void {
    const record = this.getOrCreate(connectorId);
    record.lastExecutionAt = new Date().toISOString();
    record.totalExecutions += 1;
    record.failedExecutions += 1;
    record.totalLatencyMs += latencyMs;

    const failureRate = this.computeFailureRate(record);
    if (failureRate >= 0.5) {
      record.status = "OFFLINE";
    } else if (failureRate >= 0.2) {
      record.status = "DEGRADED";
    }
  }

  private computeFailureRate(record: HealthRecord): number {
    if (record.totalExecutions === 0) {
      return 0;
    }
    return record.failedExecutions / record.totalExecutions;
  }

  private computeAvailability(record: HealthRecord): number {
    if (record.totalExecutions === 0) {
      return 1;
    }
    return record.successfulExecutions / record.totalExecutions;
  }

  getStatus(connectorId: string): ConnectorHealthStatus {
    return this.getOrCreate(connectorId).status;
  }

  snapshot(connectorId: string): ConnectorHealthSnapshot {
    const record = this.getOrCreate(connectorId);
    const failureRate = this.computeFailureRate(record);
    const availability = this.computeAvailability(record);

    return {
      connectorId,
      status: record.status,
      lastExecutionAt: record.lastExecutionAt,
      averageLatencyMs:
        record.totalExecutions === 0
          ? 0
          : Math.round(record.totalLatencyMs / record.totalExecutions),
      failureRate: Math.round(failureRate * 1000) / 1000,
      availability: Math.round(availability * 1000) / 1000,
      totalExecutions: record.totalExecutions,
      successfulExecutions: record.successfulExecutions,
      failedExecutions: record.failedExecutions,
    };
  }

  list(): ConnectorHealthSnapshot[] {
    return [...this.records.keys()].map((connectorId) => this.snapshot(connectorId));
  }

  reset(): void {
    this.records.clear();
  }
}
