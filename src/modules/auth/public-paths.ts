// Rotas que não exigem sessão. Extraído do middleware para ser testável sem
// precisar simular um NextRequest completo.

// "/sua-historia" (raiz, exata) é só a página explicativa — nunca permite
// preenchimento anônimo. As etapas do wizard (/sua-historia/para-quem,
// /motivo, etc.) exigem sessão + papel "paciente" (ADR-018): ficam de fora
// deste conjunto de propósito, reforçadas também pelo layout.tsx do route
// group (wizard) via requireRole("paciente").
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/recuperar-senha",
  "/nova-senha",
  "/robots.txt",
  "/sitemap.xml",
  "/sua-historia",
]);

const PUBLIC_PREFIXES = ["/auth/callback"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
