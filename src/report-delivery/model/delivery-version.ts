import type { DeliveryStatus } from "./delivery-status";

export interface DeliveryVersion {
  version: number;
  summary: string;
  status: DeliveryStatus;
  changedAt: string;
  changedBy: string;
}
