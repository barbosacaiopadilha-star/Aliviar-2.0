import type { CrmEstadualAdapterMetricsSnapshot } from "./types";

export class CrmEstadualAdapterMetrics {
  private requests = 0;
  private successes = 0;
  private failures = 0;
  private notFound = 0;
  private degradedEvents = 0;
  private totalLatencyMs = 0;
  private lastError: string | null = null;
  private lastSuccessAt: string | null = null;
  private configured = false;

  setConfigured(value: boolean): void {
    this.configured = value;
  }

  recordRequest(): void {
    this.requests += 1;
  }

  recordSuccess(latencyMs: number): void {
    this.successes += 1;
    this.totalLatencyMs += latencyMs;
    this.lastSuccessAt = new Date().toISOString();
    this.lastError = null;
  }

  recordFailure(error: string, latencyMs: number): void {
    this.failures += 1;
    this.totalLatencyMs += latencyMs;
    this.lastError = error;
  }

  recordNotFound(latencyMs: number): void {
    this.notFound += 1;
    this.totalLatencyMs += latencyMs;
  }

  recordDegraded(reason: string): void {
    this.degradedEvents += 1;
    this.lastError = reason;
  }

  snapshot(): CrmEstadualAdapterMetricsSnapshot {
    return {
      requests: this.requests,
      successes: this.successes,
      failures: this.failures,
      notFound: this.notFound,
      degradedEvents: this.degradedEvents,
      averageLatencyMs:
        this.requests === 0 ? 0 : Math.round(this.totalLatencyMs / this.requests),
      lastError: this.lastError,
      lastSuccessAt: this.lastSuccessAt,
      configured: this.configured,
    };
  }

  reset(): void {
    this.requests = 0;
    this.successes = 0;
    this.failures = 0;
    this.notFound = 0;
    this.degradedEvents = 0;
    this.totalLatencyMs = 0;
    this.lastError = null;
    this.lastSuccessAt = null;
    this.configured = false;
  }
}
