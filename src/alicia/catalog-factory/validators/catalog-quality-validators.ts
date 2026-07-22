import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import type { ValidationIssue } from "../types";

const CRM_PATTERN = /\bCRM[-\s]?[A-Z]{2}\s*\d[\d.]{2,}\b/i;
const RQE_PATTERN = /\bRQE\s*\d[\d.]{2,}\b/i;
const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;

const PILOT_SPECIALTIES = new Set(["Ortopedia", "Neurocirurgia"]);

function issue(
  code: string,
  message: string,
  severity: ValidationIssue["severity"],
  doctorId: string,
  field?: string,
): ValidationIssue {
  return { code, message, severity, doctorId, field };
}

function extractYears(period?: string): number[] {
  if (!period) {
    return [];
  }

  return [...period.matchAll(YEAR_PATTERN)].map((match) => Number(match[0]));
}

function normalizeInstitutionName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasCrmSource(record: DoctorImportRecord): boolean {
  return record.transparency.sources.some((source) => CRM_PATTERN.test(source.name));
}

function hasRqeSource(record: DoctorImportRecord): boolean {
  return record.transparency.sources.some((source) => RQE_PATTERN.test(source.name));
}

export function validateDoctorQualityRules(record: DoctorImportRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!hasCrmSource(record)) {
    issues.push(
      issue(
        "crm.missing",
        "Nenhuma fonte com padrão de CRM foi encontrada.",
        "warning",
        record.id,
        "transparency.sources",
      ),
    );
  }

  if (!hasRqeSource(record) && record.specialty !== "Neurocirurgia") {
    issues.push(
      issue(
        "rqe.missing",
        "Nenhuma fonte com padrão de RQE foi encontrada.",
        "info",
        record.id,
        "transparency.sources",
      ),
    );
  }

  const institutionNames = [
    record.mainInstitution,
    record.graduation.institution,
    ...record.residency.map((entry) => entry.institution),
    ...record.fellowships.map((entry) => entry.institution),
    ...record.institutions.map((entry) => entry.name),
  ].filter((name) => name && !name.includes("PENDING") && !name.includes("confirmado"));

  const normalized = new Map<string, string>();
  institutionNames.forEach((name) => {
    const key = normalizeInstitutionName(name);
    if (normalized.has(key) && normalized.get(key) !== name) {
      issues.push(
        issue(
          "institution.duplicate_name",
          `Instituição com nomes divergentes: "${normalized.get(key)}" e "${name}".`,
          "warning",
          record.id,
          "institutions",
        ),
      );
    } else {
      normalized.set(key, name);
    }
  });

  if (!PILOT_SPECIALTIES.has(record.specialty)) {
    issues.push(
      issue(
        "specialty.out_of_scope",
        `Especialidade "${record.specialty}" está fora do escopo atual do piloto.`,
        "info",
        record.id,
        "specialty",
      ),
    );
  }

  const educationEntries = [
    { label: "graduation", entry: record.graduation },
    ...record.residency.map((entry, index) => ({ label: `residency[${index}]`, entry })),
    ...record.fellowships.map((entry, index) => ({ label: `fellowship[${index}]`, entry })),
  ];

  educationEntries.forEach(({ label, entry }) => {
    const years = extractYears(entry.period);
    if (years.length >= 2 && years[0] > years[years.length - 1]) {
      issues.push(
        issue(
          "date.impossible_period",
          `Período com anos invertidos em ${label}.`,
          "error",
          record.id,
          label,
        ),
      );
    }

    const futureYear = years.find((year) => year > new Date().getFullYear() + 1);
    if (futureYear) {
      issues.push(
        issue(
          "date.future_year",
          `Ano futuro improvável (${futureYear}) em ${label}.`,
          "warning",
          record.id,
          label,
        ),
      );
    }
  });

  record.institutions.forEach((affiliation, index) => {
    if (
      affiliation.city &&
      affiliation.city !== record.location.city &&
      affiliation.state &&
      affiliation.state === record.location.state &&
      !record.location.city.toLowerCase().includes(affiliation.city.toLowerCase())
    ) {
      issues.push(
        issue(
          "city.incompatible_affiliation",
          `Instituição em ${affiliation.city} pode não corresponder à cidade principal ${record.location.city}.`,
          "info",
          record.id,
          `institutions[${index}].city`,
        ),
      );
    }
  });

  const nameTokens = record.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2);

  const narrative = `${record.whoTheyAre} ${record.trajectory}`.toLowerCase();
  const missingNameMention = nameTokens.some(
    (token) => !narrative.includes(token) && !["dr", "dra", "de", "da", "dos", "das"].includes(token),
  );

  if (missingNameMention && record.whoTheyAre.length < 40) {
    issues.push(
      issue(
        "name.divergent_narrative",
        "Narrativa curta pode não refletir o nome completo do médico.",
        "info",
        record.id,
        "whoTheyAre",
      ),
    );
  }

  record.transparency.unverifiedFields.forEach((field) => {
    issues.push(
      issue(
        "field.pending_verification",
        `Campo pendente de verificação: ${field}.`,
        "warning",
        record.id,
        field,
      ),
    );
  });

  return issues;
}

export function validateCatalogQualityRules(records: DoctorImportRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const names = new Map<string, string>();

  records.forEach((record) => {
    issues.push(...validateDoctorQualityRules(record));

    if (ids.has(record.id)) {
      issues.push(
        issue("doctor.duplicate_id", `ID duplicado: ${record.id}.`, "error", record.id, "id"),
      );
    }
    ids.add(record.id);

    const normalizedName = normalizeInstitutionName(record.name);
    if (names.has(normalizedName) && names.get(normalizedName) !== record.id) {
      issues.push(
        issue(
          "doctor.duplicate_name",
          `Possível duplicidade de médico para o nome "${record.name}".`,
          "warning",
          record.id,
          "name",
        ),
      );
    } else {
      names.set(normalizedName, record.id);
    }
  });

  return issues;
}

export function hasBlockingValidationIssues(issues: ValidationIssue[]): boolean {
  return issues.some((item) => item.severity === "error");
}
