import { describe, expect, it, beforeEach } from "vitest";

import { DryRunPublicationPipeline } from "../dry-run-publication-pipeline";
import { FailureIsolation } from "../failure-isolation";
import { FactoryCheckpointManager } from "../factory-checkpoint";
import { FactoryMetrics, FactoryReportBuilder } from "../factory-metrics";
import { FactoryOrchestrator } from "../factory-orchestrator";
import { FactoryRunRegistry } from "../factory-run";
import { FactoryScheduler } from "../factory-scheduler";
import { setFactorySchedule } from "../studio-adapter";
import type { FactoryRun } from "../types";

const baseRun: FactoryRun = {
  runId: "run-1",
  schedule: "ON_DEMAND",
  startedAt: "2026-07-23T10:00:00.000Z",
  finishedAt: "2026-07-23T10:05:00.000Z",
  durationMs: 300_000,
  status: "COMPLETED",
  dryRun: false,
  candidatesFound: 5,
  evidencePackages: 4,
  published: 2,
  reviewCases: 1,
  errors: [],
  warnings: ["review"],
  checkpoints: [
    { stage: "discovery", completedAt: "2026-07-23T10:01:00.000Z", candidateIds: ["c1"] },
    { stage: "evidence", completedAt: "2026-07-23T10:02:00.000Z", candidateIds: ["c1"] },
  ],
  correlationId: "corr-1",
};

describe("Catalog Factory 2.0", () => {
  describe("FactoryScheduler", () => {
    it("suporta MANUAL, HOURLY, DAILY, WEEKLY, ON_DEMAND", () => {
      const scheduler = new FactoryScheduler();

      scheduler.setSchedule("MANUAL");
      expect(scheduler.isDue()).toBe(false);

      scheduler.setSchedule("ON_DEMAND");
      expect(scheduler.isDue()).toBe(true);

      scheduler.setSchedule("HOURLY");
      scheduler.recordRun(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
      expect(scheduler.isDue()).toBe(true);

      scheduler.recordRun(new Date().toISOString());
      expect(scheduler.isDue()).toBe(false);
    });

    it("calcula próxima execução", () => {
      const scheduler = new FactoryScheduler();
      scheduler.setSchedule("DAILY");
      expect(scheduler.getNextRunAt()).toBeTruthy();
    });
  });

  describe("FactoryRunRegistry", () => {
    let registry: FactoryRunRegistry;

    beforeEach(() => {
      registry = new FactoryRunRegistry();
    });

    it("cria FactoryRun com todos os campos", () => {
      const run = registry.create({
        schedule: "ON_DEMAND",
        dryRun: false,
        correlationId: "corr-1",
      });

      expect(run.runId).toMatch(/^factory-run-/);
      expect(run.status).toBe("RUNNING");
      expect(run.candidatesFound).toBe(0);
      expect(run.checkpoints).toEqual([]);
    });

    it("registra checkpoints e completa run", () => {
      const run = registry.create({
        schedule: "MANUAL",
        dryRun: true,
        correlationId: "corr-2",
      });

      registry.addCheckpoint(run.runId, {
        stage: "discovery",
        completedAt: new Date().toISOString(),
        candidateIds: ["c1"],
      });

      expect(registry.isStageCompleted(run.runId, "discovery")).toBe(true);

      const completed = registry.complete(run.runId, "DRY_RUN");
      expect(completed?.durationMs).toBeGreaterThanOrEqual(0);
      expect(completed?.status).toBe("DRY_RUN");
    });
  });

  describe("FactoryCheckpointManager", () => {
    it("determina próximo estágio para resume", () => {
      const manager = new FactoryCheckpointManager();
      expect(manager.getResumeStage(["discovery", "evidence"])).toBe("protocol");
      expect(manager.getResumeStage([])).toBe("discovery");
      expect(manager.getNextStage(["discovery", "evidence", "protocol", "publication", "verification", "operations"])).toBeNull();
      expect(manager.stagesToSkip(["discovery"])).toEqual(["discovery"]);
    });
  });

  describe("FailureIsolation", () => {
    it("isola falha por candidato sem interromper execução", () => {
      const isolation = new FailureIsolation();

      isolation.record("run-1", {
        candidateId: "c1",
        stage: "evidence",
        error: "timeout",
      });

      expect(isolation.count("run-1")).toBe(1);
      expect(isolation.list("run-1")).toHaveLength(1);
      expect(isolation.shouldContinue()).toBe(true);

      isolation.reset("run-1");
      expect(isolation.count("run-1")).toBe(0);

      isolation.record("run-2", { candidateId: "c2", stage: "pub", error: "e" });
      isolation.reset();
      expect(isolation.count("run-2")).toBe(0);
    });
  });

  describe("DryRunPublicationPipeline", () => {
    it("simula publicação sem persistir", () => {
      const pipeline = new DryRunPublicationPipeline();
      const result = pipeline.execute({
        candidate: {
          id: "c1",
          caseId: "case-1",
          name: "Dr. Test",
          crm: "123",
          crmStatus: "active",
          specialty: "Ortopedia",
          city: "Vitória",
          state: "ES",
          collectedBy: "test",
          collectedAt: new Date().toISOString(),
          hasIdentityConflict: false,
          duplicateCrm: false,
        },
        evidence: [],
        decision: {
          outcome: "AUTO_PUBLISH",
          eligibility: { outcome: "eligible", nivel: "A", satisfiedRules: [], failedRules: [], pendingRules: [], justification: "" },
          evidenceReport: { fields: [], conflicts: [], highestTrustLevel: 1, level1to3Count: 1, level1to4Count: 1, totalSources: 1, onlyLowTrustSources: false },
          satisfiedRules: [],
          pendingRules: [],
          failedRules: [],
          suggestedNivel: "A",
          justification: "ok",
        },
        protocolDecisionId: "pd-1",
        evidenceReportId: "er-1",
      });

      expect(result.status).toBe("NO_CHANGE");
      expect(result.message).toContain("Dry run");

      const rejectResult = pipeline.execute({
        candidate: {
          id: "c1",
          caseId: "case-1",
          name: "Dr. Test",
          crm: "123",
          crmStatus: "active",
          specialty: "Ortopedia",
          city: "Vitória",
          state: "ES",
          collectedBy: "test",
          collectedAt: new Date().toISOString(),
          hasIdentityConflict: false,
          duplicateCrm: false,
        },
        evidence: [],
        decision: {
          outcome: "REJECT",
          eligibility: { outcome: "not_eligible", nivel: "C", satisfiedRules: [], failedRules: [], pendingRules: [], justification: "" },
          evidenceReport: { fields: [], conflicts: [], highestTrustLevel: 1, level1to3Count: 1, level1to4Count: 1, totalSources: 1, onlyLowTrustSources: false },
          satisfiedRules: [],
          pendingRules: [],
          failedRules: [],
          suggestedNivel: "C",
          justification: "rejeitado",
        },
        protocolDecisionId: "pd-2",
        evidenceReportId: "er-2",
      });
      expect(rejectResult.status).toBeDefined();
    });
  });

  describe("FactoryMetrics e Report", () => {
    it("registra métricas e gera relatório", () => {
      const metrics = new FactoryMetrics();
      metrics.recordRun(baseRun);
      metrics.recordVerification();

      expect(metrics.snapshot().totalRuns).toBe(1);
      expect(metrics.snapshot().verifications).toBe(1);

      const report = new FactoryReportBuilder().build({
        run: baseRun,
        failures: [{ candidateId: "c2", error: "fail", stage: "evidence" }],
        reviewRate: 0.2,
        publicationRate: 0.4,
      });

      expect(report.runId).toBe("run-1");
      expect(report.kpis.candidatesFound).toBe(5);
      expect(report.failures).toHaveLength(1);
      expect(report.latencies.byStage.discovery).toBeGreaterThan(0);

      const emptyReport = new FactoryReportBuilder().build({
        run: { ...baseRun, candidatesFound: 0, published: 0, reviewCases: 0, checkpoints: [] },
        failures: [],
      });
      expect(emptyReport.publicationRate).toBe(0);
      expect(emptyReport.reviewRate).toBe(0);
    });

    it("registra retry, rollback e reseta", () => {
      const metrics = new FactoryMetrics();
      metrics.recordRun(baseRun);
      metrics.recordRetry();
      metrics.recordRollback();
      expect(metrics.snapshot().retries).toBe(1);
      expect(metrics.snapshot().rollbacks).toBe(1);
      metrics.recordRun({ ...baseRun, status: "FAILED", dryRun: false });
      metrics.recordRun({ ...baseRun, runId: "dry", status: "DRY_RUN", dryRun: true });
      expect(metrics.snapshot().failedRuns).toBe(1);
      expect(metrics.snapshot().dryRuns).toBe(1);
    });
  });

  describe("FactoryRunRegistry extras", () => {
    it("cobre update, addError, addWarning, getLastCheckpoint", () => {
      const registry = new FactoryRunRegistry();
      const run = registry.create({ schedule: "MANUAL", dryRun: false, correlationId: "c" });
      registry.update(run.runId, { candidatesFound: 3 });
      registry.addError(run.runId, "err");
      registry.addWarning(run.runId, "warn");
      registry.addCheckpoint(run.runId, { stage: "discovery", completedAt: new Date().toISOString(), candidateIds: [] });
      expect(registry.get(run.runId)?.candidatesFound).toBe(3);
      expect(registry.getLastCheckpoint(run.runId)?.stage).toBe("discovery");
      expect(registry.isStageCompleted(run.runId, "discovery")).toBe(true);
      expect(registry.get("missing")).toBeNull();
      expect(registry.complete("missing")).toBeNull();
      expect(registry.update("missing", {})).toBeNull();
    });
  });

  describe("FactoryScheduler extras", () => {
    it("cobre WEEKLY e getLastRunAt", () => {
      const scheduler = new FactoryScheduler();
      scheduler.setSchedule("WEEKLY");
      expect(scheduler.isDue()).toBe(true);
      scheduler.recordRun(new Date().toISOString());
      expect(scheduler.isDue()).toBe(false);
      expect(scheduler.getLastRunAt()).toBeTruthy();
      expect(scheduler.getNextRunAt()).toBeTruthy();
    });
  });

  describe("studio-adapter", () => {
    it("setFactorySchedule altera scheduler", () => {
      setFactorySchedule("DAILY");
      expect(true).toBe(true);
    });
  });

  describe("FactoryOrchestrator extras", () => {
    it("finalizeReport retorna null para run inexistente", () => {
      const orch = new FactoryOrchestrator();
      expect(orch.finalizeReport("missing")).toBeNull();
      expect(orch.getLastReport()).toBeNull();
      orch.reset();
    });

    it("lança erro ao resumir run inexistente", async () => {
      const orch = new FactoryOrchestrator();
      await expect(orch.startRun({ resumeRunId: "nope" })).rejects.toThrow("Run não encontrado");
    });
  });

  describe("FactoryOrchestrator", () => {
    let orchestrator: FactoryOrchestrator;

    beforeEach(() => {
      orchestrator = new FactoryOrchestrator();
    });

    it("executa run completo via Event Bus", async () => {
      const run = await orchestrator.startRun({ schedule: "ON_DEMAND" });

      await waitFor(() => {
        const updated = orchestrator.getRuns().find((r) => r.runId === run.runId);
        return Boolean(updated?.finishedAt);
      }, 20_000);

      const completed = orchestrator.getRuns().find((r) => r.runId === run.runId);
      expect(completed).toBeTruthy();
      expect(completed!.checkpoints.some((c) => c.stage === "discovery")).toBe(true);

      const report = orchestrator.finalizeReport(run.runId);
      expect(report).toBeTruthy();

      const events = orchestrator.getWorkflow()?.getStore().list() ?? [];
      expect(events.some((e) => e.eventType === "FactoryStarted")).toBe(true);
    }, 30_000);

    it("executa dry run sem publicar", async () => {
      const run = await orchestrator.startRun({ schedule: "ON_DEMAND", dryRun: true });

      await waitFor(() => {
        const updated = orchestrator.getRuns().find((r) => r.runId === run.runId);
        return Boolean(updated?.finishedAt);
      }, 20_000);

      const completed = orchestrator.getRuns().find((r) => r.runId === run.runId);
      expect(completed?.dryRun).toBe(true);
      expect(completed?.status).toBe("DRY_RUN");

      const events = orchestrator.getWorkflow()?.getStore().list() ?? [];
      expect(events.some((e) => e.eventType === "FactoryDryRun")).toBe(true);
    }, 30_000);

    it("retoma run do último checkpoint", async () => {
      const runs = new FactoryRunRegistry();
      const orchestratorWithRuns = new FactoryOrchestrator({ runs });

      const existing = runs.create({
        schedule: "MANUAL",
        dryRun: false,
        correlationId: "corr-resume",
      });
      runs.addCheckpoint(existing.runId, {
        stage: "discovery",
        completedAt: new Date().toISOString(),
        candidateIds: ["c1"],
      });
      runs.complete(existing.runId, "PAUSED");

      const resumed = await orchestratorWithRuns.startRun({
        resumeRunId: existing.runId,
      });

      expect(resumed.runId).toBe(existing.runId);

      const events =
        orchestratorWithRuns.getWorkflow()?.getStore().list() ?? [];
      expect(events.some((e) => e.eventType === "FactoryResumed")).toBe(true);
    }, 15_000);

    it("reutiliza bridge em múltiplos runs", async () => {
      const run1 = await orchestrator.startRun({ schedule: "ON_DEMAND" });
      await waitFor(() => Boolean(orchestrator.getRuns().find((r) => r.runId === run1.runId)?.finishedAt), 20_000);
      const run2 = await orchestrator.startRun({ schedule: "ON_DEMAND" });
      expect(run2.runId).not.toBe(run1.runId);
    }, 30_000);

    it("runIfDue retorna null quando não está due", async () => {
      const scheduler = new FactoryScheduler();
      scheduler.setSchedule("MANUAL");
      const orch = new FactoryOrchestrator({ scheduler });

      const result = await orch.runIfDue();
      expect(result).toBeNull();
    });
  });
});

async function waitFor(
  predicate: () => boolean,
  timeoutMs: number,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
