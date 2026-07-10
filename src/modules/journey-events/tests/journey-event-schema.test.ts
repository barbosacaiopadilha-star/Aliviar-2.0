import { describe, expect, it } from "vitest";
import {
  correctJourneyEventSchema,
  createJourneyEventSchema,
  journeyEventCategorySchema,
} from "@/modules/journey-events/schemas/journey-event";

describe("createJourneyEventSchema", () => {
  const validBase = {
    category: "CONTACT",
    title: "Primeiro contato realizado",
    occurred_at: "2026-07-10T14:00",
  };

  it("aceita evento mínimo válido", () => {
    const result = createJourneyEventSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejeita título vazio", () => {
    const result = createJourneyEventSchema.safeParse({ ...validBase, title: "  " });
    expect(result.success).toBe(false);
  });

  it("rejeita categoria inválida", () => {
    const result = createJourneyEventSchema.safeParse({ ...validBase, category: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejeita data ausente", () => {
    const result = createJourneyEventSchema.safeParse({
      category: "CONTACT",
      title: "Contato",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita data futura fora do limite", () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    const result = createJourneyEventSchema.safeParse({
      ...validBase,
      occurred_at: farFuture.toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("aceita evento com impacto", () => {
    const result = createJourneyEventSchema.safeParse({
      ...validBase,
      journey_impact: "Permite avançar para agendamento de consulta.",
    });
    expect(result.success).toBe(true);
  });

  it("aceita evento com próximo passo", () => {
    const result = createJourneyEventSchema.safeParse({
      ...validBase,
      next_step: "Confirmar disponibilidade do paciente.",
    });
    expect(result.success).toBe(true);
  });

  it("aceita evento destacado", () => {
    const result = createJourneyEventSchema.safeParse({
      ...validBase,
      is_highlighted: "on",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_highlighted).toBe(true);
    }
  });
});

describe("correctJourneyEventSchema", () => {
  it("aceita correção com referência ao original", () => {
    const result = correctJourneyEventSchema.safeParse({
      original_event_id: "550e8400-e29b-41d4-a716-446655440000",
      correction_reason: "Data informada estava incorreta",
      category: "CONTACT",
      title: "Primeiro contato realizado",
      occurred_at: "2026-07-10T14:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita correção sem motivo", () => {
    const result = correctJourneyEventSchema.safeParse({
      original_event_id: "550e8400-e29b-41d4-a716-446655440000",
      correction_reason: "",
      category: "CONTACT",
      title: "Contato",
      occurred_at: "2026-07-10T14:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("journeyEventCategorySchema", () => {
  it("aceita todas as categorias válidas", () => {
    const categories = [
      "JOURNEY", "CONTACT", "CONSULTATION", "EXAM",
      "DOCUMENT", "DECISION", "OPERATIONAL", "OBSERVATION",
    ];
    categories.forEach((cat) => {
      expect(journeyEventCategorySchema.safeParse(cat).success).toBe(true);
    });
  });
});
