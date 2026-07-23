import type { ReportStatus } from "../model/report-status";

const VALID_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  DRAFT: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["DRAFT", "APPROVED"],
  APPROVED: ["DELIVERED"],
  DELIVERED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionReportStatus(from: ReportStatus, to: ReportStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function assertReportStatusTransition(from: ReportStatus, to: ReportStatus): string | null {
  if (from === to) {
    return null;
  }

  if (!canTransitionReportStatus(from, to)) {
    return `Transição inválida de ${from} para ${to}.`;
  }

  return null;
}

export function isReportEditable(status: ReportStatus): boolean {
  return status === "DRAFT" || status === "UNDER_REVIEW";
}
