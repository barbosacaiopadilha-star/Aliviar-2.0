import { describe, expect, it } from "vitest";

import { evaluateEvidence } from "../evidence-evaluator";
import { createCandidate, createEvidence, createMinimumEvidence } from "./fixtures";

describe("evidence-evaluator", () => {
  it("confirma CRM com fonte nível 1", () => {
    const candidate = createCandidate();
    const evidence = createMinimumEvidence();
    const report = evaluateEvidence(candidate, evidence);

    const crmField = report.fields.find((field) => field.field === "crm");
    expect(crmField?.status).toBe("confirmed");
    expect(report.level1to3Count).toBeGreaterThanOrEqual(2);
  });

  it("marca graduação como pendente sem verificação", () => {
    const candidate = createCandidate({
      graduation: { institution: "__PENDING_VERIFICATION__", verified: false },
    });
    const report = evaluateEvidence(candidate, createMinimumEvidence());
    const graduation = report.fields.find((field) => field.field === "graduation");

    expect(graduation?.status).toBe("pending");
  });

  it("detecta apenas fontes de baixa confiança", () => {
    const candidate = createCandidate({ crm: "", rqe: undefined });
    const evidence = [
      createEvidence({
        id: "d1",
        name: "Doctoralia",
        type: "Diretório",
        level: 6,
        supportsFields: ["specialty"],
      }),
      createEvidence({
        id: "d2",
        name: "CliniGuia",
        type: "Diretório",
        level: 6,
        supportsFields: ["current_practice"],
      }),
    ];

    const report = evaluateEvidence(candidate, evidence);
    expect(report.onlyLowTrustSources).toBe(true);
    expect(report.level1to3Count).toBe(0);
  });

  it("marca residência como confirmada quando verificada", () => {
    const candidate = createCandidate({
      residency: [{ institution: "HEC", program: "Neurocirurgia", verified: true }],
    });
    const report = evaluateEvidence(candidate, createMinimumEvidence());
    const residency = report.fields.find((field) => field.field === "residency");

    expect(residency?.status).toBe("confirmed");
  });
});
