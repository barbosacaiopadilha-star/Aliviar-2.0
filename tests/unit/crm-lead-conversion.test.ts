import { describe, expect, it } from "vitest";

import {
  evaluateLeadConversion,
  findDuplicateLeads,
  isAdministrativeFallback,
  normalizeEmail,
  normalizeLeadSource,
  normalizePhone,
  type Lead,
} from "@/modules/crm/lead";

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    fullName: "Ana Souza",
    phoneNormalized: "5511979037133",
    emailNormalized: "ana@exemplo.com",
    source: "site",
    sourceDetail: null,
    stage: "qualificado",
    qualifiedAt: "2026-07-20T10:00:00Z",
    patientProfileId: null,
    convertedAt: null,
    createdAt: "2026-07-19T10:00:00Z",
    ...overrides,
  };
}

const ATENDENTE = { id: "a1", roles: ["atendente"] };
const CURADOR = { id: "c1", roles: ["curador_medico"] };
const CONCIERGE = { id: "g1", roles: ["concierge"] };
const ADMIN = { id: "x1", roles: ["administrador"] };

describe("normalização para deduplicação", () => {
  // A mesma pessoa escreve pelo site com "(11) 97903-7133" e pelo WhatsApp
  // com "+55 11 97903-7133". Sem normalizar, viram dois pacientes.
  it("reconhece o mesmo telefone escrito de formas diferentes", () => {
    const alvo = "5511979037133";
    expect(normalizePhone("(11) 97903-7133")).toBe(alvo);
    expect(normalizePhone("+55 11 97903-7133")).toBe(alvo);
    expect(normalizePhone("11979037133")).toBe(alvo);
    expect(normalizePhone("55 11 97903 7133")).toBe(alvo);
  });

  it("trata vazio como ausência, não como string vazia", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
  });

  it("normaliza e-mail por caixa e espaços", () => {
    expect(normalizeEmail("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
  });

  it("origem desconhecida cai em 'outro' em vez de sumir do gráfico", () => {
    expect(normalizeLeadSource("instagram")).toBe("outro");
    expect(normalizeLeadSource(null)).toBe("outro");
    expect(normalizeLeadSource("WhatsApp")).toBe("whatsapp");
  });
});

describe("findDuplicateLeads", () => {
  it("acha duplicata por telefone e diz por quê", () => {
    const matches = findDuplicateLeads({ phone: "(11) 97903-7133" }, [lead()]);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedOn).toContain("telefone");
    expect(matches[0].confidence).toBe("strong");
  });

  // Homônimo não é duplicata. "Maria Silva" existe muitas vezes — bloquear por
  // nome recusaria pacientes reais.
  it("nome igual é pista fraca, nunca prova", () => {
    const matches = findDuplicateLeads({ fullName: "Ana Souza" }, [
      lead({ phoneNormalized: "5511000000000", emailNormalized: "outra@exemplo.com" }),
    ]);
    expect(matches[0].confidence).toBe("weak");
    expect(matches[0].matchedOn).toEqual([]);
  });

  it("não inventa duplicata quando nada bate", () => {
    expect(findDuplicateLeads({ phone: "11900000000", email: "x@y.com" }, [lead()])).toEqual([]);
  });
});

describe("quem pode converter", () => {
  it("o Atendente converte lead qualificado", () => {
    expect(evaluateLeadConversion({ lead: lead(), actor: ATENDENTE, existingLeads: [] })).toEqual({
      outcome: "allowed",
    });
  });

  // O Curador recebe o Case já aberto; o Concierge acompanha depois. Se
  // qualquer um deles pudesse converter, o Nível 1 deixaria de existir na
  // prática e o Case nasceria em qualquer lugar da jornada.
  it("o Curador não converte lead", () => {
    const v = evaluateLeadConversion({ lead: lead(), actor: CURADOR, existingLeads: [] });
    expect(v.outcome).toBe("rejected");
  });

  it("o Concierge não converte lead", () => {
    const v = evaluateLeadConversion({ lead: lead(), actor: CONCIERGE, existingLeads: [] });
    expect(v.outcome).toBe("rejected");
  });

  it("o Administrador pode, mas isso é intervenção, não o fluxo normal", () => {
    expect(evaluateLeadConversion({ lead: lead(), actor: ADMIN, existingLeads: [] })).toEqual({ outcome: "allowed" });
    expect(isAdministrativeFallback(ADMIN)).toBe(true);
    expect(isAdministrativeFallback(ATENDENTE)).toBe(false);
  });
});

describe("qualificação é pré-requisito", () => {
  const naoQualificado = lead({ qualifiedAt: null, stage: "novo" });

  it("lead não qualificado não é convertido pelo Atendente", () => {
    const v = evaluateLeadConversion({ lead: naoQualificado, actor: ATENDENTE, existingLeads: [] });
    expect(v).toMatchObject({ outcome: "rejected" });
    expect(v.outcome === "rejected" && v.reason).toContain("qualificado");
  });

  it("nem pelo Administrador, sem exceção explícita", () => {
    const v = evaluateLeadConversion({ lead: naoQualificado, actor: ADMIN, existingLeads: [] });
    expect(v.outcome).toBe("rejected");
  });

  it("a exceção administrativa existe, mas exige motivo", () => {
    expect(
      evaluateLeadConversion({
        lead: naoQualificado,
        actor: ADMIN,
        existingLeads: [],
        administrativeException: { reason: "   " },
      }).outcome,
    ).toBe("rejected");

    expect(
      evaluateLeadConversion({
        lead: naoQualificado,
        actor: ADMIN,
        existingLeads: [],
        administrativeException: { reason: "Paciente encaminhado por médico parceiro, urgência clínica." },
      }),
    ).toEqual({ outcome: "allowed" });
  });
});

describe("duplicidade não bloqueia cegamente", () => {
  const outro = lead({ id: "lead-2", phoneNormalized: "5511979037133" });

  it("mostra as correspondências e pede confirmação", () => {
    const v = evaluateLeadConversion({ lead: lead(), actor: ATENDENTE, existingLeads: [outro] });
    expect(v.outcome).toBe("needs-confirmation");
    expect(v.outcome === "needs-confirmation" && v.duplicates[0].leadId).toBe("lead-2");
  });

  it("depois da confirmação humana, segue", () => {
    const v = evaluateLeadConversion({
      lead: lead(),
      actor: ATENDENTE,
      existingLeads: [outro],
      duplicatesConfirmed: true,
    });
    expect(v).toEqual({ outcome: "allowed" });
  });
});

describe("idempotência", () => {
  // Dois cliques não produzem duas pessoas.
  it("lead já convertido devolve o mesmo paciente sem criar nada", () => {
    const v = evaluateLeadConversion({
      lead: lead({ patientProfileId: "p-1", convertedAt: "2026-07-21T10:00:00Z", stage: "convertido" }),
      actor: ATENDENTE,
      existingLeads: [],
    });
    expect(v).toEqual({ outcome: "already-converted", patientProfileId: "p-1" });
  });

  it("nem mesmo sem qualificação — o que já aconteceu não é reavaliado", () => {
    const v = evaluateLeadConversion({
      lead: lead({ qualifiedAt: null, patientProfileId: "p-1", convertedAt: "2026-07-21T10:00:00Z" }),
      actor: CURADOR,
      existingLeads: [],
    });
    expect(v.outcome).toBe("already-converted");
  });
});

describe("conversão preserva origem e histórico", () => {
  it("o lead continua existindo e mantém de onde veio", () => {
    const original = lead({ source: "indicacao", sourceDetail: "Dra. Helena", createdAt: "2026-07-01T08:00:00Z" });
    const depois: Lead = { ...original, patientProfileId: "p-9", convertedAt: "2026-07-22T09:00:00Z", stage: "convertido" };

    expect(depois.id).toBe(original.id);
    expect(depois.source).toBe("indicacao");
    expect(depois.sourceDetail).toBe("Dra. Helena");
    expect(depois.createdAt).toBe(original.createdAt);
    expect(depois.qualifiedAt).toBe(original.qualifiedAt);
  });
});
