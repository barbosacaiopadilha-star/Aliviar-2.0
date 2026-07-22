import type { DomainEvent } from "./domain-event";

export interface JornadaConcluida extends DomainEvent {
  readonly type: "JornadaConcluida";
  readonly pacienteId: string;
  readonly totalEtapasConcluidas: number;
}

export function criarJornadaConcluida(params: {
  aggregateId: string;
  pacienteId: string;
  totalEtapasConcluidas: number;
  occurredAt: string;
}): JornadaConcluida {
  return {
    type: "JornadaConcluida",
    aggregateId: params.aggregateId,
    pacienteId: params.pacienteId,
    totalEtapasConcluidas: params.totalEtapasConcluidas,
    occurredAt: params.occurredAt,
  };
}
