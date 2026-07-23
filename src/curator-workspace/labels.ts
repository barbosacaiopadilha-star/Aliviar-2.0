import type { OperationalStage } from "@/kernel/jornada/operational-stage";
import type { ReportStatus } from "@/curation-report";
import { isReportEditable } from "@/curation-report";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Em elaboração",
  UNDER_REVIEW: "Em revisão",
  APPROVED: "Aprovado",
  DELIVERED: "Entregue",
  ARCHIVED: "Arquivado",
};

export const OPERATIONAL_STAGE_LABELS: Record<OperationalStage, string> = {
  CADASTRO: "Cadastro",
  HISTORIA: "Compartilhando sua história",
  ACE: "Análise inicial",
  CURADORIA: "Curadoria",
  ENTREGA: "Entrega",
  ESCOLHA: "Escolha",
  ACOMPANHAMENTO: "Acompanhamento",
  RELACIONAMENTO: "Relacionamento",
  ENCERRADO: "Jornada encerrada",
};

export function reportStatusLabel(status: ReportStatus): string {
  return REPORT_STATUS_LABELS[status];
}

export function isWorkspaceEditable(status: ReportStatus): boolean {
  return isReportEditable(status);
}
