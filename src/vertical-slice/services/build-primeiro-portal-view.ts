import { buildJourneyMemory } from "@/journey-memory";
import { projectNarrativeForAudience } from "@/journey-memory";
import { projectPortalContinuation } from "@/journey-handoff";
import type { OperationalStage } from "@/kernel/jornada/operational-stage";

import { OPERATIONAL_STAGE_LABELS, PUBLIC_CHAPTER_LABELS, HISTORIA_RECEBIDA_COPY } from "../labels";
import type { PrimeiroPortalView } from "../model/primeiro-portal-view";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { hasStoryReceptionConfirmed } from "./context-projection-helpers";

export interface BuildPrimeiroPortalViewInput {
  handoffId: string;
  journeyId: string;
  patientId: string;
  actorId: string;
}

export type BuildPrimeiroPortalViewResult =
  | { ok: true; value: PrimeiroPortalView }
  | { ok: false; error: { code: "NOT_FOUND"; message: string } };

function firstName(fullName: string, preferredName?: string | null): string {
  if (preferredName?.trim()) return preferredName.trim();
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export async function buildPrimeiroPortalView(
  stack: VerticalSliceStack,
  input: BuildPrimeiroPortalViewInput,
): Promise<BuildPrimeiroPortalViewResult> {
  const [patient, journey, handoff] = await Promise.all([
    stack.patientRepository.findById(input.patientId),
    stack.journeyRepository.findById(input.journeyId),
    stack.handoff.handoffRepository.findById(input.handoffId),
  ]);

  if (!patient || !journey || !handoff) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Dados da jornada não encontrados." } };
  }

  const continuation = projectPortalContinuation(handoff, stack.clock.now());

  const memoryDeps = {
    timelineRepository: stack.memory.timelineRepository,
    noteRepository: stack.memory.noteRepository,
    attachmentRepository: stack.memory.attachmentRepository,
    commitmentSource: stack.memory.commitmentSource,
    access: stack.memory.access,
    clock: stack.memory.clock,
  };

  const memoryResult = await buildJourneyMemory(memoryDeps, {
    journeyId: input.journeyId,
    audience: "PORTAL",
    actorId: input.actorId,
  });

  let nextAction = continuation.narrativeSummary;
  if (memoryResult.ok) {
    const narrativeResult = await projectNarrativeForAudience(
      { access: stack.memory.access, clock: stack.memory.clock },
      { memory: memoryResult.value, audience: "PORTAL", actorId: input.actorId },
    );
    if (narrativeResult.ok && narrativeResult.value.summary) {
      nextAction = narrativeResult.value.summary;
    }
  }

  const displayName = firstName(patient.fullName, patient.preferredName);
  const storyReceived = memoryResult.ok
    ? hasStoryReceptionConfirmed(memoryResult.value.timeline)
    : false;

  return {
    ok: true,
    value: {
      greeting: `Olá, ${displayName}. Continuamos de onde paramos.`,
      patientName: patient.fullName,
      journeyState: OPERATIONAL_STAGE_LABELS[journey.currentStage as OperationalStage],
      narrativeCheckpoint: PUBLIC_CHAPTER_LABELS[continuation.resumeAt.publicChapter],
      nextAction,
      storyReceived,
      comprehension: storyReceived ? HISTORIA_RECEBIDA_COPY.portalComprehension : null,
    },
  };
}
