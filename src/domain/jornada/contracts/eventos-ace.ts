/**
 * Contrato conceitual: o contexto ACE publica eventos.
 * Não controla o estado da Jornada — apenas notifica fatos ocorridos.
 */
export const EVENTOS_PUBLICADOS_PELO_ACE = [
  "ACE_ATIVADO",
  "ORIENTACAO_ENVIADA",
  "LEMBRETE_DOCUMENTO_ENVIADO",
  "STATUS_COMUNICADO",
] as const;

export type EventoPublicadoPeloAceTipo = (typeof EVENTOS_PUBLICADOS_PELO_ACE)[number];

export interface EventoPublicadoPeloAce {
  readonly origem: "ACE";
  readonly pacienteId: string;
  readonly tipo: EventoPublicadoPeloAceTipo;
  readonly ocorridoEm: string;
  readonly descricao: string;
}
