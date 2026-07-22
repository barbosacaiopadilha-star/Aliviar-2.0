import type { Application } from "@/infrastructure/composition-root";
import { toApplicationResult } from "@/application/shared/to-application-result";
import { mapValidationToApiResponse } from "../../shared/errors/application-error-mapper";
import { handleApplicationResult } from "../../shared/http/handle-application-result";
import { toObterJornadaDoPacienteResponse } from "../mappers/obter-jornada-do-paciente.mapper";

export async function handleObterJornadaDoPaciente(
  app: Application,
  jornadaId: string,
): Promise<Response> {
  if (!jornadaId || jornadaId.trim().length === 0) {
    const mapped = mapValidationToApiResponse("Identificador da jornada é obrigatório.", {
      jornada_id: "Obrigatório",
    });
    return Response.json(mapped.body, { status: mapped.status });
  }

  return handleApplicationResult(
    toApplicationResult(app.obterJornadaDoPaciente.execute(jornadaId)),
    toObterJornadaDoPacienteResponse,
  );
}
