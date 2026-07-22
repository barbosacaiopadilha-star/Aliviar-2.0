import type { DomainEvent } from "./domain-event";
import type { EtapaDaJornadaCodigo } from "../value-objects/etapa-da-jornada";

export interface EtapaRetomada extends DomainEvent {
  readonly type: "EtapaRetomada";
  readonly etapa: EtapaDaJornadaCodigo;
  readonly bloqueioId: string;
}

export function criarEtapaRetomada(params: {
  aggregateId: string;
  etapa: EtapaDaJornadaCodigo;
  bloqueioId: string;
  occurredAt: string;
}): EtapaRetomada {
  return {
    type: "EtapaRetomada",
    aggregateId: params.aggregateId,
    etapa: params.etapa,
    bloqueioId: params.bloqueioId,
    occurredAt: params.occurredAt,
  };
}
