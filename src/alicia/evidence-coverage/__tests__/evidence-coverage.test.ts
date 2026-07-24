import { describe, expect, it, beforeEach } from "vitest";

import type { EvidencePackage } from "@/alicia/evidence-acquisition";
import { COVERAGE_SECTIONS } from "@/alicia/evidence-acquisition/constants";

import { AcquisitionPlanner } from "../acquisition-planner";
import { CandidatePrioritizer } from "../candidate-prioritizer";
import { CoverageAnalyzer } from "../coverage-analyzer";
import { CoverageKpiCalculator } from "../coverage-kpis";
import {
  ConnectorImpactEstimator,
  EvidenceCoverageEngine,
  formatEvidenceCoverageReportMarkdown,
  buildEvidenceCoverageReport,
} from "../evidence-coverage-engine";
import { MissingEvidenceReportBuilder } from "../missing-evidence-report";
import { resetEvidenceCoverageSession } from "../studio-adapter";
import * as api from "../index";

const META = new Map([
  ["cand-full", { name: "Dr. Completo", specialty: "Ortopedia", city: "Vitória" }],
  ["cand-partial", { name: "Dra. Parcial", specialty: "Neurocirurgia", city: "Serra" }],
  ["cand-empty", { name: "Dr. Vazio", specialty: "Ortopedia", city: "Cariacica" }],
]);

function baseCoverage(partial: Partial<Record<string, number>> = {}): EvidencePackage["coverage"] {
  return COVERAGE_SECTIONS.map((section) => ({
    section,
    percentage: partial[section] ?? 0,
    filledFields: partial[section] === 100 ? 2 : 0,
    totalFields: 2,
  }));
}

function mockPackage(
  candidateId: string,
  options: {
    coverage?: EvidencePackage["coverage"];
    conflicts?: EvidencePackage["conflicts"];
    evidence?: EvidencePackage["evidence"];
    identity?: EvidencePackage["identity"];
    specialties?: EvidencePackage["specialties"];
    practiceLocations?: EvidencePackage["practiceLocations"];
  } = {},
): EvidencePackage {
  return {
    packageId: `pkg-${candidateId}`,
    candidateId,
    identity: options.identity ?? { nome: META.get(candidateId)?.name, crm: "12345", crmUf: "ES" },
    registrations: [],
    education: [],
    residency: [],
    fellowship: [],
    institutions: [],
    specialties: options.specialties ?? [
      { primary: META.get(candidateId)?.specialty ?? "Ortopedia", provenance: [] },
    ],
    practiceLocations: options.practiceLocations ?? [
      { city: META.get(candidateId)?.city ?? "Vitória", state: "ES", provenance: [] },
    ],
    evidence: options.evidence ?? [],
    conflicts: options.conflicts ?? [],
    coverage: options.coverage ?? baseCoverage(),
    metadata: {
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
      version: 1,
      sourceCount: 1,
      connectorIds: ["cfm"],
      normalizationVersion: "1.0.0",
      runId: "run-test",
    },
  };
}

describe("Evidence Coverage Expansion", () => {
  beforeEach(() => {
    resetEvidenceCoverageSession();
  });

  describe("CoverageAnalyzer", () => {
    it("identifica evidências existentes, ausentes e conflitantes", () => {
      const analyzer = new CoverageAnalyzer();
      const pkg = mockPackage("cand-partial", {
        coverage: baseCoverage({ Identity: 100, Registrations: 100, Education: 0, Residency: 0 }),
        conflicts: [
          {
            id: "c1",
            type: "city_mismatch",
            field: "cidade",
            values: [
              { value: "Vitória", sources: ["cfm"] },
              { value: "Serra", sources: ["hospital"] },
            ],
            detectedAt: "2026-07-23T00:00:00.000Z",
          },
        ],
        evidence: [
          {
            id: "ev-1",
            category: "registration",
            field: "crm",
            value: "12345",
            provenance: [
              {
                connectorId: "cfm",
                connectorVersion: "1.0",
                sourceName: "CFM",
                sourceUrl: "",
                fetchTimestamp: "2026-07-23T00:00:00.000Z",
                rawHash: "abc",
                normalizationVersion: "1.0.0",
                confidenceDaFonte: 0.9,
              },
            ],
          },
        ],
      });

      const analysis = analyzer.analyzePackage(pkg, META.get("cand-partial")!);

      expect(analysis.existing.length).toBeGreaterThan(0);
      expect(analysis.missing.some((m) => m.category === "Graduação")).toBe(true);
      expect(analysis.conflicting).toHaveLength(1);
      expect(analysis.conflicting[0]!.category).toBe("Localização");
    });

    it("analisa múltiplos packages com meta fallback", () => {
      const analyzer = new CoverageAnalyzer();
      const packages = [
        mockPackage("cand-full", { coverage: baseCoverage(Object.fromEntries(COVERAGE_SECTIONS.map((s) => [s, 100]))) }),
        mockPackage("cand-empty"),
      ];

      const results = analyzer.analyzeMany(packages, META);
      expect(results).toHaveLength(2);
      expect(results[0]!.coveragePercent).toBeGreaterThan(results[1]!.coveragePercent);
    });

    it("trata cobertura parcial de seção", () => {
      const analyzer = new CoverageAnalyzer();
      const pkg = mockPackage("cand-partial", {
        coverage: [
          { section: "Education", percentage: 50, filledFields: 1, totalFields: 2 },
          { section: "Residency", percentage: 50, filledFields: 1, totalFields: 2 },
        ],
      });
      const analysis = analyzer.analyzePackage(pkg, META.get("cand-partial")!);
      expect(analysis.missing.some((m) => m.category === "Graduação")).toBe(true);
      expect(analysis.existing.some((e) => e.category === "Graduação")).toBe(true);
    });

    it("usa fallback de meta do package quando ausente no mapa", () => {
      const analyzer = new CoverageAnalyzer();
      const pkg = mockPackage("cand-unknown", {
        identity: { nome: "Dr. Unknown" },
        specialties: [{ primary: "Ortopedia", provenance: [] }],
        practiceLocations: [{ city: "Vitória", state: "ES", provenance: [] }],
      });
      const results = analyzer.analyzeMany([pkg], new Map());
      expect(results[0]!.name).toBe("Dr. Unknown");
    });
  });

  describe("MissingEvidenceReport", () => {
    it("classifica lacunas por categoria", () => {
      const engine = new EvidenceCoverageEngine();
      const snapshot = engine.analyze(
        [mockPackage("cand-partial"), mockPackage("cand-empty")],
        META,
      );

      expect(snapshot.missingReport.byCategory.length).toBeGreaterThan(0);
      expect(snapshot.missingReport.totalCandidates).toBe(2);
      const grad = snapshot.missingReport.byCategory.find((c) => c.category === "Graduação");
      expect(grad?.candidateCount).toBeGreaterThan(0);
    });
  });

  describe("AcquisitionPlanner", () => {
    it("sugere conectores sem executar fetch", () => {
      const planner = new AcquisitionPlanner();
      const builder = new MissingEvidenceReportBuilder();
      const analyzer = new CoverageAnalyzer();
      const analyses = analyzer.analyzeMany([mockPackage("cand-empty")], META);
      const plan = planner.build(analyses);

      expect(plan.entries.length).toBeGreaterThan(0);
      const residency = plan.entries.find((e) => e.category === "Residência");
      expect(residency).toBeDefined();
      expect(residency!.suggestedConnectors).toContain("hospital");
      expect(builder.build(analyses).byCategory).toBeDefined();
    });
  });

  describe("Coverage KPIs", () => {
    it("calcula KPIs por categoria, conector, especialidade e candidato", () => {
      const calculator = new CoverageKpiCalculator();
      const analyzer = new CoverageAnalyzer();
      const analyses = analyzer.analyzeMany(
        [
          mockPackage("cand-full", {
            coverage: baseCoverage(Object.fromEntries(COVERAGE_SECTIONS.map((s) => [s, 100]))),
            evidence: [
              {
                id: "ev-crm",
                category: "registration",
                field: "crm",
                value: "12345",
                provenance: [
                  {
                    connectorId: "crm-estadual",
                    connectorVersion: "1.0",
                    sourceName: "CRM",
                    sourceUrl: "",
                    fetchTimestamp: "2026-07-23T00:00:00.000Z",
                    rawHash: "x",
                    normalizationVersion: "1.0.0",
                    confidenceDaFonte: 0.9,
                  },
                ],
              },
            ],
          }),
          mockPackage("cand-partial"),
        ],
        META,
      );

      const kpis = calculator.compute(analyses);
      expect(kpis.averageCoverage).toBeGreaterThan(0);
      expect(kpis.byCandidate["cand-full"]).toBe(100);
      expect(kpis.byConnector["crm-estadual"]).toBeGreaterThan(0);
      expect(kpis.bySpecialty["Ortopedia"]).toBeDefined();
      expect(kpis.oneEvidenceAwayCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("CandidatePrioritizer", () => {
    it("ordena por menor esforço de coleta", () => {
      const prioritizer = new CandidatePrioritizer();
      const engine = new EvidenceCoverageEngine();
      const snapshot = engine.analyze(
        [
          mockPackage("cand-full", {
            coverage: baseCoverage(Object.fromEntries(COVERAGE_SECTIONS.map((s) => [s, 100]))),
          }),
          mockPackage("cand-partial", {
            coverage: baseCoverage({ Identity: 100, Registrations: 100 }),
          }),
          mockPackage("cand-empty"),
        ],
        META,
      );

      const prioritized = prioritizer.prioritize(snapshot.analyses);
      expect(prioritized[0]!.rank).toBe(1);
      expect(prioritized[0]!.coveragePercent).toBeGreaterThanOrEqual(
        prioritized[prioritized.length - 1]!.coveragePercent,
      );
    });
  });

  describe("ConnectorImpactEstimator", () => {
    it("estima aumento de cobertura por conector", () => {
      const estimator = new ConnectorImpactEstimator();
      const engine = new EvidenceCoverageEngine();
      const snapshot = engine.analyze([mockPackage("cand-empty")], META);
      const impact = estimator.estimate(snapshot.analyses, snapshot.kpis.averageCoverage);

      expect(impact.length).toBeGreaterThan(0);
      expect(impact.some((i) => i.estimatedCoverageIncrease >= 0)).toBe(true);
    });
  });

  describe("EvidenceCoverageEngine", () => {
    it("integra análise completa", () => {
      const engine = new EvidenceCoverageEngine();
      const snapshot = engine.analyze([mockPackage("cand-partial")], META);

      expect(snapshot.analyses).toHaveLength(1);
      expect(snapshot.acquisitionPlan.entries.length).toBeGreaterThan(0);
      expect(snapshot.prioritized).toHaveLength(1);
      expect(snapshot.connectorImpact.length).toBeGreaterThan(0);
    });
  });

  describe("Relatório", () => {
    it("gera markdown estruturado", () => {
      const engine = new EvidenceCoverageEngine();
      const snapshot = engine.analyze(
        [mockPackage("cand-partial"), mockPackage("cand-empty")],
        META,
      );

      const markdown = formatEvidenceCoverageReportMarkdown(snapshot);
      const report = buildEvidenceCoverageReport(snapshot);

      expect(markdown).toContain("Cobertura média");
      expect(markdown).toContain("Conectores que podem suprir lacunas");
      expect(report.oneEvidenceAwayCount).toBeGreaterThanOrEqual(0);
      expect(markdown).toContain("Priorização");
    });

    it("formata relatório sem conectores e com candidato a uma evidência", () => {
      const engine = new EvidenceCoverageEngine();
      const full = Object.fromEntries(COVERAGE_SECTIONS.map((s) => [s, 100])) as Record<string, number>;
      full.Education = 0;
      const snapshot = engine.analyze(
        [mockPackage("cand-one-away", { coverage: baseCoverage(full) })],
        new Map([["cand-one-away", { name: "Dr. Quase", specialty: "Ortopedia", city: "Vitória" }]]),
      );

      expect(snapshot.kpis.oneEvidenceAwayCount).toBe(1);
      const markdown = formatEvidenceCoverageReportMarkdown(snapshot);
      expect(markdown).toContain("Dr. Quase");
    });
  });

  describe("API pública", () => {
    it("exporta módulos", () => {
      expect(api.EVIDENCE_COVERAGE_VERSION).toBe("1.0.0");
      expect(api.CoverageAnalyzer).toBeDefined();
      expect(api.getEvidenceCoverageSnapshot).toBeDefined();
    });
  });
});
