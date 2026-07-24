import { describe, expect, it, beforeEach } from "vitest";

import { DiscoveryAuditTrail } from "../audit";
import { deduplicateCandidates, normalizeDiscoveryRecord } from "../deduplicator";
import { DiscoveryEngine } from "../discovery-engine";
import { DiscoveryQueue } from "../discovery-queue";
import { buildIdentityHash } from "../identity-hash";
import { DiscoveryMetrics } from "../metrics";
import {
  normalizeCity,
  normalizeCrm,
  normalizeName,
  normalizePhone,
  normalizeSpecialty,
  normalizeUrl,
} from "../normalizer";
import {
  cfmDiscoverySource,
  createFailingDiscoverySource,
  crmEstadualDiscoverySource,
  defaultDiscoverySources,
} from "../sources/mock-sources";
import { getDiscoveryInboxSnapshot, resetDiscoverySession } from "../studio-adapter";
import type { DiscoverySource } from "../ports/discovery-source";
import type { RawDiscoveryRecord } from "../types";

function createOfflineSource(): DiscoverySource {
  return {
    id: "offline",
    name: "Offline",
    priority: 50,
    discover() {
      return { records: [] };
    },
    health() {
      return "OFFLINE";
    },
  };
}

describe("Discovery Engine 1.0", () => {
  beforeEach(() => {
    resetDiscoverySession();
  });

  it("executa descoberta simples com uma fonte", async () => {
    const engine = new DiscoveryEngine({
      sources: [cfmDiscoverySource],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    });

    const result = await engine.run();

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.queueItems.length).toBeGreaterThan(0);
    expect(result.metrics.sourcesExecuted).toBe(1);
    expect(engine.getAuditTrail().list()).toHaveLength(1);
  });

  it("executa múltiplas fontes mock", async () => {
    const result = await new DiscoveryEngine({
      sources: defaultDiscoverySources,
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    }).run();

    expect(result.metrics.sourcesExecuted).toBe(defaultDiscoverySources.length);
    expect(Object.keys(result.sourceHealth).length).toBe(defaultDiscoverySources.length);
  });

  it("deduplica o mesmo médico encontrado em duas fontes", async () => {
    const result = await new DiscoveryEngine({
      sources: [cfmDiscoverySource, crmEstadualDiscoverySource],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    }).run();

    const ricardo = result.candidates.find((candidate) => candidate.nome.includes("Ricardo"));
    expect(ricardo).toBeDefined();
    expect(ricardo?.fontesEncontradas.length).toBeGreaterThan(1);
    expect(result.metrics.duplicates).toBeGreaterThan(0);
  });

  it("gera hash de identidade estável", () => {
    const first = buildIdentityHash({
      nome: "Dr. Ricardo Almeida",
      crm: "45.210",
      crmUf: "ES",
      especialidade: "Ortopedia",
    });
    const second = buildIdentityHash({
      nome: "dr ricardo almeida",
      crm: "45210",
      crmUf: "es",
      especialidade: "ortopedia",
    });

    expect(first).toBe(second);
  });

  it("normaliza nomes, CRM, especialidades, cidades, URLs e telefones", () => {
    expect(normalizeName("  dr.   joao   silva ")).toBe("Dr. Joao Silva");
    expect(normalizeCrm("CRM-ES 12.345")).toBe("12.345");
    expect(normalizeSpecialty("ortopedia e traumatologia")).toBe("Ortopedia");
    expect(normalizeCity("vitoria")).toBe("Vitória");
    expect(normalizeUrl("https://example.com/path")).toContain("https://");
    expect(normalizePhone("27999998888")).toBe("(27) 99999-8888");
  });

  it("enfileira candidatos na DiscoveryQueue", async () => {
    const queue = new DiscoveryQueue();
    const engine = new DiscoveryEngine({
      sources: [cfmDiscoverySource],
      queue,
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    });

    await engine.run();

    expect(queue.size()).toBeGreaterThan(0);
    expect(queue.listByStatus("READY_FOR_EVIDENCE").length).toBeGreaterThan(0);
  });

  it("reporta health das fontes", async () => {
    const result = await new DiscoveryEngine({
      sources: defaultDiscoverySources,
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    }).run();

    expect(result.sourceHealth.cfm).toBe("ONLINE");
    expect(result.sourceHealth.hospital).toBe("DEGRADED");
    expect(result.sourceHealth["site-institucional"]).toBe("UNKNOWN");
  });

  it("registra falha de fonte sem interromper outras", async () => {
    const result = await new DiscoveryEngine({
      sources: [cfmDiscoverySource, createFailingDiscoverySource()],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    }).run();

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.metrics.sourceFailures).toBeGreaterThan(0);
  });

  it("ignora fonte offline", async () => {
    const audit = new DiscoveryAuditTrail();
    const result = await new DiscoveryEngine({
      sources: [createOfflineSource(), cfmDiscoverySource],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit,
    }).run();

    expect(result.metrics.sourceFailures).toBe(1);
    expect(audit.list().some((event) => event.failed && event.sourceId === "offline")).toBe(true);
  });

  it("registra métricas cumulativas", async () => {
    const metrics = new DiscoveryMetrics();
    const engine = new DiscoveryEngine({
      sources: [cfmDiscoverySource],
      queue: new DiscoveryQueue(),
      metrics,
      audit: new DiscoveryAuditTrail(),
    });

    await engine.run();
    await engine.run();

    const snapshot = metrics.snapshot();
    expect(snapshot.candidatesFound).toBeGreaterThan(0);
    expect(snapshot.sourcesExecuted).toBe(2);
    expect(snapshot.averageDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("mantém auditoria append-only", async () => {
    const audit = new DiscoveryAuditTrail();
    const engine = new DiscoveryEngine({
      sources: [cfmDiscoverySource],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit,
    });

    await engine.run();
    const firstSize = audit.list().length;
    await engine.run();

    expect(audit.list().length).toBeGreaterThan(firstSize);
  });

  it("ignora candidatos fora de escopo", () => {
    const record: RawDiscoveryRecord = {
      nome: "Dr. Externo",
      crm: "CRM-SP 11.111",
      especialidade: "Dermatologia",
      cidade: "São Paulo",
      estado: "SP",
      confidence: 0.9,
    };

    expect(normalizeDiscoveryRecord(record, "test", new Date().toISOString())).toBeNull();
  });

  it("classifica duplicados explicitamente no deduplicator", () => {
    const discoveredAt = new Date().toISOString();
    const base = normalizeDiscoveryRecord(
      {
        nome: "Dr. Ricardo Almeida",
        crm: "CRM-ES 45.210",
        especialidade: "Ortopedia",
        cidade: "Vitória",
        estado: "ES",
        confidence: 0.9,
      },
      "cfm",
      discoveredAt,
    )!;

    const duplicate = normalizeDiscoveryRecord(
      {
        nome: "Dr. Ricardo Almeida",
        crm: "45210",
        crmUf: "ES",
        especialidade: "Ortopedia",
        cidade: "Vitoria",
        estado: "ES",
        confidence: 0.85,
      },
      "hospital",
      discoveredAt,
    )!;

    const result = deduplicateCandidates([base, duplicate]);
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.unique[0]?.fontesEncontradas).toEqual(
      expect.arrayContaining(["cfm", "hospital"]),
    );
  });

  it("expõe snapshot para o Studio", async () => {
    const snapshot = await getDiscoveryInboxSnapshot();
    expect(snapshot.items.length).toBeGreaterThan(0);
    expect(snapshot.metrics.candidatesFound).toBeGreaterThan(0);
  });

  it("ignora candidatos com baixa confiança", () => {
    const discoveredAt = new Date().toISOString();
    const lowConfidence = normalizeDiscoveryRecord(
      {
        nome: "Dr. Baixa Confiança",
        crm: "CRM-ES 77.777",
        especialidade: "Ortopedia",
        cidade: "Vitória",
        estado: "ES",
        confidence: 0.2,
      },
      "test",
      discoveredAt,
    )!;

    const result = deduplicateCandidates([lowConfidence]);
    expect(result.ignored).toHaveLength(1);
    expect(result.unique).toHaveLength(0);
  });

  it("cobre auditoria por fonte e reset de métricas", async () => {
    const audit = new DiscoveryAuditTrail();
    const metrics = new DiscoveryMetrics();

    const engine = new DiscoveryEngine({
      sources: [cfmDiscoverySource],
      queue: new DiscoveryQueue(),
      metrics,
      audit,
    });

    await engine.run();
    expect(audit.listBySource("cfm").length).toBeGreaterThan(0);

    metrics.reset();
    expect(metrics.snapshot().candidatesFound).toBe(0);
  });

  it("cobre runDiscovery e falha com exceção", async () => {
    const throwingSource: DiscoverySource = {
      id: "throws",
      name: "Throws",
      priority: 1,
      discover() {
        throw new Error("boom");
      },
      health() {
        return "ONLINE";
      },
    };

    const { runDiscovery } = await import("../discovery-engine");
    const result = await runDiscovery({
      sources: [throwingSource],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    });

    expect(result.metrics.sourceFailures).toBe(1);
  });

  it("cobre normalização de URLs e telefones inválidos", () => {
    expect(normalizeUrl("ftp://invalid")).toBe("");
    expect(normalizePhone("123")).toBeUndefined();
    expect(normalizePhone("2733221100")).toBe("(27) 3322-1100");
  });

  it("cobre fonte mock com falha controlada", async () => {
    const result = await new DiscoveryEngine({
      sources: [createFailingDiscoverySource()],
      queue: new DiscoveryQueue(),
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    }).run();

    expect(result.candidates).toHaveLength(0);
    expect(result.metrics.sourceFailures).toBe(1);
  });

  it("cobre fila IGNORED e re-enfileiramento", async () => {
    const lowConfSource: DiscoverySource = {
      id: "low-conf",
      name: "Baixa confiança",
      priority: 1,
      discover() {
        return {
          records: [
            {
              nome: "Dr. Baixa Fila",
              crm: "CRM-ES 66.666",
              especialidade: "Ortopedia",
              cidade: "Vitória",
              estado: "ES",
              confidence: 0.2,
            },
          ],
        };
      },
      health() {
        return "ONLINE";
      },
    };

    const queue = new DiscoveryQueue();
    await new DiscoveryEngine({
      sources: [lowConfSource],
      queue,
      metrics: new DiscoveryMetrics(),
      audit: new DiscoveryAuditTrail(),
    }).run();

    expect(queue.listByStatus("IGNORED").length).toBeGreaterThan(0);
  });

  it("exporta API pública do módulo", async () => {
    const api = await import("../index");
    expect(api.DISCOVERY_ENGINE_VERSION).toBe("1.0");
    expect(typeof api.runDiscovery).toBe("function");
  });
});
