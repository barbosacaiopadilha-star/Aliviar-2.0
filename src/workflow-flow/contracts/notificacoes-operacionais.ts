import type { AtorWorkflow } from "@/workflow-flow/contracts/workflow-engine";

/**
 * Contratos de notificação operacional.
 * Sem provider — apenas definição do que seria notificado.
 */
export type TipoNotificacaoOperacional =
  | "PACIENTE_AGUARDANDO"
  | "CURADOR_PRECISA_AGIR"
  | "DOCUMENTO_RECEBIDO"
  | "ENTREGA_PRONTA";

export interface NotificacaoOperacionalContrato {
  tipo: TipoNotificacaoOperacional;
  jornada_id: string;
  destinatario: AtorWorkflow | "PACIENTE";
  titulo: string;
  mensagem: string;
  referencia_em: string;
  metadados: Record<string, string>;
}

export interface NotificacoesPendentesView {
  notificacoes: NotificacaoOperacionalContrato[];
}
