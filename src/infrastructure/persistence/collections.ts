export const DOMAIN_COLLECTIONS = {
  CASES: "cases",
  CASE_EVENTS: "case_events",
  JOURNEY_KERNEL: "journey_kernel",
  JOURNEY_TRANSITIONS: "journey_transitions",
  HANDOFFS: "handoffs",
  MEMORY_TIMELINE: "memory_timeline",
  MEMORY_NOTES: "memory_notes",
  MEMORY_ATTACHMENTS: "memory_attachments",
  CURATION_REPORTS: "curation_reports",
  CURATION_REPORT_VERSIONS: "curation_report_versions",
  CURATION_PROCESSES: "curation_processes",
  CURATION_PROCESS_VERSIONS: "curation_process_versions",
  CURATION_RESEARCH: "curation_research",
  REPORT_DELIVERIES: "report_deliveries",
  REPORT_DELIVERY_VERSIONS: "report_delivery_versions",
  REPORT_DELIVERY_ACCESS: "report_delivery_access",
} as const;

export type DomainCollection = (typeof DOMAIN_COLLECTIONS)[keyof typeof DOMAIN_COLLECTIONS];
