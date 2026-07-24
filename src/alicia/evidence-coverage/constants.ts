export const EVIDENCE_COVERAGE_VERSION = "1.0.0";

export const EVIDENCE_CATEGORIES = [
  "Graduação",
  "Residência",
  "RQE",
  "Instituições",
  "Especialidade",
  "Localização",
  "Fontes",
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

/** Mapeamento categoria editorial → seção do Evidence Acquisition Engine. */
export const CATEGORY_TO_SECTION: Record<
  EvidenceCategory,
  readonly string[]
> = {
  Graduação: ["Education"],
  Residência: ["Residency", "Fellowship"],
  RQE: ["Registrations", "Specialties"],
  Instituições: ["Institutions"],
  Especialidade: ["Specialties"],
  Localização: ["PracticeLocations", "Identity"],
  Fontes: ["Identity", "Registrations"],
};

/** Conectores que podem suprir cada categoria — plano apenas, sem fetch. */
export const CATEGORY_CONNECTOR_HINTS: Record<EvidenceCategory, readonly string[]> = {
  Graduação: ["universidade", "cfm"],
  Residência: ["hospital", "universidade", "sociedade-medica"],
  RQE: ["cfm", "crm-estadual", "sociedade-medica"],
  Instituições: ["hospital", "site-institucional"],
  Especialidade: ["cfm", "crm-estadual", "sociedade-medica"],
  Localização: ["crm-estadual", "hospital", "site-institucional"],
  Fontes: ["cfm", "crm-estadual"],
};

/** Campos de conflito → categoria. */
export const CONFLICT_FIELD_TO_CATEGORY: Record<string, EvidenceCategory> = {
  crm: "Fontes",
  rqe: "RQE",
  especialidade: "Especialidade",
  institutionName: "Instituições",
  nome: "Fontes",
  cidade: "Localização",
};

/** Limiar de cobertura de seção considerado completo. */
export const SECTION_COMPLETE_THRESHOLD = 100;
