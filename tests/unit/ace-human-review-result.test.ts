import { describe, expect, it } from "vitest";

import {
  createHumanReviewResult,
  type CreateHumanReviewResultInput,
} from "@/modules/ace/artifacts/human-review-result";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildApproveInput(): CreateHumanReviewResultInput {
  return {
    reviewerId: "reviewer-1",
    reviewedAt: "2026-07-12T00:00:00.000Z",
    reviewStatus: "VALIDATED",
    reviewAction: "APPROVE",
    originalShortlistReference: { artifactId: "shortlist-1", artifactVersion: 1, artifactType: "Shortlist" },
    compatibilityMatrixReference: { artifactId: "matrix-1", artifactVersion: 1, artifactType: "CompatibilityMatrix" },
    approvedProviderIds: ["provider-A", "provider-B", "provider-C"],
    changes: [],
    reviewRationale: "Composição adequada ao caso.",
    evidenceReferences: ["provider-A: competencyAlignment STRONG"],
    returnToProtocol: null,
    methodVersion: "ACE-0.1",
  };
}

function buildAdjustInput(): CreateHumanReviewResultInput {
  return {
    ...buildApproveInput(),
    reviewAction: "ADJUST",
    approvedProviderIds: ["provider-A", "provider-B", "provider-D"],
    changes: [
      { type: "removed", providerId: "provider-C", rationale: "Menos aderente ao caso.", evidenceReferences: ["provider-C: strategyAlignment PARTIAL"] },
      { type: "added", providerId: "provider-D", rationale: "Mais aderente ao caso.", evidenceReferences: ["provider-D: strategyAlignment STRONG"] },
    ],
  };
}

function buildRejectInput(): CreateHumanReviewResultInput {
  return {
    ...buildApproveInput(),
    reviewStatus: "REJECTED",
    reviewAction: "REJECT",
    approvedProviderIds: [],
    reviewRationale: "Nenhum dos providers atende ao caso.",
    evidenceReferences: [],
  };
}

function buildRequestInfoInput(): CreateHumanReviewResultInput {
  return {
    ...buildApproveInput(),
    reviewStatus: "INFORMATION_REQUESTED",
    reviewAction: "REQUEST_MORE_INFORMATION",
    approvedProviderIds: [],
    reviewRationale: "Faltam evidências para validar com responsabilidade.",
    evidenceReferences: [],
  };
}

describe("HumanReviewResult", () => {
  it("é criado com decisional: true e producedBy: P009", () => {
    const result = createHumanReviewResult(buildApproveInput());

    expect(result.decisional).toBe(true);
    expect(result.producedBy).toBe("P009");
  });

  it("aceita APPROVE válido", () => {
    expect(() => createHumanReviewResult(buildApproveInput())).not.toThrow();
  });

  it("aceita ADJUST válido, com changes detalhadas", () => {
    const result = createHumanReviewResult(buildAdjustInput());

    expect(result.changes).toHaveLength(2);
    expect(result.approvedProviderIds).toEqual(["provider-A", "provider-B", "provider-D"]);
  });

  it("aceita REJECT com approvedProviderIds vazio", () => {
    expect(() => createHumanReviewResult(buildRejectInput())).not.toThrow();
  });

  it("aceita REQUEST_MORE_INFORMATION com approvedProviderIds vazio", () => {
    expect(() => createHumanReviewResult(buildRequestInfoInput())).not.toThrow();
  });

  it("exige reviewerId", () => {
    const input = { ...buildApproveInput(), reviewerId: "" };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("exige reviewedAt", () => {
    const input = { ...buildApproveInput(), reviewedAt: "" };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("exige reviewRationale para toda ação, inclusive REJECT", () => {
    const input = { ...buildRejectInput(), reviewRationale: "" };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita reviewStatus inconsistente com reviewAction (ex.: APPROVE → REJECTED)", () => {
    const input = { ...buildApproveInput(), reviewStatus: "REJECTED" as const };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita VALIDATED com menos ou mais de três approvedProviderIds", () => {
    const tooFew = { ...buildApproveInput(), approvedProviderIds: ["provider-A", "provider-B"] };
    const tooMany = { ...buildApproveInput(), approvedProviderIds: ["provider-A", "provider-B", "provider-C", "provider-D"] };

    expect(() => createHumanReviewResult(tooFew)).toThrow(ProtocolError);
    expect(() => createHumanReviewResult(tooMany)).toThrow(ProtocolError);
  });

  it("rejeita REJECT/REQUEST_MORE_INFORMATION com approvedProviderIds não vazio", () => {
    const input = { ...buildRejectInput(), approvedProviderIds: ["provider-A", "provider-B", "provider-C"] };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita APPROVE com changes não vazio", () => {
    const input = {
      ...buildApproveInput(),
      changes: [{ type: "added" as const, providerId: "provider-D", rationale: "x", evidenceReferences: ["y"] }],
    };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita ADJUST sem nenhuma change registrada", () => {
    const input = { ...buildAdjustInput(), changes: [] };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita alteração sem justificativa", () => {
    const input = buildAdjustInput();
    input.changes[0].rationale = "";
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita alteração sem evidência", () => {
    const input = buildAdjustInput();
    input.changes[0].evidenceReferences = [];
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("exige evidenceReferences para VALIDATED (APPROVE/ADJUST)", () => {
    const input = { ...buildApproveInput(), evidenceReferences: [] };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("rejeita returnToProtocol preenchido quando VALIDATED", () => {
    const input = { ...buildApproveInput(), returnToProtocol: "P006" as const };
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("aceita returnToProtocol em REJECT", () => {
    const input = { ...buildRejectInput(), returnToProtocol: "P006" as const };
    expect(() => createHumanReviewResult(input)).not.toThrow();
  });

  it("rejeita campos proibidos do Kernel (ex.: finalDecision, selectedProvider)", () => {
    const input = { ...buildApproveInput(), finalDecision: "provider-A" } as unknown as CreateHumanReviewResultInput;
    expect(() => createHumanReviewResult(input)).toThrow(ProtocolError);
  });

  it("é imutável após criado", () => {
    const result = createHumanReviewResult(buildApproveInput());

    expect(() => {
      (result.approvedProviderIds as unknown as unknown[]).push("provider-Z");
    }).toThrow();
  });
});
