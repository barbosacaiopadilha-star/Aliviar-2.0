import { advanceJourney } from "@/kernel";
import { registerJourneyEvent } from "@/kernel";
import {
  isOperationalStage,
  nextOperationalStage,
  operationalStageIndex,
  type OperationalStage,
} from "@/kernel/jornada/operational-stage";
import { appendTimelineEntry } from "@/journey-memory";

import type { CuradoriaComecouView } from "../model/curadoria-comecou-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import type { KernelActor } from "@/kernel/rbac/authorization";
import {
  CURADORIA_COMECOU_COPY,
  CURADORIA_READY_TITLE,
  CURADORIA_STARTED_PORTAL_TITLE,
  OPERATIONAL_STAGE_LABELS,
} from "../labels";
import { hasCuradoriaIniciada, hasStoryReceptionConfirmed } from "./context-projection-helpers";
import { buildJourneyMemory } from "@/journey-memory";

const SYSTEM_MANAGER_ACTOR: KernelActor = { id: "manager-profile-1", role: "MANAGER" };

export interface IniciarCuradoriaCasoInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type IniciarCuradoriaCasoError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type IniciarCuradoriaCasoResult =
  | { ok: true; value: CuradoriaComecouView }
  | { ok: false; error: IniciarCuradoriaCasoError };

function memoryDeps(stack: VerticalSliceStack) {
  const access = new PatientSharingMemoryAccess();
  return {
    timelineRepository: stack.memory.timelineRepository,
    noteRepository: stack.memory.noteRepository,
    attachmentRepository: stack.memory.attachmentRepository,
    commitmentSource: stack.memory.commitmentSource,
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

async function advanceJourneyToStage(
  stack: VerticalSliceStack,
  journeyId: string,
  targetStage: OperationalStage,
  actor: KernelActor,
): Promise<OperationalStage | null> {
  const deps = kernelDeps(stack);
  const snapshot = await stack.journeyRepository.findById(journeyId);
  if (!snapshot) return null;

  let current = isOperationalStage(snapshot.currentStage)
    ? snapshot.currentStage
    : "CADASTRO";
  const targetIndex = operationalStageIndex(targetStage);

  while (operationalStageIndex(current) < targetIndex) {
    const next = nextOperationalStage(current);
    if (!next) break;

    const advanced = await advanceJourney(deps, { journeyId, actor });
    if (!advanced.ok) break;
    current = advanced.value.toStage as OperationalStage;
  }

  return current;
}

export async function iniciarCuradoriaCaso(
  stack: VerticalSliceStack,
  input: IniciarCuradoriaCasoInput,
): Promise<IniciarCuradoriaCasoResult> {
  const memoryResult = await buildJourneyMemory(
    {
      timelineRepository: stack.memory.timelineRepository,
      noteRepository: stack.memory.noteRepository,
      attachmentRepository: stack.memory.attachmentRepository,
      commitmentSource: stack.memory.commitmentSource,
      access: stack.memory.access,
      clock: stack.memory.clock,
    },
    { journeyId: input.journeyId, audience: "PORTAL", actorId: input.actorId },
  );

  if (!memoryResult.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Memória da jornada indisponível." } };
  }

  if (!hasStoryReceptionConfirmed(memoryResult.value.timeline)) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "A história ainda não foi recebida." },
    };
  }

  if (hasCuradoriaIniciada(memoryResult.value.timeline)) {
    const journey = await stack.journeyRepository.findById(input.journeyId);
    const reception = memoryResult.value.timeline.find(
      (entry) => entry.title === CURADORIA_STARTED_PORTAL_TITLE,
    );
    return {
      ok: true,
      value: {
        headline: CURADORIA_COMECOU_COPY.headline,
        narrative: CURADORIA_COMECOU_COPY.narrative,
        continuation: CURADORIA_COMECOU_COPY.continuation,
        patientName: input.patientName,
        journeyState: OPERATIONAL_STAGE_LABELS[
          (journey?.currentStage as OperationalStage) ?? "CURADORIA"
        ],
        portalHref: "/portal",
        startedAt: reception?.occurredAt ?? stack.clock.now(),
      },
    };
  }

  const occurredAt = stack.clock.now();
  const deps = memoryDeps(stack);

  const currentStage = await advanceJourneyToStage(
    stack,
    input.journeyId,
    "CURADORIA",
    SYSTEM_MANAGER_ACTOR,
  );
  if (!currentStage) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada não encontrada." } };
  }

  const portalEntry = await appendTimelineEntry(deps, {
    journeyId: input.journeyId,
    audience: "PORTAL",
    actorId: input.actorId,
    kind: "EVENT",
    source: "MEMORY",
    category: "OBSERVATION",
    title: CURADORIA_STARTED_PORTAL_TITLE,
    body: CURADORIA_COMECOU_COPY.narrative,
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
    title: CURADORIA_READY_TITLE,
    body: CURADORIA_COMECOU_COPY.curadoriaBody,
    occurredAt,
  });
  if (!curadoriaEntry.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: curadoriaEntry.error.message } };
  }

  const journeyEvent = await registerJourneyEvent(kernelDeps(stack), {
    journeyId: input.journeyId,
    actor: SYSTEM_MANAGER_ACTOR,
    category: "JOURNEY",
    title: "Curadoria iniciada",
    description: CURADORIA_COMECOU_COPY.narrative,
    journeyImpact: "O caso entrou em análise pela curadoria.",
    occurredAt,
  });
  if (!journeyEvent.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: journeyEvent.error.message } };
  }

  return {
    ok: true,
    value: {
      headline: CURADORIA_COMECOU_COPY.headline,
      narrative: CURADORIA_COMECOU_COPY.narrative,
      continuation: CURADORIA_COMECOU_COPY.continuation,
      patientName: input.patientName,
      journeyState: OPERATIONAL_STAGE_LABELS[currentStage],
      portalHref: "/portal",
      startedAt: occurredAt,
    },
  };
}
