import {
  extractCrmParts,
  normalizeCity,
  normalizeName,
  normalizeSpecialty,
} from "@/alicia/discovery/normalizer";

import { buildConflictId } from "./hash";
import { collectUniqueSources } from "./evidence-provenance";
import type {
  EvidenceConflict,
  EvidenceConflictType,
  NormalizedCandidateEvidence,
} from "./types";

type ConflictRule = {
  type: EvidenceConflictType;
  field: string;
  normalize: (value: string) => string;
};

const CONFLICT_RULES: ConflictRule[] = [
  { type: "crm_mismatch", field: "crm", normalize: (v) => extractCrmParts(v, "").crm },
  { type: "rqe_mismatch", field: "rqe", normalize: (v) => v.trim().toUpperCase() },
  {
    type: "specialty_mismatch",
    field: "especialidade",
    normalize: (v) => normalizeSpecialty(v).toLowerCase(),
  },
  {
    type: "institution_mismatch",
    field: "institutionName",
    normalize: (v) => v.trim().toLowerCase(),
  },
  { type: "name_mismatch", field: "nome", normalize: (v) => normalizeName(v).toLowerCase() },
  { type: "city_mismatch", field: "cidade", normalize: (v) => normalizeCity(v).toLowerCase() },
];

export class ConflictDetector {
  detect(
    candidateId: string,
    merged: NormalizedCandidateEvidence,
    detectedAt: string,
  ): EvidenceConflict[] {
    const conflicts: EvidenceConflict[] = [];

    for (const rule of CONFLICT_RULES) {
      const field = merged.fields.get(rule.field);
      if (!field || field.values.length < 2) {
        continue;
      }

      const normalizedGroups = new Map<string, { value: string; sources: string[] }>();

      for (const entry of field.values) {
        const normalized = rule.normalize(entry.value);
        if (!normalized) {
          continue;
        }

        const sources = collectUniqueSources(entry.provenance);
        const existing = normalizedGroups.get(normalized);
        if (existing) {
          for (const source of sources) {
            if (!existing.sources.includes(source)) {
              existing.sources.push(source);
            }
          }
        } else {
          normalizedGroups.set(normalized, { value: entry.value, sources });
        }
      }

      if (normalizedGroups.size < 2) {
        continue;
      }

      conflicts.push({
        id: buildConflictId(candidateId, rule.type, rule.field),
        type: rule.type,
        field: rule.field,
        values: [...normalizedGroups.values()],
        detectedAt,
      });
    }

    return conflicts;
  }
}
