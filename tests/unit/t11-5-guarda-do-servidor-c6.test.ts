/**
 * T-11-5 · C6 — A GUARDA DO SERVIDOR NÃO SAIU.
 *
 * O Bloco 11 passou a exigir a justificativa da eliminação **também no
 * cliente** (C6). O risco imediato de toda correção desse tipo é a próxima
 * pessoa concluir que agora a tela cuida disso e a validação do servidor virou
 * redundância. Não virou: o cliente é conveniência, o servidor é a regra.
 *
 * Este teste burla o cliente de propósito — chama a action direto, como faria
 * um `fetch` montado à mão — e exige que ela continue recusando. É o par do
 * T-11-4: um prova que a tela avisa antes; este prova que avisar antes não
 * substitui recusar depois.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAnyRoleForActionMock, declareAreaCompatibilityMock } = vi.hoisted(() => ({
  requireAnyRoleForActionMock: vi.fn(),
  declareAreaCompatibilityMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({})),
}));

vi.mock("@/modules/auth/guard", () => ({
  requireAnyRoleForAction: requireAnyRoleForActionMock,
}));

vi.mock("@/modules/curadoria/area-repository", () => ({
  declareAreaCompatibility: declareAreaCompatibilityMock,
}));

const CASE_ID = "c6000000-0000-4000-8000-000000000001";
const PROF_ID = "c6000000-0000-4000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  // Curador autenticado de verdade: o que vamos medir é a REGRA, não o portão.
  requireAnyRoleForActionMock.mockResolvedValue({
    user: { id: "c6000000-0000-4000-8000-000000000003" },
    roles: ["curador_medico"],
  });
  declareAreaCompatibilityMock.mockResolvedValue(undefined);
});

async function declarar(input: Record<string, unknown>) {
  const { declareAreaAction } = await import("@/modules/curadoria/cruzamento-actions");
  return declareAreaAction(input);
}

describe("T-11-5 · eliminar sem justificativa é recusado no servidor", () => {
  it("INCOMPATIVEL sem justificativa não escreve nada", async () => {
    const resultado = await declarar({
      caseId: CASE_ID,
      professionalProfileId: PROF_ID,
      compatibility: "INCOMPATIVEL",
    });

    expect(resultado.success, "o servidor aceitou uma eliminação sem motivo").toBe(false);
    expect(
      declareAreaCompatibilityMock,
      "a recusa foi só de mensagem: o writer foi chamado assim mesmo",
    ).not.toHaveBeenCalled();
  });

  it("justificativa só de espaços é a mesma coisa que nenhuma", async () => {
    const resultado = await declarar({
      caseId: CASE_ID,
      professionalProfileId: PROF_ID,
      compatibility: "INCOMPATIVEL",
      rationale: "     ",
    });

    expect(resultado.success).toBe(false);
    expect(declareAreaCompatibilityMock).not.toHaveBeenCalled();
  });

  it("compatibilidade parcial e informação insuficiente também exigem motivo", async () => {
    for (const compatibility of ["PARCIALMENTE_COMPATIVEL", "INFORMACAO_INSUFICIENTE"]) {
      const resultado = await declarar({
        caseId: CASE_ID,
        professionalProfileId: PROF_ID,
        compatibility,
      });
      expect(resultado.success, `${compatibility} passou sem motivo`).toBe(false);
    }
    expect(declareAreaCompatibilityMock).not.toHaveBeenCalled();
  });

  it("com o motivo escrito, a declaração passa — a exigência é do conteúdo", async () => {
    const resultado = await declarar({
      caseId: CASE_ID,
      professionalProfileId: PROF_ID,
      compatibility: "INCOMPATIVEL",
      rationale: "A área declarada não alcança o quadro deste caso.",
    });

    expect(resultado.success, JSON.stringify(resultado)).toBe(true);
    expect(declareAreaCompatibilityMock).toHaveBeenCalledTimes(1);
  });

  it("COMPATIVEL nunca exigiu motivo, e continua não exigindo", async () => {
    const resultado = await declarar({
      caseId: CASE_ID,
      professionalProfileId: PROF_ID,
      compatibility: "COMPATIVEL",
    });

    expect(resultado.success).toBe(true);
  });
});
