import { describe, expect, it, beforeEach } from "vitest";

import * as api from "../index";
import {
  getEvidenceExplorerSnapshot,
  resetEvidenceSession,
} from "../studio-adapter";
import { EvidenceAcquisitionEngine } from "../evidence-acquisition-engine";
import { EvidenceNormalizer } from "../evidence-normalizer";
import { mergeValue } from "../evidence-merger";
import { mockCrmInput, mockCfmInput } from "../mocks/connector-inputs";

describe("evidence-acquisition modules coverage", () => {
  beforeEach(() => {
    resetEvidenceSession();
  });

  it("cobre studio adapter snapshot", async () => {
    const snapshot = await getEvidenceExplorerSnapshot({ refresh: true });
    expect(snapshot.packages.length).toBeGreaterThan(0);
    expect(snapshot.metrics.packagesCreated).toBeGreaterThan(0);
    expect(snapshot.connectorRunId).toBeTruthy();
  });

  it("cobre studio adapter sem refresh com sessão existente", async () => {
    await getEvidenceExplorerSnapshot({ refresh: true });
    const snapshot = await getEvidenceExplorerSnapshot();
    expect(snapshot.packages.length).toBeGreaterThan(0);
  });

  it("cobre mergeValue com valor diferente", () => {
    const prov = {
      connectorId: "a",
      connectorVersion: "1",
      sourceName: "A",
      sourceUrl: "",
      fetchTimestamp: "",
      rawHash: "1",
      normalizationVersion: "1",
      confidenceDaFonte: 1,
    };
    const existing = { value: "A", provenance: [prov] };
    const result = mergeValue(existing, "B", prov);
    expect(result.value).toBe("A");
  });

  it("cobre normalizer com URL inválida", () => {
    const normalizer = new EvidenceNormalizer();
    const record = {
      ...mockCrmInput.records[0]!,
      urlOrigem: "not-a-url",
    };
    const normalized = normalizer.normalize(record, mockCrmInput);
    expect(normalized.institutionName).toBe("");
  });

  it("cobre bridge com rejeições", async () => {
    const engine = new EvidenceAcquisitionEngine({ minRecordsPerCandidate: 5 });
    const result = engine.acquire([mockCrmInput]);
    expect(result.rejectedCount).toBe(1);

    const { EvidenceBusBridge } = await import("../integration/evidence-bus-bridge");
    const { EventBus, EventStore, EventBusMetrics } = await import("@/alicia/event-bus");
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const bridge = new EvidenceBusBridge({ bus });
    await bridge.publishRunEvents(result);

    const events = bus.getStore().list();
    expect(events.some((e) => e.eventType === "EvidencePackageRejected")).toBe(true);
  });

  it("exporta API pública", () => {
    expect(api.EVIDENCE_ACQUISITION_VERSION).toBe("1.0.0");
    expect(api.EvidenceAcquisitionEngine).toBeDefined();
    expect(api.EvidenceCollector).toBeDefined();
    expect(api.ConflictDetector).toBeDefined();
    expect(api.getEvidenceExplorerSnapshot).toBeDefined();
  });

  it("cobre createProvenance e collector por nome", () => {
    const { createProvenance } = api;
    const prov = createProvenance(
      {
        connectorId: "x",
        connectorVersion: "1",
        sourceName: "X",
        sourceUrl: "https://x.com",
        fetchTimestamp: "2026-01-01",
        rawHash: "abc",
        confidenceDaFonte: 0.5,
      },
      "1.0.0",
    );
    expect(prov.normalizationVersion).toBe("1.0.0");

    const collector = new api.EvidenceCollector();
    const noCrm = {
      ...mockCrmInput,
      records: [{ ...mockCrmInput.records[0]!, crm: "", recordId: "no-crm" }],
    };
    const groups = collector.collect([noCrm]);
    expect(groups[0]!.candidateKey).toMatch(/^nome:/);
  });

  it("cobre institutionFromUrl e score vazio", () => {
    const normalizer = new EvidenceNormalizer();
    const withUrl = normalizer.normalize(
      { ...mockCrmInput.records[0]!, urlOrigem: "https://www.hospital.org.br/page" },
      mockCrmInput,
    );
    expect(withUrl.institutionName).toBe("Org");

    const calculator = new api.EvidenceScoreCalculator();
    expect(calculator.averageCoverage([])).toBe(0);
    expect(calculator.fromPackage({ coverage: [] } as never)).toBe(0);
  });

  it("cobre conflitos de instituição e rqe", () => {
    const merger = new api.EvidenceMerger();
    const detector = new api.ConflictDetector();
    const normalizer = new EvidenceNormalizer();

    const a = normalizer.normalize(mockCrmInput.records[0]!, mockCrmInput);
    const b = normalizer.normalize(
      {
        ...mockCfmInput.records[0]!,
        urlOrigem: "https://outro-hospital.com.br",
        recordId: "inst-conflict",
      },
      mockCfmInput,
    );

    const merged = merger.merge("k", "c1", [a, b]);
    merged.fields.set("rqe", {
      field: "rqe",
      values: [
        { value: "12345", provenance: [a.provenance] },
        { value: "67890", provenance: [b.provenance] },
      ],
    });

    const conflicts = detector.detect("c1", merged, new Date().toISOString());
    expect(conflicts.some((c) => c.type === "institution_mismatch")).toBe(true);
    expect(conflicts.some((c) => c.type === "rqe_mismatch")).toBe(true);
  });

  it("cobre merger com campo vazio e proveniência duplicada", () => {
    const merger = new api.EvidenceMerger();
    const normalizer = new EvidenceNormalizer();
    const record = normalizer.normalize(mockCrmInput.records[0]!, mockCrmInput);
    record.telefone = undefined;
    const merged = merger.merge("k", "c1", [record]);
    expect(merged.fields.has("telefone")).toBe(false);
  });
});
