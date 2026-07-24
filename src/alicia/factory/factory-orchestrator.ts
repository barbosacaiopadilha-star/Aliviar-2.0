import { createCorrelationId, WorkflowEngine } from "@/alicia/event-bus";
import { ConnectorManager, defaultConnectors } from "@/alicia/connectors";
import { VerificationBusBridge } from "@/alicia/verification/integration/verification-bus-bridge";
import { VerificationEngine } from "@/alicia/verification/verification-engine";
import { VerificationRunner } from "@/alicia/verification/verification-runner";
import { mockPublishedProfiles } from "@/alicia/verification/mocks/published-profiles";

import { DryRunPublicationPipeline } from "./dry-run-publication-pipeline";
import { FailureIsolation } from "./failure-isolation";
import { FactoryBusBridge } from "./integration/factory-bus-bridge";
import { FactoryCheckpointManager } from "./factory-checkpoint";
import { FactoryMetrics, FactoryReportBuilder } from "./factory-metrics";
import { FactoryRunRegistry } from "./factory-run";
import { FactoryScheduler } from "./factory-scheduler";
import type { FactoryRun, FactoryRunReport, FactorySchedule } from "./types";
import type { FactoryStartedPayload } from "./factory-events";

export type FactoryOrchestratorOptions = {
  scheduler?: FactoryScheduler;
  runs?: FactoryRunRegistry;
  metrics?: FactoryMetrics;
  failures?: FailureIsolation;
  checkpoints?: FactoryCheckpointManager;
  reportBuilder?: FactoryReportBuilder;
  onOperationsRefresh?: () => Promise<void>;
};

export class FactoryOrchestrator {
  private readonly scheduler: FactoryScheduler;
  private readonly runs: FactoryRunRegistry;
  private readonly metrics: FactoryMetrics;
  private readonly failures: FailureIsolation;
  private readonly checkpoints: FactoryCheckpointManager;
  private readonly reportBuilder: FactoryReportBuilder;
  private readonly onOperationsRefresh?: () => Promise<void>;
  private bridge: FactoryBusBridge | null = null;
  private workflow: WorkflowEngine | null = null;
  private lastReport: FactoryRunReport | null = null;

  constructor(options: FactoryOrchestratorOptions = {}) {
    this.scheduler = options.scheduler ?? new FactoryScheduler();
    this.runs = options.runs ?? new FactoryRunRegistry();
    this.metrics = options.metrics ?? new FactoryMetrics();
    this.failures = options.failures ?? new FailureIsolation();
    this.checkpoints = options.checkpoints ?? new FactoryCheckpointManager();
    this.reportBuilder = options.reportBuilder ?? new FactoryReportBuilder();
    this.onOperationsRefresh = options.onOperationsRefresh;
  }

  private buildVerificationEngine(): VerificationEngine {
    const connectorManager = new ConnectorManager();
    for (const connector of defaultConnectors) {
      connectorManager.register(connector);
    }

    const engine = new VerificationEngine({
      runner: new VerificationRunner({ connectorManager }),
    });

    for (const profile of mockPublishedProfiles) {
      engine.registerProfile(profile);
    }

    return engine;
  }

  private ensureBridge(dryRun: boolean): FactoryBusBridge {
    if (this.bridge) {
      this.bridge.stop();
    }

    this.workflow = dryRun
      ? new WorkflowEngine({ publicationPipeline: new DryRunPublicationPipeline() })
      : new WorkflowEngine();

    const verificationEngine = this.buildVerificationEngine();

    this.bridge = new FactoryBusBridge({
      bus: this.workflow.getBus(),
      workflow: this.workflow,
      verificationBridge: new VerificationBusBridge({
        bus: this.workflow.getBus(),
        engine: verificationEngine,
      }),
      runs: this.runs,
      failures: this.failures,
      checkpoints: this.checkpoints,
      onOperationsRefresh: this.onOperationsRefresh,
    });

    this.bridge.start();
    return this.bridge;
  }

  getRuns(): FactoryRun[] {
    return this.runs.list();
  }

  getMetrics(): FactoryMetrics {
    return this.metrics;
  }

  getLastReport(): FactoryRunReport | null {
    return this.lastReport;
  }

  getScheduler(): FactoryScheduler {
    return this.scheduler;
  }

  getWorkflow(): WorkflowEngine | null {
    return this.workflow;
  }

  async startRun(
    options: {
      schedule?: FactorySchedule;
      dryRun?: boolean;
      resumeRunId?: string;
    } = {},
  ): Promise<FactoryRun> {
    const schedule = options.schedule ?? this.scheduler.getSchedule();
    const dryRun = options.dryRun ?? false;
    this.ensureBridge(dryRun);

    const correlationId = createCorrelationId(
      options.resumeRunId ?? `factory-${Date.now()}`,
      schedule,
    );

    let run: FactoryRun;

    if (options.resumeRunId) {
      const existing = this.runs.resume(options.resumeRunId, dryRun);
      if (!existing) {
        throw new Error(`Run não encontrado: ${options.resumeRunId}`);
      }
      run = existing;
    } else {
      run = this.runs.create({ schedule, dryRun, correlationId });
    }

    await this.workflow!.getBus().publish<FactoryStartedPayload>({
      eventType: "FactoryStarted",
      aggregateId: run.runId,
      payload: { runId: run.runId, schedule, dryRun, correlationId },
      correlationId,
      source: "factory-orchestrator",
    });

    this.scheduler.recordRun(run.startedAt);

    return run;
  }

  async runIfDue(options: { dryRun?: boolean } = {}): Promise<FactoryRun | null> {
    if (!this.scheduler.isDue()) {
      return null;
    }
    return this.startRun({ dryRun: options.dryRun });
  }

  finalizeReport(runId: string): FactoryRunReport | null {
    const run = this.runs.get(runId);
    if (!run) {
      return null;
    }

    this.metrics.recordRun(run);
    const report = this.reportBuilder.build({
      run,
      failures: this.failures.list(runId).map((f) => ({
        candidateId: f.candidateId,
        error: f.error,
        stage: f.stage,
      })),
    });

    this.lastReport = report;
    return report;
  }

  reset(): void {
    this.bridge?.stop();
    this.bridge = null;
    this.workflow = null;
    this.runs.reset();
    this.metrics.reset();
    this.failures.reset();
    this.lastReport = null;
  }
}
