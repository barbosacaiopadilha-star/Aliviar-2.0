import { hashPayload } from "./hash";
import type { PublicCatalogRecord, UpdateClassification } from "./types";

function getNestedValue(record: PublicCatalogRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
}

export function classifyUpdate(
  current: PublicCatalogRecord | undefined,
  next: PublicCatalogRecord,
): UpdateClassification {
  if (!current) {
    return "MINOR_UPDATE";
  }

  const currentHash = hashPayload(current);
  const nextHash = hashPayload(next);

  if (currentHash === nextHash) {
    return "NO_CHANGE";
  }

  const materialFields = [
    "name",
    "specialty",
    "location.city",
    "location.lat",
    "location.lng",
    "graduation.institution",
    "mainInstitution",
  ];

  const materialChanged = materialFields.some(
    (field) => getNestedValue(current, field) !== getNestedValue(next, field),
  );

  if (materialChanged) {
    const sourceLoss =
      current.transparency.sources.length > next.transparency.sources.length;
    const newConflicts = next.transparency.unverifiedFields.length > current.transparency.unverifiedFields.length;

    if (sourceLoss || newConflicts) {
      return "REVIEW_REQUIRED";
    }

    return "MATERIAL_UPDATE";
  }

  return "MINOR_UPDATE";
}

export function buildStructuredDiff(
  current: PublicCatalogRecord,
  next: PublicCatalogRecord,
): Array<{ field: string; before: unknown; after: unknown }> {
  const fields = [
    "name",
    "specialty",
    "location.city",
    "mainInstitution",
    "whoTheyAre",
    "trajectory",
    "graduation.institution",
    "transparency.lastUpdated",
  ];

  return fields
    .map((field) => ({
      field,
      before: getNestedValue(current, field),
      after: getNestedValue(next, field),
    }))
    .filter((entry) => entry.before !== entry.after);
}
