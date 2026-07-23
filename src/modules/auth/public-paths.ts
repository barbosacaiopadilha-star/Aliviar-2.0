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

// "/portal-curador" é o Portal do Curador em construção (MISSÃO 100), sobre
// dados de demonstração. Fica aberto porque a missão determina construir a
// experiência antes de integrar autenticação — e porque não existe nenhum dado
// real por trás dele: nada aqui lê banco, sessão ou paciente de verdade.
// Quando a integração acontecer, esta entrada sai e o Portal passa a exigir o
// papel "curador_medico" como o /curador atual.
const PUBLIC_PREFIXES = ["/auth/callback", "/portal-curador"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
