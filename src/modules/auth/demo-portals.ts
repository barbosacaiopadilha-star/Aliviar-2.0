// Portais de demonstração (MISSÕES 100–206): `/portal-curador` e
// `/portal-paciente` rodam sobre dados fictícios, sem banco e sem
// autenticação.
//
// Em produção eles ficam indisponíveis. O motivo não é segurança de dado —
// nada ali é real — é que a Landing publicada leva visitantes de verdade, e
// um visitante que abrisse a Jornada veria a história clínica de uma paciente
// de demonstração como se fosse a dele. Isso confunde e depõe contra a
// seriedade do Método.
//
// Preview e desenvolvimento continuam com os Portais acessíveis: é lá que a
// experiência é avaliada. A trava sai quando a autenticação real entrar e os
// Portais assumirem `/curador` e `/paciente`.

export const DEMO_PORTAL_PREFIXES = ["/portal-curador", "/portal-paciente"] as const;

export function isDemoPortalPath(pathname: string): boolean {
  return DEMO_PORTAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Só o ambiente `production` da Vercel bloqueia. `preview` e `development`
 * liberam — a variável é injetada pela própria Vercel, e sua ausência
 * (execução local) também libera.
 */
export function shouldBlockDemoPortals(vercelEnv: string | undefined): boolean {
  return vercelEnv === "production";
}
