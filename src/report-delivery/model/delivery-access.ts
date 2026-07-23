export const DELIVERY_ACCESS_TYPES = ["FIRST_VIEW", "READ_CONFIRMATION", "REOPEN"] as const;

export type DeliveryAccessType = (typeof DELIVERY_ACCESS_TYPES)[number];

export interface DeliveryAccess {
  id: string;
  deliveryId: string;
  accessType: DeliveryAccessType;
  actorId: string;
  accessedAt: string;
}
