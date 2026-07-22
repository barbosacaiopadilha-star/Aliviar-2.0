import { describe, expect, it } from "vitest";
import {
  toRegistrarCasoDeclaradoCommand,
  toRegistrarCasoDeclaradoResponse,
} from "./registrar-caso-declarado.mapper";

describe("registrar-caso-declarado.mapper", () => {
  it("mapeia request para command sem lógica adicional", () => {
    const command = toRegistrarCasoDeclaradoCommand({
      full_name: "Maria Silva",
      journey_title: "Dor lombar",
      manager_id: "11111111-1111-1111-1111-111111111111",
      priority: "HIGH",
    });

    expect(command).toEqual({
      fullName: "Maria Silva",
      preferredName: null,
      birthDate: null,
      cpf: null,
      phone: null,
      email: null,
      city: null,
      state: null,
      healthPlan: null,
      journeyTitle: "Dor lombar",
      journeyObjective: null,
      managerId: "11111111-1111-1111-1111-111111111111",
      priority: "HIGH",
      openedAt: null,
    });
  });

  it("mapeia output da application para response DTO", () => {
    const response = toRegistrarCasoDeclaradoResponse({
      casoId: "caso-1",
      pacienteId: "paciente-1",
      jornadaId: "jornada-1",
    });

    expect(response).toEqual({
      caso_id: "caso-1",
      paciente_id: "paciente-1",
      jornada_id: "jornada-1",
    });
  });
});
