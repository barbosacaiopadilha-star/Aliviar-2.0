import { describe, expect, it } from "vitest";

import { AuditTrail } from "../audit-trail";
import { classifySourceLevel, enrichEvidence } from "../source-levels";
import {
  ELIGIBILITY_RULES,
  FORMATION_RULES,
  PUBLICATION_RULES,
  executeRules,
} from "../rules";
import { evaluateEvidence } from "../evidence-evaluator";
import { createCandidate, createMinimumEvidence } from "./fixtures";

describe("rules — cenários adicionais", () => {
  it("rejeita ortopedia sem RQE ou TEOT", () => {
    const candidate = createCandidate({ specialty: "Ortopedia", rqe: "", teot: undefined });
    const evidence = createMinimumEvidence().filter((item) => !item.name.includes("RQE"));
    const report = evaluateEvidence(candidate, evidence);
    const result = ELIGIBILITY_RULES.find((rule) => rule.id === "ELIG-006")!.evaluate({
      candidate,
      evidence,
      evidenceReport: report,
    });

    expect(result.status).toBe("failed");
  });

  it("marca neuro sem RQE como pendente", () => {
    const candidate = createCandidate({ specialty: "Neurocirurgia", rqe: "", teot: undefined });
    const evidence = createMinimumEvidence().filter((item) => !item.name.includes("RQE"));
    const report = evaluateEvidence(candidate, evidence);
    const result = ELIGIBILITY_RULES.find((rule) => rule.id === "ELIG-007")!.evaluate({
      candidate,
      evidence,
      evidenceReport: report,
    });

    expect(result.status).toBe("pending");
  });

  it("detecta conflito de formação em graduação", () => {
    const candidate = createCandidate({
      graduation: { institution: "__PENDING_VERIFICATION__", verified: false },
    });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const result = FORMATION_RULES.find((rule) => rule.id === "FORM-001")!.evaluate({
      candidate,
      evidence,
      evidenceReport: report,
    });

    expect(result.status).toBe("pending");
  });

  it("executa regras de publicação com fontes insuficientes", () => {
    const candidate = createCandidate();
    const evidence = [createMinimumEvidence()[0]!];
    const report = evaluateEvidence(candidate, evidence);
    const results = executeRules(PUBLICATION_RULES, { candidate, evidence, evidenceReport: report });
    const pub001 = results.find((rule) => rule.id === "PUB-001");

    expect(pub001?.status).toBe("pending");
  });
});

describe("source-levels — cobertura complementar", () => {
  it("classifica Lattes e CNES", () => {
    expect(classifySourceLevel("Currículo Lattes", "Outras")).toBe(5);
    expect(classifySourceLevel("CNES – hospital", "Registro público")).toBe(4);
    expect(classifySourceLevel("Fonte desconhecida", "Outras")).toBe(7);
  });

  it("infere campos de sociedade médica pelo nome", () => {
    const evidence = enrichEvidence({
      id: "sbot",
      name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)",
      type: "Outras",
      consultedAt: "2026-07-22",
      responsible: "Operador",
    });

    expect(evidence.level).toBe(3);
    expect(evidence.supportsFields).toContain("specialty");
  });
});

describe("audit-trail — cobertura complementar", () => {
  it("lista entradas por candidato", () => {
    const trail = new AuditTrail();
    const candidate = createCandidate({ id: "audit-1" });
    const evidence = createMinimumEvidence();

    trail.record(candidate.id, candidate.caseId, {
      outcome: "HUMAN_REVIEW",
      eligibility: {
        outcome: "review_required",
        nivel: "B",
        satisfiedRules: [],
        failedRules: [],
        pendingRules: [],
        justification: "teste",
      },
      evidenceReport: evaluateEvidence(candidate, evidence),
      satisfiedRules: [],
      failedRules: [],
      pendingRules: [],
      suggestedNivel: "B",
      justification: "teste",
    }, evidence.map((item) => item.id));

    expect(trail.list()).toHaveLength(1);
    expect(trail.listByCandidate("audit-1")).toHaveLength(1);
    expect(trail.listByCandidate("outro")).toHaveLength(0);
  });
});
