import type { EventoPublicadoPeloPaciente } from "./eventos-paciente";
import type { EventoPublicadoPeloAce } from "./eventos-ace";
import type { EventoPublicadoPelaCuradoria } from "./eventos-curadoria";
import type { EventoPublicadoPeloRelacionamento } from "./eventos-relacionamento";

/**
 * União de eventos publicados por outros contextos.
 * A Jornada é a única coordenadora de estado — estes eventos são insumos.
 */
export type EventoExternoJornada =
  | EventoPublicadoPeloPaciente
  | EventoPublicadoPeloAce
  | EventoPublicadoPelaCuradoria
  | EventoPublicadoPeloRelacionamento;

export function isEventoDoPaciente(
  evento: EventoExternoJornada,
): evento is EventoPublicadoPeloPaciente {
  return evento.origem === "PACIENTE";
}

export function isEventoDoAce(evento: EventoExternoJornada): evento is EventoPublicadoPeloAce {
  return evento.origem === "ACE";
}

export function isEventoDaCuradoria(
  evento: EventoExternoJornada,
): evento is EventoPublicadoPelaCuradoria {
  return evento.origem === "CURADORIA";
}

export function isEventoDoRelacionamento(
  evento: EventoExternoJornada,
): evento is EventoPublicadoPeloRelacionamento {
  return evento.origem === "RELACIONAMENTO";
}
