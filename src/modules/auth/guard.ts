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

/**
 * Variante de requireRole para páginas que MAIS DE UM papel pode ver.
 *
 * Nasceu na certificação RC-1: o Administrador tem acesso global por
 * definição (Correção do Administrador §1 — "visualizar toda a operação"),
 * a RLS e as operações de servidor já o aceitam, mas o guarda de navegação
 * de `/atendimento` exigia estritamente `atendente` e o mandava para
 * /acesso-negado. Guarda de navegação não pode ser mais rígido que o
 * domínio que ele apresenta.
 */
export async function requireAnyRole(roleSlugs: string[]): Promise<AuthState> {
  const state = await getAuthState();

  if (!state) {
    redirect("/login");
  }

  if (!roleSlugs.some((slug) => state.roles.includes(slug))) {
    redirect("/acesso-negado");
  }

  return state;
}

/**
 * Checagem autoritativa de papel para uso dentro de Server Actions —
 * nunca redireciona (uma Server Action pode ser chamada fora de uma
 * navegação de página, então `redirect()` não é o comportamento certo
 * aqui). Lança erro simples; quem chama decide como transformar isso num
 * ActionResult de erro. RLS continua sendo a fronteira real de dado — isto
 * aqui só evita que a ação sequer tente a operação sem o papel exigido.
 */
export async function requireRoleForAction(roleSlug: string): Promise<AuthState> {
  const state = await getAuthState();

  if (!state || !state.roles.includes(roleSlug)) {
    throw new Error("Não autorizado.");
  }

  return state;
}

/**
 * Mesma checagem de requireRoleForAction, mas aceita qualquer um dos papéis
 * informados (papéis são cumulativos, não hierárquicos — ADR-006). Usada
 * por ações que mais de um papel pode executar (ex.: Administrador OU
 * Curador Médico podem criar um Caso — ÉPICO 1/SPRINT 2).
 */
export async function requireAnyRoleForAction(roleSlugs: string[]): Promise<AuthState> {
  const state = await getAuthState();

  if (!state || !roleSlugs.some((slug) => state.roles.includes(slug))) {
    throw new Error("Não autorizado.");
  }

  return state;
}
