import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapNotFoundToApiResponse, mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";
import { toObterJornadaDoPacienteResponse } from "../mappers/obter-jornada-do-paciente.mapper";

export async function handleRegistrarEscolha(app: Application, body: unknown): Promise<Response> {
  const access = await resolvePatientAccess();

  if (access.status !== "patient") {
    const mapped = mapValidationToApiResponse("Acesso não autorizado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const request = body as { opcao_indice?: number; observacao?: string | null };
  if (request?.opcao_indice === undefined || request.opcao_indice < 0 || request.opcao_indice > 2) {
    const mapped = mapValidationToApiResponse("opcao_indice inválido.", {
      opcao_indice: "Deve ser 0, 1 ou 2",
    });
    return errorResponse(mapped.status, mapped.body);
  }

  const jornada = await app.jornadaQuery.obterPorPacienteId(access.patientId);
  if (!jornada) {
    const mapped = mapNotFoundToApiResponse("Jornada não encontrada.");
    return errorResponse(mapped.status, mapped.body);
  }

  return instrumentOperation({
    operationType: "ESCOLHA_PACIENTE",
    patientId: access.patientId,
    jornadaId: jornada.jornadaId,
    actorId: access.authUserId,
    actorRole: "PATIENT",
    metadata: { opcao_indice: request.opcao_indice },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(
          app.registrarEscolhaPaciente.execute({
            jornadaId: jornada.jornadaId,
            opcaoIndice: request.opcao_indice!,
            observacao: request.observacao ?? null,
          }),
        ),
        toObterJornadaDoPacienteResponse,
      ),
  });
}
