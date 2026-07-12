import { describe, expect, it } from "vitest";

import { createDecisionCase, type CreateDecisionCaseInput, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import { p003CaseAudit } from "@/modules/ace/protocols/p003-case-audit";

function buildBaseInput(): CreateDecisionCaseInput {
  return {
    sourceNarrativeId: "narrative-1",
    decisionStatement: {
      decision: "Decidir se inicia um acompanhamento psicológico contínuo.",
      goal: "Sentir mais estabilidade emocional no dia a dia.",
      sourceType: "fato_relatado",
    },
    mandatoryConstraints: [],
    preferences: [],
    missingInformation: [],
  };
}

describe("P003 — Case Audit (transição P002 → P003)", () => {
  it("READY quando decisão e objetivo estão definidos e não há lacunas", async () => {
    const decisionCase = createDecisionCase(buildBaseInput());

    const audit = await p003CaseAudit.execute({ decisionCase });

    expect(audit.status).toBe("READY");
    expect(audit.blockingIssues).toHaveLength(0);
    expect(audit.warnings).toHaveLength(0);
  });

  it("READY_WITH_WARNINGS quando há uma lacuna não essencial (restrição opcional ausente)", async () => {
    const input = buildBaseInput();
    input.missingInformation = [
      {
        description: "Não ficou claro se o cliente já buscou algum tipo de apoio antes.",
        relatedField: "other",
      },
    ];
    const decisionCase = createDecisionCase(input);

    const audit = await p003CaseAudit.execute({ decisionCase });

    expect(audit.status).toBe("READY_WITH_WARNINGS");
    expect(audit.blockingIssues).toHaveLength(0);
    expect(audit.warnings).toHaveLength(1);
    expect(audit.warnings[0].category).toBe("insuficiencia");
    expect(audit.recommendedQuestions).toHaveLength(1);
  });

  it("BLOCKED quando a decisão principal está ausente", async () => {
    const input = buildBaseInput();
    input.decisionStatement = {
      decision: null,
      goal: input.decisionStatement.goal,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      { description: "A decisão do cliente ainda não está definida.", relatedField: "decision" },
    ];
    const decisionCase = createDecisionCase(input);

    const audit = await p003CaseAudit.execute({ decisionCase });

    expect(audit.status).toBe("BLOCKED");
    expect(audit.blockingIssues).toHaveLength(1);
    expect(audit.blockingIssues[0].category).toBe("ausencia");
  });

  it("BLOCKED quando o objetivo está ausente", async () => {
    const input = buildBaseInput();
    input.decisionStatement = {
      decision: input.decisionStatement.decision,
      goal: null,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      { description: "O objetivo do cliente ainda não está definido.", relatedField: "goal" },
    ];
    const decisionCase = createDecisionCase(input);

    const audit = await p003CaseAudit.execute({ decisionCase });

    expect(audit.status).toBe("BLOCKED");
    expect(audit.blockingIssues.some((issue) => issue.description.includes("objetivo"))).toBe(true);
  });

  it("narrativa insuficiente: decisão e objetivo ambos ausentes geram dois bloqueios", async () => {
    const input = buildBaseInput();
    input.decisionStatement = {
      decision: null,
      goal: null,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      { description: "A decisão do cliente ainda não está definida.", relatedField: "decision" },
      { description: "O objetivo do cliente ainda não está definido.", relatedField: "goal" },
    ];
    const decisionCase = createDecisionCase(input);

    const audit = await p003CaseAudit.execute({ decisionCase });

    expect(audit.status).toBe("BLOCKED");
    expect(audit.blockingIssues).toHaveLength(2);
    expect(audit.recommendedQuestions).toHaveLength(2);
  });

  it("informação contraditória (achado adicional) resulta em BLOCKED", async () => {
    const decisionCase = createDecisionCase(buildBaseInput());

    const audit = await p003CaseAudit.execute({
      decisionCase,
      additionalFindings: [
        {
          description: "Duas restrições obrigatórias relatadas parecem se contradizer quanto ao período disponível.",
          category: "contradicao",
          severity: "blocking",
          recommendedQuestion: "Você pode confirmar qual período realmente funciona para você?",
        },
      ],
    });

    expect(audit.status).toBe("BLOCKED");
    expect(audit.blockingIssues.some((issue) => issue.category === "contradicao")).toBe(true);
  });

  it("perguntas recomendadas são neutras e não indutivas", async () => {
    const input = buildBaseInput();
    input.decisionStatement = {
      decision: null,
      goal: input.decisionStatement.goal,
      sourceType: "inferencia_estrutural",
    };
    input.missingInformation = [
      { description: "A decisão do cliente ainda não está definida.", relatedField: "decision" },
    ];
    const decisionCase = createDecisionCase(input);

    const audit = await p003CaseAudit.execute({ decisionCase });

    for (const item of audit.recommendedQuestions) {
      expect(item.question).not.toMatch(/diagnóstic|especialidade|especialista|cirurgia|recomendo/i);
    }
  });

  it("nunca modifica o DecisionCase auditado", async () => {
    const decisionCase: DecisionCase = createDecisionCase(buildBaseInput());
    const snapshot = JSON.stringify(decisionCase);

    await p003CaseAudit.execute({ decisionCase });

    expect(JSON.stringify(decisionCase)).toBe(snapshot);
    expect(() => {
      (decisionCase as { version: number }).version = 99;
    }).toThrow();
  });

  it("rastreia o DecisionCase auditado por id e versão", async () => {
    const decisionCase = createDecisionCase(buildBaseInput());

    const audit = await p003CaseAudit.execute({ decisionCase });

    expect(audit.auditedArtifactId).toBe(decisionCase.id);
    expect(audit.auditedArtifactVersion).toBe(decisionCase.version);
  });

  it("nunca contém campos proibidos, mesmo vindos de um achado adicional malicioso", async () => {
    const decisionCase = createDecisionCase(buildBaseInput());

    await expect(
      p003CaseAudit.execute({
        decisionCase,
        additionalFindings: [
          {
            description: "teste",
            category: "ambiguidade",
            severity: "warning",
            recommendedQuestion: "teste?",
            // @ts-expect-error -- campo proibido injetado deliberadamente para o teste
            specialty: "cardiologia",
          },
        ],
      }),
    ).rejects.toThrow(/FORBIDDEN_FIELD_PRESENT|specialty/i);
  });
});
