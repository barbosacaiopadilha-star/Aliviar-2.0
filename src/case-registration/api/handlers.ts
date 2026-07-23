import type { KernelActor } from "@/kernel/rbac/authorization";
import type { AuthorizationService } from "@/identity/authorization/authorization-service";
import type { CreateJourneyDependencies } from "@/kernel/services/create-journey";

import type {
  CaseRegistrationApiResult,
  RegisterCaseRequest,
  RegisterCaseResponse,
} from "./contracts";
import { createCaseContext } from "../model/case-context";
import type { CaseIntake } from "../model/case-intake";
import { createJourneyOwnership } from "../model/journey-ownership";
import type { CaseRepositoryPort, PatientRepositoryPort } from "../ports/case-registration-ports";
import { registerCase } from "../services/register-case";

export interface CaseRegistrationHandlerDeps extends CreateJourneyDependencies {
  caseRepository: CaseRepositoryPort;
  patientRepository: PatientRepositoryPort;
  authorization: AuthorizationService;
}

function toIntake(body: RegisterCaseRequest): CaseIntake {
  const patient =
    body.patient.type === "existing"
      ? { type: "existing" as const, patientId: body.patient.patient_id }
      : {
          type: "new" as const,
          data: {
            fullName: body.patient.full_name,
            preferredName: body.patient.preferred_name,
            email: body.patient.email,
            phone: body.patient.phone,
            cpf: body.patient.cpf,
            birthDate: body.patient.birth_date,
            city: body.patient.city,
            state: body.patient.state,
            healthPlan: body.patient.health_plan,
          },
        };

  return {
    patient,
    context: createCaseContext({
      title: body.context.title,
      objective: body.context.objective,
      declaredNeed: body.context.declared_need,
      source: body.context.source,
    }),
    ownership: createJourneyOwnership(body.ownership.manager_id, {
      operationId: body.ownership.operation_id,
      curatorId: body.ownership.curator_id,
    }),
  };
}

function mapError(error: { code: string; message: string }): CaseRegistrationApiResult<never> {
  if (error.code === "FORBIDDEN") {
    return { status: 403, body: { code: "FORBIDDEN", message: error.message } };
  }
  return { status: 422, body: { code: error.code as "VALIDATION_ERROR" | "DOMAIN_ERROR", message: error.message } };
}

export async function handleRegisterCase(
  deps: CaseRegistrationHandlerDeps,
  actor: KernelActor,
  body: RegisterCaseRequest,
): Promise<CaseRegistrationApiResult<RegisterCaseResponse>> {
  const result = await registerCase(deps, {
    intake: toIntake(body),
    actor,
  });

  if (!result.ok) {
    return mapError(result.error);
  }

  const journey = await deps.journeyRepository.findById(result.value.journeyId);

  return {
    status: 201,
    body: {
      case_id: result.value.caseId,
      patient_id: result.value.patientId,
      journey_id: result.value.journeyId,
      journey_stage: journey?.currentStage ?? "CADASTRO",
      owner_id: body.ownership.manager_id,
    },
  };
}
