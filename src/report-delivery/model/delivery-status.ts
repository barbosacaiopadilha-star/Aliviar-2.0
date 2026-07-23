export const DELIVERY_STATUSES = ["PENDING", "PUBLISHED", "ARCHIVED"] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export function isDeliveryStatus(value: string): value is DeliveryStatus {
  return (DELIVERY_STATUSES as readonly string[]).includes(value);
}
