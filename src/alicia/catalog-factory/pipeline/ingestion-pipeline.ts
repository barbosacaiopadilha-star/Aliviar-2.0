import type { CatalogSnapshot } from "@/alicia/domain/doctor";
import type { CatalogImportPayload } from "@/alicia/infrastructure/import/import-types";
import { parseCsvToCatalogPayload } from "@/alicia/infrastructure/import/csv-importer";
import { normalizeCatalogImportPayload } from "@/alicia/infrastructure/import/normalizer";
import { validateCatalogImportPayload } from "@/alicia/infrastructure/import/validator";

import { deduplicateImportRecords } from "../deduplication/deduplicator";
import {
  advanceLifecycleThroughAutoVerification,
  advanceLifecycleThroughIngestion,
  createLifecycleRecord,
} from "../lifecycle/doctor-lifecycle";
import { computeProfileQuality } from "../quality/profile-quality";
import type {
  CatalogDoctorOperationalRecord,
  IngestionResult,
  IngestionSource,
  ValidationIssue,
} from "../types";
import {
  hasBlockingValidationIssues,
  validateCatalogQualityRules,
} from "../validators/catalog-quality-validators";
import { buildReviewQueue } from "./review-pipeline";
import { computeCatalogMetrics } from "../metrics/catalog-metrics";
import { publishCatalogSnapshot } from "./publication-pipeline";

function buildOperationalRecords(
  records: CatalogImportPayload["doctors"],
  issues: ValidationIssue[],
  referenceDate: string,
): CatalogDoctorOperationalRecord[] {
  const issuesByDoctor = new Map<string, ValidationIssue[]>();
  issues.forEach((issue) => {
    if (!issue.doctorId) {
      return;
    }
    const current = issuesByDoctor.get(issue.doctorId) ?? [];
    current.push(issue);
    issuesByDoctor.set(issue.doctorId, current);
  });

  return records.map((record) => {
    const doctorIssues = issuesByDoctor.get(record.id) ?? [];
    const quality = computeProfileQuality(record, referenceDate);

    let lifecycle = createLifecycleRecord("discovered", referenceDate);
    lifecycle = advanceLifecycleThroughIngestion(lifecycle, referenceDate);
    lifecycle = advanceLifecycleThroughAutoVerification(
      lifecycle,
      referenceDate,
      hasBlockingValidationIssues(doctorIssues),
    );

    return {
      doctorId: record.id,
      importRecord: record,
      lifecycle,
      quality,
      validationIssues: doctorIssues,
      reviewQueueItemIds: [],
    };
  });
}

function finalizeIngestion(
  source: IngestionSource,
  payload: CatalogImportPayload,
  referenceDate: string,
): IngestionResult {
  validateCatalogImportPayload(payload);

  const deduped = deduplicateImportRecords(payload.doctors);
  const normalizedPayload: CatalogImportPayload = { doctors: deduped.records };
  const qualityIssues = validateCatalogQualityRules(normalizedPayload.doctors);
  const operationalRecords = buildOperationalRecords(
    normalizedPayload.doctors,
    qualityIssues,
    referenceDate,
  );

  const qualities = new Map(
    operationalRecords.map((record) => [record.doctorId, record.quality]),
  );

  const reviewQueue = buildReviewQueue(
    normalizedPayload.doctors,
    qualityIssues,
    qualities,
    referenceDate,
  );

  const reviewIdsByDoctor = new Map<string, string[]>();
  reviewQueue.forEach((item) => {
    const current = reviewIdsByDoctor.get(item.doctorId) ?? [];
    current.push(item.id);
    reviewIdsByDoctor.set(item.doctorId, current);
  });

  const recordsWithReview = operationalRecords.map((record) => ({
    ...record,
    reviewQueueItemIds: reviewIdsByDoctor.get(record.doctorId) ?? [],
  }));

  const publication = publishCatalogSnapshot(
    normalizeCatalogImportPayload(normalizedPayload),
    recordsWithReview,
    referenceDate,
  );

  const metrics = computeCatalogMetrics(
    publication.snapshot,
    publication.operationalRecords,
    reviewQueue,
    referenceDate,
  );

  return {
    source,
    snapshot: publication.snapshot,
    operationalRecords: publication.operationalRecords,
    reviewQueue,
    issues: [...qualityIssues, ...publication.issues],
    metrics,
  };
}

export function ingestCatalogFromPayload(
  payload: CatalogImportPayload,
  source: IngestionSource = "manual",
  referenceDate: string = new Date().toISOString().slice(0, 10),
): IngestionResult {
  return finalizeIngestion(source, payload, referenceDate);
}

export function ingestCatalogFromJson(
  raw: string,
  referenceDate?: string,
): IngestionResult {
  const payload = JSON.parse(raw) as CatalogImportPayload;
  return finalizeIngestion("json", payload, referenceDate ?? new Date().toISOString().slice(0, 10));
}

export function ingestCatalogFromCsv(
  csv: string,
  referenceDate?: string,
): IngestionResult {
  return finalizeIngestion(
    "csv",
    parseCsvToCatalogPayload(csv),
    referenceDate ?? new Date().toISOString().slice(0, 10),
  );
}

export function ingestCatalogFromCrawler(
  records: CatalogImportPayload["doctors"],
  referenceDate?: string,
): IngestionResult {
  return finalizeIngestion(
    "crawler",
    { doctors: records },
    referenceDate ?? new Date().toISOString().slice(0, 10),
  );
}

export function ingestCatalogManually(
  records: CatalogImportPayload["doctors"],
  referenceDate?: string,
): IngestionResult {
  return finalizeIngestion(
    "manual",
    { doctors: records },
    referenceDate ?? new Date().toISOString().slice(0, 10),
  );
}

export function mergeCatalogSnapshots(
  current: CatalogSnapshot,
  incoming: CatalogSnapshot,
): CatalogSnapshot {
  const doctors = new Map(current.doctors.map((doctor) => [doctor.id, doctor]));

  incoming.doctors.forEach((doctor) => {
    doctors.set(doctor.id, doctor);
  });

  return {
    doctors: [...doctors.values()],
    specialties: new Map([...current.specialties, ...incoming.specialties]),
    institutions: new Map([...current.institutions, ...incoming.institutions]),
    educations: new Map([...current.educations, ...incoming.educations]),
    residencies: new Map([...current.residencies, ...incoming.residencies]),
    fellowships: new Map([...current.fellowships, ...incoming.fellowships]),
    sources: new Map([...current.sources, ...incoming.sources]),
    verifications: new Map([...current.verifications, ...incoming.verifications]),
  };
}
