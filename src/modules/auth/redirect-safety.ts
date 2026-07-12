const DEFAULT_PATH = "/";

/**
 * Valida um valor de redirecionamento pós-login/callback (`next`) para
 * garantir que é sempre um caminho relativo do próprio site — nunca uma URL
 * absoluta (`https://evil.com`) nem protocol-relative (`//evil.com`,
 * `/\evil.com`). Mitigação de open redirect: qualquer consumidor do
 * parâmetro `next` (callback, página de login) deve passar o valor por aqui
 * antes de usá-lo em um redirect.
 *
 * `fallback` é sempre um valor interno e seguro (nunca vindo do usuário) —
 * por padrão "/", mas o login usa a home do papel resolvido
 * (src/modules/auth/role-home.ts) para que `next` ausente ou inseguro caiam
 * no mesmo lugar, em vez de dois comportamentos diferentes.
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_PATH,
): string {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }

  return next;
}
