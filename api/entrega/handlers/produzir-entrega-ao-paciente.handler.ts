import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";
import type { ProduzirEntregaAoPacienteRequest } from "../dto/produzir-entrega-ao-paciente.dto";
import {
  toProduzirEntregaAoPacienteCommand,
  toProduzirEntregaAoPacienteResponse,
} from "../mappers/produzir-entrega-ao-paciente.mapper";

const VALID_FORMATOS = new Set(["RESUMO", "RECOMENDACAO", "DOCUMENTO"]);

export async function handleProduzirEntregaAoPaciente(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  if (!jornadaId) {
    const mapped = mapValidationToApiResponse("jornada_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const request = body as ProduzirEntregaAoPacienteRequest;

  if (!request?.formato || !VALID_FORMATOS.has(request.formato)) {
    const mapped = mapValidationToApiResponse("formato inválido.", {
      formato: "Deve ser RESUMO, RECOMENDACAO ou DOCUMENTO",
    });
    return errorResponse(mapped.status, mapped.body);
  }

  if (!request?.conteudo) {
    const mapped = mapValidationToApiResponse("conteudo é obrigatório.", {
      conteudo: "Obrigatório",
    });
    return errorResponse(mapped.status, mapped.body);
  }

  const command = toProduzirEntregaAoPacienteCommand(jornadaId, request);

  return handleApplicationResult(
    toApplicationResult(app.produzirEntregaAoPaciente.execute(command)),
    toProduzirEntregaAoPacienteResponse,
    201,
  );
}
