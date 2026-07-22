import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";
import type { RegistrarCasoDeclaradoRequest } from "../dto/registrar-caso-declarado.request";
import {
  toRegistrarCasoDeclaradoCommand,
  toRegistrarCasoDeclaradoResponse,
} from "../mappers/registrar-caso-declarado.mapper";

export async function handleRegistrarCasoDeclarado(
  app: Application,
  body: unknown,
): Promise<Response> {
  const request = body as RegistrarCasoDeclaradoRequest;

  if (!request?.full_name || !request?.journey_title || !request?.manager_id) {
    const mapped = mapValidationToApiResponse("Campos obrigatórios ausentes.", {
      full_name: !request?.full_name ? "Obrigatório" : "",
      journey_title: !request?.journey_title ? "Obrigatório" : "",
      manager_id: !request?.manager_id ? "Obrigatório" : "",
    });
    return errorResponse(mapped.status, mapped.body);
  }

  const command = toRegistrarCasoDeclaradoCommand(request);

  return handleApplicationResult(
    toApplicationResult(app.registrarCasoDeclarado.execute(command)),
    toRegistrarCasoDeclaradoResponse,
    201,
  );
}
