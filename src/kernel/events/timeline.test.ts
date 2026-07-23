import { describe, expect, it } from "vitest";

import { InMemoryTimelineRepository } from "../infrastructure/in-memory-timeline-repository";

describe("kernel timeline (K02)", () => {
  it("append-only ÔÇö eventos n├úo s├úo removidos", async () => {
    const repo = new InMemoryTimelineRepository();

    const first = await repo.append({
      journeyId: "j-1",
      category: "JOURNEY",
      source: "SYSTEM",
      title: "Primeiro evento",
      occurredAt: "2026-07-22T10:00:00.000Z",
      createdBy: "staff-1",
    });

    const second = await repo.append({
      journeyId: "j-1",
      category: "CONTACT",
      source: "MANUAL",
      title: "Segundo evento",
      occurredAt: "2026-07-22T11:00:00.000Z",
      createdBy: "staff-1",
    });

    const list = await repo.listByJourney("j-1");
    expect(list).toHaveLength(2);
    expect(list[0]?.id).toBe(first.id);
    expect(list[1]?.id).toBe(second.id);
    expect(list.every((event) => event.isCorrected === false)).toBe(true);
  });
});
