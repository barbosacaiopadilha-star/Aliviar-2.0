import { describe, expect, it } from "vitest";

import { clearStoryCache, loadStoryCache, saveStoryCache } from "@/modules/story/storage";

describe("story storage — cache transitório (ADR-018, ambiente sem window)", () => {
  it("loadStoryCache retorna null quando não há window (SSR)", () => {
    expect(loadStoryCache("story-1")).toBeNull();
  });

  it("saveStoryCache não lança erro quando não há window (SSR)", () => {
    expect(() =>
      saveStoryCache({
        storyId: "story-1",
        revision: 1,
        data: { historia: "teste" },
        currentStep: "historia",
        savedAt: new Date().toISOString(),
        pending: true,
      }),
    ).not.toThrow();
  });

  it("clearStoryCache não lança erro quando não há window (SSR)", () => {
    expect(() => clearStoryCache("story-1")).not.toThrow();
  });
});
