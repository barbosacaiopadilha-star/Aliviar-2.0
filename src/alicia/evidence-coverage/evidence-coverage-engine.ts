import { CATEGORY_CONNECTOR_HINTS, EVIDENCE_CATEGORIES } from "./constants";
import type {
  CandidateCoverageAnalysis,
  ConnectorImpactEstimate,
  EvidenceCoverageReport,
  EvidenceCoverageSnapshot,
  MissingEvidenceReport,
} from "./types";
import { AcquisitionPlanner } from "./acquisition-planner";
import { CandidatePrioritizer } from "./candidate-prioritizer";
import { CoverageAnalyzer } from "./coverage-analyzer";
import { CoverageKpiCalculator } from "./coverage-kpis";
import { MissingEvidenceReportBuilder } from "./missing-evidence-report";

export class ConnectorImpactEstimator {
  estimate(
    analyses: CandidateCoverageAnalysis[],
    currentAverage: number,
  ): ConnectorImpactEstimate[] {
    const candidateCount = analyses.length || 1;
    const estimates: ConnectorImpactEstimate[] = [];

    for (const connectorId of [
      "cfm",
      "crm-estadual",
      "hospital",
      "universidade",
      "sociedade-medica",
      "site-institucional",
    ]) {
      let categoriesAddressable = 0;
      const helpedCandidates = new Set<string>();

      for (const analysis of analyses) {
        for (const missing of analysis.missing) {
          const hints = CATEGORY_CONNECTOR_HINTS[missing.category];
          if (hints.includes(connectorId)) {
            categoriesAddressable += 1;
            helpedCandidates.add(analysis.candidateId);
          }
        }
      }

      const potentialGain = Math.round(
        (categoriesAddressable / (candidateCount * EVIDENCE_CATEGORIES.length)) * 100,
      );

      estimates.push({
        connectorId,
        missingCategoriesAddressable: categoriesAddressable,
        candidatesHelped: helpedCandidates.size,
        estimatedCoverageIncrease: Math.min(
          100 - currentAverage,
          potentialGain,
        ),
      });
    }

    return estimates.sort(
      (a, b) => b.estimatedCoverageIncrease - a.estimatedCoverageIncrease,
    );
  }
}

export class EvidenceCoverageEngine {
  private readonly analyzer = new CoverageAnalyzer();
  private readonly missingBuilder = new MissingEvidenceReportBuilder();
  private readonly planner = new AcquisitionPlanner();
  private readonly kpiCalculator = new CoverageKpiCalculator();
  private readonly prioritizer = new CandidatePrioritizer();
  private readonly impactEstimator = new ConnectorImpactEstimator();

  analyze(
    packages: Parameters<CoverageAnalyzer["analyzeMany"]>[0],
    metaByCandidate: Parameters<CoverageAnalyzer["analyzeMany"]>[1],
  ): EvidenceCoverageSnapshot {
    const analyses = this.analyzer.analyzeMany(packages, metaByCandidate);
    const missingReport = this.missingBuilder.build(analyses);
    const acquisitionPlan = this.planner.build(analyses);
    const kpis = this.kpiCalculator.compute(analyses);
    const prioritized = this.prioritizer.prioritize(analyses);
    const connectorImpact = this.impactEstimator.estimate(analyses, kpis.averageCoverage);

    return {
      generatedAt: new Date().toISOString(),
      analyses,
      missingReport,
      acquisitionPlan,
      kpis,
      prioritized,
      connectorImpact,
    };
  }
}

export function formatEvidenceCoverageReportMarkdown(
  snapshot: EvidenceCoverageSnapshot,
): string {
  const { kpis, missingReport, connectorImpact, prioritized } = snapshot;

  const topMissing = [...missingReport.byCategory].sort(
    (a, b) => b.candidateCount - a.candidateCount,
  );

  return `# Relatório de Cobertura de Evidências — Piloto ES

**Gerado em:** ${snapshot.generatedAt}

---

## KPIs

| Indicador | Valor |
|-----------|------:|
| Cobertura média | ${kpis.averageCoverage}% |
| Candidatos a uma evidência de completude | ${kpis.oneEvidenceAwayCount} |
| Candidatos analisados | ${missingReport.totalCandidates} |

### Cobertura por categoria (% candidatos com categoria completa)

${EVIDENCE_CATEGORIES.map(
  (cat) => `- **${cat}:** ${kpis.byCategory[cat]}%`,
).join("\n")}

### Cobertura por especialidade

${Object.entries(kpis.bySpecialty)
  .map(([spec, pct]) => `- **${spec}:** ${Math.round(pct)}%`)
  .join("\n")}

### Cobertura por conector (contribuições registradas)

${Object.entries(kpis.byConnector).length > 0
  ? Object.entries(kpis.byConnector)
      .map(([conn, count]) => `- **${conn}:** ${count} evidência(s)`)
      .join("\n")
  : "- Nenhuma contribuição de conector registrada"}

---

## Evidências faltantes com maior frequência

${topMissing.length > 0
  ? topMissing
      .map(
        (item) =>
          `### ${item.category}\n\n- Candidatos afetados: **${item.candidateCount}**\n- Campos: ${item.missingFields.join(", ") || "—"}`,
      )
      .join("\n\n")
  : "_Nenhuma lacuna identificada._"}

---

## Conectores que podem suprir lacunas

${connectorImpact
  .filter((c) => c.estimatedCoverageIncrease > 0)
  .map(
    (c) =>
      `- **${c.connectorId}:** +${c.estimatedCoverageIncrease}% estimado · ${c.candidatesHelped} candidato(s) · ${c.missingCategoriesAddressable} categoria(s) endereçável(is)`,
  )
  .join("\n")}

---

## Candidatos a uma evidência de completude

${prioritized.filter((p) => p.oneEvidenceAway).length > 0
  ? prioritized
      .filter((p) => p.oneEvidenceAway)
      .map(
        (p) =>
          `- **${p.name}** (${p.specialty}) — falta: ${snapshot.analyses.find((a) => a.candidateId === p.candidateId)?.missing.map((m) => m.category).join(", ")}`,
      )
      .join("\n")
  : "_Nenhum candidato a exatamente uma categoria faltante._"}

---

## Priorização (maior retorno de coleta / menor esforço)

| Rank | Candidato | Especialidade | Cobertura | Faltantes | Conectores sugeridos |
|-----:|-----------|---------------|----------:|----------:|----------------------|
${prioritized
  .map(
    (p) =>
      `| ${p.rank} | ${p.name} | ${p.specialty} | ${p.coveragePercent}% | ${p.missingCount} | ${p.suggestedConnectors.join(", ") || "—"} |`,
  )
  .join("\n")}

---

## Notas

- Este relatório **não altera** decisões do Protocol Engine.
- Nenhum dado foi inventado — análise baseada exclusivamente em packages de evidência existentes.
- O plano de aquisição indica conectores prováveis; **não executa** consultas automáticas.
`;
}

export function buildEvidenceCoverageReport(
  snapshot: EvidenceCoverageSnapshot,
): EvidenceCoverageReport {
  return {
    generatedAt: snapshot.generatedAt,
    kpis: snapshot.kpis,
    missingReport: snapshot.missingReport,
    connectorImpact: snapshot.connectorImpact,
    prioritized: snapshot.prioritized,
    oneEvidenceAwayCount: snapshot.kpis.oneEvidenceAwayCount,
  };
}
