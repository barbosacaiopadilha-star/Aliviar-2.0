import { describe, expect, it } from "vitest";

import {
  InMemoryProcessRepository,
  InMemoryProcessVersionRepository,
  InMemoryReportLookup,
  InMemoryResearchRepository,
} from "./infrastructure/in-memory-repositories";
import { CurationProcessAggregate } from "./model/curation-process";
import { addCandidateReview } from "./services/add-candidate-review";
import { cancelProcess } from "./services/cancel-process";
import { compareCandidates } from "./services/compare-candidates";
import { completeProcess } from "./services/complete-process";
import { createProcess } from "./services/create-process";
import { registerResearchFinding } from "./services/register-research-finding";
import { startInvestigation } from "./services/start-investigation";
import { submitForFinalReview } from "./services/submit-for-final-review";

const REPORT_ID = "report-1";
const JOURNEY_ID = "journey-1";
const CURATOR_ID = "curator-1";

let tick = 0;

function buildDeps(reportStatus: "DRAFT" | "UNDER_REVIEW" | "APPROVED" = "DRAFT") {
  tick += 1;
  return {
    processRepository: new InMemoryProcessRepository(),
    versionRepository: new InMemoryProcessVersionRepository(),
    researchRepository: new InMemoryResearchRepository(),
    reportLookup: new InMemoryReportLookup([
      { id: REPORT_ID, journeyId: JOURNEY_ID, status: reportStatus },
    ]),
    ids: { nextId: () => `id-${tick += 1}` },
    clock: { now: () => `2026-07-22T16:00:${String(tick).padStart(2, "0")}.000Z` },
  };
}

async function runFullProcess(deps: ReturnType<typeof buildDeps>) {
  const created = await createProcess(deps, {
    reportId: REPORT_ID,
    curatorId: CURATOR_ID,
    actorId: CURATOR_ID,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error("create failed");

  await startInvestigation(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
    investigation: { summary: "Quadro clínico inicial", scope: "Neurologia" },
  });

  await registerResearchFinding(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
    finding: {
      topic: "Histórico clínico",
      description: "Dor crônica há dois anos",
      source: "JourneyMemory",
    },
  });

  await addCandidateReview(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
    review: {
      candidateId: "dr-neuro-01",
      assessment: "Perfil adequado",
      notes: "Experiência com quadro similar",
    },
  });

  await addCandidateReview(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
    review: {
      candidateId: "dr-neuro-02",
      assessment: "Alternativa viável",
      notes: "Disponibilidade regional",
    },
  });

  await compareCandidates(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
    comparison: {
      candidateIds: ["dr-neuro-01", "dr-neuro-02"],
      criteria: ["Experiência", "Disponibilidade"],
      conclusion: "dr-neuro-01 apresenta melhor aderência clínica.",
    },
  });

  await submitForFinalReview(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
    review: { summary: "Relatório pronto para aprovação final." },
  });

  const completed = await completeProcess(deps, {
    processId: created.value.id,
    actorId: CURATOR_ID,
  });
  expect(completed.ok).toBe(true);
  if (!completed.ok) throw new Error("complete failed");

  return completed.value;
}

describe("CurationProcessAggregate", () => {
  it("reidrata apenas com relatório, jornada e curador válidos", () => {
    const aggregate = CurationProcessAggregate.create({
      id: "process-1",
      reportId: REPORT_ID,
      journeyId: JOURNEY_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
      occurredAt: "2026-07-22T16:00:00.000Z",
    });

    const snapshot = aggregate.toSnapshot();
    expect(CurationProcessAggregate.rehydrate({ ...snapshot, reportId: "" }).ok).toBe(false);
    expect(CurationProcessAggregate.rehydrate({ ...snapshot, journeyId: "" }).ok).toBe(false);
    expect(CurationProcessAggregate.rehydrate({ ...snapshot, curatorId: "" }).ok).toBe(false);
  });
});

describe("curation process services", () => {
  it("cria processo vinculado a relatório em elaboração", async () => {
    const deps = buildDeps();
    const created = await createProcess(deps, {
      reportId: REPORT_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.value.status).toBe("CREATED");
    expect(created.value.reportId).toBe(REPORT_ID);
    expect(created.value.auditTrail).toHaveLength(1);
    expect(created.value.auditTrail[0]?.action).toBe("PROCESS_CREATED");
  });

  it("rejeita criação sem relatório ou com processo ativo duplicado", async () => {
    const deps = buildDeps("APPROVED");
    const invalid = await createProcess(deps, {
      reportId: REPORT_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
    });
    expect(invalid.ok).toBe(false);
    if (invalid.ok) return;
    expect(invalid.error.message).toMatch(/elaboração|revisão/i);

    const validDeps = buildDeps();
    const first = await createProcess(validDeps, {
      reportId: REPORT_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
    });
    expect(first.ok).toBe(true);

    const duplicate = await createProcess(validDeps, {
      reportId: REPORT_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
    });
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.error.message).toMatch(/processo ativo/i);
  });

  it("percorre fluxo completo até conclusão", async () => {
    const deps = buildDeps();
    const completed = await runFullProcess(deps);

    expect(completed.status).toBe("COMPLETED");
    expect(completed.investigation).toBeTruthy();
    expect(completed.candidateReviews).toHaveLength(2);
    expect(completed.comparisons).toHaveLength(1);
    expect(completed.reviewCycles).toHaveLength(1);

    const sessions = await deps.researchRepository.listByProcessId(completed.id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.findings).toHaveLength(1);
  });

  it("bloqueia transições inválidas e violações de invariantes", async () => {
    const deps = buildDeps();
    const created = await createProcess(deps, {
      reportId: REPORT_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const skipToCompare = await compareCandidates(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      comparison: {
        candidateIds: ["a", "b"],
        criteria: ["Critério"],
        conclusion: "Inválido",
      },
    });
    expect(skipToCompare.ok).toBe(false);

    await startInvestigation(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      investigation: { summary: "Investigação", scope: "Escopo" },
    });

    const reviewTooEarly = await addCandidateReview(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      review: { candidateId: "dr-1", assessment: "Ok", notes: "" },
    });
    expect(reviewTooEarly.ok).toBe(false);

    await registerResearchFinding(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      finding: { topic: "Tópico", description: "Achado", source: "Fonte" },
    });

    await addCandidateReview(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      review: { candidateId: "dr-1", assessment: "Ok", notes: "" },
    });

    const duplicateReview = await addCandidateReview(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      review: { candidateId: "dr-1", assessment: "Duplicado", notes: "" },
    });
    expect(duplicateReview.ok).toBe(false);

    const compareWithOne = await compareCandidates(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      comparison: {
        candidateIds: ["dr-1"],
        criteria: ["Critério"],
        conclusion: "Insuficiente",
      },
    });
    expect(compareWithOne.ok).toBe(false);

    const cancelled = await cancelProcess(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      reason: "Caso encerrado pelo paciente",
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.value.status).toBe("CANCELLED");

    const afterCancel = await startInvestigation(deps, {
      processId: created.value.id,
      actorId: CURATOR_ID,
      investigation: { summary: "Tarde", scope: "Escopo" },
    });
    expect(afterCancel.ok).toBe(false);
  });

  it("audita todas as alterações relevantes", async () => {
    const deps = buildDeps();
    const completed = await runFullProcess(deps);

    const actions = completed.auditTrail.map((entry) => entry.action);
    expect(actions).toContain("PROCESS_CREATED");
    expect(actions).toContain("INVESTIGATION_STARTED");
    expect(actions).toContain("RESEARCH_FINDING_REGISTERED");
    expect(actions).toContain("CANDIDATE_REVIEW_ADDED");
    expect(actions).toContain("CANDIDATES_COMPARED");
    expect(actions).toContain("SUBMITTED_FOR_FINAL_REVIEW");
    expect(actions).toContain("PROCESS_COMPLETED");
  });

  it("mantém histórico de versões append-only", async () => {
    const deps = buildDeps();
    const completed = await runFullProcess(deps);

    const versions = await deps.versionRepository.listByProcessId(completed.id);
    expect(versions.length).toBeGreaterThanOrEqual(8);
    expect(versions[0]?.version).toBe(1);
    expect(versions.at(-1)?.version).toBe(versions.length);
  });

  it("permite novo processo após conclusão do anterior", async () => {
    const deps = buildDeps();
    await runFullProcess(deps);

    const next = await createProcess(deps, {
      reportId: REPORT_ID,
      curatorId: CURATOR_ID,
      actorId: CURATOR_ID,
    });
    expect(next.ok).toBe(true);
  });
});
