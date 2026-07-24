import { describe, expect, it, beforeEach } from "vitest";

import { EventBus, EventStore, EventBusMetrics } from "@/alicia/event-bus";
import { ConnectorManager, defaultMockConnectors, validateSchema } from "@/alicia/connectors";

import { VerificationBusBridge } from "../integration/verification-bus-bridge";
import { VerificationPlanner } from "../planner";
import { ProfileRegistry } from "../profile-registry";
import { mockPublishedProfiles } from "../mocks/published-profiles";
import { getVerificationCenterSnapshot, resetVerificationSession } from "../studio-adapter";
import { decideVerification, requiresPublication } from "../verification-decision";
import { VerificationEngine } from "../verification-engine";
import { VerificationHistory } from "../verification-history";
import { VerificationRunner } from "../verification-runner";

function buildRunner(): VerificationRunner {
  const connectorManager = new ConnectorManager();
  for (const connector of defaultMockConnectors) {
    connectorManager.register(connector);
  }
  return new VerificationRunner({ connectorManager });
}

describe("verification modules coverage", () => {
  beforeEach(() => {
    resetVerificationSession();
  });

  it("cobre studio adapter snapshot", async () => {
    const snapshot = await getVerificationCenterSnapshot({ refresh: true });
    expect(snapshot.queue.length).toBeGreaterThanOrEqual(0);
    expect(snapshot.metrics.profilesVerified).toBeGreaterThan(0);
    expect(snapshot.history.length).toBeGreaterThan(0);
  }, 30_000);

  it("cobre studio adapter sem refresh", async () => {
    await getVerificationCenterSnapshot({ refresh: true });
    const snapshot = await getVerificationCenterSnapshot({ refresh: false });
    expect(snapshot.lastRunAt).not.toBeNull();
  }, 30_000);

  it("cobre bridge stop sem start", () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const engine = new VerificationEngine();
    const bridge = new VerificationBusBridge({ bus, engine });
    bridge.stop();
    expect(bridge).toBeDefined();
  });

  it("cobre engine com perfil inexistente", async () => {
    const engine = new VerificationEngine();
    await expect(engine.runVerification("missing")).rejects.toThrow(/não encontrado/);
  });

  it("cobre history pending review", async () => {
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[3]!);
    await engine.runVerification("prof-conflict-004");
    expect(engine.getHistory().listPendingReview().length).toBeGreaterThan(0);
  });

  it("cobre métricas reset", () => {
    const engine = new VerificationEngine();
    engine.reset();
    expect(engine.getMetrics().snapshot().profilesVerified).toBe(0);
  });

  it("exporta API pública", async () => {
    const api = await import("../index");
    expect(api.VERIFICATION_ENGINE_VERSION).toBe("1.0");
    expect(typeof api.VerificationEngine).toBe("function");
    expect(api.mockPublishedProfiles.length).toBe(4);
  });

  it("cobre profile registry updateSnapshot", () => {
    const registry = new ProfileRegistry();
    registry.register(mockPublishedProfiles[0]!);
    registry.updateSnapshot("prof-stable-001", {
      ...mockPublishedProfiles[0]!.snapshot,
      version: 5,
    });
    expect(registry.get("prof-stable-001")?.snapshot.version).toBe(5);
    registry.updateSnapshot("missing", mockPublishedProfiles[0]!.snapshot);
  });

  it("cobre verification decision branches adicionais", () => {
    expect(
      decideVerification({ classification: "MATERIAL_CHANGE", changes: [] }, "HUMAN_REVIEW").outcome,
    ).toBe("REVIEW_REQUIRED");

    expect(
      decideVerification(
        { classification: "MINOR_CHANGE", changes: [{ field: "city", previous: "A", current: "B" }] },
        "HUMAN_REVIEW",
      ).outcome,
    ).toBe("REVIEW_REQUIRED");

    expect(
      decideVerification(
        { classification: "MINOR_CHANGE", changes: [{ field: "city", previous: "A", current: "B" }] },
        "AUTO_PUBLISH",
      ).outcome,
    ).toBe("VERIFIED");

    expect(
      decideVerification({ classification: "NO_CHANGE", changes: [] }, "HUMAN_REVIEW").outcome,
    ).toBe("REVIEW_REQUIRED");

    expect(requiresPublication("UPDATE_REQUIRED", "MATERIAL_CHANGE")).toBe(true);
  });

  it("cobre runner failure path", async () => {
    const failingManager = {
      runAll: async () => {
        throw new Error("connector falhou");
      },
    };
    const runner = new VerificationRunner({
      connectorManager: failingManager as never,
    });
    const result = await runner.run(mockPublishedProfiles[0]!, "corr-fail");
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("connector falhou");
  });

  it("cobre bridge publication path e double stop", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[2]!);

    const bridge = new VerificationBusBridge({ bus, engine });
    bridge.start();

    await bridge.requestVerification(
      "prof-material-003",
      "cand-material-003",
      "publication path",
    );
    await new Promise((resolve) => setTimeout(resolve, 60));

    const types = bus.getStore().list().map((event) => event.eventType);
    expect(types).toContain("VerificationCompleted");
    bridge.stop();
    bridge.stop();
  });

  it("cobre bridge VerificationFailed", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const engine = new VerificationEngine();
    const bridge = new VerificationBusBridge({ bus, engine });
    bridge.start();

    await bridge.requestVerification("missing-profile", "missing", "fail");
    await new Promise((resolve) => setTimeout(resolve, 20));

    const types = bus.getStore().list().map((event) => event.eventType);
    expect(types).toContain("VerificationFailed");
    bridge.stop();
  });

  it("cobre planner ON_DEMAND", () => {
    const planner = new VerificationPlanner();
    const onDemand = {
      ...mockPublishedProfiles[0]!,
      verificationFrequency: "ON_DEMAND" as const,
      neverVerified: false,
      lastVerifiedAt: "2026-07-22T00:00:00.000Z",
      nextVerificationAt: "2026-12-01T00:00:00.000Z",
      sourceChanged: false,
      newEvidenceAvailable: false,
      recentlyPublished: false,
    };
    const queue = planner.plan([onDemand], { now: new Date("2026-07-22T12:00:00.000Z") });
    expect(queue.some((item) => item.reason.includes("sob demanda"))).toBe(true);
  });

  it("cobre engine reschedule inexistente", () => {
    const engine = new VerificationEngine();
    engine.reschedule("missing", "DAILY");
    expect(engine.getRegistry().size()).toBe(0);
  });

  it("cobre history recent e listByProfile", () => {
    const history = new VerificationHistory();
    history.append({
      profileId: "p1",
      candidateId: "c1",
      verifiedAt: new Date().toISOString(),
      verifiedBy: "test",
      decision: "VERIFIED",
      classification: "NO_CHANGE",
      previousVersion: 1,
      newVersion: 2,
      changes: [],
      sourcesConsulted: [],
      correlationId: "corr",
    });
    expect(history.recent(1)).toHaveLength(1);
    expect(history.listByProfile("p1")).toHaveLength(1);
  });

  it("valida que connectors validation layer permanece independente", () => {
    expect(validateSchema(null).valid).toBe(false);
  });
});
