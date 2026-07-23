import type { CurationReportSnapshot } from "@/curation-report";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";
import { buildCuradoriaContextoView } from "@/vertical-slice";

import type { CuratorWorkspaceView } from "../model/curator-workspace-view";
import type { CuratorWorkspaceStack } from "../composition/curator-workspace-stack";
import { isWorkspaceEditable, OPERATIONAL_STAGE_LABELS, reportStatusLabel } from "../labels";

export interface BuildCuratorWorkspaceViewInput {
  report: CurationReportSnapshot;
  handoffId: string;
  curatorActorId: string;
}

export type BuildCuratorWorkspaceViewResult =
  | { ok: true; value: CuratorWorkspaceView }
  | { ok: false; error: { code: "NOT_FOUND"; message: string } };

export async function buildCuratorWorkspaceView(
  stack: CuratorWorkspaceStack,
  input: BuildCuratorWorkspaceViewInput,
): Promise<BuildCuratorWorkspaceViewResult> {
  const [patient, journey, context] = await Promise.all([
    stack.patientRepository.findById(input.report.patientId),
    stack.journeyRepository.findById(input.report.journeyId),
    buildCuradoriaContextoView(stack, {
      journeyId: input.report.journeyId,
      patientId: input.report.patientId,
      handoffId: input.handoffId,
      curatorActorId: input.curatorActorId,
    }),
  ]);

  if (!patient || !journey || !context.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Contexto do workspace indisponível." } };
  }

  return {
    ok: true,
    value: {
      reportId: input.report.id,
      journeyId: input.report.journeyId,
      caseId: input.report.caseId,
      patientId: input.report.patientId,
      patientName: patient.fullName,
      caseTitle: context.value.caseTitle,
      journeyState: OPERATIONAL_STAGE_LABELS[journey.currentStage as OperationalStage],
      reportStatus: input.report.status,
      statusLabel: reportStatusLabel(input.report.status),
      editable: isWorkspaceEditable(input.report.status),
      sharedContextSummary: input.report.sharedContextSummary,
      criteriaUsed: input.report.criteriaUsed,
      currentVersion: input.report.currentVersion,
      context: context.value,
      evidences: input.report.evidences.map((evidence) => ({
        id: evidence.id,
        origin: evidence.origin,
        description: evidence.description,
        type: evidence.type,
        confidence: evidence.confidence,
        reference: evidence.reference,
      })),
      medicalCandidates: input.report.medicalCandidates.map((candidate) => ({
        id: candidate.id,
        identification: candidate.identification,
        specialty: candidate.specialty,
        justification: candidate.justification,
        priority: candidate.priority,
        relatedEvidenceIds: candidate.relatedEvidenceIds,
        selectionReasons: candidate.selectionReasons.map((reason) => ({
          criterion: reason.criterion,
          rationale: reason.rationale,
        })),
      })),
      curatorNotes: input.report.curatorNotes.map((note) => ({
        id: note.id,
        content: note.content,
        authorId: note.authorId,
        createdAt: note.createdAt,
      })),
    },
  };
}
