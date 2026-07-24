import { describe, expect, it, beforeEach } from "vitest";

import * as api from "../index";
import {
  getOperationsCenterSnapshot,
  resetOperationsSession,
} from "../studio-adapter";
import { OperationalAlerts } from "../operational-alerts";
import { PipelineAnalytics } from "../pipeline-analytics";
import { PipelineStageCollector } from "../pipeline-stage-collector";
import { BottleneckDetector } from "../bottleneck-detector";
import { mockOperationsInput } from "../mocks/operations-input";

describe("operations modules coverage", () => {
  beforeEach(() => {
    resetOperationsSession();
  });

  it("cobre studio adapter snapshot", async () => {
    const snapshot = await getOperationsCenterSnapshot({ refresh: true });
    expect(snapshot.dashboard).toHaveLength(5);
    expect(snapshot.kpis).toBeDefined();
    expect(snapshot.history.length).toBeGreaterThan(0);
  }, 30_000);

  it("cobre studio adapter sem refresh com sessão existente", async () => {
    await getOperationsCenterSnapshot({ refresh: true });
    const snapshot = await getOperationsCenterSnapshot();
    expect(snapshot.dashboard.length).toBe(5);
  }, 30_000);

  it("cobre review spike alert", () => {
    const alerts = new OperationalAlerts();
    const analytics = new PipelineAnalytics();
    const stages = new PipelineStageCollector().collect(mockOperationsInput);
    const analyticsResult = analytics.compute(stages, mockOperationsInput);

    const generated = alerts.generate(
      mockOperationsInput,
      analyticsResult,
      new Date().toISOString(),
      2,
    );

    expect(generated.some((a) => a.type === "review_spike")).toBe(true);
  });

  it("cobre growing queue bottleneck", () => {
    const detector = new BottleneckDetector();
    const analytics = new PipelineAnalytics();
    const stages = new PipelineStageCollector().collect(mockOperationsInput);
    const analyticsResult = analytics.compute(stages, mockOperationsInput);

    const bottlenecks = detector.detect(
      stages,
      analyticsResult,
      mockOperationsInput,
      1,
      new Date().toISOString(),
    );

    expect(bottlenecks.some((b) => b.type === "growing_queue")).toBe(true);
  });

  it("cobre abnormal latency bottleneck", () => {
    const detector = new BottleneckDetector();
    const analytics = new PipelineAnalytics();
    const slowInput = {
      ...mockOperationsInput,
      discovery: {
        ...mockOperationsInput.discovery,
        metrics: {
          ...mockOperationsInput.discovery.metrics,
          averageDurationMs: 10_000,
        },
      },
    };
    const stages = new PipelineStageCollector().collect(slowInput);

    for (let i = 0; i < 20; i++) {
      analytics.recordLatency(10_000);
    }

    const analyticsResult = analytics.compute(stages, slowInput);
    const bottlenecks = detector.detect(
      stages,
      analyticsResult,
      slowInput,
      0,
      new Date().toISOString(),
    );

    expect(bottlenecks.some((b) => b.type === "slow_stage")).toBe(true);
  });

  it("exporta API pública", () => {
    expect(api.OPERATIONS_VERSION).toBe("1.0.0");
    expect(api.OperationsEngine).toBeDefined();
    expect(api.PipelineStageCollector).toBeDefined();
    expect(api.getOperationsCenterSnapshot).toBeDefined();
  });
});
