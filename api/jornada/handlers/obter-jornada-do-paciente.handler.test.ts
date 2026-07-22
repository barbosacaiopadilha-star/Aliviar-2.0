import { describe, expect, it } from "vitest";
import type { Application } from "@/infrastructure/composition-root";
import { ObterJornadaDoPaciente } from "@/application/jornada/obter-jornada-do-paciente";
import { criarProjecaoInicial } from "@/infrastructure/jornada/jornada-view-projection";
import { handleObterJornadaDoPaciente } from "../handlers/obter-jornada-do-paciente.handler";

describe("handleObterJornadaDoPaciente", () => {
  const model = criarProjecaoInicial({
    jornadaId: "j-1",
    pacienteId: "p-1",
    iniciadaEm: "2026-01-01T00:00:00Z",
  });

  const app = {
    obterJornadaDoPaciente: new ObterJornadaDoPaciente({
      obterPorId: async (id) => (id === "j-1" ? model : null),
    }),
  } as Application;

  it("retorna JornadaDoPacienteView para jornada existente", async () => {
    const response = await handleObterJornadaDoPaciente(app, "j-1");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.jornada_id).toBe("j-1");
    expect(body.data.etapa_atual).toBe("HISTORIA");
    expect(body.data.estado_visivel).toBe("COMPARTILHANDO_HISTORIA");
  });

  it("retorna 404 para jornada inexistente", async () => {
    const response = await handleObterJornadaDoPaciente(app, "missing");
    expect(response.status).toBe(404);
  });

  it("retorna 400 para id vazio", async () => {
    const response = await handleObterJornadaDoPaciente(app, "");
    expect(response.status).toBe(400);
  });
});
