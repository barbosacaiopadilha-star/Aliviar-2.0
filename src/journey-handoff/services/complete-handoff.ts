import { handoffCompletedEvent } from "../events/handoff-events";
import type { JourneyHandoff } from "../model/journey-handoff";
import type { AdvanceCheckpointInput } from "../model/journey-handoff";
import { isPublicChapterAfter } from "../model/public-chapter";
import type { ClockPort, HandoffRepositoryPort } from "../ports/handoff-ports";
import type { HandoffServiceResult } from "./start-handoff";

export interface CompleteHandoffInput {
  handoffId: string;
  publicChapter: AdvanceCheckpointInput["publicChapter"];
}

export interface CompleteHandoffDependencies {
  handoffRepository: HandoffRepositoryPort;
  clock: ClockPort;
}

export async function advanceHandoffCheckpoint(
  deps: CompleteHandoffDependencies,
  input: AdvanceCheckpointInput,
): Promise<HandoffServiceResult<JourneyHandoff>> {
  const handoff = await deps.handoffRepository.findById(input.handoffId);
  if (!handoff) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Handoff não encontrado." } };
  }

  if (handoff.status === "BOOTSTRAPPED") {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Handoff já finalizado." } };
  }

  const capturedAt = deps.clock.now();
  const updated: JourneyHandoff = {
    ...handoff,
    checkpoint: {
      publicChapter: isPublicChapterAfter(input.publicChapter, handoff.checkpoint.publicChapter)
        ? input.publicChapter
        : handoff.checkpoint.publicChapter,
      capturedAt,
    },
  };

  const saved = await deps.handoffRepository.save(updated);
  return { ok: true, value: saved };
}

export async function completeHandoff(
  deps: CompleteHandoffDependencies,
  input: CompleteHandoffInput,
): Promise<HandoffServiceResult<JourneyHandoff>> {
  const handoff = await deps.handoffRepository.findById(input.handoffId);
  if (!handoff) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Handoff não encontrado." } };
  }

  if (handoff.status === "BOOTSTRAPPED") {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Handoff já bootstrapado." } };
  }

  const completedAt = deps.clock.now();
  const updated: JourneyHandoff = {
    ...handoff,
    status: "COMPLETED",
    completedAt,
    checkpoint: {
      publicChapter: input.publicChapter,
      capturedAt: completedAt,
    },
  };

  const saved = await deps.handoffRepository.save(updated);
  void handoffCompletedEvent(saved.id, saved.sessionId, saved.checkpoint.publicChapter, completedAt);

  return { ok: true, value: saved };
}
