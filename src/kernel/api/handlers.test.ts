import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  handleAdvanceJourney,
  handleCreateCommitment,
  handleCreateJourney,
  handleQueryTimeline,
} from "../api/handlers";
import { InMemoryCommitmentRepository } from "../infrastructure/in-memory-commitment-repository";
import { InMemoryJourneyKernelRepository } from "../infrastructure/in-memory-journey-kernel-repository";
import { InMemoryTimelineRepository } from "../infrastructure/in-memory-timeline-repository";

let tick = 0;

function buildHandlerDeps() {
  return {
    journeyRepository: new InMemoryJourneyKernelRepository(),
    timelineRepository: new InMemoryTimelineRepository(),
    commitmentRepository: new InMemoryCommitmentRepository(),
    ids: { nextId: () => `hid-${tick += 1}` },
    clock: { now: () => `2026-07-22T15:00:${String(tick).padStart(2, "0")}.000Z` },
  };
}

describe("kernel API handlers", () => {
  it("handleCreateJourney retorna 200 com vis├úo can├┤nica", async () => {
    const deps = buildHandlerDeps();
    const journeyId = randomUUID();

    const response = await handleCreateJourney(
      deps,
      { actorId: "op-1", role: "OPERATION" },
      { journeyId, patientId: "patient-1" },
    );

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.journey.currentStage).toBe("CADASTRO");
      expect(response.body.journey.isClosed).toBe(false);
    }
  });

  it("handleAdvanceJourney retorna 403 para papel sem permiss├úo na etapa", async () => {
    const deps = buildHandlerDeps();
    const journeyId = randomUUID();

    await handleCreateJourney(
      deps,
      { actorId: "op-1", role: "OPERATION" },
      { journeyId, patientId: "patient-1" },
    );

    const response = await handleAdvanceJourney(
      deps,
      { actorId: "aud-1", role: "AUDITOR" },
      { journeyId },
    );

    expect(response.status).toBe(403);
  });

  it("handleQueryTimeline lista eventos append-only", async () => {
    const deps = buildHandlerDeps();
    const journeyId = randomUUID();

    await handleCreateJourney(
      deps,
      { actorId: "op-1", role: "OPERATION" },
      { journeyId, patientId: "patient-1" },
    );

    const response = await handleQueryTimeline(
      deps,
      { actorId: "op-1", role: "OPERATION" },
      { journeyId },
    );

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.events.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("handleCreateCommitment retorna commitmentId", async () => {
    const deps = buildHandlerDeps();
    const journeyId = randomUUID();

    await handleCreateJourney(
      deps,
      { actorId: "op-1", role: "OPERATION" },
      { journeyId, patientId: "patient-1" },
    );

    const response = await handleCreateCommitment(
      deps,
      { actorId: "op-1", role: "OPERATION" },
      {
        journeyId,
        title: "Revisar documenta├º├úo enviada",
        assignedTo: randomUUID(),
      },
    );

    expect(response.status).toBe(200);
    if (response.status === 200) {
      expect(response.body.commitmentId).toBeTruthy();
    }
  });
});
