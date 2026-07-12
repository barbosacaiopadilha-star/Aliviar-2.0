// Tipos do módulo cases (ÉPICO 1/SPRINT 2) — ponte operacional entre uma
// História enviada e a operação de curadoria (ADR-019). Nunca modela
// artefatos do ACE (P001-P010) — isso é escopo de uma sprint futura.

export const CASE_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "WAITING_FOR_INFORMATION",
  "READY_FOR_CURATION",
  "IN_CURATION",
  "HUMAN_REVIEW",
  "DELIVERED",
  "CLOSED",
  "CANCELLED",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  NEW: "Novo",
  IN_REVIEW: "Em revisão",
  WAITING_FOR_INFORMATION: "Aguardando informação",
  READY_FOR_CURATION: "Pronto para curadoria",
  IN_CURATION: "Em curadoria",
  HUMAN_REVIEW: "Revisão humana",
  DELIVERED: "Entregue",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
};

export const TERMINAL_CASE_STATUSES: readonly CaseStatus[] = ["CLOSED", "CANCELLED"];

export type CaseSummary = {
  id: string;
  patientProfileId: string;
  patientName: string;
  sourceStoryId: string;
  status: CaseStatus;
  assignedCuratorId: string | null;
  assignedCuratorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CaseDetail = CaseSummary & {
  currentStage: string | null;
  methodVersion: string | null;
  createdBy: string;
  startedAt: string | null;
  closedAt: string | null;
};

// Histórico append-only (ajuste pós-Sprint 2) — nunca editado/apagado, cada
// nota preserva autor, timestamp e conteúdo.
export type CaseNote = {
  id: number;
  caseId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type CaseEventType = "created" | "status_changed" | "curator_assigned";

export type CaseEvent = {
  id: number;
  caseId: string;
  eventType: CaseEventType;
  actorId: string | null;
  actorName: string | null;
  fromValue: string | null;
  toValue: string | null;
  // Rótulos já resolvidos para exibição — status traduzido para
  // status_changed, nome de pessoa para curator_assigned. Resolvidos no
  // repositório (nunca no componente) para nunca depender de uma segunda
  // consulta na UI.
  fromLabel: string | null;
  toLabel: string | null;
  reason: string | null;
  createdAt: string;
};

export type PatientCaseOverview = {
  caseId: string;
  statusLabel: string;
  updatedAt: string;
};

export type CaseActionResult = { success: true } | { success: false; error: string };
