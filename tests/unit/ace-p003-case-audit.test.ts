import { describe, expect, it } from "vitest";

import { createDecisionCase, type CreateDecisionCaseInput, type DecisionCase } from "@/modules/ace/artifacts/decision-case";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import { p003CaseAudit, type P003AdditionalFinding } from "@/modules/ace/protocols/p003-case-audit";

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
          relatedField: "other",
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
            relatedField: "other",
            // @ts-expect-error -- campo proibido injetado deliberadamente para o teste
            specialty: "cardiologia",
          },
        ],
      }),
    ).rejects.toThrow(/FORBIDDEN_FIELD_PRESENT|specialty/i);
  });
});

// ADR-024 (docs/DECISIONS.md) — Content Invariant do P003: um achado de
// ausência/insuficiência sobre restrição prática opcional (relatedField:
// "other") nunca pode ter severity "blocking". Cobre a matriz de testes
// unitários prevista na ADR (seção 8).
describe("P003 — Content Invariant (ADR-024)", () => {
  function buildCleanDecisionCase(): DecisionCase {
    return createDecisionCase(buildBaseInput());
  }

  it("ausência de restrição prática (relatedField: other) + warning → aceita, vira Warning", async () => {
    const decisionCase = buildCleanDecisionCase();

    const audit = await p003CaseAudit.execute({
      decisionCase,
      additionalFindings: [
        {
          description: "Não ficou claro qual a modalidade de atendimento preferida.",
          category: "ausencia",
          severity: "warning",
          recommendedQuestion: "Você tem preferência entre atendimento presencial ou por vídeo?",
          relatedField: "other",
        },
      ],
    });

    expect(audit.status).toBe("READY_WITH_WARNINGS");
    expect(audit.blockingIssues).toHaveLength(0);
    expect(audit.warnings).toHaveLength(1);
  });

  it("ausência de restrição prática (relatedField: other) + blocking → rejeita com CONTENT_INVARIANT_VIOLATION", async () => {
    const decisionCase = buildCleanDecisionCase();

    await expect(
      p003CaseAudit.execute({
        decisionCase,
        additionalFindings: [
          {
            description: "Não ficou claro qual a localização preferida para o atendimento.",
            category: "ausencia",
            severity: "blocking",
            recommendedQuestion: "Você tem preferência de localização para o atendimento?",
            relatedField: "other",
          },
        ],
      }),
    ).rejects.toMatchObject({ name: "ProtocolError", code: "CONTENT_INVARIANT_VIOLATION" });
  });

  it("insuficiência de restrição prática (relatedField: other) + blocking → rejeita com CONTENT_INVARIANT_VIOLATION", async () => {
    const decisionCase = buildCleanDecisionCase();

    const execute = () =>
      p003CaseAudit.execute({
        decisionCase,
        additionalFindings: [
          {
            description: "A informação sobre orçamento disponível está incompleta.",
            category: "insuficiencia",
            severity: "blocking",
            recommendedQuestion: "Você poderia detalhar o orçamento disponível?",
            relatedField: "other",
          },
        ],
      });

    await expect(execute()).rejects.toThrow(ProtocolError);
    await expect(execute()).rejects.toMatchObject({ code: "CONTENT_INVARIANT_VIOLATION" });
  });

  it("contradição real + blocking → aceita (comportamento inalterado pelo invariant)", async () => {
    const decisionCase = buildCleanDecisionCase();

    const audit = await p003CaseAudit.execute({
      decisionCase,
      additionalFindings: [
        {
          description: "Duas preferências relatadas se contradizem quanto à modalidade de atendimento.",
          category: "contradicao",
          severity: "blocking",
          recommendedQuestion: "Você pode esclarecer qual modalidade de atendimento prefere?",
          relatedField: "other",
        },
      ],
    });

    expect(audit.status).toBe("BLOCKED");
  });

  it("ambiguidade bloqueante + relatedField other → aceita (fora do escopo deste invariant)", async () => {
    const decisionCase = buildCleanDecisionCase();

    const audit = await p003CaseAudit.execute({
      decisionCase,
      additionalFindings: [
        {
          description: "Não é possível determinar com clareza a que a restrição relatada se refere.",
          category: "ambiguidade",
          severity: "blocking",
          recommendedQuestion: "Você pode esclarecer a que essa restrição se refere?",
          relatedField: "other",
        },
      ],
    });

    expect(audit.status).toBe("BLOCKED");
  });

  it("múltiplos achados, um inválido entre válidos → toda a resposta é rejeitada (nunca aceitação parcial)", async () => {
    const decisionCase = buildCleanDecisionCase();
    const findings: P003AdditionalFinding[] = [
      {
        description: "Duas preferências relatadas se contradizem quanto à modalidade de atendimento.",
        category: "contradicao",
        severity: "blocking",
        recommendedQuestion: "Você pode esclarecer qual modalidade de atendimento prefere?",
        relatedField: "other",
      },
      {
        description: "Não ficou claro qual o horário preferido para o atendimento.",
        category: "ausencia",
        severity: "blocking",
        relatedField: "other",
        recommendedQuestion: "Você tem preferência de horário para o atendimento?",
      },
    ];

    await expect(
      p003CaseAudit.execute({ decisionCase, additionalFindings: findings }),
    ).rejects.toMatchObject({ code: "CONTENT_INVARIANT_VIOLATION" });
  });

  it("achado rejeitado não sofre nenhuma mutação — é apenas descartado com exceção", async () => {
    const decisionCase = buildCleanDecisionCase();
    const findings: P003AdditionalFinding[] = [
      {
        description: "Não ficou claro qual o orçamento disponível.",
        category: "ausencia",
        severity: "blocking",
        recommendedQuestion: "Você poderia compartilhar o orçamento disponível?",
        relatedField: "other",
      },
    ];
    const snapshot = JSON.stringify(findings);

    await expect(p003CaseAudit.execute({ decisionCase, additionalFindings: findings })).rejects.toThrow();

    expect(JSON.stringify(findings)).toBe(snapshot);
  });
});
