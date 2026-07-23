import type { DeliveryStatus } from "./delivery-status";

export const DELIVERY_AUDIT_ACTIONS = [
  "DELIVERY_CREATED",
  "DELIVERY_PUBLISHED",
  "FIRST_VIEW_REGISTERED",
  "READ_CONFIRMATION_REGISTERED",
  "DELIVERY_REOPENED",
  "DELIVERY_ARCHIVED",
] as const;

export type DeliveryAuditAction = (typeof DELIVERY_AUDIT_ACTIONS)[number];

export interface DeliveryAuditEntry {
  id: string;
  action: DeliveryAuditAction;
  actorId: string;
  occurredAt: string;
  details: string;
  fromStatus: DeliveryStatus | null;
  toStatus: DeliveryStatus;
  version: number;
}
