import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { InMemoryCommitmentRepository } from "../infrastructure/in-memory-commitment-repository";
import { InMemoryJourneyKernelRepository } from "../infrastructure/in-memory-journey-kernel-repository";
import { InMemoryTimelineRepository } from "../infrastructure/in-memory-timeline-repository";
import { advanceJourney, createJourney } from "../services/create-journey";
import { completeCommitment, createCommitment } from "../services/journey-commitments";
import { queryJourneyTimeline, registerJourneyEvent } from "../services/journey-timeline";

const BASE_TIME = "2026-07-22T14:00:00.000Z";
let tick = 0;

function buildDeps() {
  return {
    journeyRepository: new InMemoryJourneyKernelRepository(),
    timelineRepository: new InMemoryTimelineRepository(),
    commitmentRepository: new InMemoryCommitmentRepository(),
    ids: { nextId: () => `id-${tick += 1}` },
    clock: {
      now: () => new Date(Date.parse(BASE_TIME) + tick * 1000).toISOString(),
    },
  };
}

describe("kernel services", () => {
  it("CreateJourney inicia jornada e registra evento na timeline", async () => {
    const deps = buildDeps();
    const journeyId = randomUUID();

    const result = await createJourney(deps, {
      journeyId,
      patientId: "patient-1",
      actor: { id: "op-1", role: "OPERATION" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.journey.currentStage).toBe("CADASTRO");
    const events = await deps.timelineRepository.listByJourney(journeyId);
    expect(events).toHaveLength(1);
    expect(events[0]?.category).toBe("JOURNEY");
  });

  it("AdvanceJourney respeita RBAC por etapa", async () => {
    const deps = buildDeps();
    const journeyId = randomUUID();

    await createJourney(deps, {
      journeyId,
      patientId: "patient-1",
      actor: { id: "op-1", role: "OPERATION" },
    });

    const denied = await advanceJourney(deps, {
      journeyId,
      actor: { id: "c-1", role: "CURATOR" },
    });
    expect(denied.ok).toBe(false);

    const allowed = await advanceJourney(deps, {
      journeyId,
      actor: { id: "p-1", role: "PATIENT", patientId: "patient-1" },
    });
    expect(allowed.ok).toBe(true);
    if (allowed.ok) {
      expect(allowed.value.toStage).toBe("HISTORIA");
    }
  });

  it("RegisterJourneyEvent append-only na timeline", async () => {
    const deps = buildDeps();
    const journeyId = randomUUID();

    await createJourney(deps, {
      journeyId,
      patientId: "patient-1",
      actor: { id: "op-1", role: "OPERATION" },
    });

    const result = await registerJourneyEvent(deps, {
      journeyId,
      actor: { id: "op-1", role: "OPERATION" },
      category: "CONTACT",
      title: "Contato telef├┤nico",
      occurredAt: deps.clock.now(),
    });

    expect(result.ok).toBe(true);
    const timeline = await queryJourneyTimeline(deps, {
      journeyId,
      actor: { id: "op-1", role: "OPERATION" },
    });
    expect(timeline.ok).toBe(true);
    if (timeline.ok) {
      expect(timeline.value.events.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("CreateCommitment e CompleteCommitment", async () => {
    const deps = buildDeps();
    const journeyId = randomUUID();

    await createJourney(deps, {
      journeyId,
      patientId: "patient-1",
      actor: { id: "op-1", role: "OPERATION" },
    });

    const created = await createCommitment(deps, {
      journeyId,
      actor: { id: "op-1", role: "OPERATION" },
      title: "Solicitar exame complementar",
      assignedTo: randomUUID(),
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const completed = await completeCommitment(deps, {
      journeyId,
      commitmentId: created.value.commitmentId,
      actor: { id: "op-1", role: "OPERATION" },
      occurredAt: deps.clock.now(),
    });

    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.value.status).toBe("COMPLETED");
    }
  });

  it("AUDITOR n├úo registra eventos manuais", async () => {
    const deps = buildDeps();
    const journeyId = randomUUID();

    await createJourney(deps, {
      journeyId,
      patientId: "patient-1",
      actor: { id: "op-1", role: "OPERATION" },
    });

    const result = await registerJourneyEvent(deps, {
      journeyId,
      actor: { id: "aud-1", role: "AUDITOR" },
      category: "OBSERVATION",
      title: "Tentativa de escrita",
      occurredAt: deps.clock.now(),
    });

    expect(result.ok).toBe(false);
  });
});
