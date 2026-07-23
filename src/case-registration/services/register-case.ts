import type { KernelActor } from "@/kernel/rbac/authorization";
import { createJourney, type CreateJourneyDependencies } from "@/kernel/services/create-journey";
import type { TimelineRepositoryPort } from "@/kernel/events/timeline-record";

import type { CaseRegistrationEvent } from "../events/case-registration-events";
import { CASE_TIMELINE_TITLES } from "../events/case-registration-events";
import { CaseAggregate } from "../model/case";
import type { CaseIntake } from "../model/case-intake";
import { validateCaseIntake } from "../model/case-intake";
import type {
  CaseRepositoryPort,
  IdGeneratorPort,
  PatientRepositoryPort,
} from "../ports/case-registration-ports";
import type { AuthorizationService } from "@/identity/authorization/authorization-service";
import type { PatientRecord } from "../model/patient";

export interface RegisterCaseInput {
  intake: CaseIntake;
  actor: KernelActor;
}

export interface RegisterCaseOutput {
  caseId: string;
  patientId: string;
  journeyId: string;
  patient: PatientRecord;
}

export interface RegisterCaseDependencies extends CreateJourneyDependencies {
  caseRepository: CaseRepositoryPort;
  patientRepository: PatientRepositoryPort;
  authorization: AuthorizationService;
}

export type RegisterCaseError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "VALIDATION_ERROR"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type RegisterCaseResult =
  | { ok: true; value: RegisterCaseOutput }
  | { ok: false; error: RegisterCaseError };

async function resolvePatient(
  deps: Pick<RegisterCaseDependencies, "patientRepository" | "clock">,
  intake: CaseIntake,
): Promise<PatientRecord | RegisterCaseError> {
  if (intake.patient.type === "existing") {
    const existing = await deps.patientRepository.findById(intake.patient.patientId);
    if (!existing) {
      return { code: "DOMAIN_ERROR", message: "Paciente n├úo encontrado." };
    }
    return existing;
  }

  if (intake.patient.data.cpf) {
    const byCpf = await deps.patientRepository.findByCpf(intake.patient.data.cpf);
    if (byCpf) {
      return byCpf;
    }
  }

  return deps.patientRepository.create(intake.patient.data, deps.clock.now());
}

function registrationEvent(
  ids: IdGeneratorPort,
  params: Omit<CaseRegistrationEvent, "id">,
): CaseRegistrationEvent {
  return { id: ids.nextId(), ...params };
}

async function appendCaseTimeline(
  timelineRepository: TimelineRepositoryPort,
  params: {
    journeyId: string;
    caseId: string;
    type: CaseRegistrationEvent["type"];
    actorId: string;
    occurredAt: string;
    description?: string;
  },
): Promise<void> {
  await timelineRepository.append({
    journeyId: params.journeyId,
    category: "JOURNEY",
    source: "SYSTEM",
    title: CASE_TIMELINE_TITLES[params.type],
    description: params.description ?? `Caso ${params.caseId}`,
    journeyImpact: "Caso registrado na plataforma.",
    occurredAt: params.occurredAt,
    createdBy: params.actorId,
  });
}

/**
 * Registra um caso completo:
 * paciente ÔåÆ caso ÔåÆ jornada (kernel) ÔåÆ ownership ÔåÆ primeiro evento na timeline.
 */
export async function registerCase(
  deps: RegisterCaseDependencies,
  input: RegisterCaseInput,
): Promise<RegisterCaseResult> {
  const permission = deps.authorization.authorize("journey.create");
  if (!permission.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: permission.message } };
  }

  const validationError = validateCaseIntake(input.intake);
  if (validationError) {
    return { ok: false, error: { code: "VALIDATION_ERROR", message: validationError } };
  }

  const occurredAt = deps.clock.now();
  const patientResult = await resolvePatient(deps, input.intake);
  if ("code" in patientResult) {
    return { ok: false, error: patientResult };
  }

  const patient = patientResult;
  const caseId = deps.ids.nextId();
  const journeyId = deps.ids.nextId();

  const draft = CaseAggregate.createDraft({
    id: caseId,
    patientId: patient.id,
    context: input.intake.context,
    ownership: input.intake.ownership,
    createdBy: input.actor.id,
    occurredAt,
  });

  const events: CaseRegistrationEvent[] = [
    registrationEvent(deps.ids, {
      caseId,
      journeyId: null,
      type: "CASE_CREATED",
      actorId: input.actor.id,
      occurredAt,
      metadata: { title: input.intake.context.title },
    }),
    registrationEvent(deps.ids, {
      caseId,
      journeyId: null,
      type: "PATIENT_ASSOCIATED",
      actorId: input.actor.id,
      occurredAt,
      metadata: { patientId: patient.id },
    }),
    registrationEvent(deps.ids, {
      caseId,
      journeyId: null,
      type: "OWNERSHIP_ASSIGNED",
      actorId: input.actor.id,
      occurredAt,
      metadata: { managerId: input.intake.ownership.managerId },
    }),
  ];

  await deps.caseRepository.save(draft.toRecord(), events);

  const journeyResult = await createJourney(deps, {
    journeyId,
    patientId: patient.id,
    actor: input.actor,
  });

  if (!journeyResult.ok) {
    return {
      ok: false,
      error: { code: journeyResult.error.code === "FORBIDDEN" ? "FORBIDDEN" : "DOMAIN_ERROR", message: journeyResult.error.message },
    };
  }

  const bootstrapped = draft.bootstrapJourney(journeyId, occurredAt);
  if (!bootstrapped.ok) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: bootstrapped.error.message } };
  }

  const bootstrapEvent = registrationEvent(deps.ids, {
    caseId,
    journeyId,
    type: "JOURNEY_BOOTSTRAPPED",
    actorId: input.actor.id,
    occurredAt,
    metadata: { journeyId },
  });

  await deps.caseRepository.save(bootstrapped.value.toRecord(), [bootstrapEvent]);

  await appendCaseTimeline(deps.timelineRepository, {
    journeyId,
    caseId,
    type: "CASE_CREATED",
    actorId: input.actor.id,
    occurredAt,
    description: input.intake.context.title,
  });

  return {
    ok: true,
    value: {
      caseId,
      patientId: patient.id,
      journeyId,
      patient,
    },
  };
}
