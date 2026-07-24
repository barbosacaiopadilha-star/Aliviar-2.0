import type { EvidencePackage } from "@/alicia/evidence-acquisition";
import { EvidenceScoreCalculator } from "@/alicia/evidence-acquisition/evidence-score";
import { SECTION_FIELD_MAP } from "@/alicia/evidence-acquisition/constants";

import {
  CATEGORY_TO_SECTION,
  CONFLICT_FIELD_TO_CATEGORY,
  EVIDENCE_CATEGORIES,
  SECTION_COMPLETE_THRESHOLD,
  type EvidenceCategory,
} from "./constants";
import type {
  CandidateCoverageAnalysis,
  CategoryEvidenceItem,
  ConflictingEvidenceItem,
} from "./types";

function uniqueSources(pkg: EvidencePackage, sections: readonly string[]): string[] {
  const sources = new Set<string>();
  for (const item of pkg.evidence) {
    const sectionMatch = sections.some((section) =>
      (SECTION_FIELD_MAP[section as keyof typeof SECTION_FIELD_MAP] ?? []).includes(item.field),
    );
    if (sectionMatch) {
      for (const prov of item.provenance) {
        sources.add(prov.connectorId);
      }
    }
  }
  return [...sources];
}

function sectionCoverage(
  pkg: EvidencePackage,
  sections: readonly string[],
): { percent: number; filled: string[]; missing: string[] } {
  const relevant = pkg.coverage.filter((score) =>
    sections.includes(score.section),
  );

  if (relevant.length === 0) {
    const allFields = sections.flatMap(
      (s) => SECTION_FIELD_MAP[s as keyof typeof SECTION_FIELD_MAP] ?? [],
    );
    return { percent: 0, filled: [], missing: [...allFields] };
  }

  const filled: string[] = [];
  const missing: string[] = [];

  for (const score of relevant) {
    const fields = SECTION_FIELD_MAP[score.section as keyof typeof SECTION_FIELD_MAP] ?? [];
    if (score.percentage >= SECTION_COMPLETE_THRESHOLD) {
      filled.push(...fields);
    } else if (score.filledFields === 0) {
      missing.push(...fields);
    } else {
      const filledCount = score.filledFields;
      filled.push(...fields.slice(0, filledCount));
      missing.push(...fields.slice(filledCount));
    }
  }

  const totalPercent = Math.round(
    relevant.reduce((sum, s) => sum + s.percentage, 0) / relevant.length,
  );

  return { percent: totalPercent, filled, missing };
}

function mapConflicts(pkg: EvidencePackage): ConflictingEvidenceItem[] {
  return pkg.conflicts.map((conflict) => ({
    category: CONFLICT_FIELD_TO_CATEGORY[conflict.field] ?? "Fontes",
    field: conflict.field,
    conflictType: conflict.type,
    values: conflict.values,
  }));
}

export class CoverageAnalyzer {
  private readonly scoreCalculator = new EvidenceScoreCalculator();

  analyzePackage(
    pkg: EvidencePackage,
    meta: { name: string; specialty: string; city: string },
  ): CandidateCoverageAnalysis {
    const existing: CategoryEvidenceItem[] = [];
    const missing: CategoryEvidenceItem[] = [];

    for (const category of EVIDENCE_CATEGORIES) {
      const sections = CATEGORY_TO_SECTION[category];
      const { percent, filled, missing: missingFields } = sectionCoverage(pkg, sections);
      const sources = uniqueSources(pkg, sections);

      if (percent >= SECTION_COMPLETE_THRESHOLD && missingFields.length === 0) {
        existing.push({
          category,
          fields: filled,
          sources,
          coveragePercent: percent,
        });
      } else if (percent === 0 && filled.length === 0) {
        missing.push({
          category,
          fields: missingFields,
          sources: [],
          coveragePercent: 0,
        });
      } else {
        if (filled.length > 0) {
          existing.push({
            category,
            fields: filled,
            sources,
            coveragePercent: percent,
          });
        }
        if (missingFields.length > 0) {
          missing.push({
            category,
            fields: missingFields,
            sources: [],
            coveragePercent: percent,
          });
        }
      }
    }

    return {
      candidateId: pkg.candidateId,
      name: meta.name,
      specialty: meta.specialty,
      city: meta.city,
      coveragePercent: this.scoreCalculator.fromPackage(pkg),
      existing,
      missing,
      conflicting: mapConflicts(pkg),
    };
  }

  analyzeMany(
    packages: EvidencePackage[],
    metaByCandidate: Map<string, { name: string; specialty: string; city: string }>,
  ): CandidateCoverageAnalysis[] {
    return packages.map((pkg) => {
      const meta = metaByCandidate.get(pkg.candidateId) ?? {
        name: pkg.identity.nome ?? pkg.candidateId,
        specialty: pkg.specialties[0]?.primary ?? "—",
        city: pkg.practiceLocations[0]?.city ?? "—",
      };
      return this.analyzePackage(pkg, meta);
    });
  }
}
