import type { RecordAuditEventInput } from "@/observability-flow/contracts/audit-event";

export interface AuditTrailPort {
  record(input: RecordAuditEventInput): Promise<void>;
}
