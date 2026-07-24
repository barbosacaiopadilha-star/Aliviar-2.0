import { describe, expect, it, beforeEach } from "vitest";

import { ConnectorEventEmitter } from "../connector-event-emitter";
import { ConnectorManager } from "../connector-manager";
import { ConnectorMetrics } from "../connector-metrics";
import { HealthMonitor } from "../health-monitor";
import { RateLimiter } from "../rate-limiter";
import { createFailingMockConnector, crmEstadualMockConnector } from "../mocks";
import { createMockConnector, resetMockConnectorAttempts } from "../mocks/mock-connector-factory";
import { getConnectorMonitorSnapshot, resetConnectorSession } from "../studio-adapter";
import { validateSchema } from "../validation-layer";

describe("connectors modules coverage", () => {
  beforeEach(() => {
    resetMockConnectorAttempts();
    resetConnectorSession();
  });

  it("cobre validateSchema com registro inválido", () => {
    expect(validateSchema(null).valid).toBe(false);
    expect(validateSchema("text").valid).toBe(false);
  });

  it("cobre health MAINTENANCE e recovery", async () => {
    const health = new HealthMonitor();
    health.register("maint", "MAINTENANCE");
    expect(health.snapshot("maint").status).toBe("MAINTENANCE");

    const events = new ConnectorEventEmitter();
    const manager = new ConnectorManager({ healthMonitor: health, events });

    const recovering = createMockConnector({
      id: "recovering",
      name: "Recovering",
      priority: 1,
      sourceType: "cfm",
      health: "OFFLINE",
      records: [
        {
          nome: "Dr. Recovery",
          crm: "55555",
          crm_uf: "ES",
          especialidade: "Ortopedia",
          cidade: "Vitória",
          estado: "ES",
          url: "https://example.com/recovery",
        },
      ],
    });

    health.register("recovering", "OFFLINE");
    manager.register(recovering);
    await manager.runConnector("recovering");

    expect(events.getHistory().some((event) => event.eventType === "ConnectorRecovered")).toBe(true);
  });

  it("cobre conector não suportado", async () => {
    const unsupported = createMockConnector({
      id: "unsupported",
      name: "Unsupported",
      priority: 1,
      sourceType: "cfm",
      records: [],
      supported: false,
    });

    const manager = new ConnectorManager();
    manager.register(unsupported);
    const result = await manager.runConnector("unsupported");
    expect(result.success).toBe(false);
    expect(result.error).toContain("não suportado");
  });

  it("cobre rate limiter reset e defaultConfig", () => {
    const limiter = new RateLimiter();
    const config = limiter.defaultConfig();
    expect(config.perMinute).toBeGreaterThan(0);
    limiter.recordExecution("x");
    limiter.reset("x");
    expect(limiter.canExecute("x", config)).toBe(true);
    limiter.reset();
  });

  it("cobre métricas reset", () => {
    const metrics = new ConnectorMetrics();
    metrics.recordExecution("c1", true, 10);
    metrics.recordRetry("c1");
    metrics.reset();
    expect(metrics.snapshot().totalExecutions).toBe(0);
  });

  it("cobre event emitter unsubscribe e history por conector", async () => {
    const events = new ConnectorEventEmitter();
    const handler = () => undefined;
    events.subscribe("ConnectorStarted", handler);
    events.unsubscribe("ConnectorStarted", handler);
    await events.publish("ConnectorStarted", "c1", {});
    expect(events.getHistoryByConnector("c1")).toHaveLength(1);
    events.reset();
    expect(events.getHistory()).toHaveLength(0);
  });

  it("cobre studio adapter snapshot", async () => {
    const snapshot = await getConnectorMonitorSnapshot({ refresh: true });
    expect(snapshot.connectors.length).toBe(9);
    expect(snapshot.metrics.totalExecutions).toBeGreaterThan(0);
    expect(snapshot.recentEvents.length).toBeGreaterThan(0);
  });

  it("cobre studio adapter sem refresh com sessão existente", async () => {
    await getConnectorMonitorSnapshot({ refresh: true });
    const snapshot = await getConnectorMonitorSnapshot({ refresh: false });
    expect(snapshot.lastRunAt).not.toBeNull();
  });

  it("cobre manager unregister e enable", async () => {
    const manager = new ConnectorManager();
    manager.register(crmEstadualMockConnector);
    manager.unregister("crm-estadual");
    expect(manager.getRegistry().has("crm-estadual")).toBe(false);

    manager.register(crmEstadualMockConnector);
    await manager.disable("crm-estadual");
    manager.enable("crm-estadual");
    expect(manager.isEnabled("crm-estadual")).toBe(true);
  });

  it("cobre falha de autenticação", async () => {
    const manager = new ConnectorManager();
    manager.register(createFailingMockConnector("auth-fail"));
    const result = await manager.runConnector("auth-fail");
    expect(result.success).toBe(false);
  });

  it("exporta API pública", async () => {
    const api = await import("../index");
    expect(api.CONNECTOR_FRAMEWORK_VERSION).toBe("1.0");
    expect(typeof api.ConnectorManager).toBe("function");
    expect(api.defaultMockConnectors.length).toBe(6);
  });
});
