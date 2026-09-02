import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

/**
 * Apenas rotas públicas e indexáveis. Áreas autenticadas (/admin,
 * /profissional, /paciente, /acesso-negado) nunca entram aqui — ver
 * robots.ts, que também as bloqueia explicitamente.
 *
 * **CORRIGIDO EM 01/09/2026.** O arquivo tinha duas URLs — a home e `/login`
 * — e ficou assim porque foi escrito antes de as páginas públicas existirem.
 * Faltavam justamente as duas que importam: `/o-que-e`, que é a explicação
 * inteira da Aliviar, e `/solicitar-atendimento`, que é a porta. E sobrava
 * `/login`, a única página do site que não tem razão nenhuma para ser
 * encontrada em busca — quem precisa dela já sabe onde ela fica.
 *
 * **O que continua fora, de propósito:** `/termos`, `/privacidade`,
 * `/consentimentos` e `/termos/profissional`. Enquanto o jurídico não
 * publica, elas dizem "o documento ainda não foi publicado" — e uma página
 * vazia indexada é pior que página nenhuma. Elas se declaram `noindex`
 * sozinhas até haver texto (ver `metadataDeDocumento`); quando houver, entram
 * aqui também.
 */
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
      url: `${SITE_URL}/o-que-e`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/solicitar-atendimento`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
