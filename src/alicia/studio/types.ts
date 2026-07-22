export type StudioCandidateStatus =
  | "novo"
  | "triagem"
  | "coleta"
  | "verificacao"
  | "revisao"
  | "publicado"
  | "arquivado";

export type ChecklistItemState = "pendente" | "em_andamento" | "concluido" | "bloqueado";

export type OperationalLevel = "A" | "B";

export type StudioSource = {
  id: string;
  name: string;
  type: string;
  url?: string;
  consultedAt: string;
  responsible: string;
};

export type StudioHistoryAction =
  | "caso_criado"
  | "status_alterado"
  | "checklist_atualizado"
  | "fonte_adicionada"
  | "fonte_editada"
  | "fonte_removida"
  | "nivel_atribuido"
  | "pendencia_registrada";

export type StudioHistoryEntry = {
  id: string;
  at: string;
  actor: string;
  action: StudioHistoryAction;
  detail: string;
};

export type StudioChecklistItem = {
  id: string;
  section: string;
  label: string;
  state: ChecklistItemState;
};

export type StudioCandidate = {
  id: string;
  caseId: string;
  name: string;
  crm: string;
  rqe: string;
  city: string;
  specialty: string;
  status: StudioCandidateStatus;
  nivel?: OperationalLevel;
  checklist: StudioChecklistItem[];
  sources: StudioSource[];
  pendencies: string[];
  history: StudioHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
  publishedAt?: string;
};

export type StudioDashboardMetrics = {
  backlog: number;
  nivelA: number;
  nivelB: number;
  pendencies: number;
  averageDaysToPublish: number | null;
  byStatus: Record<StudioCandidateStatus, number>;
};

export type StudioState = {
  candidates: StudioCandidate[];
  defaultActor: string;
};

export const STUDIO_STATUSES: StudioCandidateStatus[] = [
  "novo",
  "triagem",
  "coleta",
  "verificacao",
  "revisao",
  "publicado",
  "arquivado",
];

export const STUDIO_STATUS_LABELS: Record<StudioCandidateStatus, string> = {
  novo: "Novo",
  triagem: "Triagem",
  coleta: "Coleta",
  verificacao: "Verificação",
  revisao: "Revisão",
  publicado: "Publicado",
  arquivado: "Arquivado",
};
