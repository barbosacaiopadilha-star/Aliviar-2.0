import type { DiscoveryAuditEvent } from "./types";

function eventId(): string {
  return `disc-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DiscoveryAuditTrail {
  private readonly events: DiscoveryAuditEvent[] = [];

  record(input: {
    sourceId: string;
    sourceName: string;
    foundCount: number;
    normalizedCount: number;
    duplicateCount: number;
    failed: boolean;
    error?: string;
    durationMs: number;
    at?: string;
  }): DiscoveryAuditEvent {
    const event: DiscoveryAuditEvent = {
      id: eventId(),
      at: input.at ?? new Date().toISOString(),
      sourceId: input.sourceId,
      sourceName: input.sourceName,
      foundCount: input.foundCount,
      normalizedCount: input.normalizedCount,
      duplicateCount: input.duplicateCount,
      failed: input.failed,
      error: input.error,
      durationMs: input.durationMs,
    };

    this.events.push(event);
    return event;
  }

  list(): readonly DiscoveryAuditEvent[] {
    return [...this.events];
  }

  listBySource(sourceId: string): readonly DiscoveryAuditEvent[] {
    return this.events.filter((event) => event.sourceId === sourceId);
  }
}

export const globalDiscoveryAuditTrail = new DiscoveryAuditTrail();
