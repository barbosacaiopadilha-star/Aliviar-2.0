import { describe, expect, it } from "vitest";

import {
  InMemoryCaseLookup,
  InMemoryJourneyLookup,
  InMemoryPatientLookup,
  InMemoryReportRepository,
  InMemoryReportVersionRepository,
} from "./infrastructure/in-memory-repositories";
import { CurationReportAggregate } from "./model/curation-report";
import { addCuratorNote } from "./services/add-curator-note";
import { addEvidence } from "./services/add-evidence";
import { addMedicalCandidate } from "./services/add-medical-candidate";
import { approveReport } from "./services/approve-report";
import { archiveReport } from "./services/archive-report";
import { createReport } from "./services/create-report";
import { deliverReport } from "./services/deliver-report";

const JOURNEY_ID = "journey-1";
const CASE_ID = "case-1";
const PATIENT_ID = "patient-1";
const ACTOR_ID = "curator-1";

let tick = 0;

function buildDeps() {
  tick += 1;
  return {
    reportRepository: new InMemoryReportRepository(),
    versionRepository: new InMemoryReportVersionRepository(),
    caseLookup: new InMemoryCaseLookup([
      { id: CASE_ID, patientId: PATIENT_ID, journeyId: JOURNEY_ID },
    ]),
    journeyLookup: new InMemoryJourneyLookup([{ id: JOURNEY_ID, patientId: PATIENT_ID }]),
    patientLookup: new InMemoryPatientLookup([{ id: PATIENT_ID }]),
    ids: { nextId: () => `id-${tick += 1}` },
    clock: { now: () => `2026-07-22T14:00:${String(tick).padStart(2, "0")}.000Z` },
  };
}

describe("CurationReportAggregate", () => {
  it("reidrata apenas com jornada, caso e paciente válidos", () => {
    const aggregate = CurationReportAggregate.create({
      id: "report-1",
      journeyId: JOURNEY_ID,
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "Contexto",
      criteriaUsed: ["Critério A"],
      actorId: ACTOR_ID,
      occurredAt: "2026-07-22T14:00:00.000Z",
    });

    const snapshot = aggregate.toSnapshot();
    expect(CurationReportAggregate.rehydrate({ ...snapshot, journeyId: "" }).ok).toBe(false);
    expect(CurationReportAggregate.rehydrate({ ...snapshot, caseId: "" }).ok).toBe(false);
    expect(CurationReportAggregate.rehydrate({ ...snapshot, patientId: "" }).ok).toBe(false);
  });
});

describe("curation report services", () => {
  it("cria relatório vinculado a jornada, caso e paciente", async () => {
    const deps = buildDeps();
    const created = await createReport(deps, {
      journeyId: JOURNEY_ID,
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "História compartilhada pelo paciente.",
      criteriaUsed: ["Adequação clínica", "Disponibilidade"],
      actorId: ACTOR_ID,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.value.status).toBe("DRAFT");
    expect(created.value.journeyId).toBe(JOURNEY_ID);
    expect(created.value.caseId).toBe(CASE_ID);
    expect(created.value.patientId).toBe(PATIENT_ID);
    expect(created.value.currentVersion).toBe(1);
    expect(created.value.auditTrail).toHaveLength(1);
  });

  it("rejeita criação sem vínculo válido entre entidades", async () => {
    const deps = {
      ...buildDeps(),
      journeyLookup: new InMemoryJourneyLookup([
        { id: JOURNEY_ID, patientId: PATIENT_ID },
        { id: "journey-other", patientId: PATIENT_ID },
      ]),
    };

    const invalid = await createReport(deps, {
      journeyId: "journey-other",
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "Contexto",
      criteriaUsed: ["Critério"],
      actorId: ACTOR_ID,
    });

    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.error.code).toBe("DOMAIN_ERROR");
  });

  it("versiona e audita alterações relevantes", async () => {
    const deps = buildDeps();
    const created = await createReport(deps, {
      journeyId: JOURNEY_ID,
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "Contexto",
      criteriaUsed: ["Critério"],
      actorId: ACTOR_ID,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const withEvidence = await addEvidence(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      evidence: {
        origin: "JourneyMemory",
        description: "Observação compartilhada",
        type: "OBSERVATION",
        confidence: 0.9,
        reference: "mem-note-1",
      },
    });
    expect(withEvidence.ok).toBe(true);
    if (!withEvidence.ok) return;

    expect(withEvidence.value.currentVersion).toBe(2);
    expect(withEvidence.value.evidences).toHaveLength(1);

    const versions = await deps.versionRepository.listByReportId(created.value.id);
    expect(versions).toHaveLength(2);
    expect(versions[0]?.version).toBe(1);
    expect(versions[1]?.version).toBe(2);
    expect(withEvidence.value.auditTrail.length).toBeGreaterThanOrEqual(2);
  });

  it("percorre transições válidas até arquivamento", async () => {
    const deps = buildDeps();
    const created = await createReport(deps, {
      journeyId: JOURNEY_ID,
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "Contexto",
      criteriaUsed: ["Critério"],
      actorId: ACTOR_ID,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const evidence = await addEvidence(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      evidence: {
        origin: "Documento",
        description: "Laudo",
        type: "DOCUMENTARY",
        confidence: 0.8,
        reference: "doc-1",
      },
    });
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) return;

    const evidenceId = evidence.value.evidences[0]!.id;

    const candidate = await addMedicalCandidate(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      candidate: {
        identification: "dr-001",
        specialty: "Neurologia",
        justification: "Experiência com o perfil clínico.",
        relatedEvidenceIds: [evidenceId],
        priority: 1,
        selectionReasons: [{ criterion: "Adequação clínica", rationale: "Histórico compatível." }],
      },
    });
    expect(candidate.ok).toBe(true);
    if (!candidate.ok) return;

    const submitted = await addCuratorNote(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      content: "Relatório pronto para revisão.",
      submitForReview: true,
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) return;
    expect(submitted.value.status).toBe("UNDER_REVIEW");

    const approved = await approveReport(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.value.status).toBe("APPROVED");

    const delivered = await deliverReport(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
    });
    expect(delivered.ok).toBe(true);
    if (!delivered.ok) return;
    expect(delivered.value.status).toBe("DELIVERED");

    const archived = await archiveReport(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
    });
    expect(archived.ok).toBe(true);
    if (!archived.ok) return;
    expect(archived.value.status).toBe("ARCHIVED");
  });

  it("bloqueia transições inválidas e mutações após aprovação", async () => {
    const deps = buildDeps();
    const created = await createReport(deps, {
      journeyId: JOURNEY_ID,
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "Contexto",
      criteriaUsed: ["Critério"],
      actorId: ACTOR_ID,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const invalidApprove = await approveReport(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
    });
    expect(invalidApprove.ok).toBe(false);

    const evidence = await addEvidence(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      evidence: {
        origin: "Clínica",
        description: "Evidência",
        type: "CLINICAL",
        confidence: 0.7,
        reference: "ref-1",
      },
    });
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) return;

    await addMedicalCandidate(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      candidate: {
        identification: "dr-002",
        specialty: "Ortopedia",
        justification: "Perfil adequado.",
        relatedEvidenceIds: [evidence.value.evidences[0]!.id],
        priority: 2,
        selectionReasons: [{ criterion: "Critério", rationale: "Racional." }],
      },
    });

    await addCuratorNote(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      content: "Enviar para revisão.",
      submitForReview: true,
    });

    const approved = await approveReport(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;

    const blockedEvidence = await addEvidence(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      evidence: {
        origin: "Nova",
        description: "Tarde demais",
        type: "OTHER",
        confidence: 0.5,
        reference: "ref-2",
      },
    });
    expect(blockedEvidence.ok).toBe(false);

    const invalidDeliver = await deliverReport(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
    });
    expect(invalidDeliver.ok).toBe(true);
  });

  it("mantém histórico de versões append-only", async () => {
    const deps = buildDeps();
    const created = await createReport(deps, {
      journeyId: JOURNEY_ID,
      caseId: CASE_ID,
      patientId: PATIENT_ID,
      sharedContextSummary: "Contexto",
      criteriaUsed: ["Critério"],
      actorId: ACTOR_ID,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await addEvidence(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      evidence: {
        origin: "Memória",
        description: "Evidência 1",
        type: "OBSERVATION",
        confidence: 0.6,
        reference: "ref-a",
      },
    });

    const versionsAfterFirst = await deps.versionRepository.listByReportId(created.value.id);
    await addEvidence(deps, {
      reportId: created.value.id,
      actorId: ACTOR_ID,
      evidence: {
        origin: "Memória",
        description: "Evidência 2",
        type: "OBSERVATION",
        confidence: 0.7,
        reference: "ref-b",
      },
    });

    const versionsAfterSecond = await deps.versionRepository.listByReportId(created.value.id);
    expect(versionsAfterSecond.length).toBe(versionsAfterFirst.length + 1);
    expect(versionsAfterSecond[0]?.version).toBe(1);
    expect(versionsAfterSecond.at(-1)?.version).toBe(versionsAfterSecond.length);
  });
});
