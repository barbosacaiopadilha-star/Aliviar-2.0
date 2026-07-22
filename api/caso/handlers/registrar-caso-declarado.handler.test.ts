import { describe, expect, it, vi } from "vitest";
import { RegistrarCasoDeclarado } from "@/application/caso/registrar-caso-declarado";
import { handleRegistrarCasoDeclarado } from "./registrar-caso-declarado.handler";

describe("registrar-caso-declarado.handler", () => {
  it("rejeita request inválido sem chamar application", async () => {
    const execute = vi.fn();
    const app = {
      registrarCasoDeclarado: { execute },
    } as never;

    const response = await handleRegistrarCasoDeclarado(app, {});
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(execute).not.toHaveBeenCalled();
  });

  it("integra request válido com application e retorna 201", async () => {
    const useCase = new RegistrarCasoDeclarado(
      {
        requireActiveStaff: async () => ({ userId: "staff-1" }),
      },
      {
        registrarCasoDeclarado: async () => ({
          casoId: "caso-1",
          pacienteId: "paciente-1",
          jornadaId: "jornada-1",
        }),
      },
    );

    const app = { registrarCasoDeclarado: useCase } as never;

    const response = await handleRegistrarCasoDeclarado(app, {
      full_name: "Maria Silva",
      journey_title: "Dor lombar",
      manager_id: "11111111-1111-1111-1111-111111111111",
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      caso_id: "caso-1",
      paciente_id: "paciente-1",
      jornada_id: "jornada-1",
    });
  });

  it("propaga erro da application sem lógica adicional", async () => {
    const useCase = new RegistrarCasoDeclarado(
      {
        requireActiveStaff: async () => {
          throw new Error("unauthorized");
        },
      },
      {
        registrarCasoDeclarado: async () => ({
          casoId: "caso-1",
          pacienteId: "paciente-1",
          jornadaId: "jornada-1",
        }),
      },
    );

    const app = { registrarCasoDeclarado: useCase } as never;

    const response = await handleRegistrarCasoDeclarado(app, {
      full_name: "Maria Silva",
      journey_title: "Dor lombar",
      manager_id: "11111111-1111-1111-1111-111111111111",
    });

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.domainCode).toBe("UNAUTHORIZED");
  });
});
