// ETAPA 6 — a porta de publicação em português. Cada condição do trigger
// assert_publication_requirements precisa de uma pendência correspondente,
// com o caminho de correção; e um cadastro completo não tem pendência alguma.
import { describe, expect, it } from "vitest";

import { listPublicationPendencies } from "@/modules/profiles/publication-pendencies";

const COMPLETO = {
  professional: {
    isDemo: false,
    crm: "123456",
    crmUf: "SP",
    registrationStatus: "regular" as const,
  },
  practiceArea: {
    rawText: "Ortopedia — coluna",
    tags: ["ortopedia", "coluna"],
    verificationStatus: "verificado" as const,
  },
  openCriticalDivergences: 0,
};

describe("pendências de publicação", () => {
  it("cadastro completo não tem pendências", () => {
    expect(listPublicationPendencies(COMPLETO)).toEqual([]);
  });

  it("cadastro novo lista cada condição faltante, com como corrigir", () => {
    const pendencias = listPublicationPendencies({
      professional: { isDemo: false, crm: null, crmUf: null, registrationStatus: null },
      practiceArea: null,
      openCriticalDivergences: 0,
    });
    expect(pendencias.map((p) => p.code)).toEqual([
      "CRM_AUSENTE",
      "CRM_UF_AUSENTE",
      "REGISTRO_NAO_VERIFICADO",
      "AREA_DE_ATUACAO_AUSENTE",
    ]);
    for (const pendencia of pendencias) {
      expect(pendencia.howToFix.length).toBeGreaterThan(10);
    }
  });

  it("registro irregular e área não verificada são pendências distintas das ausências", () => {
    const pendencias = listPublicationPendencies({
      ...COMPLETO,
      professional: { ...COMPLETO.professional, registrationStatus: "irregular" },
      practiceArea: { ...COMPLETO.practiceArea, verificationStatus: "nao_verificado" },
    });
    expect(pendencias.map((p) => p.code)).toEqual([
      "REGISTRO_IRREGULAR",
      "AREA_DE_ATUACAO_NAO_VERIFICADA",
    ]);
  });

  it("perfil demo e divergência crítica bloqueiam mesmo com o resto completo", () => {
    const pendencias = listPublicationPendencies({
      ...COMPLETO,
      professional: { ...COMPLETO.professional, isDemo: true },
      openCriticalDivergences: 2,
    });
    expect(pendencias.map((p) => p.code)).toEqual(["PERFIL_DEMO", "DIVERGENCIA_CRITICA_ABERTA"]);
  });
});
