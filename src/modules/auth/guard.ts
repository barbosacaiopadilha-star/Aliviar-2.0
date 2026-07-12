import { redirect } from "next/navigation";

import { getAuthState, type AuthState } from "./session";

/**
 * Checagem autoritativa de papel para uso em layouts/páginas server-side.
 * O middleware (ver middleware.ts na raiz) só faz a checagem otimista de
 * "existe sessão" — quem decide se o papel exigido bate é sempre aqui,
 * porque route groups como (admin)/(profissional)/(paciente) não aparecem
 * na URL e por isso não dá pra decidir isso de forma confiável só olhando
 * o pathname no middleware.
 *
 * Nunca confiar em RLS sozinho para "autorização de UI" nem confiar só
 * nesta função para segurança de dados: RLS (docs/ENGINEERING_PLAN.md,
 * seção 8) continua sendo a fronteira real — isto aqui só decide
 * redirecionamento de navegação.
 */
export async function requireRole(roleSlug: string): Promise<AuthState> {
  const state = await getAuthState();

  if (!state) {
    redirect("/login");
  }

  if (!state.roles.includes(roleSlug)) {
    redirect("/login");
  }

  return state;
}
