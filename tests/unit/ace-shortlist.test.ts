import { describe, expect, it } from "vitest";

import { createShortlist, type CreateShortlistInput } from "@/modules/ace/artifacts/shortlist";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildComposedInput(): CreateShortlistInput {
  return {
    status: "COMPOSED",
    blockedReason: null,
    selectedProviderIds: ["provider-A", "provider-B", "provider-C"],
    candidateProviderIds: [],
    providerRationales: [
      { providerId: "provider-A", rationale: "Justificativa A." },
      { providerId: "provider-B", rationale: "Justificativa B." },
      { providerId: "provider-C", rationale: "Justificativa C." },
    ],
    compositionRationale: "Os três atendem aos requisitos essenciais.",
    relevantLimitations: [],
    missingInformation: [],
    sourceArtifact: { artifactId: "matrix-1", artifactVersion: 1, artifactType: "CompatibilityMatrix" },
    methodVersion: "ACE-0.1",
  };
}

function buildBlockedInput(): CreateShortlistInput {
  return {
    status: "BLOCKED",
    blockedReason: "INSUFFICIENT_EVIDENCE",
    selectedProviderIds: [],
    candidateProviderIds: ["provider-A"],
    providerRationales: [{ providerId: "provider-A", rationale: "Justificativa A." }],
    compositionRationale: "Apenas 1 de 4 providers atendem aos requisitos essenciais.",
    relevantLimitations: [],
    missingInformation: [],
    sourceArtifact: { artifactId: "matrix-1", artifactVersion: 1, artifactType: "CompatibilityMatrix" },
    methodVersion: "ACE-0.1",
  };
}

function buildAmbiguousInput(): CreateShortlistInput {
  return {
    status: "BLOCKED",
    blockedReason: "AMBIGUOUS_COMPOSITION",
    selectedProviderIds: [],
    candidateProviderIds: ["provider-A", "provider-B", "provider-C", "provider-D"],
    providerRationales: [
      { providerId: "provider-A", rationale: "Justificativa A." },
      { providerId: "provider-B", rationale: "Justificativa B." },
      { providerId: "provider-C", rationale: "Justificativa C." },
      { providerId: "provider-D", rationale: "Justificativa D." },
    ],
    compositionRationale: "4 providers atendem igualmente, sem critério legítimo de desempate.",
    relevantLimitations: [],
    missingInformation: [],
    sourceArtifact: { artifactId: "matrix-1", artifactVersion: 1, artifactType: "CompatibilityMatrix" },
    methodVersion: "ACE-0.1",
  };
}

describe("Shortlist", () => {
  it("é criada com decisional: false e producedBy: P008", () => {
    const shortlist = createShortlist(buildComposedInput());

    expect(shortlist.decisional).toBe(false);
    expect(shortlist.producedBy).toBe("P008");
  });

  it("aceita um resultado BLOCKED (INSUFFICIENT_EVIDENCE) sem providers selecionados", () => {
    expect(() => createShortlist(buildBlockedInput())).not.toThrow();
  });

  it("aceita um resultado BLOCKED (AMBIGUOUS_COMPOSITION) preservando todos os candidatos aptos", () => {
    const shortlist = createShortlist(buildAmbiguousInput());

    expect(shortlist.candidateProviderIds).toHaveLength(4);
    expect(shortlist.providerRationales).toHaveLength(4);
  });

  it("rejeita COMPOSED com menos de três providers", () => {
    const input = buildComposedInput();
    input.selectedProviderIds = ["provider-A", "provider-B"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita COMPOSED com mais de três providers (deveria ser BLOCKED/AMBIGUOUS_COMPOSITION)", () => {
    const input = buildComposedInput();
    input.selectedProviderIds = ["provider-A", "provider-B", "provider-C", "provider-D"];
    input.providerRationales.push({ providerId: "provider-D", rationale: "Justificativa D." });

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita COMPOSED com providers duplicados", () => {
    const input = buildComposedInput();
    input.selectedProviderIds = ["provider-A", "provider-A", "provider-B"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita COMPOSED fora de ordem neutra (providerId)", () => {
    const input = buildComposedInput();
    input.selectedProviderIds = ["provider-C", "provider-A", "provider-B"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita COMPOSED com candidateProviderIds não vazio", () => {
    const input = buildComposedInput();
    input.candidateProviderIds = ["provider-D"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita COMPOSED com blockedReason preenchido", () => {
    const input = buildComposedInput();
    input.blockedReason = "AMBIGUOUS_COMPOSITION";

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita COMPOSED sem justificativa individual para um provider selecionado", () => {
    const input = buildComposedInput();
    input.providerRationales = input.providerRationales.filter((r) => r.providerId !== "provider-B");

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita BLOCKED com providers selecionados", () => {
    const input = buildBlockedInput();
    input.selectedProviderIds = ["provider-A"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita BLOCKED sem blockedReason", () => {
    const input = buildBlockedInput();
    input.blockedReason = null;

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita BLOCKED com candidateProviderIds duplicados", () => {
    const input = buildAmbiguousInput();
    input.candidateProviderIds = ["provider-A", "provider-A", "provider-B", "provider-C"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita BLOCKED com candidateProviderIds fora de ordem neutra", () => {
    const input = buildAmbiguousInput();
    input.candidateProviderIds = ["provider-D", "provider-A", "provider-B", "provider-C"];

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita BLOCKED sem justificativa individual para um candidato preservado", () => {
    const input = buildAmbiguousInput();
    input.providerRationales = input.providerRationales.filter((r) => r.providerId !== "provider-C");

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("exige compositionRationale não vazio", () => {
    const input = buildComposedInput();
    input.compositionRationale = "";

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("exige sourceArtifact", () => {
    const input = { ...buildComposedInput(), sourceArtifact: undefined } as unknown as CreateShortlistInput;

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("rejeita campos reservados ao P009/P010 (validationDecision, finalCuradoria)", () => {
    const inputWithP009Field = { ...buildComposedInput(), validationDecision: "aprovado" } as unknown as CreateShortlistInput;
    const inputWithP010Field = { ...buildComposedInput(), finalCuradoria: {} } as unknown as CreateShortlistInput;

    expect(() => createShortlist(inputWithP009Field)).toThrow(ProtocolError);
    expect(() => createShortlist(inputWithP010Field)).toThrow(ProtocolError);
  });

  it("rejeita campos proibidos do Kernel (ex.: selectedProvider, finalDecision)", () => {
    const input = { ...buildComposedInput(), selectedProvider: "provider-A" } as unknown as CreateShortlistInput;

    expect(() => createShortlist(input)).toThrow(ProtocolError);
  });

  it("nunca contém campo de score, ranking ou vencedor", () => {
    const shortlist = createShortlist(buildComposedInput());

    expect(shortlist).not.toHaveProperty("score");
    expect(shortlist).not.toHaveProperty("ranking");
    expect(shortlist).not.toHaveProperty("winner");
  });

  it("é imutável após criada", () => {
    const shortlist = createShortlist(buildComposedInput());

    expect(() => {
      (shortlist.selectedProviderIds as unknown as unknown[]).push("provider-Z");
    }).toThrow();
  });
});
