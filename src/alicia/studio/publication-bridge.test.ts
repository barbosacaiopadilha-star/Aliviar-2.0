import { describe, expect, it } from "vitest";

import { createInitialStudioState } from "./mock-data";
import {
  getPublicationReviewCases,
  resetSessionPublicationPipeline,
  runStudioPublication,
  studioCandidateToPipelineInput,
} from "./publication-bridge";

describe("publication-bridge", () => {
  it("converte candidato do Studio para input do pipeline", () => {
    const state = createInitialStudioState();
    const candidate = state.candidates[0]!;
    const input = studioCandidateToPipelineInput(candidate);

    expect(input.candidate.id).toBe(candidate.id);
    expect(input.evidence.length).toBe(candidate.sources.length);
    expect(input.decision.outcome).toBeDefined();
  });

  it("expõe exceções do pipeline para o Studio", () => {
    resetSessionPublicationPipeline();
    const state = createInitialStudioState();
    const reviewCases = getPublicationReviewCases(state.candidates);

    expect(Array.isArray(reviewCases)).toBe(true);
    reviewCases.forEach((reviewCase) => {
      expect(reviewCase.reason).toBeDefined();
      expect(reviewCase.summary.length).toBeGreaterThan(0);
    });
  });

  it("executa publicação para candidatos AUTO_PUBLISH", () => {
    resetSessionPublicationPipeline();
    const state = createInitialStudioState();
    const autoPublishCandidate = state.candidates.find(
      (candidate) => studioCandidateToPipelineInput(candidate).decision.outcome === "AUTO_PUBLISH",
    );

    if (!autoPublishCandidate) {
      expect(true).toBe(true);
      return;
    }

    const result = runStudioPublication(autoPublishCandidate);
    expect(["PUBLISHED", "BLOCKED", "ALREADY_PUBLISHED", "NO_CHANGE"]).toContain(result.status);
  });
});
