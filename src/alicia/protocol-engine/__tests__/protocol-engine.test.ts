import { describe, expect, it } from "vitest";

import { AuditTrail } from "../audit-trail";
import { evaluateEvidence } from "../evidence-evaluator";
import { ProtocolEngine } from "../protocol-engine";
import { decidePublication } from "../publication-decision";
import { createCandidate, createEvidence, createMinimumEvidence } from "./fixtures";

describe("publication-decision", () => {
  it("retorna HUMAN_REVIEW quando CRM está ausente", () => {
    const candidate = createCandidate({ crm: "", crmStatus: "unknown" });
    const evidence = [
      createEvidence({
        id: "inst-1",
        name: "ICOT",
        type: "Instituição",
        level: 2,
        supportsFields: ["current_practice", "trajectory_milestone"],
      }),
      createEvidence({
        id: "inst-2",
        name: "Hospital Meridional",
        type: "Instituição",
        level: 2,
        supportsFields: ["current_practice"],
      }),
    ];
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("HUMAN_REVIEW");
    expect(decision.pendingRules.some((rule) => rule.id === "ELIG-002")).toBe(true);
  });

  it("retorna HUMAN_REVIEW quando residência não está confirmada", () => {
    const candidate = createCandidate({
      residency: [],
      graduation: { institution: "EMESCAM", verified: false },
    });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("HUMAN_REVIEW");
    expect(decision.pendingRules.some((rule) => rule.id === "FORM-002")).toBe(true);
  });

  it("retorna AUTO_PUBLISH para Nível B com residência confirmada e elegibilidade completa", () => {
    const candidate = createCandidate({
      graduation: { institution: "EMESCAM", verified: false },
      residency: [{ institution: "ICOT", program: "Ortopedia", verified: true }],
    });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("AUTO_PUBLISH");
    expect(decision.suggestedNivel).toBe("B");
  });

  it("retorna REJECT para especialidade fora do protocolo", () => {
    const candidate = createCandidate({ specialty: "Dermatologia" });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("REJECT");
    expect(decision.failedRules.some((rule) => rule.id === "ELIG-004")).toBe(true);
  });

  it("retorna HUMAN_REVIEW para conflito de identidade", () => {
    const candidate = createCandidate({ hasIdentityConflict: true });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("HUMAN_REVIEW");
    expect(decision.pendingRules.some((rule) => rule.id === "ELIG-012")).toBe(true);
  });

  it("retorna HUMAN_REVIEW para Nível A (quatro olhos)", () => {
    const candidate = createCandidate({
      graduation: { institution: "EMESCAM", verified: true },
      residency: [{ institution: "ICOT", program: "Ortopedia", verified: true }],
    });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("HUMAN_REVIEW");
    expect(decision.pendingRules.some((rule) => rule.id === "PUB-003")).toBe(true);
    expect(decision.suggestedNivel).toBe("A");
  });

  it("retorna REJECT com apenas fontes nível 6–7", () => {
    const candidate = createCandidate({ crm: "", rqe: undefined });
    const evidence = [
      createEvidence({
        id: "d1",
        name: "Doctoralia",
        type: "Diretório",
        level: 6,
        supportsFields: ["specialty"],
      }),
    ];
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    expect(decision.outcome).toBe("REJECT");
  });
});

describe("audit-trail", () => {
  it("registra decisões sem apagar histórico", () => {
    const trail = new AuditTrail();
    const engine = new ProtocolEngine({ auditTrail: trail, recordAudit: true });
    const candidate = createCandidate();
    const evidence = createMinimumEvidence();

    engine.evaluate(candidate, evidence);
    engine.evaluate(candidate, evidence);

    expect(trail.size).toBe(2);
    expect(trail.listByCandidate(candidate.id)).toHaveLength(2);
  });
});

describe("protocol-engine", () => {
  it("orquestra avaliação completa", () => {
    const engine = new ProtocolEngine({ recordAudit: false });
    const decision = engine.evaluate(createCandidate(), createMinimumEvidence());

    expect(decision.outcome).toBeDefined();
    expect(decision.satisfiedRules.length).toBeGreaterThan(0);
    expect(decision.justification.length).toBeGreaterThan(0);
  });
});
