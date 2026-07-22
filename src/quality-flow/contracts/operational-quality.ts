export type IncidentCategory =
  | "PLATAFORMA"
  | "PROCESSO"
  | "COMUNICACAO"
  | "DOCUMENTACAO"
  | "OPERACIONAL";

export type IncidentSeverity = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type IncidentStatus = "ABERTO" | "EM_ANDAMENTO" | "RESOLVIDO";

export interface PatientFeedbackView {
  id: string;
  jornada_id: string;
  satisfacao_geral: number;
  clareza_informacoes: number;
  facilidade_uso: number;
  comentarios: string | null;
  criado_em: string;
}

export interface CuratorFeedbackView {
  id: string;
  jornada_id: string;
  dificuldades: string | null;
  informacoes_ausentes: string | null;
  sugestoes: string | null;
  problemas_operacionais: string | null;
  criado_em: string;
}

export interface OperationalIncidentView {
  id: string;
  jornada_id: string;
  categoria: IncidentCategory;
  severidade: IncidentSeverity;
  descricao: string;
  status: IncidentStatus;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  criado_em: string;
  resolvido_em: string | null;
}

export interface OperationalIncidentEventView {
  id: string;
  incident_id: string;
  evento_tipo: "CRIADO" | "STATUS_ALTERADO" | "RESPONSAVEL_ATRIBUIDO" | "RESOLVIDO" | "NOTA";
  status: IncidentStatus | null;
  responsavel_id: string | null;
  descricao: string | null;
  ocorrido_em: string;
}

export interface QualityPanelView {
  incidentes_abertos: OperationalIncidentView[];
  incidentes_resolvidos: OperationalIncidentView[];
  feedback_paciente_recente: PatientFeedbackView[];
  feedback_curador_recente: CuratorFeedbackView[];
  principais_categorias: Array<{ categoria: IncidentCategory; total: number }>;
}

export interface QualityIndicatorsView {
  tempo_medio_resolucao_horas: number;
  incidentes_por_categoria: Array<{ categoria: IncidentCategory; total: number }>;
  satisfacao_media: number;
  feedback_pendente: number;
  amostras_feedback: number;
  amostras_incidentes: number;
  gerado_em: string;
}

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  PLATAFORMA: "Plataforma",
  PROCESSO: "Processo",
  COMUNICACAO: "Comunicação",
  DOCUMENTACAO: "Documentação",
  OPERACIONAL: "Operacional",
};
