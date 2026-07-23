import { buildJourneyMemory } from "@/journey-memory";

import type { HistoriaRecebidaView } from "../model/historia-recebida-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import {
  HISTORIA_RECEBIDA_COPY,
  OPERATIONAL_STAGE_LABELS,
  STORY_RECEPTION_PORTAL_TITLE,
} from "../labels";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";

export interface BuildHistoriaRecebidaViewInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type BuildHistoriaRecebidaViewResult =
  | { ok: true; value: HistoriaRecebidaView }
  | { ok: false; error: { code: "NOT_FOUND"; message: string } };

function memoryDeps(stack: VerticalSliceStack) {
  return {
    timelineRepository: stack.memory.timelineRepository,
    noteRepository: stack.memory.noteRepository,
    attachmentRepository: stack.memory.attachmentRepository,
    commitmentSource: stack.memory.commitmentSource,
    access: new PatientSharingMemoryAccess(),
    clock: stack.memory.clock,
  };
}

export async function buildHistoriaRecebidaView(
  stack: VerticalSliceStack,
  input: BuildHistoriaRecebidaViewInput,
): Promise<BuildHistoriaRecebidaViewResult> {
  const [journey, memoryResult] = await Promise.all([
    stack.journeyRepository.findById(input.journeyId),
    buildJourneyMemory(memoryDeps(stack), {
      journeyId: input.journeyId,
      audience: "PORTAL",
      actorId: input.actorId,
    }),
  ]);

  if (!journey || !memoryResult.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Confirmação indisponível." } };
  }

  const reception = memoryResult.value.timeline.find(
    (entry) => entry.title === STORY_RECEPTION_PORTAL_TITLE,
  );

  if (!reception) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Ainda não há confirmação para esta jornada." } };
  }

  return {
    ok: true,
    value: {
      headline: HISTORIA_RECEBIDA_COPY.headline,
      narrative: HISTORIA_RECEBIDA_COPY.narrative,
      continuation: HISTORIA_RECEBIDA_COPY.continuation,
      patientName: input.patientName,
      journeyState: OPERATIONAL_STAGE_LABELS[journey.currentStage as OperationalStage],
      portalHref: "/portal",
      receivedAt: reception.occurredAt,
    },
  };
}
