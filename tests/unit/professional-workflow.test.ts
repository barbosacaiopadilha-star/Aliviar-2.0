import { describe, expect, it } from "vitest";

import {
  PROFESSIONAL_WORKFLOW_STEPS,
  professionalWorkflowStepHref,
  resolveProfessionalWorkflowStep,
} from "@/modules/profiles/professional-workflow";

describe("fluxo operacional do cadastro profissional", () => {
  it("mantém os seis trabalhos separados e em ordem explícita", () => {
    expect(PROFESSIONAL_WORKFLOW_STEPS.map((step) => step.id)).toEqual([
      "cadastro",
      "publicacao",
      "rede",
      "documentos",
      "protocolo",
      "mapa",
    ]);
  });

  it("preserva links diretos e recusa etapas desconhecidas", () => {
    expect(professionalWorkflowStepHref("prof-1", "documentos")).toBe(
      "/admin/profissionais/prof-1?etapa=documentos",
    );
    expect(resolveProfessionalWorkflowStep("mapa")).toBe("mapa");
    expect(resolveProfessionalWorkflowStep("inexistente")).toBe("cadastro");
    expect(resolveProfessionalWorkflowStep(undefined)).toBe("cadastro");
  });
});
