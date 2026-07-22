import type { RegistrarCasoDeclaradoCommand } from "@/application/caso/registrar-caso-declarado";
import type { RegistrarCasoDeclaradoOutput } from "@/application/caso/registrar-caso-declarado.output";
import type {
  RegistrarCasoDeclaradoRequest,
  RegistrarCasoDeclaradoResponse,
} from "../dto/registrar-caso-declarado.request";

export function toRegistrarCasoDeclaradoCommand(
  request: RegistrarCasoDeclaradoRequest,
): RegistrarCasoDeclaradoCommand {
  return {
    fullName: request.full_name,
    preferredName: request.preferred_name ?? null,
    birthDate: request.birth_date ?? null,
    cpf: request.cpf ?? null,
    phone: request.phone ?? null,
    email: request.email ?? null,
    city: request.city ?? null,
    state: request.state ?? null,
    healthPlan: request.health_plan ?? null,
    journeyTitle: request.journey_title,
    journeyObjective: request.journey_objective ?? null,
    managerId: request.manager_id,
    priority: request.priority,
    openedAt: request.opened_at ?? null,
  };
}

export function toRegistrarCasoDeclaradoResponse(
  output: RegistrarCasoDeclaradoOutput,
): RegistrarCasoDeclaradoResponse {
  return {
    caso_id: output.casoId,
    paciente_id: output.pacienteId,
    jornada_id: output.jornadaId,
  };
}
