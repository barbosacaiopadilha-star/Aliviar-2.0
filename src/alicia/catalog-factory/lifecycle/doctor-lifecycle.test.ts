import { describe, expect, it } from "vitest";

import {
  advanceLifecycleThroughAutoVerification,
  advanceLifecycleThroughIngestion,
  advanceLifecycleToPublished,
  canTransitionLifecycle,
  createLifecycleRecord,
  transitionLifecycle,
} from "./doctor-lifecycle";

describe("doctor lifecycle", () => {
  it("advances through ingestion states", () => {
    let lifecycle = createLifecycleRecord("discovered", "2026-07-22");
    lifecycle = advanceLifecycleThroughIngestion(lifecycle, "2026-07-22");

    expect(lifecycle.state).toBe("normalized");
    expect(lifecycle.history).toHaveLength(2);
  });

  it("reaches auto verification when there are no blocking issues", () => {
    let lifecycle = createLifecycleRecord("normalized", "2026-07-22");
    lifecycle = advanceLifecycleThroughAutoVerification(lifecycle, "2026-07-22", false);

    expect(lifecycle.state).toBe("auto_verified");
  });

  it("publishes from auto verified state", () => {
    let lifecycle = createLifecycleRecord("auto_verified", "2026-07-22");
    lifecycle = advanceLifecycleToPublished(lifecycle, "2026-07-22");

    expect(lifecycle.state).toBe("published");
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionLifecycle("discovered", "published")).toBe(false);
    expect(() =>
      transitionLifecycle(createLifecycleRecord("discovered"), "published", "2026-07-22"),
    ).toThrow(/inválida/i);
  });
});
