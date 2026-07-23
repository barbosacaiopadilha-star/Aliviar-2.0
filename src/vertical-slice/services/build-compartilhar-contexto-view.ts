import { buildJourneyMemory } from "@/journey-memory";

import type { CompartilharContextoView } from "../model/compartilhar-contexto-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import {
  buildContextHistory,
  countSharedItems,
  organizeSharedContext,
} from "./context-projection-helpers";

export interface BuildCompartilharContextoInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type BuildCompartilharContextoResult =
  | { ok: true; value: CompartilharContextoView }
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

export async function buildCompartilharContextoView(
  stack: VerticalSliceStack,
  input: BuildCompartilharContextoInput,
): Promise<BuildCompartilharContextoResult> {
  const memoryResult = await buildJourneyMemory(memoryDeps(stack), {
    journeyId: input.journeyId,
    audience: "PORTAL",
    actorId: input.actorId,
  });

  if (!memoryResult.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Memória da jornada indisponível." } };
  }

  const memory = memoryResult.value;
  const organizacao = organizeSharedContext(memory.notes, memory.attachmentReferences);
  const historico = buildContextHistory(memory.timeline, memory.notes, memory.attachmentReferences);

  return {
    ok: true,
    value: {
      invitation: "O que mais ajuda a entender sua história?",
      reassurance: "Não precisa ser perfeito. Cada detalhe que você compartilha nos aproxima do que você vive.",
      journeyId: input.journeyId,
      patientName: input.patientName,
      organizacao,
      historico,
      hasSharedBefore: countSharedItems(organizacao) > 0,
    },
  };
}
