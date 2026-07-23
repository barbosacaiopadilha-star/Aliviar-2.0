import { advanceJourney } from "@/kernel";
import { registerJourneyEvent } from "@/kernel";
import {
  isOperationalStage,
  nextOperationalStage,
  operationalStageIndex,
  type OperationalStage,
} from "@/kernel/jornada/operational-stage";
import { appendTimelineEntry } from "@/journey-memory";
import { buildJourneyMemory } from "@/journey-memory";

import type { RelatorioEmElaboracaoView } from "../model/relatorio-em-elaboracao-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import type { KernelActor } from "@/kernel/rbac/authorization";
import {
  OPERATIONAL_STAGE_LABELS,
  RELATORIO_ELABORACAO_COPY,
  RELATORIO_ELABORACAO_CURADORIA_TITLE,
  RELATORIO_ELABORACAO_PORTAL_TITLE,
  RELATORIO_ESPACO_CURADORIA_TITLE,
} from "../labels";
import { hasCuradoriaIniciada, hasRelatorioEmElaboracao } from "./context-projection-helpers";

const SYSTEM_CURATOR_ACTOR: KernelActor = { id: "curator-profile-1", role: "CURATOR" };

export interface ElaborarRelatorioCasoInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type ElaborarRelatorioCasoError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type ElaborarRelatorioCasoResult =
  | { ok: true; value: RelatorioEmElaboracaoView }
  | { ok: false; error: ElaborarRelatorioCasoError };

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

export async function elaborarRelatorioCaso(
  stack: VerticalSliceStack,
  input: ElaborarRelatorioCasoInput,
): Promise<ElaborarRelatorioCasoResult> {
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

  if (!hasCuradoriaIniciada(memoryResult.value.timeline)) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "A curadoria ainda não começou." },
    };
  }

  if (hasRelatorioEmElaboracao(memoryResult.value.timeline)) {
    const journey = await stack.journeyRepository.findById(input.journeyId);
    const elaboration = memoryResult.value.timeline.find(
      (entry) => entry.title === RELATORIO_ELABORACAO_PORTAL_TITLE,
    );
    return {
      ok: true,
      value: {
        headline: RELATORIO_ELABORACAO_COPY.headline,
        narrative: RELATORIO_ELABORACAO_COPY.narrative,
        continuation: RELATORIO_ELABORACAO_COPY.continuation,
        patientName: input.patientName,
        journeyState: OPERATIONAL_STAGE_LABELS[
          (journey?.currentStage as OperationalStage) ?? "ENTREGA"
        ],
        portalHref: "/portal",
        elaborationStartedAt: elaboration?.occurredAt ?? stack.clock.now(),
      },
    };
  }

  const occurredAt = stack.clock.now();
  const deps = memoryDeps(stack);

  const currentStage = await advanceJourneyToStage(
    stack,
    input.journeyId,
    "ENTREGA",
    SYSTEM_CURATOR_ACTOR,
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
    title: RELATORIO_ELABORACAO_PORTAL_TITLE,
    body: RELATORIO_ELABORACAO_COPY.narrative,
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
    title: RELATORIO_ELABORACAO_CURADORIA_TITLE,
    body: RELATORIO_ELABORACAO_COPY.curadoriaBody,
    occurredAt,
  });
  if (!curadoriaEntry.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: curadoriaEntry.error.message } };
  }

  const espacoEntry = await appendTimelineEntry(deps, {
    journeyId: input.journeyId,
    audience: "CURATORIA",
    actorId: input.actorId,
    kind: "EVENT",
    source: "MEMORY",
    category: "OBSERVATION",
    title: RELATORIO_ESPACO_CURADORIA_TITLE,
    body: RELATORIO_ELABORACAO_COPY.espacoRelatorio,
    occurredAt,
  });
  if (!espacoEntry.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: espacoEntry.error.message } };
  }

  const journeyEvent = await registerJourneyEvent(kernelDeps(stack), {
    journeyId: input.journeyId,
    actor: SYSTEM_CURATOR_ACTOR,
    category: "JOURNEY",
    title: "Elaboração do relatório iniciada",
    description: RELATORIO_ELABORACAO_COPY.narrative,
    journeyImpact: "A curadoria passou a construir o relatório do caso.",
    occurredAt,
  });
  if (!journeyEvent.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: journeyEvent.error.message } };
  }

  return {
    ok: true,
    value: {
      headline: RELATORIO_ELABORACAO_COPY.headline,
      narrative: RELATORIO_ELABORACAO_COPY.narrative,
      continuation: RELATORIO_ELABORACAO_COPY.continuation,
      patientName: input.patientName,
      journeyState: OPERATIONAL_STAGE_LABELS[currentStage],
      portalHref: "/portal",
      elaborationStartedAt: occurredAt,
    },
  };
}
