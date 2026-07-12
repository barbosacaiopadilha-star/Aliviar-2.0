import type { MetadataRoute } from "next";

const SITE_URL = "https://www.aliviarcuradoriamedica.com.br";

// Áreas autenticadas nunca devem ser indexadas — a proteção real de acesso
// é o RLS/guard.ts (docs/ENGINEERING_PLAN.md, seção 8); isto é só um sinal
// de indexação para buscadores, não uma fronteira de segurança.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profissional", "/paciente", "/acesso-negado", "/auth/callback", "/nova-senha"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
