import { buildJourneyMemory, projectNarrativeForAudience } from "@/journey-memory";
import { projectPortalContinuation } from "@/journey-handoff";

import type { CuradoriaContextoView } from "../model/curadoria-contexto-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PUBLIC_CHAPTER_LABELS } from "../labels";
import {
  buildContextHistory,
  hasCasoProntoParaAnalise,
  hasNovoContextoParaCuradoria,
  organizeSharedContext,
} from "./context-projection-helpers";
import { CURADORIA_COMECOU_COPY, HISTORIA_RECEBIDA_COPY } from "../labels";
export interface BuildCuradoriaContextoInput {
  journeyId: string;
  patientId: string;
  handoffId: string;
  curatorActorId: string;
}

export type BuildCuradoriaContextoResult =
  | { ok: true; value: CuradoriaContextoView }
  | { ok: false; error: { code: "NOT_FOUND"; message: string } };

function memoryDeps(stack: VerticalSliceStack) {
  return {
    timelineRepository: stack.memory.timelineRepository,
    noteRepository: stack.memory.noteRepository,
    attachmentRepository: stack.memory.attachmentRepository,
    commitmentSource: stack.memory.commitmentSource,
    access: stack.memory.access,
    clock: stack.memory.clock,
  };
}

export async function buildCuradoriaContextoView(
  stack: VerticalSliceStack,
  input: BuildCuradoriaContextoInput,
): Promise<BuildCuradoriaContextoResult> {
  const [patient, caseRecord, handoff, memoryResult] = await Promise.all([
    stack.patientRepository.findById(input.patientId),
    stack.caseRepository.findByJourneyId(input.journeyId),
    stack.handoff.handoffRepository.findById(input.handoffId),
    buildJourneyMemory(memoryDeps(stack), {
      journeyId: input.journeyId,
      audience: "CURATORIA",
      actorId: input.curatorActorId,
    }),
  ]);

  if (!patient || !handoff || !memoryResult.ok) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Contexto não encontrado." } };
  }

  const memory = memoryResult.value;
  const organizacao = organizeSharedContext(memory.notes, memory.attachmentReferences);
  const historico = buildContextHistory(memory.timeline, memory.notes, memory.attachmentReferences);
  const continuation = projectPortalContinuation(handoff, stack.clock.now());

  const narrative = await projectNarrativeForAudience(
    { access: stack.memory.access, clock: stack.memory.clock },
    { memory, audience: "CURATORIA", actorId: input.curatorActorId },
  );

  const itemCount = organizacao.reduce((total, group) => total + group.items.length, 0);
  const novoContextoDisponivel = hasNovoContextoParaCuradoria(memory.timeline);
  const casoProntoParaAnalise = hasCasoProntoParaAnalise(memory.timeline);

  return {
    ok: true,
    value: {
      journeyId: input.journeyId,
      patientName: patient.fullName,
      narrativeCheckpoint: PUBLIC_CHAPTER_LABELS[continuation.resumeAt.publicChapter],
      caseTitle: caseRecord?.context.title ?? "Jornada do paciente",
      comprehension:
        casoProntoParaAnalise
          ? CURADORIA_COMECOU_COPY.curadoriaBody
          : itemCount > 0
            ? HISTORIA_RECEBIDA_COPY.curadoriaComprehension
            : "Aguardando que o paciente compartilhe mais contexto.",
      novoContextoDisponivel,
      sinalCuradoria: novoContextoDisponivel ? HISTORIA_RECEBIDA_COPY.curadoriaSignal : null,
      casoProntoParaAnalise,
      aberturaCuradoria: casoProntoParaAnalise ? CURADORIA_COMECOU_COPY.curadoriaAbertura : null,
      organizacao,
      historico,
      memorySummary: narrative.ok ? narrative.value.summary : "",
    },
  };
}
