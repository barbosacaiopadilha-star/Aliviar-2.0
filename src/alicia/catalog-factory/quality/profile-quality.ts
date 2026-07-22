import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import type { ProfileQualityIndicators } from "../types";

const PENDING_INSTITUTION_MARKERS = new Set([
  "__PENDING_VERIFICATION__",
  "Ainda não confirmado",
]);

const HIGH_TRUST_SOURCE_TYPES = new Set([
  "Registro profissional",
  "Título de especialista",
  "Registro de qualificação de especialista",
]);

function isPendingInstitution(value: string): boolean {
  return PENDING_INSTITUTION_MARKERS.has(value);
}

function daysSince(date: string, referenceDate: string): number {
  const parsed = Date.parse(date);
  const reference = Date.parse(referenceDate);

  if (Number.isNaN(parsed) || Number.isNaN(reference)) {
    return 365;
  }

  return Math.max(0, Math.round((reference - parsed) / (1000 * 60 * 60 * 24)));
}

function computeCoverage(record: DoctorImportRecord): number {
  const checkpoints = [
    !isPendingInstitution(record.graduation.institution),
    record.residency.length > 0,
    record.fellowships.length > 0,
    record.practiceAreas.length > 0,
    record.institutions.length > 0,
    record.whoTheyAre.trim().length > 0,
    record.trajectory.trim().length > 0,
    record.transparency.sources.length > 0,
  ];

  const confirmed = checkpoints.filter(Boolean).length;
  return Math.round((confirmed / checkpoints.length) * 100);
}

function computeReliability(record: DoctorImportRecord): number {
  const educationEntries = [
    record.graduation,
    ...record.residency,
    ...record.fellowships,
  ];

  const verifiedEducations = educationEntries.filter((entry) => entry.verified).length;
  const educationScore =
    educationEntries.length === 0
      ? 0
      : Math.round((verifiedEducations / educationEntries.length) * 100);

  const trustedSources = record.transparency.sources.filter((source) =>
    HIGH_TRUST_SOURCE_TYPES.has(source.type),
  ).length;
  const sourceScore = Math.min(100, trustedSources * 35);

  const pendingPenalty = Math.min(40, record.transparency.unverifiedFields.length * 8);

  return Math.max(0, Math.round(educationScore * 0.6 + sourceScore * 0.4 - pendingPenalty));
}

function computeFreshness(record: DoctorImportRecord, referenceDate: string): number {
  const ageInDays = daysSince(record.transparency.lastUpdated, referenceDate);

  if (ageInDays <= 30) {
    return 100;
  }
  if (ageInDays <= 90) {
    return 80;
  }
  if (ageInDays <= 180) {
    return 60;
  }
  if (ageInDays <= 365) {
    return 40;
  }

  return 20;
}

export function computeProfileQuality(
  record: DoctorImportRecord,
  referenceDate: string = new Date().toISOString().slice(0, 10),
): ProfileQualityIndicators {
  const coverage = computeCoverage(record);
  const reliability = computeReliability(record);
  const freshness = computeFreshness(record, referenceDate);
  const sourceCount = record.transparency.sources.length;
  const pendingFieldCount = record.transparency.unverifiedFields.length;

  const overall = Math.round(coverage * 0.35 + reliability * 0.45 + freshness * 0.2);

  return {
    coverage,
    reliability,
    freshness,
    sourceCount,
    pendingFieldCount,
    overall,
  };
}

export function isProfileComplete(quality: ProfileQualityIndicators): boolean {
  return (
    quality.coverage >= 75 &&
    quality.reliability >= 60 &&
    quality.pendingFieldCount <= 2 &&
    quality.sourceCount >= 2
  );
}
