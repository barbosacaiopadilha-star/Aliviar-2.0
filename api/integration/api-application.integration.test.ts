import { describe, expect, it } from "vitest";
import { ExecutarAnaliseInicial } from "@/application/analise/executar-analise-inicial";
import { AbrirSessaoDeCuradoria } from "@/application/curadoria/abrir-sessao-de-curadoria";
import { ProduzirEntregaAoPaciente } from "@/application/entrega/produzir-entrega-ao-paciente";
import { RegistrarCasoDeclarado } from "@/application/caso/registrar-caso-declarado";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";

const auth = {
  requireActiveStaff: async () => ({ userId: "staff-1" }),
};

describe("integração API → Application", () => {
  it("RegistrarCasoDeclarado delega ao repositório sem regra na API", async () => {
    const calls: string[] = [];
    const useCase = new RegistrarCasoDeclarado(auth, {
      registrarCasoDeclarado: async (input) => {
        calls.push(input.fullName);
        return { casoId: "c1", pacienteId: "p1", jornadaId: "j1" };
      },
    });

    const result = await useCase.execute({
      fullName: "João",
      journeyTitle: "Caso",
      managerId: "11111111-1111-1111-1111-111111111111",
    });

    expect(calls).toEqual(["João"]);
    expect(result.ok).toBe(true);
  });

  it("ExecutarAnaliseInicial propaga NotFoundError da application", async () => {
    const useCase = new ExecutarAnaliseInicial(auth, {
      executarAnaliseInicial: async () => {
        throw new NotFoundError("Jornada");
      },
    });

    const result = await useCase.execute({
      jornadaId: "missing",
      observacoes: "Contexto",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NOT_FOUND");
    }
  });

  it("AbrirSessaoDeCuradoria retorna output da application", async () => {
    const useCase = new AbrirSessaoDeCuradoria(auth, {
      abrirSessao: async () => ({
        sessaoId: "s1",
        jornadaId: "j1",
        curadorId: "staff-1",
        status: "ABERTA",
        abertaEm: "2026-07-22T00:00:00.000Z",
      }),
    });

    const result = await useCase.execute({ jornadaId: "j1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sessaoId).toBe("s1");
    }
  });

  it("ProduzirEntregaAoPaciente retorna output da application", async () => {
    const useCase = new ProduzirEntregaAoPaciente(auth, {
      produzirEntrega: async () => ({
        entregaId: "e1",
        jornadaId: "j1",
        formato: "RESUMO",
        conteudo: "Resumo",
        produzidaEm: "2026-07-22T00:00:00.000Z",
        produzidaPor: "staff-1",
      }),
    });

    const result = await useCase.execute({
      jornadaId: "j1",
      formato: "RESUMO",
      conteudo: "Resumo",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entregaId).toBe("e1");
    }
  });
});
