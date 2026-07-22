import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapNotFoundToApiResponse, mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";

export async function handleRegistrarDocumento(app: Application, body: unknown): Promise<Response> {
  const access = await resolvePatientAccess();

  if (access.status !== "patient") {
    const mapped = mapValidationToApiResponse("Acesso não autorizado.");
    return errorResponse(mapped.status, mapped.body);
  }

  const request = body as {
    nome_arquivo?: string;
    tipo_mime?: string;
    tamanho_bytes?: number;
    conteudo_base64?: string;
  };

  if (!request?.nome_arquivo || !request?.tipo_mime || !request?.tamanho_bytes || !request?.conteudo_base64) {
    const mapped = mapValidationToApiResponse("Campos obrigatórios ausentes.", {
      nome_arquivo: !request?.nome_arquivo ? "Obrigatório" : "",
      tipo_mime: !request?.tipo_mime ? "Obrigatório" : "",
      tamanho_bytes: !request?.tamanho_bytes ? "Obrigatório" : "",
      conteudo_base64: !request?.conteudo_base64 ? "Obrigatório" : "",
    });
    return errorResponse(mapped.status, mapped.body);
  }

  const jornada = await app.jornadaQuery.obterPorPacienteId(access.patientId);
  if (!jornada) {
    const mapped = mapNotFoundToApiResponse("Jornada não encontrada.");
    return errorResponse(mapped.status, mapped.body);
  }

  return instrumentOperation({
    operationType: "UPLOAD",
    patientId: access.patientId,
    jornadaId: jornada.jornadaId,
    actorId: access.authUserId,
    actorRole: "PATIENT",
    metadata: {
      nome_arquivo: request.nome_arquivo,
      tamanho_bytes: request.tamanho_bytes,
    },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(
          app.registrarDocumentoPaciente.execute({
            pacienteId: access.patientId,
            jornadaId: jornada.jornadaId,
            nomeArquivo: request.nome_arquivo!,
            tipoMime: request.tipo_mime!,
            tamanhoBytes: request.tamanho_bytes!,
            conteudoBase64: request.conteudo_base64!,
          }),
        ),
        (result) => ({ documento_id: result.documentoId }),
        201,
      ),
  });
}
