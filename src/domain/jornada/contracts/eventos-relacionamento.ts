/**
 * Contrato conceitual: o contexto Relacionamento publica eventos.
 * Não controla o estado da Jornada — apenas notifica fatos ocorridos.
 */
export const EVENTOS_PUBLICADOS_PELO_RELACIONAMENTO = [
  "VINCULO_ESTABELECIDO",
  "RETORNO_SINALIZADO",
  "NOVA_NECESSIDADE_INDICADA",
] as const;

export type EventoPublicadoPeloRelacionamentoTipo =
  (typeof EVENTOS_PUBLICADOS_PELO_RELACIONAMENTO)[number];

export interface EventoPublicadoPeloRelacionamento {
  readonly origem: "RELACIONAMENTO";
  readonly pacienteId: string;
  readonly tipo: EventoPublicadoPeloRelacionamentoTipo;
  readonly ocorridoEm: string;
  readonly descricao: string;
}
