import { describe, expect, it } from "vitest";

import {
  createEligibleProviderSet,
  type CreateEligibleProviderSetInput,
} from "@/modules/ace/artifacts/eligible-provider-set";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildValidInput(): CreateEligibleProviderSetInput {
  return {
    eligibleProviderIds: ["provider-A", "provider-E"],
    evaluatedCandidates: [
      { providerId: "provider-A", eligible: true, reason: "Atende a todos os requisitos." },
      { providerId: "provider-B", eligible: false, reason: "Foco incompatível." },
      { providerId: "provider-E", eligible: true, reason: "Atende a todos os requisitos." },
    ],
    sourceArtifacts: [
      { artifactId: "competency-profile-1", artifactVersion: 1, artifactType: "CompetencyProfile" },
    ],
    methodVersion: "ACE-0.1",
  };
}

describe("EligibleProviderSet", () => {
  it("é criado com decisional: false e producedBy: P006", () => {
    const set = createEligibleProviderSet(buildValidInput());

    expect(set.decisional).toBe(false);
    expect(set.producedBy).toBe("P006");
  });

  it("referencia o CompetencyProfile de origem", () => {
    const set = createEligibleProviderSet(buildValidInput());

    expect(set.sourceArtifacts).toEqual([
      { artifactId: "competency-profile-1", artifactVersion: 1, artifactType: "CompetencyProfile" },
    ]);
  });

  it("rejeita quando eligibleProviderIds não corresponde aos elegíveis em evaluatedCandidates", () => {
    const input = buildValidInput();
    input.eligibleProviderIds = ["provider-A"]; // falta provider-E, que é elegível

    expect(() => createEligibleProviderSet(input)).toThrow(ProtocolError);
  });

  it("rejeita ordem fora de ordem lexicográfica por providerId", () => {
    const input = buildValidInput();
    input.eligibleProviderIds = ["provider-E", "provider-A"]; // fora de ordem

    expect(() => createEligibleProviderSet(input)).toThrow(ProtocolError);
  });

  it("rejeita quando alguma avaliação não tem justificativa", () => {
    const input = buildValidInput();
    input.evaluatedCandidates[1].reason = "";

    expect(() => createEligibleProviderSet(input)).toThrow(ProtocolError);
  });

  it("rejeita campos proibidos", () => {
    const input = { ...buildValidInput(), compatibility: 0.9 } as unknown as CreateEligibleProviderSetInput;

    expect(() => createEligibleProviderSet(input)).toThrow(ProtocolError);

    try {
      createEligibleProviderSet(input);
    } catch (error) {
      expect((error as ProtocolError).code).toBe("FORBIDDEN_FIELD_PRESENT");
    }
  });

  it("aceita conjunto vazio de elegíveis quando nenhum candidato atende aos requisitos", () => {
    const input = buildValidInput();
    input.eligibleProviderIds = [];
    input.evaluatedCandidates = [
      { providerId: "provider-B", eligible: false, reason: "Foco incompatível." },
    ];

    const set = createEligibleProviderSet(input);

    expect(set.eligibleProviderIds).toEqual([]);
    expect(set.evaluatedCandidates).toHaveLength(1);
  });

  it("é imutável após criado", () => {
    const set = createEligibleProviderSet(buildValidInput());

    expect(() => {
      (set.eligibleProviderIds as unknown as string[]).push("provider-Z");
    }).toThrow();
  });
});
