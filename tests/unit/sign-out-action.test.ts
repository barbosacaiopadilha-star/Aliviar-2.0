import { beforeEach, describe, expect, it, vi } from "vitest";

// signOutAction termina sempre em redirect() — que no Next lança. O mock
// lança um erro reconhecível para o teste afirmar PARA ONDE redirecionou.
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const signOutMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { signOut: signOutMock } })),
}));

import { signOutAction } from "@/modules/auth/actions";

async function redirectedTo(): Promise<string> {
  try {
    await signOutAction();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("REDIRECT:")) return message.slice("REDIRECT:".length);
    throw error;
  }
  throw new Error("signOutAction retornou sem redirecionar");
}

describe("signOutAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    signOutMock.mockReset();
  });

  it("logout bem-sucedido encerra a sessão e leva ao login", async () => {
    signOutMock.mockResolvedValue({ error: null });
    expect(await redirectedTo()).toBe("/login");
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("falha real de revogação leva ao login COM o erro visível", async () => {
    signOutMock.mockResolvedValue({ error: { message: "network failure revoking token" } });
    expect(await redirectedTo()).toBe("/login?error=logout");
  });

  // Sessão expirada não é falha: a pessoa queria estar deslogada e já está.
  // Mostrar "?error=logout" aqui assustaria exatamente quem clicou Sair numa
  // aba antiga.
  it("sessão expirada é tratada como logout normal", async () => {
    signOutMock.mockResolvedValue({ error: { message: "Auth session missing!" } });
    expect(await redirectedTo()).toBe("/login");
  });

  it("usuário já deslogado vai ao login sem erro", async () => {
    signOutMock.mockResolvedValue({ error: { message: "session_not_found: Session from session_id claim in JWT does not exist" } });
    expect(await redirectedTo()).toBe("/login");
  });
});
