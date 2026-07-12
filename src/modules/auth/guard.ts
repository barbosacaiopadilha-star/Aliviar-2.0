import { redirect } from "next/navigation";

import { getAuthState, type AuthState } from "./session";

/**
 * Checagem autoritativa de papel para uso em layouts/páginas server-side.
 * O middleware (ver src/middleware.ts) só faz a checagem otimista de "existe
 * sessão" — quem decide se o papel exigido bate é sempre aqui, porque as
 * rotas /admin, /profissional, /paciente (TASK-005A; antes eram route groups
 * invisíveis na URL) não podem ser diferenciadas de forma confiável só pelo
 * middleware olhando o pathname.
 *
 * Sem sessão → /login (usuário precisa se autenticar). Com sessão mas sem o
 * papel exigido → /acesso-negado (TASK-005A) — distinto de /login porque a
 * pessoa já está autenticada; mandá-la de volta ao formulário de login seria
 * confuso.
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
    redirect("/acesso-negado");
  }

  return state;
}
