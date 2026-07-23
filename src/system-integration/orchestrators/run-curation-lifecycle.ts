import { approveReport } from "@/curation-report";
import {
  addCandidateReview,
  compareCandidates,
  completeProcess,
  createProcess,
  registerResearchFinding,
  startInvestigation,
  submitForFinalReview,
} from "@/curation-process";
import {
  openCuratorWorkspace,
  workspaceAddEvidence,
  workspaceAddMedicalCandidate,
  workspaceSubmitForReview,
} from "@/curator-workspace";

import type { SystemIntegrationStack } from "../composition/system-integration-stack";
import {
  curationProcessMutationDeps,
  curationReportMutationDeps,
} from "../composition/system-integration-stack";

export interface RunCurationLifecycleInput {
  journeyId: string;
  handoffId: string;
  curatorActorId: string;
}

export interface RunCurationLifecycleResult {
  reportId: string;
  processId: string;
  reportStatus: string;
  processStatus: string;
}

export async function runCurationLifecycle(
  stack: SystemIntegrationStack,
  input: RunCurationLifecycleInput,
): Promise<RunCurationLifecycleResult> {
  const opened = await openCuratorWorkspace(stack, {
    journeyId: input.journeyId,
    handoffId: input.handoffId,
    curatorActorId: input.curatorActorId,
  });
  if (!opened.ok) throw new Error(opened.error.message);

  const processDeps = curationProcessMutationDeps(stack);
  const created = await createProcess(processDeps, {
    reportId: opened.value.id,
    curatorId: input.curatorActorId,
    actorId: input.curatorActorId,
  });
  if (!created.ok) throw new Error(created.error.message);

  await startInvestigation(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
    investigation: {
      summary: "Análise do quadro clínico compartilhado",
      scope: "Contexto do paciente e candidatos médicos",
    },
  });

  await registerResearchFinding(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
    finding: {
      topic: "Histórico clínico",
      description: "Contexto consolidado a partir da memória da jornada",
      source: "JourneyMemory",
    },
  });

  const mutationContext = {
    handoffId: input.handoffId,
    curatorActorId: input.curatorActorId,
  };

  const withEvidence = await workspaceAddEvidence(stack, {
    reportId: opened.value.id,
    actorId: input.curatorActorId,
    evidence: {
      origin: "JourneyMemory",
      description: "Observação clínica compartilhada pelo paciente",
      type: "OBSERVATION",
      confidence: 0.92,
      reference: "memory-observation-1",
    },
    ...mutationContext,
  });
  if (!withEvidence.ok) throw new Error(withEvidence.error.message);

  const evidenceId = withEvidence.value.evidences[0]!.id;

  await workspaceAddMedicalCandidate(stack, {
    reportId: opened.value.id,
    actorId: input.curatorActorId,
    candidate: {
      identification: "dr-neuro-01",
      specialty: "Neurologia",
      justification: "Experiência com o perfil clínico relatado.",
      relatedEvidenceIds: [evidenceId],
      priority: 1,
      selectionReasons: [{ criterion: "Adequação clínica", rationale: "Histórico compatível." }],
    },
    ...mutationContext,
  });

  await addCandidateReview(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
    review: {
      candidateId: "dr-neuro-01",
      assessment: "Perfil altamente adequado",
      notes: "Experiência com quadro similar",
    },
  });

  await addCandidateReview(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
    review: {
      candidateId: "dr-neuro-02",
      assessment: "Alternativa viável",
      notes: "Boa disponibilidade regional",
    },
  });

  await compareCandidates(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
    comparison: {
      candidateIds: ["dr-neuro-01", "dr-neuro-02"],
      criteria: ["Experiência clínica", "Disponibilidade"],
      conclusion: "dr-neuro-01 apresenta melhor aderência ao caso.",
    },
  });

  await workspaceSubmitForReview(stack, {
    reportId: opened.value.id,
    actorId: input.curatorActorId,
    ...mutationContext,
  });

  await submitForFinalReview(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
    review: { summary: "Curadoria concluída e pronta para aprovação do relatório." },
  });

  const approved = await approveReport(curationReportMutationDeps(stack), {
    reportId: opened.value.id,
    actorId: input.curatorActorId,
  });
  if (!approved.ok) throw new Error(approved.error.message);

  const completed = await completeProcess(processDeps, {
    processId: created.value.id,
    actorId: input.curatorActorId,
  });
  if (!completed.ok) throw new Error(completed.error.message);

  return {
    reportId: approved.value.id,
    processId: created.value.id,
    reportStatus: approved.value.status,
    processStatus: completed.value.status,
  };
}
