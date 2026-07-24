import type { DomainEventType, EventBusMetricsSnapshot } from "./types";

export class EventBusMetrics {
  private eventsPublished = 0;
  private eventsProcessed = 0;
  private handlerFailures = 0;
  private totalProcessingMs = 0;
  private listenerCount = 0;
  private retryCount = 0;
  private dlqCount = 0;
  private readonly eventsByType = new Map<string, number>();

  setListenerCount(count: number): void {
    this.listenerCount = count;
  }

  recordPublished(eventType: DomainEventType): void {
    this.eventsPublished += 1;
    this.eventsByType.set(eventType, (this.eventsByType.get(eventType) ?? 0) + 1);
  }

  recordProcessed(durationMs: number): void {
    this.eventsProcessed += 1;
    this.totalProcessingMs += durationMs;
  }

  recordFailure(): void {
    this.handlerFailures += 1;
  }

  recordRetry(): void {
    this.retryCount += 1;
  }

  recordDlq(): void {
    this.dlqCount += 1;
  }

  snapshot(): EventBusMetricsSnapshot {
    return {
      eventsPublished: this.eventsPublished,
      eventsProcessed: this.eventsProcessed,
      handlerFailures: this.handlerFailures,
      averageProcessingMs:
        this.eventsProcessed === 0 ? 0 : Math.round(this.totalProcessingMs / this.eventsProcessed),
      listenerCount: this.listenerCount,
      retryCount: this.retryCount,
      dlqCount: this.dlqCount,
      eventsByType: Object.fromEntries(this.eventsByType.entries()),
    };
  }

  reset(): void {
    this.eventsPublished = 0;
    this.eventsProcessed = 0;
    this.handlerFailures = 0;
    this.totalProcessingMs = 0;
    this.listenerCount = 0;
    this.retryCount = 0;
    this.dlqCount = 0;
    this.eventsByType.clear();
  }
}

export const globalEventBusMetrics = new EventBusMetrics();
