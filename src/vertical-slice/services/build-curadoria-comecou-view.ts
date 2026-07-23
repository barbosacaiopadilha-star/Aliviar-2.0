import { buildJourneyMemory } from "@/journey-memory";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";

import type { CuradoriaComecouView } from "../model/curadoria-comecou-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import {
  CURADORIA_COMECOU_COPY,
  CURADORIA_STARTED_PORTAL_TITLE,
  OPERATIONAL_STAGE_LABELS,
} from "../labels";
import { hasCuradoriaIniciada } from "./context-projection-helpers";

export interface BuildCuradoriaComecouViewInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type BuildCuradoriaComecouViewResult =
  | { ok: true; value: CuradoriaComecouView }
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

export async function buildCuradoriaComecouView(
  stack: VerticalSliceStack,
  input: BuildCuradoriaComecouViewInput,
): Promise<BuildCuradoriaComecouViewResult> {
  const [journey, memoryResult] = await Promise.all([
    stack.journeyRepository.findById(input.journeyId),
    buildJourneyMemory(memoryDeps(stack), {
      journeyId: input.journeyId,
      audience: "PORTAL",
      actorId: input.actorId,
    }),
  ]);

  if (!journey || !memoryResult.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Evolução da jornada indisponível." } };
  }

  if (!hasCuradoriaIniciada(memoryResult.value.timeline)) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "A curadoria ainda não começou para esta jornada." },
    };
  }

  const started = memoryResult.value.timeline.find(
    (entry) => entry.title === CURADORIA_STARTED_PORTAL_TITLE,
  );

  return {
    ok: true,
    value: {
      headline: CURADORIA_COMECOU_COPY.headline,
      narrative: CURADORIA_COMECOU_COPY.narrative,
      continuation: CURADORIA_COMECOU_COPY.continuation,
      patientName: input.patientName,
      journeyState: OPERATIONAL_STAGE_LABELS[journey.currentStage as OperationalStage],
      portalHref: "/portal",
      startedAt: started?.occurredAt ?? journey.updatedAt,
    },
  };
}
