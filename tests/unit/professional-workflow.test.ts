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
    // A etapa saiu da QUERY e virou segmento de rota (2026-08-20). Com
    // `?etapa=`, as seis etapas eram a mesma rota: o roteador tratava a troca
    // como navegação já satisfeita, a URL não mudava e a tela ficava parada
    // depois de recarregar ou de salvar. Agora cada etapa é rota própria.
    expect(professionalWorkflowStepHref("prof-1", "documentos")).toBe(
      "/admin/profissionais/prof-1/documentos",
    );
    expect(resolveProfessionalWorkflowStep("mapa")).toBe("mapa");
    expect(resolveProfessionalWorkflowStep("inexistente")).toBe("cadastro");
    expect(resolveProfessionalWorkflowStep(undefined)).toBe("cadastro");
  });
});
