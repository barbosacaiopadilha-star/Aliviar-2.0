import type { DomainEvent, StoredEvent } from "./types";

export class EventStore {
  private readonly events: StoredEvent[] = [];

  append(event: DomainEvent): StoredEvent {
    this.events.push(structuredClone(event));
    return event;
  }

  appendMany(events: DomainEvent[]): StoredEvent[] {
    return events.map((event) => this.append(event));
  }

  list(): readonly StoredEvent[] {
    return [...this.events];
  }

  listByCorrelationId(correlationId: string): StoredEvent[] {
    return this.events.filter((event) => event.correlationId === correlationId);
  }

  listByAggregateId(aggregateId: string): StoredEvent[] {
    return this.events.filter((event) => event.aggregateId === aggregateId);
  }

  listByType(eventType: StoredEvent["eventType"]): StoredEvent[] {
    return this.events.filter((event) => event.eventType === eventType);
  }

  size(): number {
    return this.events.length;
  }
}

export const globalEventStore = new EventStore();
