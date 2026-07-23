import type { JourneyEventCategory } from "@/modules/journey-events/types/journey-event";

import type { ClockPort, IdGeneratorPort, JourneyKernelRepositoryPort } from "../ports/kernel-ports";
import type { CommitmentRepositoryPort } from "../commitments/commitment-record";
import type { TimelineRepositoryPort } from "../events/timeline-record";
import type { KernelActor } from "../rbac/authorization";
import {
  type AdvanceJourneyRequest,
  type AdvanceJourneyResponse,
  type CompleteCommitmentRequest,
  type CompleteCommitmentResponse,
  type CreateCommitmentRequest,
  type CreateCommitmentResponse,
  type CreateJourneyRequest,
  type CreateJourneyResponse,
  type KernelApiResult,
  type QueryTimelineRequest,
  type QueryTimelineResponse,
  type RegisterJourneyEventRequest,
  type RegisterJourneyEventResponse,
  toKernelJourneyView,
} from "./contracts";
import { advanceJourney, createJourney } from "../services/create-journey";
import { completeCommitment, createCommitment } from "../services/journey-commitments";
import { queryJourneyTimeline, registerJourneyEvent } from "../services/journey-timeline";

export interface KernelHandlerDependencies {
  journeyRepository: JourneyKernelRepositoryPort;
  timelineRepository: TimelineRepositoryPort;
  commitmentRepository: CommitmentRepositoryPort;
  ids: IdGeneratorPort;
  clock: ClockPort;
}

function toActor(context: { actorId: string; role: KernelActor["role"]; patientId?: string }): KernelActor {
  return {
    id: context.actorId,
    role: context.role,
    patientId: context.patientId,
  };
}

function mapError(error: { code: string; message: string }): KernelApiResult<never> {
  if (error.code === "FORBIDDEN" || error.code === "OWNERSHIP_REQUIRED") {
    return { status: 403, body: { code: error.code, message: error.message } };
  }
  if (error.message.includes("n├úo encontrada") || error.message.includes("n├úo encontrado")) {
    return { status: 404, body: { code: "NOT_FOUND", message: error.message } };
  }
  return { status: 422, body: { code: "DOMAIN_ERROR", message: error.message } };
}

export async function handleCreateJourney(
  deps: KernelHandlerDependencies,
  actorContext: { actorId: string; role: KernelActor["role"]; patientId?: string },
  body: CreateJourneyRequest,
): Promise<KernelApiResult<CreateJourneyResponse>> {
  const result = await createJourney(deps, {
    journeyId: body.journeyId,
    patientId: body.patientId,
    actor: toActor(actorContext),
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  return {
    status: 200,
    body: { journey: toKernelJourneyView(result.value.journey) },
  };
}

export async function handleAdvanceJourney(
  deps: KernelHandlerDependencies,
  actorContext: { actorId: string; role: KernelActor["role"]; patientId?: string },
  body: AdvanceJourneyRequest,
): Promise<KernelApiResult<AdvanceJourneyResponse>> {
  const result = await advanceJourney(deps, {
    journeyId: body.journeyId,
    actor: toActor(actorContext),
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  return {
    status: 200,
    body: {
      journey: toKernelJourneyView(result.value.journey),
      fromStage: result.value.fromStage as AdvanceJourneyResponse["fromStage"],
      toStage: result.value.toStage as AdvanceJourneyResponse["toStage"],
    },
  };
}

export async function handleRegisterJourneyEvent(
  deps: KernelHandlerDependencies,
  actorContext: { actorId: string; role: KernelActor["role"]; patientId?: string },
  body: RegisterJourneyEventRequest,
): Promise<KernelApiResult<RegisterJourneyEventResponse>> {
  const result = await registerJourneyEvent(deps, {
    journeyId: body.journeyId,
    actor: toActor(actorContext),
    category: body.category as JourneyEventCategory,
    title: body.title,
    description: body.description,
    journeyImpact: body.journeyImpact,
    nextStep: body.nextStep,
    occurredAt: body.occurredAt,
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  return { status: 200, body: result.value };
}

export async function handleQueryTimeline(
  deps: KernelHandlerDependencies,
  actorContext: { actorId: string; role: KernelActor["role"]; patientId?: string },
  body: QueryTimelineRequest,
): Promise<KernelApiResult<QueryTimelineResponse>> {
  const result = await queryJourneyTimeline(deps, {
    journeyId: body.journeyId,
    actor: toActor(actorContext),
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  return {
    status: 200,
    body: {
      events: result.value.events.map((event) => ({
        id: event.id,
        category: event.category,
        title: event.title,
        description: event.description,
        occurredAt: event.occurredAt,
        source: event.source,
      })),
    },
  };
}

export async function handleCreateCommitment(
  deps: KernelHandlerDependencies,
  actorContext: { actorId: string; role: KernelActor["role"]; patientId?: string },
  body: CreateCommitmentRequest,
): Promise<KernelApiResult<CreateCommitmentResponse>> {
  const result = await createCommitment(deps, {
    journeyId: body.journeyId,
    actor: toActor(actorContext),
    title: body.title,
    assignedTo: body.assignedTo,
    dueDate: body.dueDate,
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  return { status: 200, body: result.value };
}

export async function handleCompleteCommitment(
  deps: KernelHandlerDependencies,
  actorContext: { actorId: string; role: KernelActor["role"]; patientId?: string },
  body: CompleteCommitmentRequest,
): Promise<KernelApiResult<CompleteCommitmentResponse>> {
  const result = await completeCommitment(deps, {
    journeyId: body.journeyId,
    commitmentId: body.commitmentId,
    actor: toActor(actorContext),
    occurredAt: deps.clock.now(),
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  return { status: 200, body: result.value };
}
