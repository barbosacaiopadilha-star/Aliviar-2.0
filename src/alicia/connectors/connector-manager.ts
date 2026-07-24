import type { SourceConnector } from "./ports/source-connector";
import { DEFAULT_MAX_RETRIES } from "./constants";
import { ConnectorEventEmitter } from "./connector-event-emitter";
import { ConnectorMetrics } from "./connector-metrics";
import { ConnectorRegistry } from "./connector-registry";
import { HealthMonitor } from "./health-monitor";
import { NormalizerPipeline } from "./normalizer-pipeline";
import { RateLimiter } from "./rate-limiter";
import type {
  ConnectorExecutionStatus,
  ConnectorHealthStatus,
  ConnectorManagerRunResult,
  ConnectorRetryJob,
  ConnectorRunResult,
  ConnectorStatusSnapshot,
  NormalizedConnectorRecord,
} from "./types";

function runId(): string {
  return `conn-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function retryJobId(): string {
  return `conn-retry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type ConnectorManagerOptions = {
  registry?: ConnectorRegistry;
  healthMonitor?: HealthMonitor;
  rateLimiter?: RateLimiter;
  normalizer?: NormalizerPipeline;
  metrics?: ConnectorMetrics;
  events?: ConnectorEventEmitter;
};

export class ConnectorManager {
  private readonly registry: ConnectorRegistry;
  private readonly healthMonitor: HealthMonitor;
  private readonly rateLimiter: RateLimiter;
  private readonly normalizer: NormalizerPipeline;
  private readonly metrics: ConnectorMetrics;
  private readonly events: ConnectorEventEmitter;
  private readonly enabled = new Set<string>();
  private readonly executionStatus = new Map<string, ConnectorExecutionStatus>();
  private readonly lastSyncAt = new Map<string, string>();
  private readonly lastError = new Map<string, string | null>();
  private readonly retryQueue: ConnectorRetryJob[] = [];
  private lastRunAt: string | null = null;

  constructor(options: ConnectorManagerOptions = {}) {
    this.registry = options.registry ?? new ConnectorRegistry();
    this.healthMonitor = options.healthMonitor ?? new HealthMonitor();
    this.rateLimiter = options.rateLimiter ?? new RateLimiter();
    this.normalizer = options.normalizer ?? new NormalizerPipeline();
    this.metrics = options.metrics ?? new ConnectorMetrics();
    this.events = options.events ?? new ConnectorEventEmitter();
  }

  register(connector: SourceConnector): void {
    this.registry.register(connector);
    this.enabled.add(connector.id);
    this.executionStatus.set(connector.id, "IDLE");
    this.healthMonitor.register(connector.id, connector.health());
  }

  registerOrReplace(connector: SourceConnector): void {
    this.registry.registerOrReplace(connector);
    this.enabled.add(connector.id);
    this.executionStatus.set(connector.id, "IDLE");
    this.healthMonitor.register(connector.id, connector.health());
  }

  unregister(connectorId: string): boolean {
    this.enabled.delete(connectorId);
    this.executionStatus.delete(connectorId);
    this.lastSyncAt.delete(connectorId);
    this.lastError.delete(connectorId);
    return this.registry.unregister(connectorId);
  }

  enable(connectorId: string): void {
    if (!this.registry.has(connectorId)) {
      throw new Error(`Conector não registrado: ${connectorId}`);
    }
    this.enabled.add(connectorId);
    this.executionStatus.set(connectorId, "IDLE");
  }

  async disable(connectorId: string, reason = "Desabilitado manualmente."): Promise<void> {
    this.enabled.delete(connectorId);
    this.executionStatus.set(connectorId, "DISABLED");
    await this.events.publish("ConnectorDisabled", connectorId, { connectorId, reason });
  }

  isEnabled(connectorId: string): boolean {
    return this.enabled.has(connectorId);
  }

  getRegistry(): ConnectorRegistry {
    return this.registry;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getMetrics(): ConnectorMetrics {
    return this.metrics;
  }

  getEvents(): ConnectorEventEmitter {
    return this.events;
  }

  getRetryQueue(): ConnectorRetryJob[] {
    return [...this.retryQueue];
  }

  getLastRunAt(): string | null {
    return this.lastRunAt;
  }

  getStatusSnapshots(): ConnectorStatusSnapshot[] {
    return this.registry.list().map((connector) => {
      const health = this.healthMonitor.snapshot(connector.id);
      return {
        connectorId: connector.id,
        name: connector.name,
        version: connector.version,
        enabled: this.enabled.has(connector.id),
        priority: connector.priority,
        health: health.status,
        executionStatus: this.executionStatus.get(connector.id) ?? "IDLE",
        lastSyncAt: this.lastSyncAt.get(connector.id) ?? null,
        lastError: this.lastError.get(connector.id) ?? null,
        availability: health.availability,
        averageLatencyMs: health.averageLatencyMs,
        failureRate: health.failureRate,
      };
    });
  }

  async runConnector(connectorId: string): Promise<ConnectorRunResult> {
    const connector = this.registry.get(connectorId);
    if (!connector) {
      throw new Error(`Conector não registrado: ${connectorId}`);
    }

    if (!this.enabled.has(connectorId)) {
      return {
        connectorId,
        success: false,
        records: [],
        invalidCount: 0,
        error: "Conector desabilitado.",
        latencyMs: 0,
        retries: 0,
      };
    }

    if (!connector.supports()) {
      return {
        connectorId,
        success: false,
        records: [],
        invalidCount: 0,
        error: "Conector não suportado neste ambiente.",
        latencyMs: 0,
        retries: 0,
      };
    }

    const rateConfig = connector.rateLimit();
    if (!this.rateLimiter.canExecute(connectorId, rateConfig)) {
      return {
        connectorId,
        success: false,
        records: [],
        invalidCount: 0,
        error: "Rate limit excedido.",
        latencyMs: 0,
        retries: 0,
      };
    }

    return this.executeWithRetry(connector);
  }

  async runAll(): Promise<ConnectorManagerRunResult> {
    const startedAt = new Date().toISOString();
    const runIdentifier = runId();
    const results: ConnectorRunResult[] = [];

    const connectors = this.registry
      .list()
      .filter((connector) => this.enabled.has(connector.id));

    for (const connector of connectors) {
      const result = await this.runConnector(connector.id);
      results.push(result);
    }

    this.lastRunAt = new Date().toISOString();

    return {
      runId: runIdentifier,
      startedAt,
      completedAt: this.lastRunAt,
      results,
      metrics: this.metrics.snapshot(),
    };
  }

  private async executeWithRetry(connector: SourceConnector): Promise<ConnectorRunResult> {
    const connectorId = connector.id;
    const rateConfig = connector.rateLimit();
    const maxAttempts = rateConfig.maxRetries ?? DEFAULT_MAX_RETRIES;
    let attempt = 0;
    let retries = 0;
    const started = performance.now();

    this.executionStatus.set(connectorId, "RUNNING");
    await this.events.publish("ConnectorStarted", connectorId, {
      connectorId,
      connectorName: connector.name,
    });

    while (attempt < maxAttempts) {
      attempt += 1;

      try {
        const auth = await connector.authenticate();
        if (!auth.success) {
          throw new Error(auth.error ?? "Falha na autenticação.");
        }

        const fetchResult = await connector.fetch();
        if (!fetchResult.success) {
          throw new Error(fetchResult.error ?? "Falha no fetch.");
        }

        this.rateLimiter.recordExecution(connectorId);

        const pipelineResult = this.normalizer.process(connector, fetchResult.data);
        const latencyMs = Math.round(performance.now() - started);

        const previousHealth = this.healthMonitor.getStatus(connectorId);
        this.healthMonitor.recordSuccess(connectorId, latencyMs);
        this.metrics.recordExecution(connectorId, true, latencyMs);
        this.executionStatus.set(connectorId, "SUCCEEDED");
        this.lastSyncAt.set(connectorId, new Date().toISOString());
        this.lastError.set(connectorId, null);

        if (previousHealth === "OFFLINE" || previousHealth === "DEGRADED") {
          await this.events.publish("ConnectorRecovered", connectorId, {
            connectorId,
            previousHealth,
            currentHealth: "ONLINE",
          });
        }

        await this.events.publish("ConnectorSucceeded", connectorId, {
          connectorId,
          recordCount: pipelineResult.valid.length,
          latencyMs,
        });

        return {
          connectorId,
          success: true,
          records: pipelineResult.valid,
          invalidCount: pipelineResult.invalid.length,
          latencyMs,
          retries,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha desconhecida.";
        const latencyMs = Math.round(performance.now() - started);

        if (attempt < maxAttempts) {
          retries += 1;
          this.metrics.recordRetry(connectorId);
          const backoff = this.rateLimiter.computeBackoff(attempt, rateConfig);
          const nextRetryAt = new Date(Date.now() + backoff).toISOString();

          this.retryQueue.push({
            jobId: retryJobId(),
            connectorId,
            attempt,
            maxAttempts,
            status: "Retrying",
            lastError: message,
            scheduledAt: nextRetryAt,
            updatedAt: new Date().toISOString(),
          });

          await this.events.publish("ConnectorRetried", connectorId, {
            connectorId,
            attempt,
            nextRetryAt,
            error: message,
          });

          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        this.healthMonitor.recordFailure(connectorId, latencyMs);
        this.metrics.recordExecution(connectorId, false, latencyMs);
        this.executionStatus.set(connectorId, "FAILED");
        this.lastError.set(connectorId, message);

        await this.events.publish("ConnectorFailed", connectorId, {
          connectorId,
          error: message,
          attempt,
        });

        return {
          connectorId,
          success: false,
          records: [] as NormalizedConnectorRecord[],
          invalidCount: 0,
          error: message,
          latencyMs,
          retries,
        };
      }
    }

    return {
      connectorId,
      success: false,
      records: [],
      invalidCount: 0,
      error: "Limite de tentativas excedido.",
      latencyMs: Math.round(performance.now() - started),
      retries,
    };
  }

  reset(): void {
    this.enabled.clear();
    this.executionStatus.clear();
    this.lastSyncAt.clear();
    this.lastError.clear();
    this.retryQueue.length = 0;
    this.lastRunAt = null;
    this.registry.clear();
    this.healthMonitor.reset();
    this.rateLimiter.reset();
    this.metrics.reset();
    this.events.reset();
  }
}
