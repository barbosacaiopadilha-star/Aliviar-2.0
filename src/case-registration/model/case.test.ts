import { describe, expect, it } from "vitest";

import { CaseAggregate } from "./case";
import { createCaseContext } from "./case-context";
import { createJourneyOwnership } from "./journey-ownership";

describe("CaseAggregate", () => {
  it("cria rascunho sem jornada", () => {
    const aggregate = CaseAggregate.createDraft({
      id: "case-1",
      patientId: "p-1",
      context: createCaseContext({ title: "Dor lombar persistente" }),
      ownership: createJourneyOwnership("mgr-1"),
      createdBy: "op-1",
      occurredAt: "2026-07-22T12:00:00.000Z",
    });

    expect(aggregate.hasJourney).toBe(false);
    expect(aggregate.toRecord().status).toBe("OPEN");
  });

  it("bootstrap associa jornada e ativa caso", () => {
    const draft = CaseAggregate.createDraft({
      id: "case-1",
      patientId: "p-1",
      context: createCaseContext({ title: "Consulta cardiologia" }),
      ownership: createJourneyOwnership("mgr-1"),
      createdBy: "op-1",
      occurredAt: "2026-07-22T12:00:00.000Z",
    });

    const result = draft.bootstrapJourney("j-1", "2026-07-22T12:01:00.000Z");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.journeyId).toBe("j-1");
      expect(result.value.toRecord().status).toBe("ACTIVE");
    }
  });

  it("rejeita segunda jornada no mesmo caso", () => {
    const draft = CaseAggregate.createDraft({
      id: "case-1",
      patientId: "p-1",
      context: createCaseContext({ title: "Caso ├║nico" }),
      ownership: createJourneyOwnership("mgr-1"),
      createdBy: "op-1",
      occurredAt: "2026-07-22T12:00:00.000Z",
    });

    const first = draft.bootstrapJourney("j-1", "2026-07-22T12:01:00.000Z");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = first.value.bootstrapJourney("j-2", "2026-07-22T12:02:00.000Z");
    expect(second.ok).toBe(false);
  });
});
