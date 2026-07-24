import { describe, expect, it, beforeEach } from "vitest";

import { ConnectorEventEmitter } from "../connector-event-emitter";
import { ConnectorManager } from "../connector-manager";
import { ConnectorMetrics } from "../connector-metrics";
import { ConnectorRegistry } from "../connector-registry";
import { HealthMonitor } from "../health-monitor";
import { NormalizerPipeline } from "../normalizer-pipeline";
import { RateLimiter } from "../rate-limiter";
import {
  cfmConnector,
  crmEstadualMockConnector,
  defaultMockConnectors,
} from "../mocks";
import { createMockConnector, resetMockConnectorAttempts } from "../mocks/mock-connector-factory";
import { resetConnectorSession } from "../studio-adapter";
import { validateNormalizedRecord } from "../validation-layer";
import type { ConnectorEvent, NormalizedConnectorRecord } from "../types";

describe("Connector Registry", () => {
  it("registra e lista conectores por prioridade", () => {
    const registry = new ConnectorRegistry();
    registry.register(cfmConnector);
    registry.register(crmEstadualMockConnector);

    expect(registry.size()).toBe(2);
    expect(registry.list()[0]!.id).toBe("crm-estadual");
    expect(registry.list()[1]!.id).toBe("cfm");
  });

  it("impede registro duplicado", () => {
    const registry = new ConnectorRegistry();
    registry.register(cfmConnector);
    expect(() => registry.register(cfmConnector)).toThrow(/já registrado/);
  });

  it("permite registerOrReplace dinâmico", () => {
    const registry = new ConnectorRegistry();
    registry.register(cfmConnector);
    const replacement = createMockConnector({
      id: "cfm",
      name: "CFM v2",
      priority: 2,
      sourceType: "cfm",
      records: [],
    });
    registry.registerOrReplace(replacement);
    expect(registry.get("cfm")!.name).toBe("CFM v2");
  });
});

describe("Validation Layer", () => {
  const validRecord: NormalizedConnectorRecord = {
    recordId: "rec-1",
    sourceId: "cfm",
    sourceType: "cfm",
    nome: "Dr. Teste Validação",
    crm: "CRM-ES 12345",
    crmUf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitória",
    estado: "ES",
    urlOrigem: "https://example.com/medico",
    confidence: 0.9,
    fetchedAt: new Date().toISOString(),
  };

  it("aceita registro válido", () => {
    expect(validateNormalizedRecord(validRecord).valid).toBe(true);
  });

  it("rejeita campos obrigatórios ausentes", () => {
    const result = validateNormalizedRecord({ ...validRecord, nome: "" });
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.field === "nome")).toBe(true);
  });

  it("rejeita confidence fora do intervalo", () => {
    const result = validateNormalizedRecord({ ...validRecord, confidence: 1.5 });
    expect(result.valid).toBe(false);
  });
});

describe("Normalizer Pipeline", () => {
  it("normaliza e filtra registros inválidos", () => {
    const pipeline = new NormalizerPipeline();
    const connector = createMockConnector({
      id: "test-normalizer",
      name: "Test",
      priority: 1,
      sourceType: "cfm",
      records: [
        {
          nome: "Dr. Válido",
          crm: "12345",
          crm_uf: "ES",
          especialidade: "Ortopedia",
          cidade: "Vitória",
          estado: "ES",
          url: "https://example.com/valido",
        },
        {
          nome: "X",
          crm: "abc",
          crm_uf: "ES",
          especialidade: "Ortopedia",
          cidade: "Vitória",
          estado: "ESS",
          url: "invalid-url",
        },
      ],
    });

    const fetchResult = connector.normalize({
      nome: "Dr. Válido",
      crm: "12345",
      crm_uf: "ES",
      especialidade: "Ortopedia",
      cidade: "Vitória",
      estado: "ES",
      url: "https://example.com/valido",
    });

    const result = pipeline.process(connector, [
      {
        nome: "Dr. Válido",
        crm: "12345",
        crm_uf: "ES",
        especialidade: "Ortopedia",
        cidade: "Vitória",
        estado: "ES",
        url: "https://example.com/valido",
      },
      {
        nome: "X",
        crm: "abc",
        crm_uf: "ES",
        especialidade: "Ortopedia",
        cidade: "Vitória",
        estado: "ESS",
        url: "invalid-url",
      },
    ]);

    expect(result.valid.length).toBeGreaterThanOrEqual(1);
    expect(result.invalid.length).toBeGreaterThanOrEqual(1);
    expect(fetchResult[0]!.nome).toBe("Dr. Válido");
  });
});

describe("Rate Limiter", () => {
  it("respeita limite por minuto", () => {
    const limiter = new RateLimiter();
    const config = { perMinute: 2, perHour: 100, maxRetries: 1, backoffBaseMs: 1, backoffMaxMs: 10 };

    expect(limiter.canExecute("c1", config)).toBe(true);
    limiter.recordExecution("c1");
    limiter.recordExecution("c1");
    expect(limiter.canExecute("c1", config)).toBe(false);
  });

  it("calcula backoff exponencial", () => {
    const limiter = new RateLimiter();
    const config = { perMinute: 60, perHour: 1000, maxRetries: 5, backoffBaseMs: 100, backoffMaxMs: 1000 };
    expect(limiter.computeBackoff(1, config)).toBe(100);
    expect(limiter.computeBackoff(2, config)).toBe(200);
    expect(limiter.computeBackoff(5, config)).toBe(1000);
  });
});

describe("Health Monitor", () => {
  it("transiciona para DEGRADED e OFFLINE com falhas", () => {
    const monitor = new HealthMonitor();
    monitor.register("c1", "ONLINE");

    monitor.recordSuccess("c1", 50);
    monitor.recordSuccess("c1", 50);
    monitor.recordFailure("c1", 50);
    expect(monitor.getStatus("c1")).toBe("DEGRADED");

    monitor.recordFailure("c1", 50);
    monitor.recordFailure("c1", 50);
    expect(monitor.getStatus("c1")).toBe("OFFLINE");
  });

  it("registra latência média e disponibilidade", () => {
    const monitor = new HealthMonitor();
    monitor.register("c1");
    monitor.recordSuccess("c1", 100);
    monitor.recordSuccess("c1", 200);
    monitor.recordFailure("c1", 50);

    const snapshot = monitor.snapshot("c1");
    expect(snapshot.averageLatencyMs).toBe(117);
    expect(snapshot.availability).toBeCloseTo(0.667, 2);
  });
});

describe("Connector Events", () => {
  it("publica e entrega eventos a subscribers", async () => {
    const events = new ConnectorEventEmitter();
    const received: ConnectorEvent[] = [];

    events.subscribe("ConnectorStarted", (event) => {
      received.push(event);
    });

    await events.publish("ConnectorStarted", "cfm", { connectorId: "cfm" });
    expect(received).toHaveLength(1);
    expect(events.getHistory()).toHaveLength(1);
  });
});

describe("Connector Manager", () => {
  beforeEach(() => {
    resetMockConnectorAttempts();
    resetConnectorSession();
  });

  it("executa conectores mock por prioridade", async () => {
    const manager = new ConnectorManager();
    for (const connector of defaultMockConnectors) {
      manager.register(connector);
    }

    const result = await manager.runAll();
    expect(result.results.length).toBe(6);
    expect(result.results.every((item) => item.success)).toBe(true);
    expect(result.metrics.totalExecutions).toBe(6);
  });

  it("publica eventos de sucesso", async () => {
    const events = new ConnectorEventEmitter();
    const manager = new ConnectorManager({ events });
    manager.register(crmEstadualMockConnector);

    await manager.runConnector("crm-estadual");
    const types = events.getHistory().map((event) => event.eventType);
    expect(types).toContain("ConnectorStarted");
    expect(types).toContain("ConnectorSucceeded");
  });

  it("faz retry e publica ConnectorRetried em falha transitória", async () => {
    const events = new ConnectorEventEmitter();
    const flaky = createMockConnector({
      id: "flaky",
      name: "Flaky",
      priority: 1,
      sourceType: "cfm",
      records: [{ nome: "Dr. Flaky", crm: "11111", crm_uf: "ES", especialidade: "Ortopedia", cidade: "Vitória", estado: "ES", url: "https://example.com/flaky" }],
      shouldFail: true,
      failUntilAttempt: 1,
      rateLimit: { maxRetries: 3, perMinute: 60, perHour: 1000, backoffBaseMs: 1, backoffMaxMs: 5 },
    });

    const manager = new ConnectorManager({ events });
    manager.register(flaky);

    const result = await manager.runConnector("flaky");
    expect(result.success).toBe(true);
    expect(result.retries).toBeGreaterThan(0);
    expect(events.getHistory().some((event) => event.eventType === "ConnectorRetried")).toBe(true);
  });

  it("move para falha após esgotar retries", async () => {
    const events = new ConnectorEventEmitter();
    const failing = createMockConnector({
      id: "always-fail",
      name: "Always Fail",
      priority: 99,
      sourceType: "cfm",
      health: "OFFLINE",
      records: [],
      shouldFail: true,
      rateLimit: { maxRetries: 2, perMinute: 60, perHour: 1000, backoffBaseMs: 1, backoffMaxMs: 5 },
    });
    const manager = new ConnectorManager({ events });
    manager.register(failing);

    const result = await manager.runConnector("always-fail");
    expect(result.success).toBe(false);
    expect(events.getHistory().some((event) => event.eventType === "ConnectorFailed")).toBe(true);
    expect(manager.getRetryQueue().length).toBeGreaterThan(0);
  });

  it("desabilita conector e publica ConnectorDisabled", async () => {
    const events = new ConnectorEventEmitter();
    const manager = new ConnectorManager({ events });
    manager.register(cfmConnector);

    await manager.disable("cfm", "Teste de desabilitação");
    const result = await manager.runConnector("cfm");
    expect(result.success).toBe(false);
    expect(events.getHistory().some((event) => event.eventType === "ConnectorDisabled")).toBe(true);
  });

  it("bloqueia execução quando rate limit excedido", async () => {
    const limiter = new RateLimiter();
    const tight = createMockConnector({
      id: "tight-limit",
      name: "Tight",
      priority: 1,
      sourceType: "cfm",
      records: [{ nome: "Dr. Limit", crm: "99999", crm_uf: "ES", especialidade: "Ortopedia", cidade: "Vitória", estado: "ES", url: "https://example.com/limit" }],
      rateLimit: { perMinute: 1, perHour: 1, maxRetries: 1, backoffBaseMs: 1, backoffMaxMs: 1 },
    });

    const manager = new ConnectorManager({ rateLimiter: limiter });
    manager.register(tight);

    const first = await manager.runConnector("tight-limit");
    const second = await manager.runConnector("tight-limit");

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
    expect(second.error).toContain("Rate limit");
  });

  it("expõe status e métricas", async () => {
    const metrics = new ConnectorMetrics();
    const manager = new ConnectorManager({ metrics });
    manager.register(crmEstadualMockConnector);
    await manager.runConnector("crm-estadual");

    const status = manager.getStatusSnapshots()[0];
    expect(status?.connectorId).toBe("crm-estadual");
    expect(status?.lastSyncAt).not.toBeNull();
    expect(metrics.snapshot().successfulExecutions).toBe(1);
  });
});

describe("Concorrência simples", () => {
  it("executa múltiplos conectores em sequência sem corrupção", async () => {
    const manager = new ConnectorManager();
    manager.register(crmEstadualMockConnector);
    manager.register(cfmConnector);

    const [first, second] = await Promise.all([
      manager.runConnector("crm-estadual"),
      manager.runConnector("cfm"),
    ]);

    expect(first.records.length + second.records.length).toBeGreaterThan(0);
  });
});
