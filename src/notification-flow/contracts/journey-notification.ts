export type JourneyNotificationType =
  | "DOCUMENTOS_RECEBIDOS"
  | "DOCUMENTOS_PENDENTES"
  | "CURADORIA_INICIADA"
  | "CURADORIA_CONCLUIDA"
  | "ENTREGA_DISPONIVEL"
  | "ESCOLHA_REGISTRADA"
  | "ACOMPANHAMENTO_INICIADO";

export type JourneyNotificationPriority = "BAIXA" | "NORMAL" | "ALTA";

export type JourneyNotificationOrigin =
  | "JORNADA"
  | "DOCUMENTO"
  | "ENTREGA"
  | "ESCOLHA"
  | "ACOMPANHAMENTO";

export type JourneyNotificationReferenceType =
  | "ETAPA"
  | "DOCUMENTO"
  | "ENTREGA"
  | "ESCOLHA"
  | "ACOMPANHAMENTO";

export interface JourneyNotificationView {
  id: string;
  jornada_id: string;
  tipo: JourneyNotificationType;
  titulo: string;
  mensagem: string;
  prioridade: JourneyNotificationPriority;
  data: string;
  lida: boolean;
  origem: JourneyNotificationOrigin;
  referencia_tipo: JourneyNotificationReferenceType | null;
  referencia_id: string | null;
}

export interface JourneyNotificationDraft {
  tipo: JourneyNotificationType;
  titulo: string;
  mensagem: string;
  prioridade: JourneyNotificationPriority;
  origem: JourneyNotificationOrigin;
  referencia_tipo: JourneyNotificationReferenceType | null;
  referencia_id: string | null;
  source_event_key: string;
  data: string;
}

export interface NotificationPreferencesView {
  receber_email: boolean;
  receber_whatsapp: boolean;
  somente_plataforma: boolean;
  atualizado_em: string;
}

export interface NotificationListFilter {
  tipo?: JourneyNotificationType;
  lida?: boolean;
  q?: string;
}

export interface NotificationTimelineItemView {
  id: string;
  tipo: "NOTIFICACAO";
  titulo: string;
  descricao: string;
  ocorrido_em: string;
  etapa: string | null;
  visibilidade: "PUBLICO";
  notificacao_id: string;
  referencia_tipo: JourneyNotificationReferenceType | null;
  referencia_id: string | null;
  lida: boolean;
}
