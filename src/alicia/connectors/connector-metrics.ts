import type { ConnectorMetricsSnapshot } from "./types";

type ConnectorMetricRecord = {
  executions: number;
  successes: number;
  failures: number;
  retries: number;
  totalLatencyMs: number;
  lastExecutionAt: number | null;
};

export class ConnectorMetrics {
  private totalExecutions = 0;
  private successfulExecutions = 0;
  private failedExecutions = 0;
  private retries = 0;
  private totalLatencyMs = 0;
  private readonly byConnector = new Map<string, ConnectorMetricRecord>();

  private getOrCreate(connectorId: string): ConnectorMetricRecord {
    const existing = this.byConnector.get(connectorId);
    if (existing) {
      return existing;
    }

    const created: ConnectorMetricRecord = {
      executions: 0,
      successes: 0,
      failures: 0,
      retries: 0,
      totalLatencyMs: 0,
      lastExecutionAt: null,
    };
    this.byConnector.set(connectorId, created);
    return created;
  }

  recordExecution(connectorId: string, success: boolean, latencyMs: number): void {
    this.totalExecutions += 1;
    this.totalLatencyMs += latencyMs;

    const record = this.getOrCreate(connectorId);
    record.executions += 1;
    record.totalLatencyMs += latencyMs;
    record.lastExecutionAt = Date.now();

    if (success) {
      this.successfulExecutions += 1;
      record.successes += 1;
    } else {
      this.failedExecutions += 1;
      record.failures += 1;
    }
  }

  recordRetry(connectorId: string): void {
    this.retries += 1;
    const record = this.getOrCreate(connectorId);
    record.retries += 1;
  }

  private computeThroughput(): number {
    const now = Date.now();
    let recentCount = 0;

    for (const record of this.byConnector.values()) {
      if (record.lastExecutionAt && now - record.lastExecutionAt <= 60_000) {
        recentCount += 1;
      }
    }

    return recentCount;
  }

  snapshot(): ConnectorMetricsSnapshot {
    const byConnector: ConnectorMetricsSnapshot["byConnector"] = {};

    for (const [connectorId, record] of this.byConnector.entries()) {
      byConnector[connectorId] = {
        executions: record.executions,
        successes: record.successes,
        failures: record.failures,
        retries: record.retries,
        averageLatencyMs:
          record.executions === 0 ? 0 : Math.round(record.totalLatencyMs / record.executions),
        availability:
          record.executions === 0 ? 1 : Math.round((record.successes / record.executions) * 1000) / 1000,
      };
    }

    return {
      totalExecutions: this.totalExecutions,
      successfulExecutions: this.successfulExecutions,
      failedExecutions: this.failedExecutions,
      retries: this.retries,
      averageLatencyMs:
        this.totalExecutions === 0 ? 0 : Math.round(this.totalLatencyMs / this.totalExecutions),
      throughputPerMinute: this.computeThroughput(),
      availability:
        this.totalExecutions === 0
          ? 1
          : Math.round((this.successfulExecutions / this.totalExecutions) * 1000) / 1000,
      byConnector,
    };
  }

  reset(): void {
    this.totalExecutions = 0;
    this.successfulExecutions = 0;
    this.failedExecutions = 0;
    this.retries = 0;
    this.totalLatencyMs = 0;
    this.byConnector.clear();
  }
}
