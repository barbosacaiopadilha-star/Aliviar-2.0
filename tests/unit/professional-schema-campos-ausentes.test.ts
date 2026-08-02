// Regressão da "criação sem avanço" (Release de Reconstrução, ETAPA 6/10).
// Mecanismo: campo removido do formulário → formData.get() devolve null →
// Zod rejeitava null em .optional() → erro em campo invisível → submit morto.
// Este teste trava o contrato: ausência (null) é lacuna declarada, nunca erro.
import { describe, expect, it } from "vitest";

import { professionalProfileSchema } from "@/modules/profiles/professional-schema";

function comoFormDataAusente() {
  // Exatamente o shape que o handleSubmit monta quando os campos do motor
  // legado não existem no DOM: FormData.get() de campo ausente é null.
  return {
    displayName: "Profissional Regressão",
    professionalIdentifier: "CRM-REG-1",
    crm: null,
    crmUf: null,
    professionalSummary: null,
    institutionName: null,
    experienceLevel: null,
    intakeApproach: null,
    offersContinuousCare: null,
    availabilityWindow: null,
    competencyDomains: [],
  };
}

describe("professionalProfileSchema — campos ausentes do formulário", () => {
  it("aceita null (campo não renderizado) como lacuna declarada", () => {
    const parsed = professionalProfileSchema.safeParse(comoFormDataAusente());
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.experienceLevel).toBeUndefined();
      expect(parsed.data.intakeApproach).toBeUndefined();
      expect(parsed.data.availabilityWindow).toBeUndefined();
      expect(parsed.data.offersContinuousCare).toBeUndefined();
    }
  });

  it("continua exigindo os dois campos obrigatórios", () => {
    const parsed = professionalProfileSchema.safeParse({
      ...comoFormDataAusente(),
      displayName: "",
    });
    expect(parsed.success).toBe(false);
  });
});
