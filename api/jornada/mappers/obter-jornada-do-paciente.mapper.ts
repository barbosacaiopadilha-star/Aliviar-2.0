import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { readModelToView } from "@/infrastructure/jornada/jornada-view-projection";
import type { ObterJornadaDoPacienteResponse } from "../dto/obter-jornada-do-paciente.dto";

export function toObterJornadaDoPacienteResponse(
  model: JornadaDoPacienteReadModel,
): ObterJornadaDoPacienteResponse {
  return readModelToView(model);
}
