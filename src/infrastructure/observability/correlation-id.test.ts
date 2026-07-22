import { describe, expect, it } from "vitest";
import {
  createCorrelationId,
  maskEntityId,
  resolveCorrelationId,
} from "@/infrastructure/observability/correlation-id";

describe("correlationId", () => {
  it("gera UUID válido", () => {
    const id = createCorrelationId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("reutiliza correlationId válido", () => {
    const incoming = createCorrelationId();
    expect(resolveCorrelationId(incoming)).toBe(incoming);
  });

  it("gera novo id quando ausente ou inválido", () => {
    expect(resolveCorrelationId(null)).toMatch(/-/);
    expect(resolveCorrelationId("   ")).toMatch(/-/);
    expect(resolveCorrelationId("x".repeat(200))).toMatch(/-/);
  });

  it("mascara ids sem expor valor completo", () => {
    const masked = maskEntityId("2406a266-c27d-41a5-aa9a-ff991777f277");
    expect(masked).toBe("2406…f277");
    expect(masked).not.toContain("ff991777f277".slice(0, 8));
  });
});
