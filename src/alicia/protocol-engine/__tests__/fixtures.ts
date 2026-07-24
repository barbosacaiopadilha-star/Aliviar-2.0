import type { DoctorCandidate, Evidence } from "../types";

export function createEvidence(overrides: Partial<Evidence> & Pick<Evidence, "id" | "name" | "type">): Evidence {
  return {
    consultedAt: "2026-07-22",
    responsible: "Operador Teste",
    level: 1,
    supportsFields: ["crm", "identity"],
    ...overrides,
  };
}

export function createCandidate(overrides: Partial<DoctorCandidate> = {}): DoctorCandidate {
  return {
    id: "cand-1",
    caseId: "ALC-ES-2026-00001",
    name: "Dr. Teste Protocolo",
    crm: "CRM-ES 12.345",
    crmStatus: "active",
    rqe: "RQE 9.999",
    specialty: "Ortopedia",
    city: "Vitória",
    state: "ES",
    graduation: { institution: "EMESCAM", verified: true },
    residency: [{ institution: "ICOT", program: "Ortopedia", verified: true }],
    currentInstitutions: [{ name: "ICOT", role: "Ortopedista" }],
    practiceAreas: ["Ortopedia"],
    collectedBy: "Operador Teste",
    collectedAt: "2026-07-22T10:00:00.000Z",
    hasIdentityConflict: false,
    duplicateCrm: false,
    ...overrides,
  };
}

export function createMinimumEvidence(): Evidence[] {
  return [
    createEvidence({
      id: "src-crm",
      name: "CRM-ES 12.345",
      type: "Registro profissional",
      level: 1,
      supportsFields: ["crm", "crm_status", "identity", "specialty", "city"],
    }),
    createEvidence({
      id: "src-rqe",
      name: "RQE 9.999",
      type: "Registro de qualificação de especialista",
      level: 1,
      supportsFields: ["rqe", "specialty"],
    }),
    createEvidence({
      id: "src-inst",
      name: "ICOT — corpo clínico",
      type: "Instituição",
      level: 2,
      supportsFields: ["current_practice", "specialty", "trajectory_milestone"],
    }),
  ];
}
