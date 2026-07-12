import { describe, expect, it } from "vitest";

import {
  createDecisionContext,
  type CreateDecisionContextInput,
} from "@/modules/ace/artifacts/decision-context";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildValidInput(): CreateDecisionContextInput {
  return {
    decisionType: "buscar_acompanhamento",
    objective: "Ter um espaço de escuta para lidar com a ansiedade.",
    clinicalDomain: "saude_emocional_mental",
    complexity: "baixa",
    urgency: "nao_determinado",
    strategy: "conexao_direta",
    mandatoryConstraints: [],
    assumptions: ["Nenhuma restrição de tempo foi mencionada."],
    rationale: "O cliente busca um espaço de conversa pontual, sem urgência sinalizada.",
    sourceArtifacts: [
      { artifactId: "decision-case-1", artifactVersion: 1, artifactType: "DecisionCase" },
      { artifactId: "case-audit-1", artifactVersion: 1, artifactType: "CaseAudit" },
    ],
    methodVersion: "ACE-0.1",
  };
}

describe("DecisionContext", () => {
  it("é criado com referência aos artefatos de origem, por id e versão", () => {
    const context = createDecisionContext(buildValidInput());

    expect(context.sourceArtifacts).toHaveLength(2);
    expect(context.sourceArtifacts[0].artifactType).toBe("DecisionCase");
  });

  it("rejeita clinicalDomain fora do conjunto fechado (nunca especialidade médica)", () => {
    const input = buildValidInput();
    input.clinicalDomain = "cardiologia" as CreateDecisionContextInput["clinicalDomain"];

    expect(() => createDecisionContext(input)).toThrow(ProtocolError);
  });

  it("rejeita campos proibidos", () => {
    const input = { ...buildValidInput(), diagnosis: "algo" } as unknown as CreateDecisionContextInput;

    expect(() => createDecisionContext(input)).toThrow(ProtocolError);

    try {
      createDecisionContext(input);
    } catch (error) {
      expect((error as ProtocolError).code).toBe("FORBIDDEN_FIELD_PRESENT");
    }
  });

  it("exige rationale", () => {
    const input = buildValidInput();
    input.rationale = "";

    expect(() => createDecisionContext(input)).toThrow(ProtocolError);
  });

  it("exige ao menos uma referência em sourceArtifacts", () => {
    const input = buildValidInput();
    input.sourceArtifacts = [];

    expect(() => createDecisionContext(input)).toThrow(ProtocolError);
  });

  it("é imutável após criado", () => {
    const context = createDecisionContext(buildValidInput());

    expect(() => {
      (context as { complexity: string }).complexity = "alta";
    }).toThrow();

    expect(() => {
      (context.assumptions as unknown as unknown[]).push("nova premissa");
    }).toThrow();
  });

  it("preserva mandatoryConstraints tal como recebido (ADR-015), sem reinterpretar", () => {
    const input = buildValidInput();
    input.mandatoryConstraints = [
      {
        description: "Não pode ser presencial.",
        sourceType: "fato_relatado",
        originEvidence: { quote: "só posso por vídeo", source: "narrativa" },
      },
    ];

    const context = createDecisionContext(input);

    expect(context.mandatoryConstraints).toEqual(input.mandatoryConstraints);
  });

  it("rejeita 'compatibilityMatrix' — reservado ao P007, produzido pelo P004", () => {
    const input = {
      ...buildValidInput(),
      compatibilityMatrix: {},
    } as unknown as CreateDecisionContextInput;

    expect(() => createDecisionContext(input)).toThrow(ProtocolError);
  });
});
