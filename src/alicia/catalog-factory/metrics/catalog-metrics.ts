import type { CatalogSnapshot } from "@/alicia/domain/doctor";
import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import { markLifecycleUpdated } from "../lifecycle/doctor-lifecycle";
import { computeProfileQuality, isProfileComplete } from "../quality/profile-quality";
import type {
  CatalogDoctorOperationalRecord,
  CatalogMetrics,
  ReviewQueueItem,
  UpdateResult,
} from "../types";
import { validateDoctorQualityRules } from "../validators/catalog-quality-validators";
import { buildReviewQueue } from "../pipeline/review-pipeline";

function incrementCounter(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function daysSince(date: string, referenceDate: string): number {
  const parsed = Date.parse(date);
  const reference = Date.parse(referenceDate);

  if (Number.isNaN(parsed) || Number.isNaN(reference)) {
    return 0;
  }

  return Math.max(0, Math.round((reference - parsed) / (1000 * 60 * 60 * 24)));
}

export function computeCatalogMetrics(
  snapshot: CatalogSnapshot,
  operationalRecords: CatalogDoctorOperationalRecord[],
  reviewQueue: ReviewQueueItem[],
  referenceDate: string = new Date().toISOString().slice(0, 10),
): CatalogMetrics {
  const coverageByCity: Record<string, number> = {};
  const coverageByState: Record<string, number> = {};
  const coverageBySpecialty: Record<string, number> = {};

  snapshot.doctors.forEach((doctor) => {
    incrementCounter(coverageByCity, doctor.practiceLocation.city);
    incrementCounter(coverageByState, doctor.practiceLocation.state);

    const specialty = snapshot.specialties.get(doctor.specialtyId)?.name ?? "Desconhecida";
    incrementCounter(coverageBySpecialty, specialty);
  });

  const completeProfiles = operationalRecords.filter((record) =>
    isProfileComplete(record.quality),
  ).length;

  const sourceCounts = operationalRecords.map((record) => record.quality.sourceCount);
  const updateAges = operationalRecords.map((record) =>
    daysSince(record.importRecord.transparency.lastUpdated, referenceDate),
  );

  return {
    totalDoctors: snapshot.doctors.length,
    coverageByCity,
    coverageByState,
    coverageBySpecialty,
    completeProfiles,
    profilesInReview: reviewQueue.filter((item) => item.status === "open").length,
    averageSourcesPerDoctor: average(sourceCounts),
    averageDaysSinceUpdate: average(updateAges),
  };
}

export function updateCatalogDoctor(
  record: CatalogDoctorOperationalRecord,
  incoming: DoctorImportRecord,
  referenceDate: string = new Date().toISOString().slice(0, 10),
): {
  record: CatalogDoctorOperationalRecord;
  reviewItems: ReviewQueueItem[];
} {
  const validationIssues = validateDoctorQualityRules(incoming);
  const quality = computeProfileQuality(incoming, referenceDate);
  const lifecycle = markLifecycleUpdated(record.lifecycle, referenceDate);
  const reviewItems = buildReviewQueue(
    [incoming],
    validationIssues,
    new Map([[incoming.id, quality]]),
    referenceDate,
  );

  return {
    record: {
      ...record,
      importRecord: incoming,
      lifecycle,
      quality,
      validationIssues,
      reviewQueueItemIds: reviewItems.map((item) => item.id),
    },
    reviewItems,
  };
}

export function updateCatalogDoctors(
  records: CatalogDoctorOperationalRecord[],
  incomingById: Map<string, DoctorImportRecord>,
  referenceDate: string = new Date().toISOString().slice(0, 10),
): UpdateResult {
  const updatedDoctorIds: string[] = [];
  const unchangedDoctorIds: string[] = [];
  const newReviewItems: ReviewQueueItem[] = [];

  records.forEach((record) => {
    const incoming = incomingById.get(record.doctorId);
    if (!incoming) {
      unchangedDoctorIds.push(record.doctorId);
      return;
    }

    if (incoming.transparency.lastUpdated === record.importRecord.transparency.lastUpdated) {
      unchangedDoctorIds.push(record.doctorId);
      return;
    }

    const result = updateCatalogDoctor(record, incoming, referenceDate);
    updatedDoctorIds.push(record.doctorId);
    newReviewItems.push(...result.reviewItems);
  });

  return {
    updatedDoctorIds,
    unchangedDoctorIds,
    newReviewItems,
  };
}
