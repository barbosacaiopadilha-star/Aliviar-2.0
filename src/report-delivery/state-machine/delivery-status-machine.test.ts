import { describe, expect, it } from "vitest";

import {
  assertDeliveryStatusTransition,
  canTransitionDeliveryStatus,
  isDeliveryAccessible,
  isDeliveryActive,
} from "./delivery-status-machine";

describe("delivery status machine", () => {
  it("permite publicar e arquivar entregas", () => {
    expect(canTransitionDeliveryStatus("PENDING", "PUBLISHED")).toBe(true);
    expect(canTransitionDeliveryStatus("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(canTransitionDeliveryStatus("PENDING", "ARCHIVED")).toBe(true);
  });

  it("bloqueia transições inválidas", () => {
    expect(assertDeliveryStatusTransition("PUBLISHED", "PENDING")).toMatch(/inválida/i);
    expect(assertDeliveryStatusTransition("ARCHIVED", "PUBLISHED")).toMatch(/inválida/i);
  });

  it("identifica entrega ativa e acessível", () => {
    expect(isDeliveryActive("PUBLISHED")).toBe(true);
    expect(isDeliveryAccessible("PUBLISHED")).toBe(true);
    expect(isDeliveryAccessible("PENDING")).toBe(false);
    expect(isDeliveryAccessible("ARCHIVED")).toBe(false);
  });
});
