import { describe, expect, it } from "vitest";

import {
  createDecisionCase,
  reviseDecisionCase,
  type CreateDecisionCaseInput,
} from "@/modules/ace/artifacts/decision-case";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { findKernelViolations } from "@/modules/ace/core/field-policy";

function buildValidInput(): CreateDecisionCaseInput {
  return {
    sourceNarrativeId: "narrative-123",
    decisionStatement: {
      decision: "Decidir se a cirurgia no joelho é realmente necessária.",
      goal: "Ter clareza e segurança antes de decidir.",
      sourceType: "fato_relatado",
      originEvidence: { quote: "Sua principal dúvida é decidir se a cirurgia é realmente necessária.", source: "narrativa" },
    },
    mandatoryConstraints: [
      {
        description: "Não estar em recuperação durante a viagem de trabalho.",
        sourceType: "fato_relatado",
        originEvidence: { quote: "uma viagem de trabalho importante prevista para daqui a três meses", source: "narrativa" },
      },
    ],
    preferences: [],
    missingInformation: [],
  };
}

describe("DecisionCase", () => {
  it("é criado com sourceNarrativeId como referência, nunca cópia do texto", () => {
    const decisionCase = createDecisionCase(buildValidInput());

    expect(decisionCase.sourceNarrativeId).toBe("narrative-123");
    expect(decisionCase).not.toHaveProperty("sourceNarrativeText");
  });

  it("marca cada restrição com fato_relatado ou inferencia_estrutural e evidência de origem", () => {
    const decisionCase = createDecisionCase(buildValidInput());

    expect(decisionCase.mandatoryConstraints[0].sourceType).toBe("fato_relatado");
    expect(decisionCase.mandatoryConstraints[0].originEvidence.quote).toBeTruthy();
  });

  it("rejeita a construção quando um campo proibido está presente", () => {
    const input = buildValidInput();
    const withForbidden = { ...input, diagnosis: "algo" } as unknown as CreateDecisionCaseInput;

    expect(() => createDecisionCase(withForbidden)).toThrow(ProtocolError);

    try {
      createDecisionCase(withForbidden);
    } catch (error) {
      expect((error as ProtocolError).code).toBe("FORBIDDEN_FIELD_PRESENT");
    }
  });

  it("detecta campos proibidos do Kernel aninhados (findKernelViolations)", () => {
    const candidate = {
      decisionStatement: { decision: "x", goal: "y", confidence: 0.9 },
    };

    expect(findKernelViolations(candidate)).toContain("confidence");
  });

  it("detecta 'compatibility' como violação do Kernel quando produzido antes do P007", () => {
    const input = { ...buildValidInput(), compatibility: "STRONG" } as unknown as CreateDecisionCaseInput;

    expect(() => createDecisionCase(input)).toThrow(ProtocolError);
  });

  it("registra informação ausente como null (nunca string vazia) quando a decisão não está clara", () => {
    const input = buildValidInput();
    input.decisionStatement = {
      decision: null,
      goal: input.decisionStatement.goal,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      {
        description: "A decisão específica que o cliente precisa tomar ainda não está definida.",
        relatedField: "decision",
      },
    ];

    const decisionCase = createDecisionCase(input);

    expect(decisionCase.decisionStatement.decision).toBeNull();
    expect(decisionCase.missingInformation).toHaveLength(1);
    expect(decisionCase.missingInformation[0].relatedField).toBe("decision");
  });

  it("rejeita decision null sem a entrada correspondente em missingInformation", () => {
    const input = buildValidInput();
    input.decisionStatement = {
      decision: null,
      goal: input.decisionStatement.goal,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [];

    expect(() => createDecisionCase(input)).toThrow(ProtocolError);
  });

  it("rejeita goal null sem a entrada correspondente em missingInformation", () => {
    const input = buildValidInput();
    input.decisionStatement = {
      decision: input.decisionStatement.decision,
      goal: null,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      { description: "Alguma outra lacuna, não relacionada ao objetivo.", relatedField: "other" },
    ];

    expect(() => createDecisionCase(input)).toThrow(ProtocolError);
  });

  it("é imutável após criado", () => {
    const decisionCase = createDecisionCase(buildValidInput());

    expect(() => {
      (decisionCase as { version: number }).version = 99;
    }).toThrow();

    expect(() => {
      (decisionCase.mandatoryConstraints as unknown as unknown[]).push({});
    }).toThrow();
  });

  it("cria versão inicial 1 e não sobrescreve ao revisar", () => {
    const v1 = createDecisionCase(buildValidInput());
    expect(v1.version).toBe(1);
    expect(v1.previousVersionId).toBeUndefined();

    const revisedInput = buildValidInput();
    revisedInput.preferences = [
      {
        description: "Prefere manter a folga de trabalho já agendada.",
        sourceType: "fato_relatado",
        originEvidence: { quote: "não gostaria de estar em recuperação", source: "narrativa" },
      },
    ];

    const v2 = reviseDecisionCase(v1, revisedInput);

    expect(v2.version).toBe(2);
    expect(v2.previousVersionId).toBe(v1.id);
    expect(v1.preferences).toHaveLength(0);
    expect(v2.preferences).toHaveLength(1);
  });
});
