import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import type { DuplicateCandidate } from "../types";

const CRM_PATTERN = /\bCRM[-\s]?([A-Z]{2})\s*([\d.]+)/i;

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(dr|dra|de|da|dos|das)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractCrmKey(record: DoctorImportRecord): string | null {
  for (const source of record.transparency.sources) {
    const match = source.name.match(CRM_PATTERN);
    if (match) {
      return `${match[1]}-${match[2].replace(/\./g, "")}`;
    }
  }

  return null;
}

function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeName(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeName(b).split(" ").filter(Boolean));
  const intersection = [...tokensA].filter((token) => tokensB.has(token));

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  return intersection.length / Math.max(tokensA.size, tokensB.size);
}

export function findDuplicateCandidates(records: DoctorImportRecord[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (let index = 0; index < records.length; index += 1) {
    for (let inner = index + 1; inner < records.length; inner += 1) {
      const recordA = records[index];
      const recordB = records[inner];
      const reasons: string[] = [];
      let score = 0;

      const crmA = extractCrmKey(recordA);
      const crmB = extractCrmKey(recordB);
      if (crmA && crmB && crmA === crmB) {
        reasons.push("Mesmo CRM");
        score += 100;
      }

      const nameScore = tokenSimilarity(recordA.name, recordB.name);
      if (nameScore >= 0.8) {
        reasons.push("Nome muito semelhante");
        score += Math.round(nameScore * 60);
      }

      if (
        recordA.specialty === recordB.specialty &&
        recordA.location.city === recordB.location.city
      ) {
        reasons.push("Mesma especialidade e cidade");
        score += 20;
      }

      if (score >= 60) {
        candidates.push({
          doctorIdA: recordA.id,
          doctorIdB: recordB.id,
          score,
          reasons,
        });
      }
    }
  }

  return candidates.sort((left, right) => right.score - left.score);
}

export function deduplicateImportRecords(records: DoctorImportRecord[]): {
  records: DoctorImportRecord[];
  removedDoctorIds: string[];
  duplicates: DuplicateCandidate[];
} {
  const duplicates = findDuplicateCandidates(records);
  const removed = new Set<string>();

  duplicates.forEach((candidate) => {
    if (candidate.score >= 100) {
      removed.add(candidate.doctorIdB);
    }
  });

  return {
    records: records.filter((record) => !removed.has(record.id)),
    removedDoctorIds: [...removed],
    duplicates,
  };
}
