import type { ConnectorEventType } from "./connector-events";
import type { ConnectorEvent, ConnectorEventHandler } from "./types";

function eventId(): string {
  return `conn-evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ConnectorEventEmitter {
  private readonly listeners = new Map<ConnectorEventType, Set<ConnectorEventHandler>>();
  private readonly history: ConnectorEvent[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory = 200) {
    this.maxHistory = maxHistory;
  }

  subscribe(eventType: ConnectorEventType, handler: ConnectorEventHandler): void {
    const handlers = this.listeners.get(eventType) ?? new Set();
    handlers.add(handler);
    this.listeners.set(eventType, handlers);
  }

  unsubscribe(eventType: ConnectorEventType, handler: ConnectorEventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (!handlers) {
      return;
    }
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.listeners.delete(eventType);
    }
  }

  async publish(
    eventType: ConnectorEventType,
    connectorId: string,
    payload: Record<string, unknown>,
  ): Promise<ConnectorEvent> {
    const event: ConnectorEvent = {
      eventId: eventId(),
      eventType,
      connectorId,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const handlers = this.listeners.get(eventType);
    if (handlers) {
      await Promise.allSettled([...handlers].map((handler) => handler(event)));
    }

    return event;
  }

  getHistory(): ConnectorEvent[] {
    return [...this.history];
  }

  getHistoryByConnector(connectorId: string): ConnectorEvent[] {
    return this.history.filter((event) => event.connectorId === connectorId);
  }

  reset(): void {
    this.listeners.clear();
    this.history.length = 0;
  }
}
