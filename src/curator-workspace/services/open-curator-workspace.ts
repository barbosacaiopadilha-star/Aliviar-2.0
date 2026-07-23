import { createReport } from "@/curation-report";
import type { CurationReportSnapshot } from "@/curation-report";
import { buildCuradoriaContextoView } from "@/vertical-slice";

import type { CuratorWorkspaceStack } from "../composition/curator-workspace-stack";
import { curationReportFullDeps } from "../composition/curator-workspace-stack";

export interface EnsureCurationReportInput {
  journeyId: string;
  handoffId: string;
  curatorActorId: string;
}

export type EnsureCurationReportResult =
  | { ok: true; value: CurationReportSnapshot }
  | { ok: false; error: { code: "NOT_FOUND" | "DOMAIN_ERROR"; message: string } };

export async function ensureCurationReportForWorkspace(
  stack: CuratorWorkspaceStack,
  input: EnsureCurationReportInput,
): Promise<EnsureCurationReportResult> {
  const existing = await stack.reportRepository.findByJourneyId(input.journeyId);
  if (existing) {
    return { ok: true, value: existing };
  }

  const caseRecord = await stack.caseRepository.findByJourneyId(input.journeyId);
  if (!caseRecord?.journeyId) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Caso não encontrado para a jornada." } };
  }

  const patient = await stack.patientRepository.findById(caseRecord.patientId);
  if (!patient) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Paciente não encontrado." } };
  }

  const context = await buildCuradoriaContextoView(stack, {
    journeyId: input.journeyId,
    patientId: caseRecord.patientId,
    handoffId: input.handoffId,
    curatorActorId: input.curatorActorId,
  });

  const sharedContextSummary = context.ok
    ? context.value.memorySummary || context.value.comprehension
    : caseRecord.context.title;

  const created = await createReport(curationReportFullDeps(stack), {
    journeyId: input.journeyId,
    caseId: caseRecord.id,
    patientId: caseRecord.patientId,
    sharedContextSummary,
    criteriaUsed: ["Compreensão clínica", "Adequação ao perfil", "Evidências disponíveis"],
    actorId: input.curatorActorId,
  });

  if (!created.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: created.error.message } };
  }

  return { ok: true, value: created.value };
}

export async function openCuratorWorkspace(
  stack: CuratorWorkspaceStack,
  input: EnsureCurationReportInput,
): Promise<EnsureCurationReportResult> {
  return ensureCurationReportForWorkspace(stack, input);
}
