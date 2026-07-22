import { randomUUID } from "crypto";

import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapNotFoundToApiResponse, mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";
import { toObterJornadaDoPacienteResponse } from "../mappers/obter-jornada-do-paciente.mapper";

function patientErrorResponse(status: number, code: string, message: string): Response {
  return errorResponse(status, {
    error: { code, message, traceId: randomUUID() },
  });
}

export async function handleObterMinhaJornada(app: Application): Promise<Response> {
  const access = await resolvePatientAccess();

  if (access.status === "unauthenticated" || access.status === "session_invalid") {
    return patientErrorResponse(401, "UNAUTHORIZED", "Sessão inválida ou expirada.");
  }

  if (access.status === "not_patient") {
    return patientErrorResponse(403, "FORBIDDEN", "Acesso restrito a pacientes.");
  }

  return handleApplicationResult(
    toApplicationResult(app.obterJornadaDoPacienteAutenticado.execute(access.patientId)),
    toObterJornadaDoPacienteResponse,
  );
}

export async function handleAvancarOnboarding(app: Application): Promise<Response> {
  const access = await resolvePatientAccess();

  if (access.status !== "patient") {
    const mapped = mapValidationToApiResponse("Acesso não autorizado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const jornada = await app.jornadaQuery.obterPorPacienteId(access.patientId);
  if (!jornada) {
    const mapped = mapNotFoundToApiResponse("Jornada não encontrada.");
    return errorResponse(mapped.status, mapped.body);
  }

  return instrumentOperation({
    operationType: "JORNADA_ALTERADA",
    patientId: access.patientId,
    jornadaId: jornada.jornadaId,
    actorId: access.authUserId,
    actorRole: "PATIENT",
    metadata: { acao: "onboarding_avancar" },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.avancarOnboardingPaciente.execute(jornada.jornadaId)),
        toObterJornadaDoPacienteResponse,
      ),
  });
}

export async function handleAvancarParaEscolha(app: Application): Promise<Response> {
  const access = await resolvePatientAccess();

  if (access.status !== "patient") {
    const mapped = mapValidationToApiResponse("Acesso não autorizado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const jornada = await app.jornadaQuery.obterPorPacienteId(access.patientId);
  if (!jornada) {
    const mapped = mapNotFoundToApiResponse("Jornada não encontrada.");
    return errorResponse(mapped.status, mapped.body);
  }

  return instrumentOperation({
    operationType: "JORNADA_ALTERADA",
    patientId: access.patientId,
    jornadaId: jornada.jornadaId,
    actorId: access.authUserId,
    actorRole: "PATIENT",
    metadata: { acao: "entrega_avancar_escolha" },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.avancarParaEscolhaPaciente.execute(jornada.jornadaId)),
        toObterJornadaDoPacienteResponse,
      ),
  });
}
