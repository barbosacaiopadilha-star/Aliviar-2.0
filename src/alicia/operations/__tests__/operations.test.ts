import { describe, expect, it, beforeEach } from "vitest";

import { BottleneckDetector } from "../bottleneck-detector";
import { OperationalAlerts } from "../operational-alerts";
import { OperationalKpisCalculator } from "../operational-kpis";
import { OperationalTimelineBuilder } from "../operational-timeline";
import { OperationsEngine } from "../operations-engine";
import { OperationsHistory } from "../operations-history";
import { PipelineAnalytics } from "../pipeline-analytics";
import { PipelineStageCollector } from "../pipeline-stage-collector";
import { percentile, successRate, todayDateKey } from "../utils";
import {
  mockOperationsInput,
  mockOperationsInputHealthy,
} from "../mocks/operations-input";

describe("Operations Center", () => {
  let engine: OperationsEngine;

  beforeEach(() => {
    engine = new OperationsEngine();
  });

  it("coleta métricas de todas as etapas do pipeline", () => {
    const collector = new PipelineStageCollector();
    const stages = collector.collect(mockOperationsInput);

    expect(stages).toHaveLength(5);
    expect(stages[0]!.stage).toBe("discovery");
    expect(stages[0]!.input).toBe(10);
    expect(stages[1]!.stage).toBe("evidence");
    expect(stages[2]!.stage).toBe("protocol");
    expect(stages[4]!.stage).toBe("verification");
  });

  it("calcula analytics com P95, P99 e throughput", () => {
    const collector = new PipelineStageCollector();
    const analytics = new PipelineAnalytics();
    const stages = collector.collect(mockOperationsInput);
    const result = analytics.compute(stages, mockOperationsInput);

    expect(result.totalLatencyMs).toBeGreaterThan(0);
    expect(result.throughputPerHour).toBe(50);
    expect(result.backlog).toBeGreaterThanOrEqual(0);
    expect(result.p95LatencyMs).toBeGreaterThanOrEqual(0);
  });

  it("detecta gargalos automaticamente", () => {
    const detector = new BottleneckDetector();
    const collector = new PipelineStageCollector();
    const analytics = new PipelineAnalytics();
    const stages = collector.collect(mockOperationsInput);
    const analyticsResult = analytics.compute(stages, mockOperationsInput);

    const bottlenecks = detector.detect(
      stages,
      analyticsResult,
      mockOperationsInput,
      2,
      new Date().toISOString(),
    );

    expect(bottlenecks.length).toBeGreaterThan(0);
    expect(bottlenecks.some((b) => b.type === "degraded_connector")).toBe(true);
    expect(bottlenecks.some((b) => b.type === "excessive_retries")).toBe(true);
    expect(bottlenecks.some((b) => b.type === "dlq_growing")).toBe(true);
  });

  it("não toma decisões — apenas alerta", () => {
    const alerts = new OperationalAlerts();
    const analytics = new PipelineAnalytics();
    const collector = new PipelineStageCollector();
    const stages = collector.collect(mockOperationsInput);
    const analyticsResult = analytics.compute(stages, mockOperationsInput);

    const generated = alerts.generate(
      mockOperationsInput,
      analyticsResult,
      new Date().toISOString(),
    );

    expect(generated.length).toBeGreaterThan(0);
    expect(generated.some((a) => a.type === "connector_offline")).toBe(true);
    expect(generated.some((a) => a.type === "retry_storm")).toBe(true);
    expect(generated.every((a) => !("action" in a))).toBe(true);
  });

  it("calcula KPIs operacionais diários", () => {
    const calculator = new OperationalKpisCalculator();
    const analytics = new PipelineAnalytics();
    const collector = new PipelineStageCollector();
    const stages = collector.collect(mockOperationsInput);
    const analyticsResult = analytics.compute(stages, mockOperationsInput);

    const kpis = calculator.compute(mockOperationsInput, analyticsResult);

    expect(kpis.date).toBe(todayDateKey());
    expect(kpis.candidatesFound).toBe(10);
    expect(kpis.evidencePackages).toBe(6);
    expect(kpis.protocolApproved).toBe(3);
    expect(kpis.reviewCases).toBeGreaterThan(0);
  });

  it("reconstrói timeline por correlationId", () => {
    const builder = new OperationalTimelineBuilder();
    const timelines = builder.build(mockOperationsInput.workflow.events);

    expect(timelines.length).toBeGreaterThan(0);
    const journey = timelines[0]!;
    expect(journey.correlationId).toBe("corr-abc");
    expect(journey.stages.length).toBeGreaterThan(0);
    expect(journey.totalDurationMs).toBeGreaterThan(0);
    expect(journey.stages.some((s) => s.stage === "discovery")).toBe(true);
    expect(journey.stages.some((s) => s.stage === "protocol")).toBe(true);
  });

  it("guarda snapshots diários sem apagar histórico", () => {
    engine.buildFromInput(mockOperationsInput);

    engine.getHistory().record({
      date: "2026-07-22",
      capturedAt: "2026-07-22T00:00:00.000Z",
      kpis: {
        date: "2026-07-22",
        candidatesFound: 1,
        evidencePackages: 1,
        protocolApproved: 0,
        protocolRejected: 0,
        reviewCases: 0,
        profilesPublished: 0,
        profilesUpdated: 0,
        profilesReverified: 0,
        connectorAvailability: 1,
      },
      analytics: engine.getLastSnapshot()!.analytics,
      reviewRate: 0,
      publicationRate: 0,
      connectorHealth: [],
      stageMetrics: [],
    });

    engine.buildFromInput(mockOperationsInputHealthy);
    const allHistory = engine.getHistory().list();

    expect(allHistory.length).toBeGreaterThanOrEqual(2);
    expect(allHistory.some((h) => h.date === "2026-07-22")).toBe(true);
    expect(allHistory.some((h) => h.date === todayDateKey())).toBe(true);
  });

  it("produz snapshot completo do Operations Center", () => {
    const snapshot = engine.buildFromInput(mockOperationsInput);

    expect(snapshot.dashboard).toHaveLength(5);
    expect(snapshot.analytics).toBeDefined();
    expect(snapshot.kpis).toBeDefined();
    expect(snapshot.timelines.length).toBeGreaterThan(0);
    expect(snapshot.health.overall).toBe("critical");
    expect(snapshot.lastRefreshedAt).toBeTruthy();
  });

  it("reporta health healthy quando sem problemas", () => {
    const snapshot = engine.buildFromInput(mockOperationsInputHealthy);
    expect(snapshot.health.overall).toBe("healthy");
    expect(snapshot.bottlenecks.length).toBeLessThan(
      engine.buildFromInput(mockOperationsInput).bottlenecks.length,
    );
  });

  it("utilitários de percentil e success rate", () => {
    expect(percentile([100, 200, 300, 400, 500], 95)).toBe(500);
    expect(percentile([], 95)).toBe(0);
    expect(successRate(8, 10)).toBe(0.8);
    expect(successRate(0, 0)).toBe(1);
  });

  it("reset limpa estado do engine", () => {
    engine.buildFromInput(mockOperationsInput);
    engine.reset();
    expect(engine.getLastSnapshot()).toBeNull();
  });
});

describe("OperationsHistory", () => {
  it("atualiza snapshot do mesmo dia sem duplicar", () => {
    const history = new OperationsHistory();
    const date = todayDateKey();

    history.record({
      date,
      capturedAt: "2026-07-23T08:00:00.000Z",
      kpis: {
        date,
        candidatesFound: 1,
        evidencePackages: 1,
        protocolApproved: 0,
        protocolRejected: 0,
        reviewCases: 0,
        profilesPublished: 0,
        profilesUpdated: 0,
        profilesReverified: 0,
        connectorAvailability: 1,
      },
      analytics: {
        stageLatencies: {
          discovery: 0,
          evidence: 0,
          protocol: 0,
          publication: 0,
          verification: 0,
        },
        totalLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        throughputPerHour: 0,
        backlog: 0,
        reviewRate: 0,
        publicationRate: 0,
      },
      reviewRate: 0,
      publicationRate: 0,
      connectorHealth: [],
      stageMetrics: [],
    });

    history.record({
      date,
      capturedAt: "2026-07-23T12:00:00.000Z",
      kpis: {
        date,
        candidatesFound: 5,
        evidencePackages: 3,
        protocolApproved: 1,
        protocolRejected: 0,
        reviewCases: 0,
        profilesPublished: 1,
        profilesUpdated: 0,
        profilesReverified: 0,
        connectorAvailability: 1,
      },
      analytics: {
        stageLatencies: {
          discovery: 100,
          evidence: 200,
          protocol: 300,
          publication: 400,
          verification: 500,
        },
        totalLatencyMs: 1500,
        p95LatencyMs: 500,
        p99LatencyMs: 500,
        throughputPerHour: 10,
        backlog: 2,
        reviewRate: 0.1,
        publicationRate: 0.9,
      },
      reviewRate: 0.1,
      publicationRate: 0.9,
      connectorHealth: [],
      stageMetrics: [],
    });

    expect(history.size).toBe(1);
    expect(history.getToday()?.kpis.candidatesFound).toBe(5);
  });
});
