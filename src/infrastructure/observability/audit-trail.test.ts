import { describe, expect, it } from "vitest";
import type { AuditTrailPort } from "@/application/ports/audit-trail-port";
import type { RecordAuditEventInput } from "@/observability-flow/contracts/audit-event";

class InMemoryAuditTrail implements AuditTrailPort {
  readonly events: RecordAuditEventInput[] = [];

  async record(input: RecordAuditEventInput): Promise<void> {
    this.events.push(input);
  }
}

describe("audit trail append-only", () => {
  it("acumula eventos sem sobrescrever anteriores", async () => {
    const trail = new InMemoryAuditTrail();

    await trail.record({
      correlationId: "c1",
      eventType: "UPLOAD",
      actorRole: "PATIENT",
      resultado: "SUCESSO",
      durationMs: 10,
      jornadaId: "j1",
    });

    await trail.record({
      correlationId: "c2",
      eventType: "PUBLICACAO",
      actorRole: "STAFF",
      resultado: "FALHA",
      durationMs: 20,
      errorCode: "HTTP_500",
      jornadaId: "j1",
    });

    expect(trail.events).toHaveLength(2);
    expect(trail.events[0]?.eventType).toBe("UPLOAD");
    expect(trail.events[1]?.resultado).toBe("FALHA");
  });
});
