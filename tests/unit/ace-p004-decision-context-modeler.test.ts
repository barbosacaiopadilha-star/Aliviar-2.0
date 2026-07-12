import { describe, expect, it } from "vitest";

import { createDecisionCase, type CreateDecisionCaseInput, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import { p003CaseAudit } from "@/modules/ace/protocols/p003-case-audit";
import { p004DecisionContextModeler, type P004Modeling } from "@/modules/ace/protocols/p004-decision-context-modeler";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildSimpleCaseInput(): CreateDecisionCaseInput {
  return {
    sourceNarrativeId: "narrative-1",
    decisionStatement: {
      decision: "Encontrar um profissional (psicólogo) para conversar sobre a ansiedade atual.",
      goal: "Ter um espaço de escuta para lidar com a ansiedade.",
      sourceType: "fato_relatado",
    },
    mandatoryConstraints: [],
    preferences: [],
    missingInformation: [],
  };
}

function buildComplexCaseInput(): CreateDecisionCaseInput {
  return {
    sourceNarrativeId: "narrative-2",
    decisionStatement: {
      decision: "Decidir se a cirurgia no joelho é realmente necessária.",
      goal: "Ter clareza e segurança antes de decidir.",
      sourceType: "fato_relatado",
    },
    mandatoryConstraints: [
      {
        description: "Não estar em recuperação durante a viagem de trabalho em 3 meses.",
        sourceType: "fato_relatado",
        originEvidence: { quote: "viagem de trabalho importante prevista para daqui a três meses", source: "narrativa" },
      },
    ],
    preferences: [],
    missingInformation: [],
  };
}

describe("P004 — Decision Context Modeler (transição P003 → P004)", () => {
  it("contexto simples: baixa complexidade, conexão direta", async () => {
    const decisionCase = createDecisionCase(buildSimpleCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const modeling: P004Modeling = {
      decisionType: "buscar_acompanhamento",
      objective: decisionCase.decisionStatement.goal,
      clinicalDomain: "saude_emocional_mental",
      complexity: "baixa",
      urgency: "nao_determinado",
      strategy: "conexao_direta",
      assumptions: ["Nenhuma restrição de tempo foi mencionada."],
      rationale: "Decisão clara, sem restrições, sem urgência sinalizada.",
    };

    const context = await p004DecisionContextModeler.execute({ decisionCase, caseAudit, modeling });

    expect(context.complexity).toBe("baixa");
    expect(context.strategy).toBe("conexao_direta");
    expect(context.urgency).toBe("nao_determinado");
  });

  it("contexto complexo: restrição de prazo gera urgência média e maior complexidade", async () => {
    const decisionCase = createDecisionCase(buildComplexCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const modeling: P004Modeling = {
      decisionType: "decidir_intervencao",
      objective: decisionCase.decisionStatement.goal,
      clinicalDomain: "saude_fisica",
      complexity: "media",
      urgency: "media",
      strategy: "avaliacao_inicial",
      assumptions: ["A restrição de viagem foi interpretada como urgência moderada, não alta."],
      rationale: "O cliente já tem uma dúvida específica e uma restrição de prazo concreta.",
    };

    const context = await p004DecisionContextModeler.execute({ decisionCase, caseAudit, modeling });

    expect(context.complexity).toBe("media");
    expect(context.urgency).toBe("media");
    expect(context.strategy).toBe("avaliacao_inicial");
    expect(context.clinicalDomain).toBe("saude_fisica");
  });

  it("nunca contém diagnóstico ou especialidade", async () => {
    const decisionCase = createDecisionCase(buildSimpleCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const context = await p004DecisionContextModeler.execute({
      decisionCase,
      caseAudit,
      modeling: {
        decisionType: "buscar_acompanhamento",
        objective: decisionCase.decisionStatement.goal,
        clinicalDomain: "saude_emocional_mental",
        complexity: "baixa",
        urgency: "nao_determinado",
        strategy: "conexao_direta",
        assumptions: [],
        rationale: "Decisão clara.",
      },
    });

    expect(context).not.toHaveProperty("diagnosis");
    expect(context).not.toHaveProperty("specialty");
    expect(context).not.toHaveProperty("competencies");
  });

  it("é imutável e nunca modifica o DecisionCase/CaseAudit auditados", async () => {
    const decisionCase: DecisionCase = createDecisionCase(buildSimpleCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });
    const caseSnapshot = JSON.stringify(decisionCase);
    const auditSnapshot = JSON.stringify(caseAudit);

    const context = await p004DecisionContextModeler.execute({
      decisionCase,
      caseAudit,
      modeling: {
        decisionType: "buscar_acompanhamento",
        objective: decisionCase.decisionStatement.goal,
        clinicalDomain: "saude_emocional_mental",
        complexity: "baixa",
        urgency: "nao_determinado",
        strategy: "conexao_direta",
        assumptions: [],
        rationale: "Decisão clara.",
      },
    });

    expect(JSON.stringify(decisionCase)).toBe(caseSnapshot);
    expect(JSON.stringify(caseAudit)).toBe(auditSnapshot);
    expect(() => {
      (context as { complexity: string }).complexity = "alta";
    }).toThrow();
  });

  it("rastreia o DecisionCase e a CaseAudit por id e versão em sourceArtifacts", async () => {
    const decisionCase = createDecisionCase(buildSimpleCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const context = await p004DecisionContextModeler.execute({
      decisionCase,
      caseAudit,
      modeling: {
        decisionType: "buscar_acompanhamento",
        objective: decisionCase.decisionStatement.goal,
        clinicalDomain: "saude_emocional_mental",
        complexity: "baixa",
        urgency: "nao_determinado",
        strategy: "conexao_direta",
        assumptions: [],
        rationale: "Decisão clara.",
      },
    });

    const caseRef = context.sourceArtifacts.find((ref) => ref.artifactType === "DecisionCase");
    const auditRef = context.sourceArtifacts.find((ref) => ref.artifactType === "CaseAudit");

    expect(caseRef).toEqual({
      artifactId: decisionCase.id,
      artifactVersion: decisionCase.version,
      artifactType: "DecisionCase",
    });
    expect(auditRef).toEqual({
      artifactId: caseAudit.id,
      artifactVersion: caseAudit.version,
      artifactType: "CaseAudit",
    });
  });

  it("rejeita a execução quando a CaseAudit está BLOCKED", async () => {
    const input = buildComplexCaseInput();
    input.decisionStatement = {
      decision: null,
      goal: input.decisionStatement.goal,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      { description: "A decisão do cliente ainda não está definida.", relatedField: "decision" },
    ];
    const decisionCase = createDecisionCase(input);
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    expect(caseAudit.status).toBe("BLOCKED");

    await expect(
      p004DecisionContextModeler.execute({
        decisionCase,
        caseAudit,
        modeling: {
          decisionType: "decidir_intervencao",
          objective: decisionCase.decisionStatement.goal,
          clinicalDomain: "saude_fisica",
          complexity: "alta",
          urgency: "media",
          strategy: "avaliacao_inicial",
          assumptions: [],
          rationale: "tentativa inválida",
        },
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("rejeita quando a CaseAudit não audita o DecisionCase fornecido", async () => {
    const decisionCaseA = createDecisionCase(buildSimpleCaseInput());
    const decisionCaseB = createDecisionCase(buildComplexCaseInput());
    const auditForB = await p003CaseAudit.execute({ decisionCase: decisionCaseB });

    await expect(
      p004DecisionContextModeler.execute({
        decisionCase: decisionCaseA,
        caseAudit: auditForB,
        modeling: {
          decisionType: "buscar_acompanhamento",
          objective: decisionCaseA.decisionStatement.goal,
          clinicalDomain: "saude_emocional_mental",
          complexity: "baixa",
          urgency: "nao_determinado",
          strategy: "conexao_direta",
          assumptions: [],
          rationale: "tentativa inválida",
        },
      }),
    ).rejects.toThrow(ProtocolError);
  });

  it("propaga mandatoryConstraints do DecisionCase sem criar ou interpretar (ADR-015)", async () => {
    const decisionCase = createDecisionCase(buildComplexCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const context = await p004DecisionContextModeler.execute({
      decisionCase,
      caseAudit,
      modeling: {
        decisionType: "decidir_intervencao",
        objective: decisionCase.decisionStatement.goal,
        clinicalDomain: "saude_fisica",
        complexity: "media",
        urgency: "media",
        strategy: "avaliacao_inicial",
        assumptions: [],
        rationale: "Decisão clara, com restrição de prazo concreta.",
      },
    });

    expect(context.mandatoryConstraints).toEqual(decisionCase.mandatoryConstraints);
  });

  it("propaga lista vazia de mandatoryConstraints quando o DecisionCase não tem nenhuma", async () => {
    const decisionCase = createDecisionCase(buildSimpleCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const context = await p004DecisionContextModeler.execute({
      decisionCase,
      caseAudit,
      modeling: {
        decisionType: "buscar_acompanhamento",
        objective: decisionCase.decisionStatement.goal,
        clinicalDomain: "saude_emocional_mental",
        complexity: "baixa",
        urgency: "nao_determinado",
        strategy: "conexao_direta",
        assumptions: [],
        rationale: "Decisão clara.",
      },
    });

    expect(context.mandatoryConstraints).toEqual([]);
  });

  it("rejeita campos proibidos", async () => {
    const decisionCase = createDecisionCase(buildSimpleCaseInput());
    const caseAudit = await p003CaseAudit.execute({ decisionCase });

    const modeling = {
      decisionType: "buscar_acompanhamento",
      objective: decisionCase.decisionStatement.goal,
      clinicalDomain: "saude_emocional_mental",
      complexity: "baixa",
      urgency: "nao_determinado",
      strategy: "conexao_direta",
      assumptions: [],
      rationale: "Decisão clara.",
      specialty: "psicologia",
    } as unknown as P004Modeling;

    await expect(p004DecisionContextModeler.execute({ decisionCase, caseAudit, modeling })).rejects.toThrow(
      /FORBIDDEN_FIELD_PRESENT|specialty/i,
    );
  });
});
