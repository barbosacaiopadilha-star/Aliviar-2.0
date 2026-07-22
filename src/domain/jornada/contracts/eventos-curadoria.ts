/**
 * Contrato conceitual: o contexto Curadoria publica eventos.
 * Não controla o estado da Jornada — apenas notifica fatos ocorridos.
 */
export const EVENTOS_PUBLICADOS_PELA_CURADORIA = [
  "SESSAO_ABERTA",
  "ANALISE_INICIADA",
  "ENTREGA_PRODUZIDA",
] as const;

export type EventoPublicadoPelaCuradoriaTipo =
  (typeof EVENTOS_PUBLICADOS_PELA_CURADORIA)[number];

export interface EventoPublicadoPelaCuradoria {
  readonly origem: "CURADORIA";
  readonly pacienteId: string;
  readonly tipo: EventoPublicadoPelaCuradoriaTipo;
  readonly ocorridoEm: string;
  readonly descricao: string;
}
