import { describe, expect, it } from "vitest";

import { createInitialStudioState } from "./mock-data";
import { evaluateCandidateProtocol, getStudioReviewCases } from "./protocol-bridge";

describe("protocol-bridge", () => {
  it("avalia candidatos do Studio via Protocol Engine", () => {
    const state = createInitialStudioState();
    const evaluation = evaluateCandidateProtocol(state.candidates[0]!);

    expect(evaluation.decision.outcome).toBeDefined();
    expect(typeof evaluation.isReviewCase).toBe("boolean");
  });

  it("lista review cases para exceções", () => {
    const state = createInitialStudioState();
    const reviewCases = getStudioReviewCases(state.candidates);

    expect(reviewCases.length).toBeGreaterThan(0);
    expect(reviewCases.every((item) => item.decision.outcome !== "AUTO_PUBLISH")).toBe(true);
  });
});
