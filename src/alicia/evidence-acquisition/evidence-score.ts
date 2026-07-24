import { SECTION_FIELD_MAP } from "./constants";
import type { CoverageScore, EvidencePackage, NormalizedCandidateEvidence } from "./types";

function fieldFilled(
  merged: NormalizedCandidateEvidence,
  fieldName: string,
): boolean {
  const field = merged.fields.get(fieldName);
  if (!field || field.values.length === 0) {
    return false;
  }
  return field.values.some((item) => Boolean(item.value.trim()));
}

export class EvidenceScoreCalculator {
  calculate(merged: NormalizedCandidateEvidence): CoverageScore[] {
    return (Object.keys(SECTION_FIELD_MAP) as Array<keyof typeof SECTION_FIELD_MAP>).map(
      (section) => {
        const fields = SECTION_FIELD_MAP[section];
        const filledFields = fields.filter((field) => fieldFilled(merged, field)).length;
        const totalFields = fields.length;
        const percentage =
          totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100);

        return {
          section,
          percentage,
          filledFields,
          totalFields,
        };
      },
    );
  }

  averageCoverage(coverage: CoverageScore[]): number {
    if (coverage.length === 0) {
      return 0;
    }
    const total = coverage.reduce((sum, item) => sum + item.percentage, 0);
    return Math.round(total / coverage.length);
  }

  fromPackage(pkg: EvidencePackage): number {
    if (pkg.coverage.length === 0) {
      return 0;
    }
    return this.averageCoverage(pkg.coverage);
  }
}
