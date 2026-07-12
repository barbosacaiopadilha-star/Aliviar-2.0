import { describe, expect, it } from "vitest";

import {
  createCompatibilityMatrix,
  type CreateCompatibilityMatrixInput,
  type DimensionResult,
} from "@/modules/ace/artifacts/compatibility-matrix";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildDimensionResult(overrides: Partial<DimensionResult> = {}): DimensionResult {
  return {
    classification: "STRONG",
    rationale: "Justificativa de teste.",
    evidence: ["Evidência de teste."],
    ...overrides,
  };
}

function buildValidInput(): CreateCompatibilityMatrixInput {
  return {
    entries: [
      {
        providerId: "provider-A",
        dimensionResults: {
          competencyAlignment: buildDimensionResult({ classification: "STRONG" }),
          experienceAlignment: buildDimensionResult({ classification: "ADEQUATE" }),
          contextAlignment: buildDimensionResult({ classification: "NOT_APPLICABLE", evidence: [] }),
          strategyAlignment: buildDimensionResult({ classification: "ADEQUATE" }),
          constraintAlignment: buildDimensionResult({ classification: "NOT_APPLICABLE", evidence: [] }),
          continuityAlignment: buildDimensionResult({ classification: "STRONG" }),
        },
        strengths: ["Forte alinhamento em competência."],
        limitations: [],
        missingInformation: [],
        rationale: "Avaliação de teste.",
      },
    ],
    sourceArtifacts: [
      { artifactId: "decision-context-1", artifactVersion: 1, artifactType: "DecisionContext" },
      { artifactId: "competency-profile-1", artifactVersion: 1, artifactType: "CompetencyProfile" },
      { artifactId: "eligible-set-1", artifactVersion: 1, artifactType: "EligibleProviderSet" },
    ],
    methodVersion: "ACE-0.1",
  };
}

describe("CompatibilityMatrix", () => {
  it("é criado com decisional: false e producedBy: P007 na matriz e em cada entrada", () => {
    const matrix = createCompatibilityMatrix(buildValidInput());

    expect(matrix.decisional).toBe(false);
    expect(matrix.producedBy).toBe("P007");
    expect(matrix.entries[0].producedBy).toBe("P007");
    expect(matrix.entries[0].version).toBe(1);
    expect(typeof matrix.entries[0].createdAt).toBe("string");
  });

  it("aceita legitimamente os campos de compatibilidade agora liberados (ADR-014)", () => {
    // Não deve exigir nenhuma exceção ad hoc — a política de campos já
    // libera esses nomes a partir do P007.
    expect(() => createCompatibilityMatrix(buildValidInput())).not.toThrow();
  });

  it("referencia os três artefatos de origem na matriz e em cada entrada", () => {
    const matrix = createCompatibilityMatrix(buildValidInput());

    expect(matrix.sourceArtifacts).toHaveLength(3);
    expect(matrix.entries[0].sourceArtifacts).toHaveLength(3);
    expect(matrix.sourceArtifacts.map((ref) => ref.artifactType)).toEqual([
      "DecisionContext",
      "CompetencyProfile",
      "EligibleProviderSet",
    ]);
  });

  it("rejeita quando falta rationale geral em uma entrada", () => {
    const input = buildValidInput();
    input.entries[0].rationale = "";

    expect(() => createCompatibilityMatrix(input)).toThrow(ProtocolError);
  });

  it("rejeita quando falta rationale em uma dimensão", () => {
    const input = buildValidInput();
    input.entries[0].dimensionResults.competencyAlignment.rationale = "";

    expect(() => createCompatibilityMatrix(input)).toThrow(ProtocolError);
  });

  it("rejeita classificação de dimensão fora da escala oficial", () => {
    const input = buildValidInput();
    (input.entries[0].dimensionResults.competencyAlignment as { classification: string }).classification = "85%";

    expect(() => createCompatibilityMatrix(input)).toThrow(ProtocolError);
  });

  it("rejeita provider duplicado em entries", () => {
    const input = buildValidInput();
    input.entries.push({ ...input.entries[0] });

    expect(() => createCompatibilityMatrix(input)).toThrow(ProtocolError);
  });

  it("rejeita campos reservados a um estágio posterior (ex.: shortlist, P008)", () => {
    const input = { ...buildValidInput(), shortlist: ["provider-A"] } as unknown as CreateCompatibilityMatrixInput;

    expect(() => createCompatibilityMatrix(input)).toThrow(ProtocolError);
  });

  it("rejeita campos proibidos do Kernel (ex.: diagnosis)", () => {
    const input = { ...buildValidInput(), diagnosis: "algo" } as unknown as CreateCompatibilityMatrixInput;

    expect(() => createCompatibilityMatrix(input)).toThrow(ProtocolError);
  });

  it("nunca contém campo de score, ranking ou percentual", () => {
    const matrix = createCompatibilityMatrix(buildValidInput());

    expect(matrix).not.toHaveProperty("score");
    expect(matrix).not.toHaveProperty("ranking");
    expect(matrix).not.toHaveProperty("percentage");
    expect(matrix.entries[0]).not.toHaveProperty("score");
    expect(matrix.entries[0]).not.toHaveProperty("rank");
  });

  it("é imutável após criado", () => {
    const matrix = createCompatibilityMatrix(buildValidInput());

    expect(() => {
      (matrix.entries as unknown as unknown[]).push({});
    }).toThrow();

    expect(() => {
      (matrix.entries[0] as unknown as { rationale: string }).rationale = "alterado";
    }).toThrow();
  });
});
