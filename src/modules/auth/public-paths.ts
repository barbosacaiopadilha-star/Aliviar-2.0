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
  // OBS-01: saúde precisa ser legível por monitor externo, que não tem
  // sessão. Ao contrário de build-info, este endpoint TOCA as dependências —
  // 503 quando o banco cai, e é isso que um monitor precisa ver.
  "/api/health",
  "/sua-historia",
  // GOVERNANÇA (Bloco H): documento publicado é público por natureza — quem
  // vai aceitar precisa poder LER antes de ter sessão, e um permalink de
  // prova tem de abrir para qualquer um que o receba (inclusive um juiz).
  // O prefixo /legal/ é tratado à parte no middleware por ser dinâmico.
  "/privacidade",
  "/termos",
  "/termos/profissional",
  "/consentimentos",
  "/cookies",
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
// `/legal/<slug>/v/<versao>` é o permalink de PROVA de uma versão publicada:
// precisa abrir para quem o receber — inclusive fora da plataforma, inclusive
// anos depois. É prefixo porque slug e versão são dinâmicos.
// `/consentimentos/<slug>` idem: cada consentimento tem endereço próprio.
const PUBLIC_PREFIXES = ["/auth/callback", "/legal/", "/consentimentos/"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
