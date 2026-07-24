import { EVIDENCE_CATEGORIES } from "./constants";
import type { CandidateCoverageAnalysis, MissingEvidenceByCategory, MissingEvidenceReport } from "./types";

export class MissingEvidenceReportBuilder {
  build(analyses: CandidateCoverageAnalysis[]): MissingEvidenceReport {
    const byCategory: MissingEvidenceByCategory[] = EVIDENCE_CATEGORIES.map((category) => {
      const candidateIds: string[] = [];
      const missingFieldsSet = new Set<string>();

      for (const analysis of analyses) {
        const missing = analysis.missing.find((m) => m.category === category);
        if (missing) {
          candidateIds.push(analysis.candidateId);
          for (const field of missing.fields) {
            missingFieldsSet.add(field);
          }
        }
      }

      return {
        category,
        candidateCount: candidateIds.length,
        candidateIds,
        missingFields: [...missingFieldsSet],
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      byCategory: byCategory.filter((item) => item.candidateCount > 0),
      totalCandidates: analyses.length,
    };
  }
}
