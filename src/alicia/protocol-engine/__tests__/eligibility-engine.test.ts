import { describe, expect, it } from "vitest";

import { evaluateEligibility } from "../eligibility-engine";
import { evaluateEvidence } from "../evidence-evaluator";
import { ELIGIBILITY_RULES, executeRules, partitionRuleResults } from "../rules";
import { createCandidate, createEvidence, createMinimumEvidence } from "./fixtures";

describe("eligibility-engine", () => {
  it("retorna elegível para candidato completo", () => {
    const candidate = createCandidate();
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const result = evaluateEligibility(candidate, evidence, report);

    expect(result.outcome).toBe("eligible");
    expect(["A", "B"]).toContain(result.nivel);
    expect(result.failedRules).toHaveLength(0);
  });

  it("retorna não elegível para especialidade fora do escopo", () => {
    const candidate = createCandidate({ specialty: "Cardiologia" });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const result = evaluateEligibility(candidate, evidence, report);

    expect(result.outcome).toBe("not_eligible");
    expect(result.failedRules.some((rule) => rule.id === "ELIG-004")).toBe(true);
  });

  it("retorna revisão quando CRM está ausente", () => {
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
    const result = evaluateEligibility(candidate, evidence, report);

    expect(result.outcome).toBe("review_required");
    expect(result.pendingRules.some((rule) => rule.id === "ELIG-002")).toBe(true);
  });

  it("falha elegibilidade com CRM cancelado", () => {
    const candidate = createCandidate({ crmStatus: "cancelled" });
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const result = evaluateEligibility(candidate, evidence, report);

    expect(result.failedRules.some((rule) => rule.id === "ELIG-003")).toBe(true);
  });

  it("executa todas as regras de elegibilidade", () => {
    const candidate = createCandidate();
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);
    const results = executeRules(ELIGIBILITY_RULES, { candidate, evidence, evidenceReport: report });
    const partitioned = partitionRuleResults(results);

    expect(results).toHaveLength(ELIGIBILITY_RULES.length);
    expect(partitioned.satisfied.length + partitioned.pending.length + partitioned.failed.length).toBe(
      ELIGIBILITY_RULES.length,
    );
  });
});
