import { describe, expect, it } from "vitest";

import { JourneyKernelAggregate } from "./journey-kernel-aggregate";

const BASE_TIME = "2026-07-22T12:00:00.000Z";

describe("JourneyKernelAggregate", () => {
  it("inicia em CADASTRO com evento JOURNEY_CREATED", () => {
    const journey = JourneyKernelAggregate.create({
      id: "j-1",
      patientId: "p-1",
      actorId: "staff-1",
      occurredAt: BASE_TIME,
      transitionEventId: "te-1",
    });

    expect(journey.currentStage).toBe("CADASTRO");
    expect(journey.completedStages).toHaveLength(0);
    expect(journey.transitionEvents[0]?.type).toBe("JOURNEY_CREATED");
  });

  it("percorre todas as etapas operacionais at├® ENCERRADO", () => {
    let journey = JourneyKernelAggregate.create({
      id: "j-1",
      patientId: "p-1",
      actorId: "staff-1",
      occurredAt: BASE_TIME,
      transitionEventId: "te-0",
    });

    const stages: string[] = ["CADASTRO"];
    for (let i = 0; i < 8; i += 1) {
      const result = journey.advance({
        transitionEventId: `te-${i + 1}`,
        actorId: "staff-1",
        occurredAt: new Date(Date.parse(BASE_TIME) + (i + 1) * 60_000).toISOString(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        journey = result.value;
        stages.push(journey.currentStage);
      }
    }

    expect(stages.at(-1)).toBe("ENCERRADO");
    expect(journey.isClosed).toBe(true);
    expect(journey.completedStages).toHaveLength(8);
    expect(journey.transitionEvents.at(-1)?.type).toBe("JOURNEY_CLOSED");
  });

  it("n├úo avan├ºa quando bloqueada", () => {
    const journey = JourneyKernelAggregate.create({
      id: "j-1",
      patientId: "p-1",
      actorId: "staff-1",
      occurredAt: BASE_TIME,
      transitionEventId: "te-1",
    });

    const blocked = journey.block({
      transitionEventId: "te-2",
      actorId: "staff-1",
      occurredAt: "2026-07-22T12:01:00.000Z",
      reason: "Aguardando documento",
    });

    expect(blocked.ok).toBe(true);
    if (blocked.ok) {
      const advance = blocked.value.advance({
        transitionEventId: "te-3",
        actorId: "staff-1",
        occurredAt: "2026-07-22T12:02:00.000Z",
      });
      expect(advance.ok).toBe(false);
    }
  });

  it("retoma ap├│s bloqueio e continua avan├ºando", () => {
    const journey = JourneyKernelAggregate.create({
      id: "j-1",
      patientId: "p-1",
      actorId: "staff-1",
      occurredAt: BASE_TIME,
      transitionEventId: "te-1",
    });

    const blocked = journey.block({
      transitionEventId: "te-2",
      actorId: "staff-1",
      occurredAt: "2026-07-22T12:01:00.000Z",
      reason: "Pend├¬ncia",
    });
    expect(blocked.ok).toBe(true);
    if (!blocked.ok) return;

    const resumed = blocked.value.resume({
      transitionEventId: "te-3",
      actorId: "staff-1",
      occurredAt: "2026-07-22T12:02:00.000Z",
    });
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) return;

    const advanced = resumed.value.advance({
      transitionEventId: "te-4",
      actorId: "staff-1",
      occurredAt: "2026-07-22T12:03:00.000Z",
    });
    expect(advanced.ok).toBe(true);
    if (advanced.ok) {
      expect(advanced.value.currentStage).toBe("HISTORIA");
    }
  });

  it("reidrata snapshot v├ílido", () => {
    const created = JourneyKernelAggregate.create({
      id: "j-1",
      patientId: "p-1",
      actorId: "staff-1",
      occurredAt: BASE_TIME,
      transitionEventId: "te-1",
    });

    const rehydrated = JourneyKernelAggregate.rehydrate(created.toSnapshot());
    expect(rehydrated.ok).toBe(true);
    if (rehydrated.ok) {
      expect(rehydrated.value.currentStage).toBe("CADASTRO");
    }
  });
});
