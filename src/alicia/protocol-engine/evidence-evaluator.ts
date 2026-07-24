import type { DoctorCandidate, Evidence, EvidenceField, EvidenceReport, FieldEvidenceStatus, SourceConflict } from "./types";
import { isHighTrustLevel, isPublishableTrustLevel } from "./source-levels";

const CRITICAL_FIELDS: EvidenceField[] = [
  "identity",
  "crm",
  "crm_status",
  "rqe",
  "specialty",
  "graduation",
  "residency",
];

const TRACKED_FIELDS: EvidenceField[] = [
  "identity",
  "crm",
  "crm_status",
  "rqe",
  "teot",
  "specialty",
  "city",
  "graduation",
  "residency",
  "current_practice",
  "practice_areas",
  "trajectory_milestone",
];

function fieldStatusFromCandidate(
  field: EvidenceField,
  candidate: DoctorCandidate,
  supportingEvidence: Evidence[],
  allEvidence: Evidence[],
): FieldEvidenceStatus["status"] {
  const highTrust = supportingEvidence.filter((item) => isHighTrustLevel(item.level));
  const publishable = supportingEvidence.filter((item) => isPublishableTrustLevel(item.level));
  const globalHighTrust = allEvidence.filter((item) => isHighTrustLevel(item.level));

  switch (field) {
    case "identity":
    case "crm":
      return candidate.crm.trim().length > 0 && highTrust.length > 0
        ? "confirmed"
        : candidate.crm.trim().length > 0
          ? "pending"
          : "insufficient";

    case "crm_status":
      if (candidate.crmStatus === "active") {
        return highTrust.length > 0 ? "confirmed" : "pending";
      }
      if (candidate.crmStatus === "unknown") {
        return "pending";
      }
      return "insufficient";

    case "rqe":
    case "teot":
      return candidate.rqe?.trim() || candidate.teot?.trim() || highTrust.length > 0
        ? highTrust.length > 0
          ? "confirmed"
          : "pending"
        : "insufficient";

    case "specialty":
      return highTrust.length > 0 || publishable.length > 0 ? "confirmed" : "insufficient";

    case "city":
      return candidate.city.trim().length > 0 && publishable.length > 0
        ? "confirmed"
        : candidate.city.trim().length > 0
          ? "pending"
          : "insufficient";

    case "graduation":
      if (candidate.graduation?.verified) {
        return "confirmed";
      }
      return globalHighTrust.length > 0 ? "pending" : "insufficient";

    case "residency":
      if (candidate.residency?.some((entry) => entry.verified)) {
        return "confirmed";
      }
      return globalHighTrust.length > 0 ? "pending" : "insufficient";

    case "current_practice":
      return (candidate.currentInstitutions?.length ?? 0) > 0 || publishable.length > 0
        ? "confirmed"
        : "insufficient";

    case "practice_areas":
      return (candidate.practiceAreas?.length ?? 0) > 0 && publishable.length > 0
        ? "confirmed"
        : "pending";

    case "trajectory_milestone":
      return highTrust.length > 0 ||
        (candidate.currentInstitutions?.length ?? 0) > 0 ||
        candidate.graduation?.verified ||
        (candidate.residency?.some((entry) => entry.verified) ?? false)
        ? "confirmed"
        : "pending";

    case "fellowship":
      return "pending";

    default:
      return "insufficient";
  }
}

function detectConflicts(
  fields: FieldEvidenceStatus[],
  evidence: Evidence[],
): SourceConflict[] {
  const conflicts: SourceConflict[] = [];

  fields.forEach((fieldStatus) => {
    if (fieldStatus.status !== "conflicting") {
      return;
    }

    conflicts.push({
      field: fieldStatus.field,
      sourceIds: fieldStatus.sourceIds,
      description:
        fieldStatus.conflictDetails ??
        `Conflito não resolvido no campo ${fieldStatus.field}.`,
    });
  });

  if (evidence.length >= 2) {
    const level6Only = evidence.every((item) => item.level >= 6);
    if (level6Only) {
      conflicts.push({
        field: "specialty",
        sourceIds: evidence.map((item) => item.id),
        description: "Apenas fontes nível 6 sem confirmação cruzada.",
      });
    }
  }

  return conflicts;
}

/**
 * Avalia evidências e produz relatório determinístico por campo.
 */
export function evaluateEvidence(
  candidate: DoctorCandidate,
  evidence: Evidence[],
): EvidenceReport {
  const fields: FieldEvidenceStatus[] = TRACKED_FIELDS.map((field) => {
    const supportingEvidence = evidence.filter((item) => item.supportsFields.includes(field));
    const status = fieldStatusFromCandidate(field, candidate, supportingEvidence, evidence);

    return {
      field,
      status,
      sourceIds: supportingEvidence.map((item) => item.id),
    };
  });

  const conflicts = detectConflicts(fields, evidence);
  const level1to3Count = evidence.filter((item) => isHighTrustLevel(item.level)).length;
  const level1to4Count = evidence.filter((item) => isPublishableTrustLevel(item.level)).length;
  const highestTrustLevel =
    evidence.length === 0 ? null : (Math.min(...evidence.map((item) => item.level)) as EvidenceReport["highestTrustLevel"]);

  const onlyLowTrustSources =
    evidence.length > 0 && evidence.every((item) => item.level >= 6);

  const enrichedFields = fields.map((fieldStatus) => {
    const isCritical = CRITICAL_FIELDS.includes(fieldStatus.field);
    const conflict = conflicts.find((item) => item.field === fieldStatus.field);

    if (conflict && isCritical) {
      return {
        ...fieldStatus,
        status: "conflicting" as const,
        conflictDetails: conflict.description,
      };
    }

    return fieldStatus;
  });

  return {
    fields: enrichedFields,
    conflicts,
    highestTrustLevel,
    level1to3Count,
    level1to4Count,
    totalSources: evidence.length,
    onlyLowTrustSources,
  };
}
