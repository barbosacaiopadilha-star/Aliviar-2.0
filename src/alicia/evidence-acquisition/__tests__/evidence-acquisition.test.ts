import { describe, expect, it, beforeEach } from "vitest";

import { EventBus, EventStore, EventBusMetrics } from "@/alicia/event-bus";

import { ConflictDetector } from "../conflict-detector";
import { EvidenceAcquisitionEngine } from "../evidence-acquisition-engine";
import { EvidenceCollector, buildCandidateKey } from "../evidence-collector";
import { EvidenceMerger } from "../evidence-merger";
import { EvidenceNormalizer } from "../evidence-normalizer";
import { EvidencePackageBuilder } from "../evidence-package-builder";
import { EvidenceScoreCalculator } from "../evidence-score";
import { EvidenceHistory } from "../evidence-history";
import { EvidenceMetrics } from "../evidence-metrics";
import { hashRawRecord, buildPackageId, buildConflictId } from "../hash";
import { mergeProvenanceLists, collectUniqueSources } from "../evidence-provenance";
import { EvidenceBusBridge } from "../integration/evidence-bus-bridge";
import {
  mockCfmConflictInput,
  mockCfmInput,
  mockCrmInput,
  mockFailedInput,
  mockHospitalInput,
  mockAcademicGraduationInput,
} from "../mocks/connector-inputs";

describe("Evidence Acquisition Engine", () => {
  let engine: EvidenceAcquisitionEngine;

  beforeEach(() => {
    engine = new EvidenceAcquisitionEngine();
  });

  it("agrupa registros de múltiplos conectores por candidato", () => {
    const collector = new EvidenceCollector();
    const groups = collector.collect([mockCrmInput, mockCfmInput]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.records).toHaveLength(2);
    expect(buildCandidateKey(mockCrmInput.records[0]!)).toContain("crm:ES:");
  });

  it("mescla fontes sem duplicar valores iguais", () => {
    const result = engine.acquire([mockCrmInput, mockCfmInput]);
    const pkg = result.packages[0]!;

    expect(result.packages).toHaveLength(1);
    expect(pkg.metadata.sourceCount).toBe(2);
    expect(pkg.metadata.connectorIds).toContain("crm-estadual");
    expect(pkg.metadata.connectorIds).toContain("cfm");
    expect(pkg.identity.nome).toBe("Dr. Ricardo Almeida");
    expect(pkg.registrations).toHaveLength(1);
  });

  it("preserva proveniência com hash e metadados da fonte", () => {
    const normalizer = new EvidenceNormalizer();
    const normalized = normalizer.normalize(mockCrmInput.records[0]!, mockCrmInput);

    expect(normalized.provenance.connectorId).toBe("crm-estadual");
    expect(normalized.provenance.connectorVersion).toBe("1.0.0");
    expect(normalized.provenance.rawHash).toHaveLength(64);
    expect(normalized.provenance.normalizationVersion).toBe("1.0.0");
    expect(normalized.provenance.confidenceDaFonte).toBe(0.9);

    const hash = hashRawRecord(mockCrmInput.records[0]!);
    expect(hash).toBe(normalized.provenance.rawHash);
  });

  it("detecta conflitos objetivos sem resolvê-los", () => {
    const result = engine.acquire([mockCrmInput, mockCfmConflictInput]);
    const pkg = result.packages[0]!;

    expect(pkg.conflicts.length).toBeGreaterThan(0);
    expect(pkg.conflicts.some((c) => c.type === "specialty_mismatch")).toBe(true);
    expect(pkg.conflicts.some((c) => c.type === "city_mismatch")).toBe(true);
    expect(pkg.conflicts[0]!.values.length).toBeGreaterThanOrEqual(2);
  });

  it("calcula cobertura por seção sem influenciar decisões", () => {
    const result = engine.acquire([mockCrmInput, mockCfmInput, mockAcademicGraduationInput]);
    const pkg = result.packages[0]!;
    const calculator = new EvidenceScoreCalculator();

    expect(pkg.coverage.length).toBe(8);
    expect(pkg.coverage.find((c) => c.section === "Identity")?.percentage).toBe(100);
    expect(pkg.coverage.find((c) => c.section === "Education")?.percentage).toBe(100);
    expect(pkg.coverage.find((c) => c.section === "Specialties")?.percentage).toBe(100);
    expect(pkg.coverage.find((c) => c.section === "Institutions")?.percentage).toBe(100);
    expect(pkg.coverage.find((c) => c.section === "PracticeLocations")?.percentage).toBe(100);
    expect(calculator.fromPackage(pkg)).toBeGreaterThanOrEqual(60);
  });

  it("produz Evidence Package completo", () => {
    const result = engine.acquire([mockCrmInput, mockCfmInput, mockAcademicGraduationInput]);
    const pkg = result.packages[0]!;

    expect(pkg.packageId).toMatch(/^evp-/);
    expect(pkg.evidence.length).toBeGreaterThan(0);
    expect(pkg.institutions.length).toBeGreaterThan(0);
    expect(pkg.specialties.length).toBeGreaterThan(0);
    expect(pkg.practiceLocations.length).toBeGreaterThan(0);
    expect(pkg.education.length).toBeGreaterThan(0);
    expect(pkg.education[0]!.institution).toBeTruthy();
    expect(pkg.education[0]!.graduationYear).toBeTruthy();
  });

  it("atualiza package existente incrementando versão", () => {
    const first = engine.acquire([mockCrmInput, mockCfmInput]);
    const candidateId = first.packages[0]!.candidateId;

    engine.acquire([mockCrmInput, mockCfmInput, mockHospitalInput]);
    const ricardo = engine.getPackage(candidateId);

    expect(ricardo?.metadata.version).toBe(2);
    const history = engine.getHistory().listByCandidate(candidateId);
    expect(history.some((h) => h.action === "created")).toBe(true);
    expect(history.some((h) => h.action === "updated")).toBe(true);
  });

  it("rejeita candidatos com dados insuficientes", () => {
    const strictEngine = new EvidenceAcquisitionEngine({ minRecordsPerCandidate: 2 });
    const result = strictEngine.acquire([mockHospitalInput]);

    expect(result.rejectedCount).toBe(1);
    expect(result.packages).toHaveLength(0);
    expect(strictEngine.getMetrics().snapshot().packagesRejected).toBe(1);
  });

  it("ignora conectores com falha", () => {
    const result = engine.acquire([mockFailedInput, mockHospitalInput]);
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]!.identity.nome).toContain("Camila");
  });

  it("registra histórico e métricas", () => {
    engine.acquire([mockCrmInput, mockCfmInput]);
    const metrics = engine.getMetrics().snapshot();

    expect(metrics.packagesCreated).toBe(1);
    expect(metrics.candidatesProcessed).toBe(1);
    expect(metrics.lastRunAt).toBeTruthy();
    expect(engine.getHistory().list().length).toBe(1);
  });

  it("publica eventos no Event Bus", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const bridge = new EvidenceBusBridge({ bus });
    const result = engine.acquire([mockCrmInput, mockCfmConflictInput]);

    await bridge.publishRunEvents(result);

    const store = bus.getStore();
    const events = store.list();
    expect(events.some((e) => e.eventType === "EvidencePackageCreated")).toBe(true);
    expect(events.some((e) => e.eventType === "EvidenceConflictDetected")).toBe(true);
  });

  it("publica EvidencePackageUpdated em re-aquisição", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    const bridge = new EvidenceBusBridge({ bus });

    engine.acquire([mockCrmInput, mockCfmInput]);
    const updated = engine.acquire([mockCrmInput, mockCfmInput]);
    await bridge.publishRunEvents(updated);

    const events = bus.getStore().list();
    expect(events.some((e) => e.eventType === "EvidencePackageUpdated")).toBe(true);
  });

  it("merger agrupa proveniência de fontes distintas", () => {
    const normalizer = new EvidenceNormalizer();
    const merger = new EvidenceMerger();
    const records = [
      normalizer.normalize(mockCrmInput.records[0]!, mockCrmInput),
      normalizer.normalize(mockCfmInput.records[0]!, mockCfmInput),
    ];

    const merged = merger.merge("key", "cand-1", records);
    const nomeField = merged.fields.get("nome");
    expect(nomeField?.values).toHaveLength(1);
    expect(nomeField?.values[0]!.provenance).toHaveLength(2);
  });

  it("utilitários de hash e proveniência", () => {
    expect(buildPackageId("cand-1", 1)).toBe("evp-cand-1-v1");
    expect(buildConflictId("cand-1", "crm_mismatch", "crm")).toMatch(/^evc-/);

    const prov = mockCrmInput.records[0]!;
    const lists = mergeProvenanceLists([
      [{ connectorId: "a", connectorVersion: "1", sourceName: "A", sourceUrl: "", fetchTimestamp: "", rawHash: "1", normalizationVersion: "1", confidenceDaFonte: 1 }],
      [{ connectorId: "a", connectorVersion: "1", sourceName: "A", sourceUrl: "", fetchTimestamp: "", rawHash: "1", normalizationVersion: "1", confidenceDaFonte: 1 }],
    ]);
    expect(lists).toHaveLength(1);
    expect(collectUniqueSources(lists)).toEqual(["A"]);
  });

  it("reset limpa estado do engine", () => {
    engine.acquire([mockCrmInput]);
    engine.reset();
    expect(engine.getPackages()).toHaveLength(0);
    expect(engine.getLastRunAt()).toBeNull();
  });
});

describe("ConflictDetector", () => {
  it("não gera conflito quando valores são equivalentes após normalização", () => {
    const normalizer = new EvidenceNormalizer();
    const merger = new EvidenceMerger();
    const detector = new ConflictDetector();

    const cfmVariant = {
      ...mockCfmInput,
      records: [
        {
          ...mockCfmInput.records[0]!,
          cidade: "Vitoria",
        },
      ],
    };

    const records = [
      normalizer.normalize(mockCrmInput.records[0]!, mockCrmInput),
      normalizer.normalize(cfmVariant.records[0]!, cfmVariant),
    ];

    const merged = merger.merge("key", "cand-1", records);
    const conflicts = detector.detect("cand-1", merged, new Date().toISOString());
    expect(conflicts.some((c) => c.type === "city_mismatch")).toBe(false);
  });

  it("detecta crm_mismatch quando valores divergem no mesmo candidato", () => {
    const merger = new EvidenceMerger();
    const detector = new ConflictDetector();
    const normalizer = new EvidenceNormalizer();

    const crmA = { ...mockCrmInput, records: [{ ...mockCrmInput.records[0]!, crm: "45210" }] };
    const crmB = {
      ...mockCfmInput,
      records: [{ ...mockCfmInput.records[0]!, crm: "CRM-ES 99999", recordId: "cfm-crm-conflict" }],
    };

    const records = [
      normalizer.normalize(crmA.records[0]!, crmA),
      normalizer.normalize(crmB.records[0]!, crmB),
    ];

    const merged = merger.merge("key", "cand-1", records);
    const conflicts = detector.detect("cand-1", merged, new Date().toISOString());
    expect(conflicts.some((c) => c.type === "crm_mismatch")).toBe(true);
  });
});

describe("EvidenceHistory e EvidenceMetrics", () => {
  it("registra e consulta histórico por candidato", () => {
    const history = new EvidenceHistory();
    history.record({
      packageId: "evp-1",
      candidateId: "cand-1",
      version: 1,
      action: "created",
      timestamp: "2026-07-23T00:00:00.000Z",
      conflictCount: 0,
      coverageAverage: 50,
    });

    expect(history.list()).toHaveLength(1);
    expect(history.getLatest("cand-1")?.packageId).toBe("evp-1");
    history.reset();
    expect(history.list()).toHaveLength(0);
  });

  it("métricas calculam média de cobertura", () => {
    const metrics = new EvidenceMetrics();
    metrics.recordCreated(0, 80);
    metrics.recordCreated(1, 60);
    expect(metrics.snapshot().averageCoverage).toBe(70);
    metrics.reset();
    expect(metrics.snapshot().packagesCreated).toBe(0);
  });
});

describe("EvidencePackageBuilder", () => {
  it("constrói package com campos vazios quando sem dados", () => {
    const builder = new EvidencePackageBuilder();
    const merger = new EvidenceMerger();
    const merged = merger.merge("key", "cand-empty", []);
    const calculator = new EvidenceScoreCalculator();

    const pkg = builder.build({
      merged,
      conflicts: [],
      coverage: calculator.calculate(merged),
      runId: "run-1",
      version: 1,
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
    });

    expect(pkg.registrations).toEqual([]);
    expect(pkg.institutions).toEqual([]);
  });
});
