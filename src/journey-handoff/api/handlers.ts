import { bootstrapJourneyFromHandoff } from "../services/bootstrap-journey";
import { completeHandoff } from "../services/complete-handoff";
import { projectPortalContinuationFromHandoff } from "../services/project-portal-continuation";
import { startHandoff } from "../services/start-handoff";
import type {
  BootstrapJourneyRequest,
  BootstrapJourneyResponse,
  CompleteHandoffRequest,
  CompleteHandoffResponse,
  HandoffApiResult,
  ProjectContinuationRequest,
  ProjectContinuationResponse,
  StartHandoffRequest,
  StartHandoffResponse,
} from "./contracts";
import type {
  ClockPort,
  HandoffRepositoryPort,
  IdGeneratorPort,
  JourneyBootstrapPort,
} from "../ports/handoff-ports";

export interface HandoffHandlerDependencies {
  handoffRepository: HandoffRepositoryPort;
  bootstrapPort: JourneyBootstrapPort;
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
}

function toApiError<T>(result: { ok: false; error: { code: string; message: string } }): HandoffApiResult<T> {
  return {
    ok: false,
    error: {
      code: result.error.code as "NOT_FOUND" | "DOMAIN_ERROR",
      message: result.error.message,
    },
  };
}

export async function handleStartHandoff(
  deps: HandoffHandlerDependencies,
  request: StartHandoffRequest,
): Promise<HandoffApiResult<StartHandoffResponse>> {
  const result = await startHandoff(deps, request);
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { handoff: result.value } };
}

export async function handleCompleteHandoff(
  deps: HandoffHandlerDependencies,
  request: CompleteHandoffRequest,
): Promise<HandoffApiResult<CompleteHandoffResponse>> {
  const result = await completeHandoff(deps, request);
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { handoff: result.value } };
}

export async function handleBootstrapJourney(
  deps: HandoffHandlerDependencies,
  request: BootstrapJourneyRequest,
): Promise<HandoffApiResult<BootstrapJourneyResponse>> {
  const result = await bootstrapJourneyFromHandoff(deps, request);
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { handoff: result.value } };
}

export async function handleProjectContinuation(
  deps: HandoffHandlerDependencies,
  request: ProjectContinuationRequest,
): Promise<HandoffApiResult<ProjectContinuationResponse>> {
  const result = await projectPortalContinuationFromHandoff(deps, request);
  if (!result.ok) return toApiError(result);
  return { ok: true, value: { continuation: result.value } };
}
