import { describe, expect, it } from "vitest";

import { buildCommitmentsView } from "@/journey-memory/projection/commitments-view";
import { projectNarrative } from "@/journey-memory/projection/narrative-projection";
import type { JourneyMemory } from "@/journey-memory/model/journey-memory";

describe("commitments view projection", () => {
  it("separa compromissos abertos, concluídos e cancelados", () => {
    const view = buildCommitmentsView("j-1", [
      {
        id: "1",
        journey_id: "j-1",
        title: "Aberto",
        assigned_to: "u1",
        status: "PENDING",
        due_date: "2026-07-30",
        completed_at: null,
        cancelled_at: null,
        created_by: "u1",
        created_at: "2026-07-20T00:00:00.000Z",
        updated_at: "2026-07-20T00:00:00.000Z",
      },
      {
        id: "2",
        journey_id: "j-1",
        title: "Feito",
        assigned_to: "u1",
        status: "COMPLETED",
        due_date: null,
        completed_at: "2026-07-21T00:00:00.000Z",
        cancelled_at: null,
        created_by: "u1",
        created_at: "2026-07-19T00:00:00.000Z",
        updated_at: "2026-07-21T00:00:00.000Z",
      },
    ]);

    expect(view.open).toHaveLength(1);
    expect(view.completed).toHaveLength(1);
    expect(view.cancelled).toHaveLength(0);
  });
});

describe("narrative projection", () => {
  const baseMemory: JourneyMemory = {
    journeyId: "j-1",
    timeline: [
      {
        id: "t1",
        journeyId: "j-1",
        kind: "EVENT",
        category: "JOURNEY",
        source: "MANUAL",
        title: "Início",
        body: null,
        occurredAt: "2026-07-20T10:00:00.000Z",
        recordedAt: "2026-07-20T10:00:00.000Z",
        actorId: "curator-1",
        originId: null,
      },
    ],
    notes: [
      {
        id: "n1",
        journeyId: "j-1",
        content: "Nota operacional",
        visibility: ["OPERACAO"],
        createdBy: "operator-1",
        createdAt: "2026-07-21T11:00:00.000Z",
      },
    ],
    attachmentReferences: [],
    commitments: {
      journeyId: "j-1",
      open: [],
      completed: [],
      cancelled: [],
      total: 0,
    },
    builtAt: "2026-07-22T12:00:00.000Z",
    entryCount: 1,
  };

  it("curadoria vê eventos e notas de curadoria", () => {
    const narrative = projectNarrative(baseMemory, "CURATORIA", "2026-07-22T12:00:00.000Z");
    expect(narrative.segments.length).toBeGreaterThanOrEqual(1);
  });

  it("operação vê notas operacionais", () => {
    const narrative = projectNarrative(baseMemory, "OPERACAO", "2026-07-22T12:00:00.000Z");
    expect(narrative.segments.some((s) => s.provenance === "note")).toBe(true);
  });
});
