import { buildJourneyMemory } from "@/journey-memory";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";

import type { RelatorioEmElaboracaoView } from "../model/relatorio-em-elaboracao-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";
import {
  OPERATIONAL_STAGE_LABELS,
  RELATORIO_ELABORACAO_COPY,
  RELATORIO_ELABORACAO_PORTAL_TITLE,
} from "../labels";
import { hasRelatorioEmElaboracao } from "./context-projection-helpers";

export interface BuildRelatorioEmElaboracaoViewInput {
  journeyId: string;
  patientId: string;
  actorId: string;
  patientName: string;
}

export type BuildRelatorioEmElaboracaoViewResult =
  | { ok: true; value: RelatorioEmElaboracaoView }
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

export async function buildRelatorioEmElaboracaoView(
  stack: VerticalSliceStack,
  input: BuildRelatorioEmElaboracaoViewInput,
): Promise<BuildRelatorioEmElaboracaoViewResult> {
  const [journey, memoryResult] = await Promise.all([
    stack.journeyRepository.findById(input.journeyId),
    buildJourneyMemory(memoryDeps(stack), {
      journeyId: input.journeyId,
      audience: "PORTAL",
      actorId: input.actorId,
    }),
  ]);

  if (!journey || !memoryResult.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Elaboração indisponível." } };
  }

  if (!hasRelatorioEmElaboracao(memoryResult.value.timeline)) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "O relatório ainda não está em elaboração." },
    };
  }

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
      journeyState: OPERATIONAL_STAGE_LABELS[journey.currentStage as OperationalStage],
      portalHref: "/portal",
      elaborationStartedAt: elaboration?.occurredAt ?? journey.updatedAt,
    },
  };
}
