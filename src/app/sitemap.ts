import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

// Apenas rotas públicas e indexáveis. Áreas autenticadas (/admin,
// /profissional, /paciente, /acesso-negado) nunca entram aqui — ver
// robots.ts, que também as bloqueia explicitamente.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
