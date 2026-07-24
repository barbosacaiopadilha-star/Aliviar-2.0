import { describe, expect, it, beforeEach } from "vitest";

import * as api from "../index";
import { getFactoryCenterSnapshot, resetFactorySession } from "../studio-adapter";
import { FactoryBusBridge } from "../integration/factory-bus-bridge";
import { FactoryRunRegistry } from "../factory-run";
import { FailureIsolation } from "../failure-isolation";
import { FactoryCheckpointManager } from "../factory-checkpoint";
import { EventBus, EventStore, EventBusMetrics, WorkflowEngine } from "@/alicia/event-bus";
import { VerificationBusBridge } from "@/alicia/verification/integration/verification-bus-bridge";
import { VerificationEngine } from "@/alicia/verification/verification-engine";

describe("factory modules coverage", () => {
  beforeEach(() => {
    resetFactorySession();
  });

  it("cobre studio adapter snapshot", async () => {
    const snapshot = await getFactoryCenterSnapshot({ refresh: true });
    expect(snapshot.runs.length).toBeGreaterThan(0);
    expect(snapshot.metrics.totalRuns).toBeGreaterThan(0);
  }, 30_000);

  it("cobre FactoryBusBridge publishFailure", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const workflow = new WorkflowEngine({ bus });
    const runs = new FactoryRunRegistry();
    const run = runs.create({
      schedule: "MANUAL",
      dryRun: false,
      correlationId: "corr-fail",
    });

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
    });

    bridge.start();
    await bridge.publishFailure(run.runId, "Erro fatal", "discovery");
    bridge.stop();

    const failed = runs.get(run.runId);
    expect(failed?.status).toBe("FAILED");

    const events = bus.getStore().list();
    expect(events.some((e) => e.eventType === "FactoryFailed")).toBe(true);
  });

  it("exporta API pública", () => {
    expect(api.FACTORY_VERSION).toBe("2.0.0");
    expect(api.FactoryOrchestrator).toBeDefined();
    expect(api.getFactoryCenterSnapshot).toBeDefined();
  });
});
