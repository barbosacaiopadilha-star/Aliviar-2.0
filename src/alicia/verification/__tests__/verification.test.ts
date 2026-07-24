import { describe, expect, it, beforeEach } from "vitest";

import { EventBus, EventStore, EventBusMetrics } from "@/alicia/event-bus";
import { ConnectorManager, defaultMockConnectors } from "@/alicia/connectors";

import { ChangeDetector } from "../change-detector";
import { VerificationPlanner } from "../planner";
import { ProfileRegistry } from "../profile-registry";
import { VerificationScheduler } from "../scheduler";
import { VerificationBusBridge } from "../integration/verification-bus-bridge";
import { mockPublishedProfiles } from "../mocks/published-profiles";
import { resetVerificationSession } from "../studio-adapter";
import {
  decideVerification,
  isReviewRequired,
  requiresPublication,
} from "../verification-decision";
import { VerificationEngine } from "../verification-engine";
import { VerificationHistory } from "../verification-history";
import { VerificationMetrics } from "../verification-metrics";
import { VerificationRunner } from "../verification-runner";
import type { PublishedProfileSnapshot } from "../types";

function buildRunner(): VerificationRunner {
  const connectorManager = new ConnectorManager();
  for (const connector of defaultMockConnectors) {
    connectorManager.register(connector);
  }
  return new VerificationRunner({ connectorManager });
}

function snapshot(overrides: Partial<PublishedProfileSnapshot> = {}): PublishedProfileSnapshot {
  return {
    profileId: "prof-test",
    candidateId: "cand-test",
    doctorName: "Dr. Teste",
    crm: "CRM-ES 12345",
    rqe: "RQE 9999",
    institutions: ["ICOT"],
    residency: ["Ortopedia — ICOT"],
    specialty: "Ortopedia",
    city: "Vitória",
    state: "ES",
    sources: ["cfm"],
    status: "active",
    publishedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

describe("Verification Scheduler", () => {
  const scheduler = new VerificationScheduler();

  it("calcula próxima verificação por frequência", () => {
    const from = new Date("2026-07-22T00:00:00.000Z");
    const daily = scheduler.computeNextVerificationAt("DAILY", from);
    expect(new Date(daily).getTime()).toBeGreaterThan(from.getTime());

    const onDemand = scheduler.computeNextVerificationAt("ON_DEMAND", from);
    expect(onDemand).toBe(from.toISOString());
  });

  it("identifica perfil vencido", () => {
    const profile = mockPublishedProfiles[0]!;
    const dueProfile = { ...profile, nextVerificationAt: "2026-07-01T00:00:00.000Z" };
    expect(scheduler.isDue(dueProfile, new Date("2026-07-22T00:00:00.000Z"))).toBe(true);
  });

  it("reagenda após verificação", () => {
    const profile = mockPublishedProfiles[0]!;
    const verified = scheduler.markVerified(profile, "2026-07-22T12:00:00.000Z");
    expect(verified.lastVerifiedAt).toBe("2026-07-22T12:00:00.000Z");
    expect(verified.neverVerified).toBe(false);
  });
});

describe("Verification Planner", () => {
  it("seleciona perfis por critérios", () => {
    const planner = new VerificationPlanner();
    const queue = planner.plan(mockPublishedProfiles, {
      now: new Date("2026-07-22T12:00:00.000Z"),
    });
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.some((item) => item.reason.includes("nunca revisado"))).toBe(true);
  });
});

describe("Change Detector", () => {
  const detector = new ChangeDetector();

  it("detecta perfil sem mudanças", () => {
    const base = snapshot();
    const result = detector.detect(base, { ...base, version: 2 });
    expect(result.classification).toBe("NO_CHANGE");
  });

  it("detecta mudança leve", () => {
    const previous = snapshot({ city: "Vila Velha" });
    const current = snapshot({ city: "Vitória", version: 2 });
    expect(detector.detect(previous, current).classification).toBe("MINOR_CHANGE");
  });

  it("detecta mudança material", () => {
    const previous = snapshot();
    const current = snapshot({
      specialty: "Traumatologia",
      institutions: ["EMESCAM", "ICOT"],
      version: 2,
    });
    expect(detector.detect(previous, current).classification).toBe("MATERIAL_CHANGE");
  });

  it("detecta conflito", () => {
    const previous = snapshot();
    const current = snapshot({ crm: "CRM-ES 99999", status: "inactive", version: 2 });
    expect(detector.detect(previous, current).classification).toBe("CONFLICT");
  });
});

describe("Verification Decision", () => {
  it("retorna VERIFIED sem mudanças", () => {
    const decision = decideVerification(
      { classification: "NO_CHANGE", changes: [] },
      "AUTO_PUBLISH",
    );
    expect(decision.outcome).toBe("VERIFIED");
  });

  it("retorna UPDATE_REQUIRED para mudança material com AUTO_PUBLISH", () => {
    const decision = decideVerification(
      { classification: "MATERIAL_CHANGE", changes: [{ field: "specialty", previous: "A", current: "B" }] },
      "AUTO_PUBLISH",
    );
    expect(decision.outcome).toBe("UPDATE_REQUIRED");
    expect(requiresPublication(decision.outcome, "MATERIAL_CHANGE")).toBe(true);
  });

  it("retorna UNPUBLISH_RECOMMENDED em conflito", () => {
    const decision = decideVerification(
      { classification: "CONFLICT", changes: [] },
      "AUTO_PUBLISH",
    );
    expect(decision.outcome).toBe("UNPUBLISH_RECOMMENDED");
    expect(isReviewRequired(decision.outcome)).toBe(true);
  });
});

describe("Verification History", () => {
  it("registra histórico append-only", () => {
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
      sourcesConsulted: ["cfm"],
      correlationId: "corr",
    });

    expect(history.size()).toBe(1);
    expect(history.listByProfile("p1")).toHaveLength(1);
  });
});

describe("Verification Engine", () => {
  beforeEach(() => {
    resetVerificationSession();
  });

  it("executa verificação de perfil estável", async () => {
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[0]!);

    const result = await engine.runVerification("prof-stable-001");
    expect(result.status).toBe("COMPLETED");
    expect(result.change.classification).toBe("NO_CHANGE");
    expect(result.decision.outcome).not.toBe("UNPUBLISH_RECOMMENDED");
    expect(engine.getHistory().size()).toBe(1);
  });

  it("detecta mudança leve", async () => {
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[1]!);

    const result = await engine.runVerification("prof-minor-002");
    expect(result.change.classification).toBe("MINOR_CHANGE");
  });

  it("detecta mudança material", async () => {
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[2]!);

    const result = await engine.runVerification("prof-material-003");
    expect(result.change.classification).toBe("MATERIAL_CHANGE");
  });

  it("detecta conflito", async () => {
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[3]!);

    const result = await engine.runVerification("prof-conflict-004");
    expect(result.change.classification).toBe("CONFLICT");
    expect(isReviewRequired(result.decision.outcome)).toBe(true);
  });

  it("executa fila planejada e atualiza métricas", async () => {
    const metrics = new VerificationMetrics();
    const engine = new VerificationEngine({ runner: buildRunner(), metrics });
    for (const profile of mockPublishedProfiles) {
      engine.registerProfile(profile);
    }

    const results = await engine.runPlanned();
    expect(results.length).toBeGreaterThan(0);
    expect(metrics.snapshot().profilesVerified).toBeGreaterThan(0);
  });

  it("reagenda perfil", () => {
    const engine = new VerificationEngine();
    engine.registerProfile(mockPublishedProfiles[0]!);
    engine.reschedule("prof-stable-001", "MONTHLY");
    expect(engine.getRegistry().get("prof-stable-001")?.verificationFrequency).toBe("MONTHLY");
  });
});

describe("Verification Bus Bridge", () => {
  beforeEach(() => {
    resetVerificationSession();
  });

  it("integra via Event Bus sem chamar motores diretamente", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[3]!);

    const bridge = new VerificationBusBridge({ bus, engine });
    bridge.start();

    await bridge.requestVerification(
      "prof-conflict-004",
      "cand-conflict-004",
      "teste integração",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const types = bus.getStore().list().map((event) => event.eventType);
    expect(types).toContain("VerificationRequested");
    expect(types).toContain("VerificationStarted");
    expect(types).toContain("VerificationCompleted");
    expect(types).toContain("ProfileChanged");
    expect(types).toContain("ReviewRequested");
    expect(types).toContain("ReviewCaseCreated");

    bridge.stop();
  });

  it("publica PublicationRequested em UPDATE_REQUIRED material", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const engine = new VerificationEngine({ runner: buildRunner() });
    engine.registerProfile(mockPublishedProfiles[2]!);

    const bridge = new VerificationBusBridge({ bus, engine });
    bridge.start();

    await bridge.requestVerification(
      "prof-material-003",
      "cand-material-003",
      "material change",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const types = bus.getStore().list().map((event) => event.eventType);
    expect(types).toContain("ProfileChanged");
    expect(
      types.includes("PublicationRequested") || types.includes("ReviewCaseCreated"),
    ).toBe(true);
    bridge.stop();
  });
});

describe("Profile Registry", () => {
  it("registra e atualiza perfis", () => {
    const registry = new ProfileRegistry();
    registry.register(mockPublishedProfiles[0]!);
    expect(registry.size()).toBe(1);
    registry.markVerified("prof-stable-001", new Date().toISOString());
    expect(registry.get("prof-stable-001")?.neverVerified).toBe(false);
  });
});
