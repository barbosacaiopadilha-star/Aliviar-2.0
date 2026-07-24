import { AcquisitionPlanner } from "./acquisition-planner";
import type { CandidateCoverageAnalysis, PrioritizedCandidate } from "./types";

export class CandidatePrioritizer {
  private readonly planner = new AcquisitionPlanner();

  prioritize(analyses: CandidateCoverageAnalysis[]): PrioritizedCandidate[] {
    const scored = analyses.map((analysis) => {
      const missingCount = analysis.missing.length;
      const conflictCount = analysis.conflicting.length;
      const oneEvidenceAway = missingCount === 1;

      const priorityScore =
        100 -
        missingCount * 12 -
        conflictCount * 8 +
        analysis.coveragePercent * 0.3 +
        (oneEvidenceAway ? 15 : 0);

      return {
        candidateId: analysis.candidateId,
        name: analysis.name,
        specialty: analysis.specialty,
        city: analysis.city,
        coveragePercent: analysis.coveragePercent,
        missingCount,
        conflictCount,
        priorityScore: Math.round(priorityScore * 10) / 10,
        oneEvidenceAway,
        suggestedConnectors: this.planner.connectorsForCandidate(analysis),
      };
    });

    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    return scored.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
