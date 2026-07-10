import { describe, expect, it } from "vitest";
import {
  createPatientWithJourneySchema,
  patientFieldsSchema,
  journeyFieldsSchema,
} from "@/lib/validations/patient-journey";

describe("patientFieldsSchema", () => {
  it("aceita paciente mínimo válido", () => {
    const result = patientFieldsSchema.safeParse({ full_name: "Ana Silva" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = patientFieldsSchema.safeParse({ full_name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    const result = patientFieldsSchema.safeParse({
      full_name: "Ana Silva",
      email: "email-invalido",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita CPF com quantidade incorreta de dígitos", () => {
    const result = patientFieldsSchema.safeParse({
      full_name: "Ana Silva",
      cpf: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita nascimento futuro", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = patientFieldsSchema.safeParse({
      full_name: "Ana Silva",
      birth_date: future.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it("normaliza CPF para somente números", () => {
    const result = patientFieldsSchema.safeParse({
      full_name: "Ana Silva",
      cpf: "123.456.789-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cpf).toBe("12345678901");
    }
  });
});

describe("journeyFieldsSchema", () => {
  it("aceita Jornada válida", () => {
    const result = journeyFieldsSchema.safeParse({
      title: "Acompanhamento inicial",
      manager_id: "550e8400-e29b-41d4-a716-446655440000",
      priority: "NORMAL",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita Jornada sem Gestor", () => {
    const result = journeyFieldsSchema.safeParse({
      title: "Acompanhamento inicial",
      manager_id: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("createPatientWithJourneySchema", () => {
  it("aceita cadastro combinado válido", () => {
    const result = createPatientWithJourneySchema.safeParse({
      full_name: "Maria Souza",
      title: "Primeira Jornada",
      manager_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });
});
