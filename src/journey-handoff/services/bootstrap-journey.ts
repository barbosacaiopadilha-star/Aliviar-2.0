import { journeyBootstrappedEvent } from "../events/handoff-events";
import type { BootstrapJourneyInput } from "../model/bootstrap-result";
import type { JourneyHandoff } from "../model/journey-handoff";
import { canBootstrap } from "../model/handoff-status";
import type { ClockPort, HandoffRepositoryPort, JourneyBootstrapPort } from "../ports/handoff-ports";
import type { HandoffServiceResult } from "./start-handoff";

export type BootstrapJourneyServiceInput = BootstrapJourneyInput;

export interface BootstrapJourneyDependencies {
  handoffRepository: HandoffRepositoryPort;
  bootstrapPort: JourneyBootstrapPort;
  clock: ClockPort;
}

export async function bootstrapJourneyFromHandoff(
  deps: BootstrapJourneyDependencies,
  input: BootstrapJourneyServiceInput,
): Promise<HandoffServiceResult<JourneyHandoff>> {
  const handoff = await deps.handoffRepository.findById(input.handoffId);
  if (!handoff) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Handoff não encontrado." } };
  }

  if (!canBootstrap(handoff.status)) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Handoff não elegível para bootstrap." } };
  }

  if (handoff.bootstrap) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada já bootstrapada para este handoff." } };
  }

  const bootstrap = await deps.bootstrapPort.bootstrap(input);
  const updated: JourneyHandoff = {
    ...handoff,
    status: "BOOTSTRAPPED",
    bootstrap,
    completedAt: handoff.completedAt ?? deps.clock.now(),
  };

  const saved = await deps.handoffRepository.save(updated);
  void journeyBootstrappedEvent(
    saved.id,
    saved.sessionId,
    bootstrap.journeyId,
    bootstrap.caseId,
    bootstrap.patientId,
    bootstrap.bootstrappedAt,
  );

  return { ok: true, value: saved };
}
