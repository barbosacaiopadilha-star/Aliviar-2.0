import type { JourneyEventCategory } from "@/modules/journey-events/types/journey-event";

import type { TimelineRepositoryPort } from "../events/timeline-record";
import type { JourneyKernelRepositoryPort } from "../ports/kernel-ports";
import type { KernelActor } from "../rbac/authorization";
import { authorize, authorizePatientOwnership } from "../rbac/authorization";
import type { KernelServiceResult } from "./create-journey";

export interface RegisterJourneyEventInput {
  journeyId: string;
  actor: KernelActor;
  category: JourneyEventCategory;
  title: string;
  description?: string | null;
  journeyImpact?: string | null;
  nextStep?: string | null;
  occurredAt: string;
}

export interface RegisterJourneyEventOutput {
  eventId: string;
}

export interface RegisterJourneyEventDependencies {
  journeyRepository: JourneyKernelRepositoryPort;
  timelineRepository: TimelineRepositoryPort;
}

export async function registerJourneyEvent(
  deps: RegisterJourneyEventDependencies,
  input: RegisterJourneyEventInput,
): Promise<KernelServiceResult<RegisterJourneyEventOutput>> {
  const auth = authorize(input.actor, "journey.events.write");
  if (!auth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: auth.message } };
  }

  const snapshot = await deps.journeyRepository.findById(input.journeyId);
  if (!snapshot) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada n├úo encontrada." } };
  }

  const ownership = authorizePatientOwnership(input.actor, snapshot.patientId);
  if (!ownership.ok) {
    return { ok: false, error: { code: "OWNERSHIP_REQUIRED", message: ownership.message } };
  }

  const record = await deps.timelineRepository.append({
    journeyId: input.journeyId,
    category: input.category,
    source: "MANUAL",
    title: input.title,
    description: input.description,
    journeyImpact: input.journeyImpact,
    nextStep: input.nextStep,
    occurredAt: input.occurredAt,
    createdBy: input.actor.id,
  });

  return { ok: true, value: { eventId: record.id } };
}

export interface QueryJourneyTimelineInput {
  journeyId: string;
  actor: KernelActor;
}

export interface QueryJourneyTimelineOutput {
  events: Awaited<ReturnType<TimelineRepositoryPort["listByJourney"]>>;
}

export async function queryJourneyTimeline(
  deps: RegisterJourneyEventDependencies,
  input: QueryJourneyTimelineInput,
): Promise<KernelServiceResult<QueryJourneyTimelineOutput>> {
  const auth = authorize(input.actor, "journey.timeline.read");
  if (!auth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: auth.message } };
  }

  const snapshot = await deps.journeyRepository.findById(input.journeyId);
  if (!snapshot) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada n├úo encontrada." } };
  }

  const ownership = authorizePatientOwnership(input.actor, snapshot.patientId);
  if (!ownership.ok) {
    return { ok: false, error: { code: "OWNERSHIP_REQUIRED", message: ownership.message } };
  }

  const events = await deps.timelineRepository.listByJourney(input.journeyId);
  return { ok: true, value: { events } };
}
