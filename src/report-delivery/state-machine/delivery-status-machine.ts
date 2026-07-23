import type { DeliveryStatus } from "../model/delivery-status";

const VALID_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  PENDING: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionDeliveryStatus(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function assertDeliveryStatusTransition(from: DeliveryStatus, to: DeliveryStatus): string | null {
  if (from === to) {
    return null;
  }

  if (!canTransitionDeliveryStatus(from, to)) {
    return `Transição inválida de ${from} para ${to}.`;
  }

  return null;
}

export function isDeliveryActive(status: DeliveryStatus): boolean {
  return status === "PUBLISHED";
}

export function isDeliveryAccessible(status: DeliveryStatus): boolean {
  return status === "PUBLISHED";
}
