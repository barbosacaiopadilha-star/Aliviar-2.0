import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapNotFoundToApiResponse, mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";

export async function handleObterDossiePaciente(app: Application): Promise<Response> {
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

  return handleApplicationResult(
    toApplicationResult(
      app.obterDossiePaciente.execute(jornada.jornadaId, access.patientId),
    ),
    (data) => data,
  );
}

export async function handleRegistrarEscolhaDossie(
  app: Application,
  body: unknown,
): Promise<Response> {
  const access = await resolvePatientAccess();

  if (access.status !== "patient") {
    const mapped = mapValidationToApiResponse("Acesso não autorizado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const request = body as {
    dossie_id?: string;
    versao_id?: string;
    opcao_indice?: number;
    proximos_passos?: string;
    observacao?: string | null;
  };

  if (!request?.dossie_id) {
    const mapped = mapValidationToApiResponse("dossie_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }
  if (!request.versao_id) {
    const mapped = mapValidationToApiResponse("versao_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }
  if (request.opcao_indice === undefined || request.opcao_indice < 0 || request.opcao_indice > 2) {
    const mapped = mapValidationToApiResponse("opcao_indice inválido.", {
      opcao_indice: "Deve ser 0, 1 ou 2",
    });
    return errorResponse(mapped.status, mapped.body);
  }
  if (!request.proximos_passos?.trim()) {
    const mapped = mapValidationToApiResponse("proximos_passos é obrigatório.");
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
    metadata: { opcao_indice: request.opcao_indice, dossie_id: request.dossie_id },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(
          app.registrarEscolhaCuradoria.execute({
            journeyId: jornada.jornadaId,
            patientId: access.patientId,
            dossieId: request.dossie_id!,
            versaoId: request.versao_id!,
            opcaoIndice: request.opcao_indice!,
            proximosPassos: request.proximos_passos!.trim(),
            observacao: request.observacao ?? null,
          }),
        ),
        (data) => data,
        201,
      ),
  });
}
