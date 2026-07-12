import { describe, expect, it } from "vitest";

import { createCaseAudit, type CreateCaseAuditInput } from "@/modules/ace/artifacts/case-audit";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildReadyInput(): CreateCaseAuditInput {
  return {
    status: "READY",
    blockingIssues: [],
    warnings: [],
    missingInformation: [],
    recommendedQuestions: [],
    auditedArtifactId: "decision-case-1",
    auditedArtifactVersion: 1,
    methodVersion: "ACE-0.1",
  };
}

describe("CaseAudit", () => {
  it("aceita status READY quando não há bloqueios nem avisos", () => {
    const audit = createCaseAudit(buildReadyInput());

    expect(audit.status).toBe("READY");
  });

  it("rejeita status inconsistente com os achados", () => {
    const input = buildReadyInput();
    input.status = "BLOCKED"; // inconsistente: não há blockingIssues

    expect(() => createCaseAudit(input)).toThrow(ProtocolError);
  });

  it("exige exatamente uma pergunta recomendada por bloqueio/aviso", () => {
    const input = buildReadyInput();
    input.status = "BLOCKED";
    input.blockingIssues = [{ id: "issue-1", description: "Falta a decisão.", category: "ausencia" }];
    input.recommendedQuestions = []; // faltando a pergunta correspondente

    expect(() => createCaseAudit(input)).toThrow(ProtocolError);
  });

  it("rejeita pergunta recomendada que referencia um item inexistente", () => {
    const input = buildReadyInput();
    input.recommendedQuestions = [{ relatedIssueId: "issue-inexistente", question: "Pergunta órfã?" }];

    expect(() => createCaseAudit(input)).toThrow(ProtocolError);
  });

  it("rejeita campos proibidos", () => {
    const input = { ...buildReadyInput(), diagnosis: "algo" } as unknown as CreateCaseAuditInput;

    expect(() => createCaseAudit(input)).toThrow(ProtocolError);

    try {
      createCaseAudit(input);
    } catch (error) {
      expect((error as ProtocolError).code).toBe("FORBIDDEN_FIELD_PRESENT");
    }
  });

  it("referencia o artefato auditado por id e versão", () => {
    const audit = createCaseAudit(buildReadyInput());

    expect(audit.auditedArtifactId).toBe("decision-case-1");
    expect(audit.auditedArtifactVersion).toBe(1);
  });

  it("rejeita 'compatibility' — reservado ao P007, produzido pelo P003", () => {
    const input = { ...buildReadyInput(), compatibility: "STRONG" } as unknown as CreateCaseAuditInput;

    expect(() => createCaseAudit(input)).toThrow(ProtocolError);
  });
});
