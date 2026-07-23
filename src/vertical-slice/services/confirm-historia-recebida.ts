import { advanceJourney } from "@/kernel";
import { registerJourneyEvent } from "@/kernel";
import { appendTimelineEntry } from "@/journey-memory";

import type { HistoriaRecebidaView } from "../model/historia-recebida-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import {
  HISTORIA_RECEBIDA_COPY,
  OPERATIONAL_STAGE_LABELS,
  STORY_RECEPTION_CURADORIA_TITLE,
  STORY_RECEPTION_PORTAL_TITLE,
} from "../labels";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";

const SYSTEM_MANAGER_ACTOR = { id: "manager-profile-1", role: "MANAGER" as const };

export interface ConfirmHistoriaRecebidaInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type ConfirmHistoriaRecebidaError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type ConfirmHistoriaRecebidaResult =
  | { ok: true; value: HistoriaRecebidaView }
  | { ok: false; error: ConfirmHistoriaRecebidaError };

function memoryDeps(stack: VerticalSliceStack) {
  const access = new PatientSharingMemoryAccess();
  return {
    timelineRepository: stack.memory.timelineRepository,
    noteRepository: stack.memory.noteRepository,
    attachmentRepository: stack.memory.attachmentRepository,
    access,
    clock: stack.memory.clock,
    idGenerator: stack.memory.idGenerator,
  };
}

function kernelDeps(stack: VerticalSliceStack) {
  return {
    journeyRepository: stack.journeyRepository,
    timelineRepository: stack.timelineRepository,
    ids: stack.ids,
    clock: stack.clock,
  };
}

export async function confirmHistoriaRecebida(
  stack: VerticalSliceStack,
  input: ConfirmHistoriaRecebidaInput,
): Promise<ConfirmHistoriaRecebidaResult> {
  const occurredAt = stack.clock.now();
  const deps = memoryDeps(stack);

  const portalEntry = await appendTimelineEntry(deps, {
    journeyId: input.journeyId,
    audience: "PORTAL",
    actorId: input.actorId,
    kind: "EVENT",
    source: "MEMORY",
    category: "OBSERVATION",
    title: STORY_RECEPTION_PORTAL_TITLE,
    body: HISTORIA_RECEBIDA_COPY.narrative,
    occurredAt,
  });
  if (!portalEntry.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: portalEntry.error.message } };
  }

  const curadoriaEntry = await appendTimelineEntry(deps, {
    journeyId: input.journeyId,
    audience: "CURATORIA",
    actorId: input.actorId,
    kind: "EVENT",
    source: "MEMORY",
    category: "OBSERVATION",
    title: STORY_RECEPTION_CURADORIA_TITLE,
    body: HISTORIA_RECEBIDA_COPY.curadoriaBody,
    occurredAt,
  });
  if (!curadoriaEntry.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: curadoriaEntry.error.message } };
  }

  const journeyEvent = await registerJourneyEvent(kernelDeps(stack), {
    journeyId: input.journeyId,
    actor: SYSTEM_MANAGER_ACTOR,
    category: "JOURNEY",
    title: "História recebida",
    description: HISTORIA_RECEBIDA_COPY.narrative,
    journeyImpact: "A equipe passou a compreender melhor a história do paciente.",
    occurredAt,
  });
  if (!journeyEvent.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: journeyEvent.error.message } };
  }

  const journey = await stack.journeyRepository.findById(input.journeyId);
  if (!journey) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada não encontrada." } };
  }

  let currentStage = journey.currentStage as OperationalStage;
  if (currentStage === "CADASTRO") {
    const advanced = await advanceJourney(kernelDeps(stack), {
      journeyId: input.journeyId,
      actor: { id: input.actorId, role: "PATIENT", patientId: input.patientId },
    });
    if (advanced.ok) {
      currentStage = advanced.value.toStage as OperationalStage;
    }
  }

  return {
    ok: true,
    value: {
      headline: HISTORIA_RECEBIDA_COPY.headline,
      narrative: HISTORIA_RECEBIDA_COPY.narrative,
      continuation: HISTORIA_RECEBIDA_COPY.continuation,
      patientName: input.patientName,
      journeyState: OPERATIONAL_STAGE_LABELS[currentStage],
      portalHref: "/portal",
      receivedAt: occurredAt,
    },
  };
}
