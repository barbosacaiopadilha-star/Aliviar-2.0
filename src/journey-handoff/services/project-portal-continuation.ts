import type { PortalContinuationProjection } from "../projection/portal-continuation";
import { projectPortalContinuation } from "../projection/portal-continuation";
import type { ClockPort, HandoffRepositoryPort } from "../ports/handoff-ports";
import type { HandoffServiceResult } from "./start-handoff";

export interface ProjectPortalContinuationInput {
  handoffId: string;
}

export interface ProjectPortalContinuationDependencies {
  handoffRepository: HandoffRepositoryPort;
  clock: ClockPort;
}

export async function projectPortalContinuationFromHandoff(
  deps: ProjectPortalContinuationDependencies,
  input: ProjectPortalContinuationInput,
): Promise<HandoffServiceResult<PortalContinuationProjection>> {
  const handoff = await deps.handoffRepository.findById(input.handoffId);
  if (!handoff) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Handoff não encontrado." } };
  }

  return {
    ok: true,
    value: projectPortalContinuation(handoff, deps.clock.now()),
  };
}
