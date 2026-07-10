import { describe, expect, it } from "vitest";
import {
  createCommitmentSchema,
  commitmentStatusSchema,
  validateStatusTransition,
} from "@/modules/journey-commitments/schemas/commitment";

describe("createCommitmentSchema", () => {
  const validBase = {
    title: "Entrar em contato com o paciente",
    assigned_to: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("aceita compromisso mínimo válido", () => {
    const result = createCommitmentSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejeita título vazio", () => {
    const result = createCommitmentSchema.safeParse({ ...validBase, title: "  " });
    expect(result.success).toBe(false);
  });

  it("rejeita título muito curto", () => {
    const result = createCommitmentSchema.safeParse({ ...validBase, title: "Ver" });
    expect(result.success).toBe(false);
  });

  it("rejeita título muito longo", () => {
    const result = createCommitmentSchema.safeParse({
      ...validBase,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita responsável ausente", () => {
    const result = createCommitmentSchema.safeParse({
      title: "Entrar em contato com o paciente",
      assigned_to: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita prazo passado", () => {
    const result = createCommitmentSchema.safeParse({
      ...validBase,
      due_date: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("aceita prazo válido", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const result = createCommitmentSchema.safeParse({
      ...validBase,
      due_date: future.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(true);
  });
});

describe("commitmentStatusSchema", () => {
  it("rejeita status inválido", () => {
    const result = commitmentStatusSchema.safeParse("INVALID");
    expect(result.success).toBe(false);
  });
});

describe("validateStatusTransition", () => {
  it("permite PENDING → IN_PROGRESS", () => {
    expect(validateStatusTransition("PENDING", "IN_PROGRESS")).toBe(true);
  });

  it("permite IN_PROGRESS → COMPLETED", () => {
    expect(validateStatusTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("bloqueia COMPLETED → PENDING", () => {
    expect(validateStatusTransition("COMPLETED", "PENDING")).toBe(false);
  });

  it("bloqueia CANCELLED → qualquer status", () => {
    expect(validateStatusTransition("CANCELLED", "PENDING")).toBe(false);
    expect(validateStatusTransition("CANCELLED", "IN_PROGRESS")).toBe(false);
  });
});
