import type {
  ChangeDetectionResult,
  FieldChange,
  PublishedProfileSnapshot,
} from "./types";

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function listChanged(
  field: string,
  previous: string[],
  current: string[],
): FieldChange | null {
  const prev = previous.join("|");
  const curr = current.join("|");
  if (normalize(prev) === normalize(curr)) {
    return null;
  }
  return { field, previous: prev, current: curr };
}

export class ChangeDetector {
  detect(
    previous: PublishedProfileSnapshot,
    current: PublishedProfileSnapshot,
  ): ChangeDetectionResult {
    const changes: FieldChange[] = [];

    const scalarFields: Array<keyof PublishedProfileSnapshot> = [
      "crm",
      "rqe",
      "specialty",
      "city",
      "state",
      "status",
    ];

    for (const field of scalarFields) {
      const prev = String(previous[field] ?? "");
      const curr = String(current[field] ?? "");
      if (normalize(prev) !== normalize(curr)) {
        changes.push({ field, previous: prev, current: curr });
      }
    }

    const institutionChange = listChanged(
      "institutions",
      previous.institutions,
      current.institutions,
    );
    if (institutionChange) {
      changes.push(institutionChange);
    }

    const residencyChange = listChanged("residency", previous.residency, current.residency);
    if (residencyChange) {
      changes.push(residencyChange);
    }

    const sourcesChange = listChanged("sources", previous.sources, current.sources);
    if (sourcesChange) {
      changes.push(sourcesChange);
    }

    if (changes.length === 0) {
      return { classification: "NO_CHANGE", changes: [] };
    }

    const hasConflict = changes.some(
      (change) =>
        change.field === "crm" ||
        (change.field === "status" && change.current.toLowerCase().includes("inactive")),
    );

    if (hasConflict) {
      return { classification: "CONFLICT", changes };
    }

    const materialFields = new Set(["crm", "rqe", "specialty", "residency", "institutions", "status"]);
    const hasMaterial = changes.some((change) => materialFields.has(change.field));

    if (hasMaterial) {
      return { classification: "MATERIAL_CHANGE", changes };
    }

    return { classification: "MINOR_CHANGE", changes };
  }
}
