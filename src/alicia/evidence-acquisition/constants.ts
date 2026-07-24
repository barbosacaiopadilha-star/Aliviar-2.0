export const EVIDENCE_ACQUISITION_VERSION = "1.0.0";

export const NORMALIZATION_VERSION = "1.0.0";

export const COVERAGE_SECTIONS = [
  "Identity",
  "Registrations",
  "Education",
  "Residency",
  "Fellowship",
  "Institutions",
  "Specialties",
  "PracticeLocations",
] as const;

export const SECTION_FIELD_MAP: Record<
  (typeof COVERAGE_SECTIONS)[number],
  readonly string[]
> = {
  Identity: ["nome", "crm"],
  Registrations: ["crm", "crmUf"],
  Education: ["education.institution", "education.graduationYear"],
  Residency: ["residency.institution", "residency.program"],
  Fellowship: ["fellowship.institution", "fellowship.program"],
  Institutions: ["name", "url"],
  Specialties: ["primary"],
  PracticeLocations: ["city", "state"],
};
