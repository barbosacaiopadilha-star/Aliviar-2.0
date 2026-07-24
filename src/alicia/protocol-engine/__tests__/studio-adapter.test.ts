import { describe, expect, it } from "vitest";

import {
  collectReviewCases,
  evaluateStudioCandidate,
  getSuggestedOperationalLevel,
} from "../studio-adapter";

const baseStudioCandidate = {
  id: "studio-1",
  caseId: "ALC-ES-2026-10001",
  name: "Dr. Studio Teste",
  crm: "CRM-ES 15.392",
  rqe: "RQE 13.597",
  city: "Vitória",
  specialty: "Ortopedia" as const,
  sources: [
    {
      id: "s1",
      name: "CRM-ES 15.392",
      type: "Registro profissional",
      consultedAt: "2026-07-22",
      responsible: "Operador",
    },
    {
      id: "s2",
      name: "RQE 13.597",
      type: "Registro de qualificação de especialista",
      consultedAt: "2026-07-22",
      responsible: "Operador",
    },
    {
      id: "s3",
      name: "Hospital Meridional",
      type: "Instituição",
      consultedAt: "2026-07-22",
      responsible: "Operador",
    },
  ],
  currentInstitutions: [{ name: "Hospital Meridional", role: "Ortopedista" }],
};

describe("studio-adapter", () => {
  it("avalia candidato do Studio", () => {
    const decision = evaluateStudioCandidate(baseStudioCandidate);
    expect(["AUTO_PUBLISH", "HUMAN_REVIEW", "REJECT"]).toContain(decision.outcome);
  });

  it("gera Review Cases apenas para exceções", () => {
    const reviewCases = collectReviewCases([
      baseStudioCandidate,
      {
        ...baseStudioCandidate,
        id: "studio-2",
        specialty: "Cardiologia",
      },
    ]);

    expect(reviewCases.length).toBeGreaterThanOrEqual(1);
    expect(reviewCases.every((item) => item.decision.outcome !== "AUTO_PUBLISH")).toBe(true);
  });

  it("sugere nível operacional quando não rejeitado", () => {
    const nivel = getSuggestedOperationalLevel(baseStudioCandidate);
    expect(nivel === "A" || nivel === "B").toBe(true);
  });

  it("retorna undefined para candidato rejeitado", () => {
    const nivel = getSuggestedOperationalLevel({
      ...baseStudioCandidate,
      specialty: "Cardiologia",
    });

    expect(nivel).toBeUndefined();
  });

  it("mapeia candidato com metadados de formação", () => {
    const decision = evaluateStudioCandidate({
      ...baseStudioCandidate,
      graduationInstitution: "EMESCAM",
      graduationVerified: true,
      residencyVerified: true,
    });

    expect(decision.suggestedNivel).toBe("A");
    expect(decision.outcome).toBe("HUMAN_REVIEW");
  });
});
