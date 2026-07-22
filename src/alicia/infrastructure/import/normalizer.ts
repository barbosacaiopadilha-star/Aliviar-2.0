import type {
  CatalogSnapshot,
  Doctor,
  Fellowship,
  Institution,
  Residency,
  Specialty,
} from "@/alicia/domain";
import type { Education } from "@/alicia/domain/education";
import type { Source } from "@/alicia/domain/source";
import type { Verification } from "@/alicia/domain/verification";
import type {
  CatalogImportPayload,
  DoctorImportEducation,
  DoctorImportRecord,
} from "@/alicia/infrastructure/import/import-types";
import { canonicalizeCityName } from "@/alicia/lib/city-standardization";
import { slugify, uniqueId } from "@/alicia/infrastructure/import/slug";
import { validateCatalogImportPayload } from "@/alicia/infrastructure/import/validator";

function createVerification(
  origin: string,
  verified: boolean,
  recordedAt: string,
  lastVerifiedAt: string,
): Verification {
  return {
    id: uniqueId("verification", `${origin}-${recordedAt}-${verified}`),
    origin,
    recordedAt,
    status: verified ? "verified" : "pending",
    lastVerifiedAt: verified ? lastVerifiedAt : null,
    confidence: verified ? "high" : "medium",
  };
}

function upsertInstitution(
  institutions: Map<string, Institution>,
  name: string,
  city: string,
  state?: string,
): string {
  const id = uniqueId("institution", `${name}-${city}`);
  if (!institutions.has(id)) {
    institutions.set(id, { id, name, city, state });
  }
  return id;
}

function upsertSpecialty(specialties: Map<string, Specialty>, name: string): string {
  const id = uniqueId("specialty", name);
  if (!specialties.has(id)) {
    specialties.set(id, { id, name });
  }
  return id;
}

function normalizeEducationEntry(
  snapshot: CatalogSnapshot,
  doctorId: string,
  kind: "graduation" | "residency" | "fellowship",
  index: number,
  entry: DoctorImportEducation,
  recordedAt: string,
  lastVerifiedAt: string,
): { id: string; verificationId: string } {
  const institutionId = upsertInstitution(
    snapshot.institutions,
    entry.institution,
    entry.institutionCity ?? "",
    entry.institutionState,
  );

  const verification = createVerification(
    `${kind}:${entry.institution}`,
    entry.verified,
    recordedAt,
    lastVerifiedAt,
  );
  snapshot.verifications.set(verification.id, verification);

  const id = uniqueId(`${kind}`, `${doctorId}-${index}-${entry.program}`);

  if (kind === "graduation") {
    const education: Education = {
      id,
      institutionId,
      program: entry.program,
      period: entry.period,
      verificationId: verification.id,
    };
    snapshot.educations.set(id, education);
  } else if (kind === "residency") {
    const residency: Residency = {
      id,
      institutionId,
      program: entry.program,
      period: entry.period,
      verificationId: verification.id,
    };
    snapshot.residencies.set(id, residency);
  } else {
    const fellowship: Fellowship = {
      id,
      institutionId,
      program: entry.program,
      period: entry.period,
      verificationId: verification.id,
    };
    snapshot.fellowships.set(id, fellowship);
  }

  return { id, verificationId: verification.id };
}

function normalizeSources(
  snapshot: CatalogSnapshot,
  doctorId: string,
  record: DoctorImportRecord,
): string[] {
  return record.transparency.sources.map((source, index) => {
    const verification = createVerification(
      `source:${source.name}`,
      true,
      record.transparency.lastUpdated,
      record.transparency.lastUpdated,
    );
    snapshot.verifications.set(verification.id, verification);

    const id = uniqueId("source", `${doctorId}-${slugify(source.name)}-${index}`);
    const domainSource: Source = {
      id,
      name: source.name,
      type: source.type,
      url: source.url,
      verificationId: verification.id,
    };
    snapshot.sources.set(id, domainSource);
    return id;
  });
}

export function createEmptyCatalogSnapshot(): CatalogSnapshot {
  return {
    doctors: [],
    specialties: new Map(),
    institutions: new Map(),
    educations: new Map(),
    residencies: new Map(),
    fellowships: new Map(),
    sources: new Map(),
    verifications: new Map(),
  };
}

export function normalizeCatalogImportPayload(payload: CatalogImportPayload): CatalogSnapshot {
  validateCatalogImportPayload(payload);

  const snapshot = createEmptyCatalogSnapshot();

  payload.doctors.forEach((record) => {
    const location = {
      ...record.location,
      city: canonicalizeCityName(record.location.city),
    };

    const specialtyId = upsertSpecialty(snapshot.specialties, record.specialty);
    const mainInstitutionId = upsertInstitution(
      snapshot.institutions,
      record.mainInstitution,
      location.city,
      location.state,
    );

    record.institutions.forEach((affiliation) => {
      upsertInstitution(
        snapshot.institutions,
        affiliation.name,
        canonicalizeCityName(affiliation.city),
        affiliation.state,
      );
    });

    upsertInstitution(
      snapshot.institutions,
      record.graduation.institution,
      record.location.city,
      record.location.state,
    );

    record.residency.forEach((entry) => {
      upsertInstitution(snapshot.institutions, entry.institution, record.location.city);
    });

    record.fellowships.forEach((entry) => {
      upsertInstitution(snapshot.institutions, entry.institution, record.location.city);
    });

    const graduation = normalizeEducationEntry(
      snapshot,
      record.id,
      "graduation",
      0,
      record.graduation,
      record.transparency.lastUpdated,
      record.transparency.lastUpdated,
    );

    const residencyIds = record.residency.map((entry, index) =>
      normalizeEducationEntry(
        snapshot,
        record.id,
        "residency",
        index,
        entry,
        record.transparency.lastUpdated,
        record.transparency.lastUpdated,
      ).id,
    );

    const fellowshipIds = record.fellowships.map((entry, index) =>
      normalizeEducationEntry(
        snapshot,
        record.id,
        "fellowship",
        index,
        entry,
        record.transparency.lastUpdated,
        record.transparency.lastUpdated,
      ).id,
    );

    const sourceIds = normalizeSources(snapshot, record.id, record);

    const affiliations = record.institutions.map((affiliation) => ({
      institutionId: upsertInstitution(
        snapshot.institutions,
        affiliation.name,
        affiliation.city,
        affiliation.state,
      ),
      role: affiliation.role,
    }));

    const doctor: Doctor = {
      id: record.id,
      name: record.name,
      specialtyId,
      practiceLocation: location,
      mainInstitutionId,
      whoTheyAre: record.whoTheyAre,
      trajectory: record.trajectory,
      graduationId: graduation.id,
      residencyIds,
      fellowshipIds,
      practiceAreas: [...record.practiceAreas],
      affiliations,
      scientificProductionPlaceholder: record.scientificProductionPlaceholder,
      sourceIds,
      lastUpdated: record.transparency.lastUpdated,
      unverifiedFieldLabels: [...record.transparency.unverifiedFields],
    };

    snapshot.doctors.push(doctor);
  });

  return snapshot;
}
