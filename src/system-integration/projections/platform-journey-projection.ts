import { buildJourneyMemory } from "@/journey-memory";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";
import { isTerminalStage } from "@/kernel/jornada/operational-stage";
import { PatientSharingMemoryAccess } from "@/vertical-slice";
import {
  hasCuradoriaIniciada,
  hasRelatorioEmElaboracao,
  hasStoryReceptionConfirmed,
} from "@/vertical-slice";

import type { SystemIntegrationStack } from "../composition/system-integration-stack";

export interface PlatformJourneyProjection {
  journeyId: string;
  patientId: string;
  journeyStage: OperationalStage;
  journeyClosed: boolean;
  handoffCompleted: boolean;
  contextShared: boolean;
  historiaRecebida: boolean;
  curadoriaIniciada: boolean;
  relatorioEmElaboracao: boolean;
  reportId: string | null;
  reportStatus: string | null;
  processId: string | null;
  processStatus: string | null;
  deliveryId: string | null;
  deliveryStatus: string | null;
  deliveryPublished: boolean;
  deliveryReadConfirmed: boolean;
  memoryEventCount: number;
  kernelEventCount: number;
}

export interface BuildPlatformJourneyProjectionInput {
  journeyId: string;
  patientId: string;
  actorId: string;
}

export async function buildPlatformJourneyProjection(
  stack: SystemIntegrationStack,
  input: BuildPlatformJourneyProjectionInput,
): Promise<PlatformJourneyProjection> {
  const journey = await stack.journeyRepository.findById(input.journeyId);
  const memory = await buildJourneyMemory(
    {
      timelineRepository: stack.memory.timelineRepository,
      noteRepository: stack.memory.noteRepository,
      attachmentRepository: stack.memory.attachmentRepository,
      commitmentSource: stack.memory.commitmentSource,
      access: new PatientSharingMemoryAccess(),
      clock: stack.memory.clock,
    },
    { journeyId: input.journeyId, audience: "PORTAL", actorId: input.actorId },
  );

  const report = await stack.reportRepository.findByJourneyId(input.journeyId);
  const process = report
    ? await stack.processRepository.findActiveByReportId(report.id)
    : null;
  const processes = report ? await stack.processRepository.listByReportId(report.id) : [];
  const resolvedProcess =
    process ?? processes.find((item) => item.status === "COMPLETED") ?? processes.at(-1) ?? null;

  const delivery = report
    ? (
        await stack.deliveryRepository.listByReportId(report.id)
      ).find((item) => item.status !== "ARCHIVED") ?? null
    : null;

  const kernelTimeline = await stack.timelineRepository.listByJourney(input.journeyId);

  return {
    journeyId: input.journeyId,
    patientId: input.patientId,
    journeyStage: (journey?.currentStage as OperationalStage) ?? "CADASTRO",
    journeyClosed: journey ? isTerminalStage(journey.currentStage as OperationalStage) : false,
    handoffCompleted: Boolean(journey),
    contextShared: memory.ok ? memory.value.timeline.length > 0 : false,
    historiaRecebida: memory.ok ? hasStoryReceptionConfirmed(memory.value.timeline) : false,
    curadoriaIniciada: memory.ok ? hasCuradoriaIniciada(memory.value.timeline) : false,
    relatorioEmElaboracao: memory.ok ? hasRelatorioEmElaboracao(memory.value.timeline) : false,
    reportId: report?.id ?? null,
    reportStatus: report?.status ?? null,
    processId: resolvedProcess?.id ?? null,
    processStatus: resolvedProcess?.status ?? null,
    deliveryId: delivery?.id ?? null,
    deliveryStatus: delivery?.status ?? null,
    deliveryPublished: delivery?.status === "PUBLISHED",
    deliveryReadConfirmed: Boolean(delivery?.readConfirmedAt),
    memoryEventCount: memory.ok ? memory.value.timeline.length : 0,
    kernelEventCount: kernelTimeline.length,
  };
}
