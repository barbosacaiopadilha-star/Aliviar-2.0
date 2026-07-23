import { handoffStartedEvent } from "../events/handoff-events";
import type { JourneyHandoff } from "../model/journey-handoff";
import type { ClockPort, HandoffRepositoryPort, IdGeneratorPort } from "../ports/handoff-ports";
import type { StartHandoffInput } from "../model/journey-handoff";

export type HandoffServiceError =
  | { code: "NOT_FOUND"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type HandoffServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: HandoffServiceError };

export interface StartHandoffDependencies {
  handoffRepository: HandoffRepositoryPort;
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
}

export async function startHandoff(
  deps: StartHandoffDependencies,
  input: StartHandoffInput,
): Promise<HandoffServiceResult<JourneyHandoff>> {
  const existing = await deps.handoffRepository.findBySessionId(input.sessionId);
  if (existing && existing.status !== "BOOTSTRAPPED") {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Sessão já possui handoff ativo." } };
  }

  const startedAt = deps.clock.now();
  const handoff: JourneyHandoff = {
    id: deps.idGenerator.nextId(),
    sessionId: input.sessionId,
    intention: input.intention,
    status: "STARTED",
    checkpoint: { publicChapter: input.publicChapter, capturedAt: startedAt },
    startedAt,
    completedAt: null,
    bootstrap: null,
  };

  const saved = await deps.handoffRepository.save(handoff);
  void handoffStartedEvent(
    saved.id,
    saved.sessionId,
    saved.intention,
    saved.checkpoint.publicChapter,
    startedAt,
  );

  return { ok: true, value: saved };
}
