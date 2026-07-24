import { describe, expect, it, beforeEach, vi } from "vitest";

import { PublicationPipeline } from "@/alicia/publication-pipeline";
import { createCandidate, createMinimumEvidence } from "@/alicia/protocol-engine/__tests__/fixtures";
import { evaluateEvidence, decidePublication } from "@/alicia/protocol-engine";

import { createCorrelationId } from "../correlation";
import { DeadLetterQueue } from "../dead-letter-queue";
import { EventBus } from "../event-bus";
import { EventStore } from "../event-store";
import { handleEvidenceRequested } from "../integration/evidence-facade";
import { handleEvidenceCollected } from "../integration/protocol-facade";
import { handlePublicationRequested } from "../integration/publication-facade";
import {
  registerDiscoveredCandidate,
  resetWorkflowContext,
  setCandidateEvidence,
} from "../integration/workflow-context";
import { EventBusMetrics } from "../metrics";
import { RetryQueue } from "../retry-queue";
import { WorkflowEngine } from "../workflow-engine";
import {
  getWorkflowMonitorSnapshot,
  getWorkflowTimelineByCorrelation,
  resetWorkflowSession,
} from "../studio-adapter";
import type { DiscoveryCandidate } from "@/alicia/discovery";

function buildCandidate(overrides: Partial<DiscoveryCandidate> = {}): DiscoveryCandidate {
  return {
    candidateId: "disc-test-candidate",
    nome: "Dr. Teste Protocolo",
    crm: "12.345",
    crmUf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitória",
    estado: "ES",
    fonteOrigem: "cfm",
    fontesEncontradas: ["cfm", "hospital"],
    urlOrigem: "https://example.com/medico",
    dataDescoberta: "2026-07-22T10:00:00.000Z",
    confidence: 0.9,
    hashIdentidade: "hash-test",
    status: "QUEUED",
    ...overrides,
  };
}

describe("event-bus integration coverage", () => {
  beforeEach(() => {
    resetWorkflowSession();
    resetWorkflowContext();
  });

  it("cobre publication-facade success, rollback e review case", async () => {
    const store = new EventStore();
    const bus = new EventBus(store, new EventBusMetrics());
    const pipeline = new PublicationPipeline();
    const candidate = buildCandidate({ candidateId: "disc-pub-ok" });
    registerDiscoveredCandidate(candidate);
    setCandidateEvidence(candidate.candidateId, createMinimumEvidence());

    const baseEvent = {
      eventType: "PublicationRequested" as const,
      aggregateId: candidate.candidateId,
      payload: { candidateId: candidate.candidateId, protocolDecisionId: "pd-ok" },
      timestamp: new Date().toISOString(),
      correlationId: createCorrelationId(candidate.candidateId),
      causationId: null,
      source: "test",
      version: 1,
    };

    const executeSpy = vi.spyOn(pipeline, "execute");
    executeSpy.mockReturnValueOnce({
      status: "PUBLISHED",
      snapshotId: "snap-1",
    });
    await handlePublicationRequested(bus, pipeline, { ...baseEvent, eventId: "evt-pub-ok" });
    expect(store.listByType("PublicationSucceeded")).toHaveLength(1);

    executeSpy.mockReturnValueOnce({
      status: "ROLLBACK_EXECUTED",
      snapshotId: "snap-2",
      message: "rollback",
      reviewCase: {
        candidateId: candidate.candidateId,
        caseId: "case-1",
        doctorId: candidate.candidateId,
        reason: "PUBLICATION_INCONSISTENT",
        summary: "Inconsistência pós-publicação",
        blocks: [],
        createdAt: new Date().toISOString(),
      },
    });
    await handlePublicationRequested(bus, pipeline, { ...baseEvent, eventId: "evt-pub-rollback" });
    expect(store.listByType("PublicationRolledBack")).toHaveLength(1);
    expect(store.listByType("ReviewCaseCreated").length).toBeGreaterThan(0);

    executeSpy.mockReturnValueOnce({
      status: "BLOCKED",
      message: "Bloqueado no preflight",
      reviewCase: {
        candidateId: candidate.candidateId,
        caseId: "case-2",
        doctorId: candidate.candidateId,
        reason: "PUBLICATION_BLOCKED",
        summary: "Preflight bloqueou",
        blocks: [],
        createdAt: new Date().toISOString(),
      },
    });
    await handlePublicationRequested(bus, pipeline, { ...baseEvent, eventId: "evt-pub-fail" });
    expect(store.listByType("PublicationFailed")).toHaveLength(1);
    executeSpy.mockRestore();
  });

  it("cobre publication-facade com candidato elegível", async () => {
    const store = new EventStore();
    const metrics = new EventBusMetrics();
    const bus = new EventBus(store, metrics);
    const pipeline = new PublicationPipeline();
    const candidate = buildCandidate();

    registerDiscoveredCandidate(candidate);
    const protocolCandidate = createCandidate({
      id: candidate.candidateId,
      name: candidate.nome,
      crm: "CRM-ES 12.345",
      rqe: "RQE 9.999",
      graduation: { institution: "EMESCAM", verified: false },
      residency: [{ institution: "ICOT", program: "Ortopedia", verified: true }],
    });
    const evidence = createMinimumEvidence();
    setCandidateEvidence(candidate.candidateId, evidence);

    const correlationId = createCorrelationId(candidate.candidateId, "pub-test");
    const decision = decidePublication(
      protocolCandidate,
      evidence,
      evaluateEvidence(protocolCandidate, evidence),
    );

    expect(decision.outcome).toBe("AUTO_PUBLISH");

    await handlePublicationRequested(bus, pipeline, {
      eventId: "evt-pub-req",
      eventType: "PublicationRequested",
      aggregateId: candidate.candidateId,
      payload: {
        candidateId: candidate.candidateId,
        protocolDecisionId: "pd-test",
      },
      timestamp: new Date().toISOString(),
      correlationId,
      causationId: null,
      source: "test",
      version: 1,
    });

    const types = store.list().map((event) => event.eventType);
    expect(types).toContain("PublicationStarted");
    expect(
      types.includes("PublicationSucceeded") ||
        types.includes("PublicationFailed") ||
        types.includes("PublicationRolledBack"),
    ).toBe(true);
  });

  it("cobre evidence-facade com falha", async () => {
    const store = new EventStore();
    const bus = new EventBus(store, new EventBusMetrics());
    const correlationId = createCorrelationId("missing", "fail");

    await handleEvidenceRequested(bus, {
      eventId: "evt-ev-fail",
      payload: { candidateId: "missing", correlationId },
      correlationId,
    });

    expect(store.listByType("EvidenceFailed")).toHaveLength(1);
  });

  it("cobre studio adapter sem refresh com store vazio", async () => {
    resetWorkflowSession();
    const snapshot = await getWorkflowMonitorSnapshot({ refresh: false });
    expect(snapshot.timeline.length).toBeGreaterThan(0);
  });

  it("cobre studio adapter snapshot e timeline", async () => {
    const snapshot = await getWorkflowMonitorSnapshot({ refresh: true });
    expect(snapshot.timeline.length).toBeGreaterThan(0);
    expect(snapshot.metrics.eventsPublished).toBeGreaterThan(0);

    const corr = snapshot.timeline[0]!.event.correlationId;
    const timeline = await getWorkflowTimelineByCorrelation(corr);
    expect(timeline.correlationId).toBe(corr);
  });

  it("cobre publication-facade com bloqueio e candidato ausente", async () => {
    const store = new EventStore();
    const bus = new EventBus(store, new EventBusMetrics());
    const pipeline = new PublicationPipeline();

    await handlePublicationRequested(bus, pipeline, {
      eventId: "evt-missing",
      eventType: "PublicationRequested",
      aggregateId: "missing",
      payload: { candidateId: "missing", protocolDecisionId: "pd" },
      timestamp: new Date().toISOString(),
      correlationId: "corr",
      causationId: null,
      source: "test",
      version: 1,
    });
    expect(store.size()).toBe(0);

    const blocked = buildCandidate({ candidateId: "disc-blocked", crm: "12.345", nome: "Dr. Sem RQE" });
    registerDiscoveredCandidate(blocked);
    setCandidateEvidence(blocked.candidateId, [
      {
        id: "crm-only",
        name: "CRM-ES 12.345",
        type: "Registro profissional",
        level: 1,
        consultedAt: blocked.dataDescoberta,
        responsible: "test",
        supportsFields: ["crm"],
      },
    ]);

    await handlePublicationRequested(bus, pipeline, {
      eventId: "evt-blocked",
      eventType: "PublicationRequested",
      aggregateId: blocked.candidateId,
      payload: { candidateId: blocked.candidateId, protocolDecisionId: "pd-blocked" },
      timestamp: new Date().toISOString(),
      correlationId: createCorrelationId(blocked.candidateId),
      causationId: null,
      source: "test",
      version: 1,
    });

    expect(store.listByType("PublicationFailed").length).toBeGreaterThan(0);
  });

  it("cobre protocol-facade sem candidato registrado", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    await handleEvidenceCollected(bus, {
      eventId: "evt-no-cand",
      eventType: "EvidenceCollected",
      aggregateId: "ghost",
      payload: { candidateId: "ghost", evidenceCount: 0 },
      timestamp: new Date().toISOString(),
      correlationId: "corr",
      causationId: null,
      source: "test",
      version: 1,
    });
    expect(bus.getStore().size()).toBe(0);
  });

  it("cobre workflow stop sem start e PublicationRequested via AUTO_PUBLISH", async () => {
    const workflow = new WorkflowEngine();
    workflow.stop();

    workflow.start();
    const candidate = buildCandidate({ candidateId: "disc-auto-pub" });
    registerDiscoveredCandidate(candidate);
    setCandidateEvidence(candidate.candidateId, createMinimumEvidence());
    const correlationId = createCorrelationId(candidate.candidateId);

    await workflow.getBus().publish({
      eventType: "ProtocolEvaluated",
      aggregateId: candidate.candidateId,
      payload: { candidateId: candidate.candidateId, outcome: "AUTO_PUBLISH", suggestedNivel: "B" },
      correlationId,
      source: "test",
    });

    const types = workflow.getStore().list().map((event) => event.eventType);
    expect(types).toContain("PublicationRequested");
    expect(types).toContain("PublicationStarted");
  });

  it("cobre retry job inexistente e handler com retry", async () => {
    const metrics = new EventBusMetrics();
    const dlq = new DeadLetterQueue();
    const retry = new RetryQueue(dlq, metrics, 1);
    const retryWithAttempts = new RetryQueue(dlq, metrics, 3);
    const event = {
      eventId: "evt-retry",
      eventType: "EvidenceRequested" as const,
      aggregateId: "c1",
      payload: { candidateId: "c1", correlationId: "corr" },
      timestamp: new Date().toISOString(),
      correlationId: "corr",
      causationId: null,
      source: "test",
      version: 1,
    };

    retry.enqueue(event, "missing-handler");
    const status = await retry.processJob(retry.list()[0]!.jobId);
    expect(status).toBe("DeadLetter");
    expect(await retry.processJob("job-inexistente")).toBe("Failed");

    retryWithAttempts.registerHandler("flaky", async () => {
      throw new Error("falha temporária");
    });
    retryWithAttempts.enqueue(event, "flaky");
    expect(await retryWithAttempts.processJob(retryWithAttempts.list()[0]!.jobId)).toBe("Retrying");
    expect(metrics.snapshot().retryCount).toBe(1);

    const workflow = new WorkflowEngine();
    workflow.start();
    await workflow.enqueueEvidenceWithRetry(event);
  });

  it("cobre event bus sem listeners", async () => {
    const bus = new EventBus(new EventStore(), new EventBusMetrics());
    await bus.publish({
      eventType: "ReviewCaseResolved",
      aggregateId: "c1",
      payload: { candidateId: "c1", resolution: "ok" },
      correlationId: "corr",
      source: "test",
    });
    expect(bus.getMetrics().snapshot().eventsProcessed).toBe(0);
  });

  it("cobre métricas reset e DLQ list", () => {
    const metrics = new EventBusMetrics();
    metrics.recordPublished("DiscoveryCompleted");
    metrics.reset();
    expect(metrics.snapshot().eventsPublished).toBe(0);

    const dlq = new DeadLetterQueue();
    expect(dlq.list()).toHaveLength(0);
  });

  it("exporta API pública", async () => {
    const api = await import("../index");
    expect(api.EVENT_BUS_VERSION).toBe("1.0");
    expect(typeof api.WorkflowEngine).toBe("function");
  });
});
