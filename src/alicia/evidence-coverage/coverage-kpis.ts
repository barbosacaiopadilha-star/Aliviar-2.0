import { EVIDENCE_CATEGORIES } from "./constants";
import type { CandidateCoverageAnalysis, CoverageKpis } from "./types";

export class CoverageKpiCalculator {
  compute(analyses: CandidateCoverageAnalysis[]): CoverageKpis {
    const byCategory = Object.fromEntries(
      EVIDENCE_CATEGORIES.map((cat) => [cat, 0]),
    ) as Record<(typeof EVIDENCE_CATEGORIES)[number], number>;

    const bySpecialty: Record<string, number> = {};
    const byConnector: Record<string, number> = {};
    const byCandidate: Record<string, number> = {};
    const specialtyAgg: Record<string, { sum: number; count: number }> = {};

    let totalCoverage = 0;
    let oneEvidenceAwayCount = 0;

    for (const analysis of analyses) {
      totalCoverage += analysis.coveragePercent;
      byCandidate[analysis.candidateId] = analysis.coveragePercent;

      const agg = specialtyAgg[analysis.specialty] ?? { sum: 0, count: 0 };
      agg.sum += analysis.coveragePercent;
      agg.count += 1;
      specialtyAgg[analysis.specialty] = agg;

      if (analysis.missing.length === 1) {
        oneEvidenceAwayCount += 1;
      }

      for (const category of EVIDENCE_CATEGORIES) {
        const isMissing = analysis.missing.some((m) => m.category === category);
        if (!isMissing) {
          byCategory[category] += 1;
        }
      }

      for (const existing of analysis.existing) {
        for (const source of existing.sources) {
          byConnector[source] = (byConnector[source] ?? 0) + 1;
        }
      }
    }

    const candidateCount = analyses.length || 1;

    for (const [specialty, agg] of Object.entries(specialtyAgg)) {
      bySpecialty[specialty] = Math.round(agg.sum / agg.count);
    }

    for (const category of EVIDENCE_CATEGORIES) {
      byCategory[category] = Math.round((byCategory[category] / candidateCount) * 100);
    }

    return {
      averageCoverage: Math.round(totalCoverage / candidateCount),
      byCategory,
      byConnector,
      bySpecialty,
      byCandidate,
      oneEvidenceAwayCount,
    };
  }
}
