/**
 * Contrato conceitual: o contexto Paciente publica eventos.
 * Não controla o estado da Jornada — apenas notifica fatos ocorridos.
 */
export const EVENTOS_PUBLICADOS_PELO_PACIENTE = [
  "CONTATO_INICIADO",
  "CADASTRO_CONFIRMADO",
  "HISTORIA_COMPARTILHADA",
  "ESCOLHA_REGISTRADA",
  "ACOMPANHAMENTO_SINALIZADO",
] as const;

export type EventoPublicadoPeloPacienteTipo =
  (typeof EVENTOS_PUBLICADOS_PELO_PACIENTE)[number];

export interface EventoPublicadoPeloPaciente {
  readonly origem: "PACIENTE";
  readonly pacienteId: string;
  readonly tipo: EventoPublicadoPeloPacienteTipo;
  readonly ocorridoEm: string;
  readonly descricao: string;
}
