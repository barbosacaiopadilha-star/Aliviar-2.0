import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { EventBus, EventStore, EventBusMetrics, WorkflowEngine } from "@/alicia/event-bus";
import { VerificationBusBridge } from "@/alicia/verification/integration/verification-bus-bridge";
import { VerificationEngine } from "@/alicia/verification/verification-engine";

import { FactoryBusBridge } from "../integration/factory-bus-bridge";
import { FactoryCheckpointManager } from "../factory-checkpoint";
import { FactoryRunRegistry } from "../factory-run";
import { FailureIsolation } from "../failure-isolation";

function createBridge(
  runs: FactoryRunRegistry,
  options: { onOperationsRefresh?: () => Promise<void> } = {},
) {
  const bus = new EventBus(new EventStore(), new EventBusMetrics());
  const workflow = new WorkflowEngine({ bus });
  const bridge = new FactoryBusBridge({
    bus,
    workflow,
    verificationBridge: new VerificationBusBridge({
      bus,
      engine: new VerificationEngine(),
    }),
    runs,
    failures: new FailureIsolation(),
    checkpoints: new FactoryCheckpointManager(),
    onOperationsRefresh: options.onOperationsRefresh,
  });
  bridge.start();
  return { bus, bridge, workflow };
}

async function publish(
  bus: EventBus,
  eventType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  correlationId: string,
) {
  await bus.publish({
    eventType: eventType as Parameters<EventBus["publish"]>[0]["eventType"],
    aggregateId,
    payload,
    correlationId,
    source: "test",
  });
}

describe("FactoryBusBridge", () => {
  let runs: FactoryRunRegistry;

  beforeEach(() => {
    runs = new FactoryRunRegistry();
  });

  afterEach(() => {
    runs.reset();
  });

  it("completa pipeline com candidatos via eventos", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-1" });

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: ["c1"],
      candidateCount: 1,
    }, "corr-1");

    await publish(bus, "EvidenceCollected", "c1", { candidateId: "c1" }, "corr-1");
    await publish(bus, "ProtocolEvaluated", "c1", {
      candidateId: "c1",
      outcome: "AUTO_PUBLISH",
    }, "corr-1");
    await publish(bus, "PublicationSucceeded", "c1", { candidateId: "c1" }, "corr-1");
    await publish(bus, "VerificationCompleted", "c1", { candidateId: "c1" }, "corr-1");

    const completed = runs.get(run.runId);
    expect(completed?.finishedAt).toBeTruthy();
    expect(completed?.published).toBe(1);
    expect(completed?.checkpoints.some((c) => c.stage === "operations")).toBe(true);

    const events = bus.getStore().list();
    expect(events.some((e) => e.eventType === "FactoryFinished")).toBe(true);
    expect(events.some((e) => e.eventType === "FactoryCheckpoint")).toBe(true);
  });

  it("dry run não incrementa published", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: true, correlationId: "corr-dry" });

    await publish(bus, "FactoryStarted", run.runId, {
      runId: run.runId,
      schedule: "ON_DEMAND",
      dryRun: true,
      correlationId: "corr-dry",
    }, "corr-dry");

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: ["c1"],
      candidateCount: 1,
    }, "corr-dry");

    await publish(bus, "EvidenceCollected", "c1", { candidateId: "c1" }, "corr-dry");
    await publish(bus, "PublicationSucceeded", "c1", { candidateId: "c1" }, "corr-dry");
    await publish(bus, "VerificationCompleted", "c1", { candidateId: "c1" }, "corr-dry");

    const completed = runs.get(run.runId);
    expect(completed?.published).toBe(0);
    expect(completed?.status).toBe("DRY_RUN");
    expect(bus.getStore().list().some((e) => e.eventType === "FactoryDryRun")).toBe(true);
  });

  it("resume a partir de checkpoint discovery", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "MANUAL", dryRun: false, correlationId: "corr-resume" });
    runs.addCheckpoint(run.runId, {
      stage: "discovery",
      completedAt: new Date().toISOString(),
      candidateIds: ["c1"],
    });
    runs.complete(run.runId, "PAUSED");
    runs.resume(run.runId, false);

    await publish(bus, "FactoryStarted", run.runId, {
      runId: run.runId,
      schedule: "MANUAL",
      dryRun: false,
      correlationId: "corr-resume",
    }, "corr-resume");

    expect(bus.getStore().list().some((e) => e.eventType === "FactoryResumed")).toBe(true);
  });

  it("resume operations stage completa diretamente", async () => {
    const refreshed: string[] = [];
    const { bus } = createBridge(runs, {
      onOperationsRefresh: async () => {
        refreshed.push("ok");
      },
    });

    const run = runs.create({ schedule: "MANUAL", dryRun: false, correlationId: "corr-ops" });
    for (const stage of ["discovery", "evidence", "protocol", "publication", "verification"] as const) {
      runs.addCheckpoint(run.runId, {
        stage,
        completedAt: new Date().toISOString(),
        candidateIds: [],
      });
    }
    runs.complete(run.runId, "PAUSED");
    runs.resume(run.runId, false);

    await publish(bus, "FactoryStarted", run.runId, {
      runId: run.runId,
      schedule: "MANUAL",
      dryRun: false,
      correlationId: "corr-ops",
    }, "corr-ops");

    const completed = runs.get(run.runId);
    expect(completed?.finishedAt).toBeTruthy();
    expect(refreshed).toContain("ok");
  });

  it("isola falha de evidence e continua", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-fail" });

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: ["c1", "c2"],
      candidateCount: 2,
    }, "corr-fail");

    await publish(bus, "EvidenceFailed", "c1", {
      candidateId: "c1",
      reason: "timeout",
    }, "corr-fail");

    await publish(bus, "EvidenceCollected", "c2", { candidateId: "c2" }, "corr-fail");
    await publish(bus, "VerificationCompleted", "c2", { candidateId: "c2" }, "corr-fail");

    const updated = runs.get(run.runId);
    expect(updated?.errors.length).toBeGreaterThan(0);
    expect(updated?.finishedAt).toBeTruthy();
  });

  it("registra review case e publication failed", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-review" });

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: ["c1"],
      candidateCount: 1,
    }, "corr-review");

    await publish(bus, "ProtocolEvaluated", "c1", {
      candidateId: "c1",
      outcome: "HUMAN_REVIEW",
    }, "corr-review");

    await publish(bus, "ReviewCaseCreated", "c1", { candidateId: "c1" }, "corr-review");

    const updated = runs.get(run.runId);
    expect(updated?.reviewCases).toBeGreaterThan(0);
    expect(updated?.finishedAt).toBeTruthy();
  });

  it("registra publication failed e verification failed", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-pub-fail" });

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: ["c1"],
      candidateCount: 1,
    }, "corr-pub-fail");

    await publish(bus, "PublicationFailed", "c1", {
      candidateId: "c1",
      message: "erro pub",
    }, "corr-pub-fail");

    const afterPub = runs.get(run.runId);
    expect(afterPub?.errors.length).toBeGreaterThan(0);
    expect(afterPub?.finishedAt).toBeTruthy();

    const run2 = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-ver-fail" });
    await publish(bus, "DiscoveryCompleted", run2.runId, {
      candidateIds: ["c2"],
      candidateCount: 1,
    }, "corr-ver-fail");
    await publish(bus, "VerificationFailed", "c2", {
      candidateId: "c2",
      error: "ver fail",
    }, "corr-ver-fail");

    expect(runs.get(run2.runId)?.errors.length).toBeGreaterThan(0);
  });

  it("registra rollback e publishFailure", async () => {
    const { bus, bridge } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-rb" });

    await publish(bus, "PublicationRolledBack", run.runId, {}, "corr-rb");
    expect(runs.get(run.runId)?.warnings.some((w) => w.includes("Rollback"))).toBe(true);

    const failRun = runs.create({ schedule: "MANUAL", dryRun: false, correlationId: "corr-fatal" });
    await bridge.publishFailure(failRun.runId, "fatal", "discovery");
    expect(runs.get(failRun.runId)?.status).toBe("FAILED");
    expect(bus.getStore().list().some((e) => e.eventType === "FactoryFailed")).toBe(true);
  });

  it("ignora eventos sem run ativo", async () => {
    const { bus } = createBridge(runs);
    await publish(bus, "DiscoveryCompleted", "orphan", {
      candidateIds: [],
      candidateCount: 0,
    }, "corr-orphan");
    expect(runs.list()).toHaveLength(0);
  });

  it("FactoryStarted com dry run em run novo", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: true, correlationId: "corr-new" });

    await publish(bus, "FactoryStarted", run.runId, {
      runId: run.runId,
      schedule: "ON_DEMAND",
      dryRun: true,
      correlationId: "corr-new",
    }, "corr-new");

    expect(bus.getStore().list().some((e) => e.eventType === "FactoryDryRun")).toBe(true);
  });

  it("resume discovery stage chama runDiscovery", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "MANUAL", dryRun: false, correlationId: "corr-disc" });
    runs.complete(run.runId, "PAUSED");
    runs.resume(run.runId, false);

    await publish(bus, "FactoryStarted", run.runId, {
      runId: run.runId,
      schedule: "MANUAL",
      dryRun: false,
      correlationId: "corr-disc",
    }, "corr-disc");

    expect(bus.getStore().list().some((e) => e.eventType === "DiscoveryCompleted")).toBe(true);
  });

  it("publishFailure ignora run inexistente", async () => {
    const { bridge } = createBridge(runs);
    await bridge.publishFailure("missing-run", "erro");
    expect(runs.get("missing-run")).toBeNull();
  });

  it("ignora FactoryStarted sem run registrado", async () => {
    const { bus } = createBridge(runs);
    await publish(bus, "FactoryStarted", "ghost", {
      runId: "ghost",
      schedule: "MANUAL",
      dryRun: false,
      correlationId: "corr-ghost",
    }, "corr-ghost");
    expect(runs.list()).toHaveLength(0);
  });

  it("não duplica checkpoint de stage já concluído", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-dedup" });
    runs.addCheckpoint(run.runId, {
      stage: "discovery",
      completedAt: new Date().toISOString(),
      candidateIds: ["c1"],
    });

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: ["c1"],
      candidateCount: 1,
    }, "corr-dedup");

    const updated = runs.get(run.runId);
    expect(updated?.checkpoints.filter((c) => c.stage === "discovery")).toHaveLength(1);
  });

  it("discovery sem candidatos completa run", async () => {
    const { bus } = createBridge(runs);
    const run = runs.create({ schedule: "ON_DEMAND", dryRun: false, correlationId: "corr-empty" });

    await publish(bus, "DiscoveryCompleted", run.runId, {
      candidateIds: [],
      candidateCount: 0,
    }, "corr-empty");

    expect(runs.get(run.runId)?.finishedAt).toBeTruthy();
  });

  it("stop/start idempotente", () => {
    const { bridge } = createBridge(runs);
    bridge.stop();
    bridge.stop();
    bridge.start();
    bridge.start();
    expect(true).toBe(true);
  });
});
