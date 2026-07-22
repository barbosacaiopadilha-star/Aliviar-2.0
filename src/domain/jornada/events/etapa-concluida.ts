import type { DomainEvent } from "./domain-event";
import type { EtapaDaJornadaCodigo } from "../value-objects/etapa-da-jornada";
import type { ResponsavelDaJornadaCodigo } from "../value-objects/responsavel-da-jornada";

export interface EtapaConcluida extends DomainEvent {
  readonly type: "EtapaConcluida";
  readonly etapa: EtapaDaJornadaCodigo;
  readonly proximaEtapa: EtapaDaJornadaCodigo | null;
  readonly responsavel: ResponsavelDaJornadaCodigo;
}

export function criarEtapaConcluida(params: {
  aggregateId: string;
  etapa: EtapaDaJornadaCodigo;
  proximaEtapa: EtapaDaJornadaCodigo | null;
  responsavel: ResponsavelDaJornadaCodigo;
  occurredAt: string;
}): EtapaConcluida {
  return {
    type: "EtapaConcluida",
    aggregateId: params.aggregateId,
    etapa: params.etapa,
    proximaEtapa: params.proximaEtapa,
    responsavel: params.responsavel,
    occurredAt: params.occurredAt,
  };
}
