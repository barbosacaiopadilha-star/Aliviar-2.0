import type { CatalogImportPayload, DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) {
    throw new CatalogValidationError(`${field} é obrigatório.`);
  }
}

function validateEducation(
  education: DoctorImportRecord["graduation"],
  field: string,
): void {
  assertNonEmpty(education.institution, `${field}.institution`);
  assertNonEmpty(education.program, `${field}.program`);
}

export function validateDoctorImportRecord(record: DoctorImportRecord): void {
  assertNonEmpty(record.id, "doctor.id");
  assertNonEmpty(record.name, "doctor.name");
  assertNonEmpty(record.specialty, "doctor.specialty");
  assertNonEmpty(record.mainInstitution, "doctor.mainInstitution");
  assertNonEmpty(record.whoTheyAre, "doctor.whoTheyAre");
  assertNonEmpty(record.trajectory, "doctor.trajectory");
  assertNonEmpty(record.scientificProductionPlaceholder, "doctor.scientificProductionPlaceholder");
  assertNonEmpty(record.transparency.lastUpdated, "doctor.transparency.lastUpdated");

  if (!Number.isFinite(record.location.lat) || !Number.isFinite(record.location.lng)) {
    throw new CatalogValidationError("doctor.location deve conter coordenadas válidas.");
  }

  assertNonEmpty(record.location.city, "doctor.location.city");
  assertNonEmpty(record.location.state, "doctor.location.state");

  validateEducation(record.graduation, "doctor.graduation");
  record.residency.forEach((entry, index) => validateEducation(entry, `doctor.residency[${index}]`));
  record.fellowships.forEach((entry, index) =>
    validateEducation(entry, `doctor.fellowships[${index}]`),
  );

  if (record.transparency.sources.length === 0) {
    throw new CatalogValidationError("doctor.transparency.sources não pode ser vazio.");
  }

  record.transparency.sources.forEach((source, index) => {
    assertNonEmpty(source.name, `doctor.transparency.sources[${index}].name`);
    assertNonEmpty(source.type, `doctor.transparency.sources[${index}].type`);
  });
}

export function validateCatalogImportPayload(payload: CatalogImportPayload): void {
  if (!Array.isArray(payload.doctors) || payload.doctors.length === 0) {
    throw new CatalogValidationError("Payload deve conter ao menos um médico.");
  }

  const ids = new Set<string>();
  payload.doctors.forEach((doctor) => {
    validateDoctorImportRecord(doctor);
    if (ids.has(doctor.id)) {
      throw new CatalogValidationError(`ID duplicado encontrado: ${doctor.id}`);
    }
    ids.add(doctor.id);
  });
}
