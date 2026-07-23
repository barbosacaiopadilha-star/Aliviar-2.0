export const REPORT_STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "DELIVERED",
  "ARCHIVED",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportStatus(value: string): value is ReportStatus {
  return (REPORT_STATUSES as readonly string[]).includes(value);
}
