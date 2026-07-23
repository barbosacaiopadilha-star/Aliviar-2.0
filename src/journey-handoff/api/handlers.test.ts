import { describe, expect, it } from "vitest";

import {
  handoffCompletedEvent,
  handoffStartedEvent,
  journeyBootstrappedEvent,
} from "@/journey-handoff/events/handoff-events";

describe("handoff events", () => {
  it("emite HANDOFF_STARTED", () => {
    const event = handoffStartedEvent(
      "h-1",
      "s-1",
      "INICIAR_CONVERSA",
      "LIMIAR_INVITE",
      "2026-07-22T12:00:00.000Z",
    );
    expect(event.type).toBe("HANDOFF_STARTED");
    expect(event.payload.intention).toBe("INICIAR_CONVERSA");
  });

  it("emite HANDOFF_COMPLETED", () => {
    const event = handoffCompletedEvent(
      "h-1",
      "s-1",
      "CONVERSA_CLOSING",
      "2026-07-22T12:00:00.000Z",
    );
    expect(event.type).toBe("HANDOFF_COMPLETED");
  });

  it("emite JOURNEY_BOOTSTRAPPED", () => {
    const event = journeyBootstrappedEvent(
      "h-1",
      "s-1",
      "j-1",
      "c-1",
      "p-1",
      "2026-07-22T12:00:00.000Z",
    );
    expect(event.type).toBe("JOURNEY_BOOTSTRAPPED");
    expect(event.payload.journeyId).toBe("j-1");
  });
});
