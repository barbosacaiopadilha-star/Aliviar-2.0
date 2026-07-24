import { EVENT_SCHEMA_VERSION } from "./constants";
import { EventStore } from "./event-store";
import { EventBusMetrics } from "./metrics";
import type {
  DomainEvent,
  DomainEventType,
  EventHandler,
  StoredEvent,
} from "./types";

function eventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type PublishInput<TPayload extends Record<string, unknown>> = {
  eventType: DomainEventType;
  aggregateId: string;
  payload: TPayload;
  correlationId: string;
  causationId?: string | null;
  source: string;
};

export class EventBus {
  private readonly listeners = new Map<DomainEventType, Set<EventHandler>>();
  private processing = false;
  private readonly queue: DomainEvent[] = [];

  constructor(
    private readonly store: EventStore,
    private readonly metrics: EventBusMetrics,
  ) {}

  subscribe<TPayload extends Record<string, unknown>>(
    eventType: DomainEventType,
    handler: EventHandler<TPayload>,
  ): void {
    const handlers = this.listeners.get(eventType) ?? new Set();
    handlers.add(handler as EventHandler);
    this.listeners.set(eventType, handlers);
    this.metrics.setListenerCount(this.listenerCount());
  }

  unsubscribe<TPayload extends Record<string, unknown>>(
    eventType: DomainEventType,
    handler: EventHandler<TPayload>,
  ): void {
    const handlers = this.listeners.get(eventType);
    if (!handlers) {
      return;
    }
    handlers.delete(handler as EventHandler);
    if (handlers.size === 0) {
      this.listeners.delete(eventType);
    }
    this.metrics.setListenerCount(this.listenerCount());
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((total, set) => total + set.size, 0);
  }

  createEvent<TPayload extends Record<string, unknown>>(
    input: PublishInput<TPayload>,
  ): DomainEvent<TPayload> {
    return {
      eventId: eventId(),
      eventType: input.eventType,
      aggregateId: input.aggregateId,
      payload: input.payload,
      timestamp: new Date().toISOString(),
      correlationId: input.correlationId,
      causationId: input.causationId ?? null,
      source: input.source,
      version: EVENT_SCHEMA_VERSION,
    };
  }

  async publish<TPayload extends Record<string, unknown>>(
    input: PublishInput<TPayload>,
  ): Promise<StoredEvent> {
    const event = this.createEvent(input);
    this.store.append(event);
    this.metrics.recordPublished(event.eventType);
    await this.dispatch(event);
    return event;
  }

  async publishBatch<TPayload extends Record<string, unknown>>(
    inputs: PublishInput<TPayload>[],
  ): Promise<StoredEvent[]> {
    const events = inputs.map((input) => this.createEvent(input));
    this.store.appendMany(events);
    events.forEach((event) => this.metrics.recordPublished(event.eventType));

    for (const event of events) {
      await this.dispatch(event);
    }

    return events;
  }

  private async dispatch(event: DomainEvent): Promise<void> {
    this.queue.push(event);
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const next = this.queue.shift();
        if (!next) {
          break;
        }
        await this.dispatchToListeners(next);
      }
    } finally {
      this.processing = false;
    }
  }

  private async dispatchToListeners(event: DomainEvent): Promise<void> {
    const handlers = this.listeners.get(event.eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const started = performance.now();
    const results = await Promise.allSettled(
      [...handlers].map(async (handler) => {
        await handler(event);
      }),
    );

    const durationMs = Math.round(performance.now() - started);
    this.metrics.recordProcessed(durationMs);

    results.forEach((result) => {
      if (result.status === "rejected") {
        this.metrics.recordFailure();
      }
    });
  }

  getStore(): EventStore {
    return this.store;
  }

  getMetrics(): EventBusMetrics {
    return this.metrics;
  }
}

export const globalEventBus = new EventBus(new EventStore(), new EventBusMetrics());
