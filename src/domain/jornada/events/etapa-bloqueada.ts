import type { DomainEvent } from "./domain-event";
import type { EtapaDaJornadaCodigo } from "../value-objects/etapa-da-jornada";

export interface EtapaBloqueada extends DomainEvent {
  readonly type: "EtapaBloqueada";
  readonly etapa: EtapaDaJornadaCodigo;
  readonly bloqueioId: string;
  readonly motivo: string;
}

export function criarEtapaBloqueada(params: {
  aggregateId: string;
  etapa: EtapaDaJornadaCodigo;
  bloqueioId: string;
  motivo: string;
  occurredAt: string;
}): EtapaBloqueada {
  return {
    type: "EtapaBloqueada",
    aggregateId: params.aggregateId,
    etapa: params.etapa,
    bloqueioId: params.bloqueioId,
    motivo: params.motivo,
    occurredAt: params.occurredAt,
  };
}
