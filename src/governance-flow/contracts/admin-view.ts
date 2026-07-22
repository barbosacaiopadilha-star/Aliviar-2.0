import type { OperationalAuditEvent } from "@/observability-flow/contracts/audit-event";

export interface AuditSearchFilters {
  patient_id?: string;
  jornada_id?: string;
  curator_id?: string;
  event_type?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface AuditSearchResult {
  items: OperationalAuditEvent[];
  total: number;
}

export interface AdminUserView {
  id: string;
  full_name: string;
  role: string;
  governance_role: string;
  is_active: boolean;
  updated_at: string;
}

export interface UpdateAdminUserInput {
  is_active?: boolean;
  role?: string;
}
