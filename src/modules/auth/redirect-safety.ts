const DEFAULT_PATH = "/";

/**
 * Valida um valor de redirecionamento pós-login/callback (`next`) para
 * garantir que é sempre um caminho relativo do próprio site — nunca uma URL
 * absoluta (`https://evil.com`) nem protocol-relative (`//evil.com`,
 * `/\evil.com`). Mitigação de open redirect: qualquer consumidor do
 * parâmetro `next` (callback, futura página de login da TASK-004B) deve
 * passar o valor por aqui antes de usá-lo em um redirect.
 */
export function getSafeRedirectPath(next: string | null | undefined): string {
  if (!next) {
    return DEFAULT_PATH;
  }

  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_PATH;
  }

  return next;
}
