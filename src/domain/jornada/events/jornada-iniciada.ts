import type { DomainEvent } from "./domain-event";
import type { EtapaDaJornadaCodigo } from "../value-objects/etapa-da-jornada";
import type { ResponsavelDaJornadaCodigo } from "../value-objects/responsavel-da-jornada";

export interface JornadaIniciada extends DomainEvent {
  readonly type: "JornadaIniciada";
  readonly pacienteId: string;
  readonly etapaInicial: EtapaDaJornadaCodigo;
  readonly responsavelInicial: ResponsavelDaJornadaCodigo;
}

export function criarJornadaIniciada(params: {
  aggregateId: string;
  pacienteId: string;
  etapaInicial: EtapaDaJornadaCodigo;
  responsavelInicial: ResponsavelDaJornadaCodigo;
  occurredAt: string;
}): JornadaIniciada {
  return {
    type: "JornadaIniciada",
    aggregateId: params.aggregateId,
    pacienteId: params.pacienteId,
    etapaInicial: params.etapaInicial,
    responsavelInicial: params.responsavelInicial,
    occurredAt: params.occurredAt,
  };
}
