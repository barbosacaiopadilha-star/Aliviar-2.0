import { describe, expect, it } from "vitest";

import { buildCrmConfigReport } from "../config-report";
import { classifyCrmHomologation } from "../report-formatter";
import type { CrmHomologationProbeResult } from "../types";

describe("CRM homologation config", () => {
  it("detecta configuração ausente", () => {
    const report = buildCrmConfigReport({});
    expect(report.configured).toBe(false);
    expect(report.checks.find((c) => c.variable === "ALICIA_CFM_WS_CHAVE")?.present).toBe(false);
  });

  it("valida configuração completa", () => {
    const report = buildCrmConfigReport({
      ALICIA_CFM_WS_CHAVE: "test-key-12345",
      ALICIA_CRM_ESTADUAL_UF: "ES",
      ALICIA_CRM_ESTADUAL_SEED_CRMS: "45210,51332",
    });
    expect(report.configured).toBe(true);
    expect(report.seedCount).toBe(2);
  });
});

describe("CRM homologation classification", () => {
  const baseProbe: CrmHomologationProbeResult = {
    startedAt: "",
    completedAt: "",
    configured: false,
    attempts: [],
    averageLatencyMs: 0,
    successRate: 0,
    availability: 0,
    soapErrors: 0,
    timeouts: 0,
    retries: 0,
    health: "OFFLINE",
  };

  it("classifica NEEDS_IMPROVEMENT sem configuração", () => {
    const result = classifyCrmHomologation({
      config: buildCrmConfigReport({}),
      probe: baseProbe,
      pipeline: {
        coverageAverage: 0,
        coverageDeltaVsBaseline: -100,
        humanReview: 6,
        humanReviewDelta: 0,
        autoPublish: 0,
        autoPublishDelta: 0,
        publicationDryRun: 0,
        verificationAttempted: 0,
        operationsBottlenecks: 0,
      },
      problems: [],
    });
    expect(result.classification).toBe("NEEDS_IMPROVEMENT");
  });
});
