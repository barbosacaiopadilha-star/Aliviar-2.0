import type { CatalogSnapshot } from "@/alicia/domain/doctor";

import { advanceLifecycleToPublished } from "../lifecycle/doctor-lifecycle";
import type {
  CatalogDoctorOperationalRecord,
  PublicationResult,
  ValidationIssue,
} from "../types";
import { hasBlockingValidationIssues } from "../validators/catalog-quality-validators";

const PUBLISHABLE_STATES = new Set(["auto_verified", "human_verified", "updated"]);

export function publishCatalogSnapshot(
  snapshot: CatalogSnapshot,
  operationalRecords: CatalogDoctorOperationalRecord[],
  referenceDate: string = new Date().toISOString().slice(0, 10),
): PublicationResult & { operationalRecords: CatalogDoctorOperationalRecord[] } {
  const publishableIds = new Set<string>();
  const blockedDoctorIds: string[] = [];
  const issues: ValidationIssue[] = [];

  const updatedRecords = operationalRecords.map((record) => {
    const canPublish =
      PUBLISHABLE_STATES.has(record.lifecycle.state) &&
      !hasBlockingValidationIssues(record.validationIssues);

    if (!canPublish) {
      blockedDoctorIds.push(record.doctorId);
      return record;
    }

    try {
      const lifecycle = advanceLifecycleToPublished(record.lifecycle, referenceDate);
      publishableIds.add(record.doctorId);
      return { ...record, lifecycle };
    } catch {
      blockedDoctorIds.push(record.doctorId);
      issues.push({
        code: "publication.blocked",
        message: `Perfil ${record.doctorId} não está em estado publicável.`,
        severity: "warning",
        doctorId: record.doctorId,
      });
      return record;
    }
  });

  const publishedSnapshot: CatalogSnapshot = {
    ...snapshot,
    doctors: snapshot.doctors.filter((doctor) => publishableIds.has(doctor.id)),
  };

  return {
    snapshot: publishedSnapshot,
    publishedDoctorIds: [...publishableIds],
    blockedDoctorIds,
    issues,
    operationalRecords: updatedRecords,
  };
}

export function filterPublishedDoctors(
  snapshot: CatalogSnapshot,
  publishedDoctorIds: string[],
): CatalogSnapshot {
  const allowed = new Set(publishedDoctorIds);

  return {
    ...snapshot,
    doctors: snapshot.doctors.filter((doctor) => allowed.has(doctor.id)),
  };
}
