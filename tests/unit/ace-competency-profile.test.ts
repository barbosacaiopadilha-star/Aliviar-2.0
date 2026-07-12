import { describe, expect, it } from "vitest";

import {
  createCompetencyProfile,
  type CreateCompetencyProfileInput,
} from "@/modules/ace/artifacts/competency-profile";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildValidInput(): CreateCompetencyProfileInput {
  return {
    domain: "saude_emocional_mental",
    focus: "acompanhamento_continuo",
    experienceLevel: "geral",
    rationale: "Derivado deterministicamente do Contexto de Decisão.",
    assumptions: [],
    sourceArtifacts: [
      { artifactId: "decision-context-1", artifactVersion: 1, artifactType: "DecisionContext" },
    ],
    methodVersion: "ACE-0.1",
  };
}

describe("CompetencyProfile", () => {
  it("é criado com decisional: false estrutural", () => {
    const profile = createCompetencyProfile(buildValidInput());

    expect(profile.decisional).toBe(false);
  });

  it("referencia o DecisionContext de origem por id e versão", () => {
    const profile = createCompetencyProfile(buildValidInput());

    expect(profile.sourceArtifacts).toHaveLength(1);
    expect(profile.sourceArtifacts[0]).toEqual({
      artifactId: "decision-context-1",
      artifactVersion: 1,
      artifactType: "DecisionContext",
    });
  });

  it("rejeita campos proibidos", () => {
    const input = { ...buildValidInput(), specialty: "cardiologia" } as unknown as CreateCompetencyProfileInput;

    expect(() => createCompetencyProfile(input)).toThrow(ProtocolError);

    try {
      createCompetencyProfile(input);
    } catch (error) {
      expect((error as ProtocolError).code).toBe("FORBIDDEN_FIELD_PRESENT");
    }
  });

  it("exige rationale", () => {
    const input = buildValidInput();
    input.rationale = "";

    expect(() => createCompetencyProfile(input)).toThrow(ProtocolError);
  });

  it("exige ao menos uma referência em sourceArtifacts", () => {
    const input = buildValidInput();
    input.sourceArtifacts = [];

    expect(() => createCompetencyProfile(input)).toThrow(ProtocolError);
  });

  it("é imutável após criado", () => {
    const profile = createCompetencyProfile(buildValidInput());

    expect(() => {
      (profile as { experienceLevel: string }).experienceLevel = "altamente_experiente";
    }).toThrow();
  });

  it("rejeita 'compatibility' — reservado ao P007, produzido pelo P005", () => {
    const input = { ...buildValidInput(), compatibility: "STRONG" } as unknown as CreateCompetencyProfileInput;

    expect(() => createCompetencyProfile(input)).toThrow(ProtocolError);
  });
});
