import { describe, expect, it } from "vitest";

import {
  addCaseNoteInputSchema,
  changeCaseStatusInputSchema,
  createCaseInputSchema,
  reassignCuratorInputSchema,
} from "@/modules/cases/schema";

const uuid = "123e4567-e89b-12d3-a456-426614174000";

describe("createCaseInputSchema", () => {
  it("aceita storyId sozinho (curador ainda não atribuído)", () => {
    expect(createCaseInputSchema.safeParse({ storyId: uuid }).success).toBe(true);
  });

  it("aceita storyId + assignedCuratorId", () => {
    expect(createCaseInputSchema.safeParse({ storyId: uuid, assignedCuratorId: uuid }).success).toBe(true);
  });

  it("rejeita storyId inválido", () => {
    expect(createCaseInputSchema.safeParse({ storyId: "abc" }).success).toBe(false);
  });
});

describe("reassignCuratorInputSchema", () => {
  it("aceita reatribuição para ninguém (null) com justificativa", () => {
    expect(
      reassignCuratorInputSchema.safeParse({ caseId: uuid, newCuratorId: null, reason: "Curador de férias" })
        .success,
    ).toBe(true);
  });

  it("rejeita justificativa longa demais", () => {
    expect(
      reassignCuratorInputSchema.safeParse({ caseId: uuid, newCuratorId: uuid, reason: "a".repeat(501) }).success,
    ).toBe(false);
  });
});

describe("changeCaseStatusInputSchema", () => {
  it("aceita um status válido do enum", () => {
    expect(changeCaseStatusInputSchema.safeParse({ caseId: uuid, nextStatus: "IN_REVIEW" }).success).toBe(true);
  });

  it("rejeita status fora do enum", () => {
    expect(changeCaseStatusInputSchema.safeParse({ caseId: uuid, nextStatus: "INVENTADO" }).success).toBe(false);
  });
});

describe("addCaseNoteInputSchema", () => {
  it("rejeita nota vazia (append-only não admite nota em branco)", () => {
    expect(addCaseNoteInputSchema.safeParse({ caseId: uuid, body: "" }).success).toBe(false);
    expect(addCaseNoteInputSchema.safeParse({ caseId: uuid, body: "   " }).success).toBe(false);
  });

  it("aceita uma nota com conteúdo", () => {
    expect(addCaseNoteInputSchema.safeParse({ caseId: uuid, body: "Paciente retornou contato." }).success).toBe(true);
  });

  it("rejeita nota longa demais", () => {
    expect(addCaseNoteInputSchema.safeParse({ caseId: uuid, body: "a".repeat(2001) }).success).toBe(false);
  });
});
