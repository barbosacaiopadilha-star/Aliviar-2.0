import type { KernelActor } from "../rbac/authorization";
import { authorize, authorizePatientOwnership, authorizeStageAdvance } from "../rbac/authorization";
import { JourneyKernelAggregate } from "../jornada/journey-kernel-aggregate";
import type {
  ClockPort,
  IdGeneratorPort,
  JourneyKernelRepositoryPort,
} from "../ports/kernel-ports";
import type { TimelineRepositoryPort } from "../events/timeline-record";

export interface CreateJourneyInput {
  journeyId: string;
  patientId: string;
  actor: KernelActor;
}

export interface CreateJourneyOutput {
  journey: ReturnType<JourneyKernelAggregate["toSnapshot"]>;
}

export interface CreateJourneyDependencies {
  journeyRepository: JourneyKernelRepositoryPort;
  timelineRepository: TimelineRepositoryPort;
  ids: IdGeneratorPort;
  clock: ClockPort;
}

export type KernelServiceError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "OWNERSHIP_REQUIRED"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type KernelServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: KernelServiceError };

export async function createJourney(
  deps: CreateJourneyDependencies,
  input: CreateJourneyInput,
): Promise<KernelServiceResult<CreateJourneyOutput>> {
  const auth = authorize(input.actor, "journey.create");
  if (!auth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: auth.message } };
  }

  const occurredAt = deps.clock.now();
  const aggregate = JourneyKernelAggregate.create({
    id: input.journeyId,
    patientId: input.patientId,
    actorId: input.actor.id,
    occurredAt,
    transitionEventId: deps.ids.nextId(),
  });

  const snapshot = await deps.journeyRepository.save(
    aggregate.toSnapshot(),
    aggregate.transitionEvents,
  );

  await deps.timelineRepository.append({
    journeyId: input.journeyId,
    category: "JOURNEY",
    source: "SYSTEM",
    title: "Jornada operacional iniciada",
    description: "Plataforma iniciada na etapa CADASTRO.",
    occurredAt,
    createdBy: input.actor.id,
  });

  return { ok: true, value: { journey: snapshot } };
}

export interface AdvanceJourneyInput {
  journeyId: string;
  actor: KernelActor;
}

export interface AdvanceJourneyOutput {
  journey: ReturnType<JourneyKernelAggregate["toSnapshot"]>;
  fromStage: string;
  toStage: string;
}

export type AdvanceJourneyDependencies = CreateJourneyDependencies;

export async function advanceJourney(
  deps: AdvanceJourneyDependencies,
  input: AdvanceJourneyInput,
): Promise<KernelServiceResult<AdvanceJourneyOutput>> {
  const snapshot = await deps.journeyRepository.findById(input.journeyId);
  if (!snapshot) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada n├úo encontrada." } };
  }

  const readAuth = authorize(input.actor, "journey.read");
  if (!readAuth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: readAuth.message } };
  }

  const ownership = authorizePatientOwnership(input.actor, snapshot.patientId);
  if (!ownership.ok) {
    return { ok: false, error: { code: "OWNERSHIP_REQUIRED", message: ownership.message } };
  }

  const advanceAuth = authorizeStageAdvance(
    input.actor,
    snapshot.currentStage,
    snapshot.patientId,
  );
  if (!advanceAuth.ok) {
    return {
      ok: false,
      error: {
        code: advanceAuth.reason === "OWNERSHIP_REQUIRED" ? "OWNERSHIP_REQUIRED" : "FORBIDDEN",
        message: advanceAuth.message,
      },
    };
  }

  const rehydrated = JourneyKernelAggregate.rehydrate(snapshot);
  if (!rehydrated.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: rehydrated.error.message } };
  }

  const occurredAt = deps.clock.now();
  const fromStage = rehydrated.value.currentStage;
  const advanced = rehydrated.value.advance({
    transitionEventId: deps.ids.nextId(),
    actorId: input.actor.id,
    occurredAt,
  });

  if (!advanced.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: advanced.error.message } };
  }

  const saved = await deps.journeyRepository.save(
    advanced.value.toSnapshot(),
    advanced.value.transitionEvents,
  );

  const toStage = saved.currentStage;
  await deps.timelineRepository.append({
    journeyId: input.journeyId,
    category: "JOURNEY",
    source: "SYSTEM",
    title: `Etapa avan├ºada: ${fromStage} ÔåÆ ${toStage}`,
    description: null,
    journeyImpact: `Jornada na etapa ${toStage}.`,
    occurredAt,
    createdBy: input.actor.id,
  });

  return { ok: true, value: { journey: saved, fromStage, toStage } };
}
