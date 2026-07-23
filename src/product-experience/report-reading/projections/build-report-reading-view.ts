import { buildJourneyMemory } from "@/journey-memory";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";
import { isTerminalStage } from "@/kernel/jornada/operational-stage";
import {
  buildPlatformJourneyProjection,
  type SystemIntegrationStack,
} from "@/system-integration";
import { OPERATIONAL_STAGE_LABELS, PatientSharingMemoryAccess } from "@/vertical-slice";

import type { ReportReadingView } from "../model/report-reading-view";

export interface BuildReportReadingViewInput {
  journeyId: string;
  patientId: string;
  actorId: string;
}

export type BuildReportReadingViewResult =
  | { ok: true; value: ReportReadingView }
  | { ok: false; error: { code: "NOT_FOUND" | "UNAVAILABLE"; message: string } };

export async function buildReportReadingView(
  stack: SystemIntegrationStack,
  input: BuildReportReadingViewInput,
): Promise<BuildReportReadingViewResult> {
  const projection = await buildPlatformJourneyProjection(stack, input);
  const report = await stack.reportRepository.findByJourneyId(input.journeyId);

  if (!report || !projection.deliveryId) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Relatório ainda não disponível para leitura." },
    };
  }

  if (!projection.deliveryPublished) {
    return {
      ok: false,
      error: { code: "UNAVAILABLE", message: "Relatório ainda não foi publicado." },
    };
  }

  const [patient, delivery, memory] = await Promise.all([
    stack.patientRepository.findById(input.patientId),
    stack.deliveryRepository.findById(projection.deliveryId),
    buildJourneyMemory(
      {
        timelineRepository: stack.memory.timelineRepository,
        noteRepository: stack.memory.noteRepository,
        attachmentRepository: stack.memory.attachmentRepository,
        commitmentSource: stack.memory.commitmentSource,
        access: new PatientSharingMemoryAccess(),
        clock: stack.memory.clock,
      },
      { journeyId: input.journeyId, audience: "PORTAL", actorId: input.actorId },
    ),
  ]);

  if (!patient || !delivery) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Dados do relatório indisponíveis." },
    };
  }

  const memoryHighlights =
    memory.ok ?
      memory.value.timeline
        .filter((entry) => entry.body?.trim())
        .slice(0, 3)
        .map((entry) => entry.body!.trim())
    : [];

  const journey = await stack.journeyRepository.findById(input.journeyId);
  const journeyStage = (journey?.currentStage as OperationalStage) ?? "CADASTRO";

  return {
    ok: true,
    value: {
      journeyId: input.journeyId,
      patientName: patient.fullName,
      journeyState: OPERATIONAL_STAGE_LABELS[journeyStage],
      sharedContextSummary: report.sharedContextSummary,
      memoryHighlights,
      criteriaUsed: [...report.criteriaUsed],
      candidates: [...report.medicalCandidates]
        .sort((left, right) => left.priority - right.priority)
        .map((candidate) => ({
          id: candidate.id,
          identification: candidate.identification,
          specialty: candidate.specialty,
          justification: candidate.justification,
          reasons: candidate.selectionReasons.map((reason) => ({
            criterion: reason.criterion,
            rationale: reason.rationale,
          })),
          priority: candidate.priority,
        })),
      deliveryId: delivery.id,
      publishedAt: delivery.publishedAt,
      firstViewedAt: delivery.firstViewedAt,
      readConfirmedAt: delivery.readConfirmedAt,
      canConfirmReading: Boolean(delivery.firstViewedAt) && !delivery.readConfirmedAt,
      journeyClosed: isTerminalStage(journeyStage),
      portalHref: "/portal",
    },
  };
}
