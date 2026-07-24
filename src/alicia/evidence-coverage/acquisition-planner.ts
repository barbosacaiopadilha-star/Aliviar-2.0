import { CATEGORY_CONNECTOR_HINTS } from "./constants";
import type {
  AcquisitionPlan,
  AcquisitionPlanEntry,
  CandidateCoverageAnalysis,
} from "./types";

export class AcquisitionPlanner {
  build(analyses: CandidateCoverageAnalysis[]): AcquisitionPlan {
    const entries: AcquisitionPlanEntry[] = [];

    for (const analysis of analyses) {
      for (const missing of analysis.missing) {
        entries.push({
          candidateId: analysis.candidateId,
          candidateName: analysis.name,
          category: missing.category,
          missingFields: missing.fields,
          suggestedConnectors: [...CATEGORY_CONNECTOR_HINTS[missing.category]],
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      entries,
    };
  }

  connectorsForCandidate(analysis: CandidateCoverageAnalysis): string[] {
    const connectors = new Set<string>();
    for (const missing of analysis.missing) {
      for (const connector of CATEGORY_CONNECTOR_HINTS[missing.category]) {
        connectors.add(connector);
      }
    }
    return [...connectors];
  }
}
