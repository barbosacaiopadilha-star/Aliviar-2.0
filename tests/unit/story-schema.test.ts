import { describe, expect, it } from "vitest";

import {
  saveStoryDraftInputSchema,
  submitStoryInputSchema,
  suaHistoriaPatchSchema,
} from "@/modules/story/schema";

describe("suaHistoriaPatchSchema", () => {
  it("aceita um patch parcial válido", () => {
    expect(suaHistoriaPatchSchema.safeParse({ motivo: "ansiedade" }).success).toBe(true);
    expect(suaHistoriaPatchSchema.safeParse({}).success).toBe(true);
  });

  it("rejeita valores fora do enum", () => {
    expect(suaHistoriaPatchSchema.safeParse({ paraQuem: "outro-valor" }).success).toBe(false);
    expect(suaHistoriaPatchSchema.safeParse({ preferenciaModalidade: "hibrido" }).success).toBe(false);
  });

  it("rejeita texto longo demais", () => {
    expect(suaHistoriaPatchSchema.safeParse({ historia: "a".repeat(5001) }).success).toBe(false);
    expect(suaHistoriaPatchSchema.safeParse({ historia: "a".repeat(5000) }).success).toBe(true);
  });
});

describe("saveStoryDraftInputSchema", () => {
  const base = {
    storyId: "123e4567-e89b-12d3-a456-426614174000",
    expectedRevision: 1,
    patch: { motivo: "ansiedade" },
    currentStep: "motivo",
  };

  it("aceita um input válido", () => {
    expect(saveStoryDraftInputSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita currentStep fora do wizard", () => {
    expect(saveStoryDraftInputSchema.safeParse({ ...base, currentStep: "outra-coisa" }).success).toBe(false);
  });

  it("rejeita revision não positiva", () => {
    expect(saveStoryDraftInputSchema.safeParse({ ...base, expectedRevision: 0 }).success).toBe(false);
  });

  it("rejeita storyId que não é uuid", () => {
    expect(saveStoryDraftInputSchema.safeParse({ ...base, storyId: "abc" }).success).toBe(false);
  });
});

describe("submitStoryInputSchema", () => {
  it("aceita storyId + expectedRevision válidos", () => {
    expect(
      submitStoryInputSchema.safeParse({
        storyId: "123e4567-e89b-12d3-a456-426614174000",
        expectedRevision: 3,
      }).success,
    ).toBe(true);
  });
});
