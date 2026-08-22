import type { PipelineStage } from "./pipeline";

export const CRM_ROLES = ["administrador", "concierge", "curador_medico"] as const;
export type CrmRole = (typeof CRM_ROLES)[number];

export const CONTACT_SOURCES = [
  "site",
  "whatsapp",
  "indicacao",
  "telefone",
  "email",
  "presencial",
  "outro",
] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  telefone: "Telefone",
  email: "E-mail",
  presencial: "Presencial",
  outro: "Outro",
};

export const CONTACT_STATUSES = ["ativo", "arquivado"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONSENT_STATUSES = ["pendente", "concedido", "negado", "revogado"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

// Renomeado de CASE_STATUSES (auditoria F-10): colidia com o CASE_STATUSES
// canônico de modules/cases — mesmo nome, vocabulários diferentes. O tipo já
// se chamava CrmCaseStatus; a constante acompanha.
export const CRM_CASE_STATUSES = ["aberto", "fechado", "arquivado"] as const;
export type CrmCaseStatus = (typeof CRM_CASE_STATUSES)[number];

export const PRIORITIES = ["baixa", "media", "alta", "urgente"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const INTERACTION_TYPES = [
  "ligacao",
  "mensagem",
  "whatsapp",
  "email",
  "reuniao",
  "anotacao_interna",
  "atualizacao_status",
  "tentativa_contato",
  "documento_enviado",
  "documento_recebido",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  ligacao: "Ligação",
  mensagem: "Mensagem",
  whatsapp: "WhatsApp",
  email: "E-mail",
  reuniao: "Reunião",
  anotacao_interna: "Anotação interna",
  atualizacao_status: "Atualização de status",
  tentativa_contato: "Tentativa de contato",
  documento_enviado: "Documento enviado",
  documento_recebido: "Documento recebido",
};

export const INTERACTION_CHANNELS = [
  "site",
  "whatsapp",
  "telefone",
  "email",
  "presencial",
  "videochamada",
  "interno",
  "outro",
] as const;
export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];

export const INTERACTION_DIRECTIONS = ["entrada", "saida", "interno"] as const;
export type InteractionDirection = (typeof INTERACTION_DIRECTIONS)[number];

export const INTERACTION_VISIBILITIES = ["operacional", "restrita", "administrativa"] as const;
export type InteractionVisibility = (typeof INTERACTION_VISIBILITIES)[number];

export const TASK_STATUSES = ["pendente", "em_andamento", "concluida", "cancelada"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Auditoria visual de 22/08: a ficha única mostrava o valor cru do banco
// ("pendente", "concluida"). O mapa segue o padrão dos irmãos acima.
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const TASK_TYPES = [
  "retorno",
  "confirmacao",
  "cobranca",
  "agendamento",
  "envio_documento",
  "acompanhamento",
  "tarefa_interna",
  "outro",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const APPOINTMENT_TYPES = [
  "retorno_concierge",
  "consulta_inicial",
  "reuniao_interna",
  "acompanhamento",
  "outro",
] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_STATUSES = ["agendado", "confirmado", "concluido", "cancelado", "nao_compareceu"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type CrmActionResult = { success: true } | { success: false; error: string };

export type CrmContactSummary = {
  id: string;
  fullName: string;
  preferredName: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  email: string | null;
  emailNormalized: string | null;
  city: string | null;
  state: string | null;
  source: ContactSource;
  sourceDetail: string | null;
  status: ContactStatus;
  pipelineStage: PipelineStage;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  lastInteractionAt: string | null;
  nextActionAt: string | null;
  archivedAt: string | null;
  consentStatus: ConsentStatus;
  consentRecordedAt: string | null;
  activeCaseId: string | null;
  activeCaseTitle: string | null;
  /** Paciente originado deste lead — o vínculo canônico contato→Case (B3). */
  patientProfileId: string | null;
};

export type CrmContactDetail = CrmContactSummary & {
  initialReason: string | null;
  preferredChannel: InteractionChannel | null;
};

export type CrmCaseSummary = {
  id: string;
  contactId: string;
  title: string;
  summary: string | null;
  status: CrmCaseStatus;
  pipelineStage: PipelineStage;
  responsibleConciergeId: string | null;
  responsibleConciergeName: string | null;
  responsibleCuratorId: string | null;
  responsibleCuratorName: string | null;
  priority: Priority;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmInteraction = {
  id: string;
  contactId: string;
  caseId: string | null;
  type: InteractionType;
  channel: InteractionChannel;
  direction: InteractionDirection;
  subject: string | null;
  content: string;
  occurredAt: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  externalReference: string | null;
  visibility: InteractionVisibility;
};

export type CrmTaskSummary = {
  id: string;
  contactId: string;
  contactName: string;
  caseId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  assignedTo: string;
  assignedToName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmAppointmentSummary = {
  id: string;
  contactId: string;
  contactName: string;
  caseId: string | null;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  assignedTo: string;
  assignedToName: string | null;
  locationOrLink: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmTimelineEntry =
  | { kind: "interaction"; at: string; interaction: CrmInteraction }
  | { kind: "stage_change"; at: string; fromStage: PipelineStage | null; toStage: PipelineStage; actorName: string | null }
  | { kind: "task_completed"; at: string; task: CrmTaskSummary }
  | { kind: "appointment"; at: string; appointment: CrmAppointmentSummary }
  | { kind: "audit"; at: string; action: string; summary: string; actorName: string | null };

export type CrmDashboardData = {
  newContacts: CrmContactSummary[];
  myQueue: CrmContactSummary[];
  dueToday: CrmTaskSummary[];
  overdueTasks: CrmTaskSummary[];
  overdueContacts: CrmContactSummary[];
  withoutNextAction: CrmContactSummary[];
  upcomingAppointments: CrmAppointmentSummary[];
  metrics: {
    newContactsCount: number;
    inServiceCount: number;
    awaitingContractingCount: number;
    contractedCount: number;
    scheduledConsultationsCount: number;
    overdueCount: number;
  };
};

export type CrmAuditEntry = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  createdAt: string;
};
