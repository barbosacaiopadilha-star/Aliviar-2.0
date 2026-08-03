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
  // Identidade do build (ETAPA 1): ambiente, host do backend, commit e data.
  // Nenhum segredo — é a primeira pergunta do diagnóstico, e precisa ser
  // respondível antes de qualquer sessão existir.
  "/api/build-info",
  "/sua-historia",
  // FUN-01 (gate D20): o formulário público do site posta aqui SEM sessão.
  // Fora deste conjunto, o middleware devolvia 302 → /login e o lead morria
  // em silêncio — o integrador lia o redirect como sucesso e o dado nunca
  // chegava ao banco (perda irrecuperável). A rota é pública, mas nunca
  // aberta: o handler exige o segredo CRM_SITE_LEAD_SECRET em TODO ambiente
  // (src/app/api/crm/leads/route.ts).
  "/api/crm/leads",
]);

// Os Portais SAÍRAM daqui na MISSÃO 209, Fase 4: agora leem o banco de
// produção e exigem sessão + papel (`curador_medico` no Portal do Curador,
// `paciente` na Jornada), reforçado em cada rota por requireRole() e, no
// banco, pela RLS. Enquanto liam mocks, ficar abertos não expunha nada; a
// partir do momento em que leem dado real, ficariam expondo tudo.
const PUBLIC_PREFIXES = ["/auth/callback"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
