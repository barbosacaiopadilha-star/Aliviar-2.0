import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { instrumentOperation } from "../../shared/observability/instrument-operation";
import { mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { errorResponse } from "../../shared/http/response";
import type { ExecutarAnaliseInicialRequest } from "../dto/executar-analise-inicial.dto";
import {
  toExecutarAnaliseInicialCommand,
  toExecutarAnaliseInicialResponse,
} from "../mappers/executar-analise-inicial.mapper";

export async function handleExecutarAnaliseInicial(
  app: Application,
  jornadaId: string,
  body: unknown,
): Promise<Response> {
  if (!jornadaId) {
    const mapped = mapValidationToApiResponse("jornada_id é obrigatório.");
    return errorResponse(mapped.status, mapped.body);
  }

  const request = body as ExecutarAnaliseInicialRequest;

  if (!request?.observacoes) {
    const mapped = mapValidationToApiResponse("observacoes é obrigatório.", {
      observacoes: "Obrigatório",
    });
    return errorResponse(mapped.status, mapped.body);
  }

  const command = toExecutarAnaliseInicialCommand(jornadaId, request);

  return instrumentOperation({
    operationType: "ACE_ANALISE_INICIO",
    jornadaId,
    actorRole: "STAFF",
    metadata: { acao: "ace_melhorado", pipeline: "v2" },
    execute: () =>
      handleApplicationResult(
        toApplicationResult(app.executarAnaliseInicial.execute(command)),
        toExecutarAnaliseInicialResponse,
        201,
      ),
  });
}
