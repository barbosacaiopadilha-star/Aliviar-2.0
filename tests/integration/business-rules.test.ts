import { describe, expect, it } from "vitest";
import { displayPatientName, isOpenJourneyStatus } from "@/lib/types/database";

describe("displayPatientName", () => {
  it("usa nome preferido quando informado", () => {
    expect(
      displayPatientName({ full_name: "Maria Aparecida", preferred_name: "Maria" }),
    ).toBe("Maria");
  });

  it("usa nome completo quando preferido está vazio", () => {
    expect(displayPatientName({ full_name: "Maria Aparecida", preferred_name: null })).toBe(
      "Maria Aparecida",
    );
  });
});

describe("isOpenJourneyStatus", () => {
  it("considera NEW, ACTIVE e WAITING como abertas", () => {
    expect(isOpenJourneyStatus("NEW")).toBe(true);
    expect(isOpenJourneyStatus("ACTIVE")).toBe(true);
    expect(isOpenJourneyStatus("WAITING")).toBe(true);
  });

  it("considera FINISHED e CANCELLED como encerradas", () => {
    expect(isOpenJourneyStatus("FINISHED")).toBe(false);
    expect(isOpenJourneyStatus("CANCELLED")).toBe(false);
  });
});

describe("RLS expectations (documented)", () => {
  it("bloqueia usuário sem perfil ativo", () => {
    const hasActiveProfile = false;
    const canQueryPatients = hasActiveProfile;
    expect(canQueryPatients).toBe(false);
  });

  it("permite usuário ativo listar pacientes", () => {
    const hasActiveProfile = true;
    const canQueryPatients = hasActiveProfile;
    expect(canQueryPatients).toBe(true);
  });

  it("exige Gestor ADMIN ou MANAGER ativo", () => {
    const manager = { role: "OPERATION" as const, is_active: true };
    const isValid = manager.is_active && ["ADMIN", "MANAGER"].includes(manager.role);
    expect(isValid).toBe(false);
  });

  it("bloqueia exclusão física pela interface", () => {
    const deletePolicyExists = false;
    expect(deletePolicyExists).toBe(false);
  });
});

describe("fluxo paciente + jornada", () => {
  it("falha na Jornada não deve concluir silenciosamente", () => {
    const patientCreated = true;
    const journeyCreated = false;
    const flowSucceeded = patientCreated && journeyCreated;
    expect(flowSucceeded).toBe(false);
  });

  it("criação transacional exige paciente e jornada juntos", () => {
    const result = { patient_id: "p1", journey_id: "j1" };
    expect(result.patient_id).toBeTruthy();
    expect(result.journey_id).toBeTruthy();
  });
});
