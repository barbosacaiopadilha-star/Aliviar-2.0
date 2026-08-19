/**
 * O ENDEREÇO PÚBLICO DO SITE — uma fonte só.
 *
 * Estava escrito à mão em três arquivos (`layout.tsx`, `robots.ts`,
 * `sitemap.ts`), todos apontando para `www.aliviarcuradoriamedica.com.br` —
 * domínio que a Aliviar não tem mais. O efeito não era cosmético: o
 * `sitemap.xml` listava URLs mortas, o `robots.txt` apontava para um sitemap
 * morto, e o `metadataBase` fazia toda URL canônica e todo link
 * compartilhado (Open Graph) nascer com o endereço errado.
 *
 * Agora vem do ambiente, nesta ordem:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — a resposta quando existir domínio próprio de
 *    novo. Basta definir a variável; nenhum código muda.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — o domínio de produção do projeto, que
 *    a própria Vercel injeta. É o caso de hoje, e é por isso que ninguém
 *    precisa manter uma constante à mão.
 * 3. `localhost` — desenvolvimento.
 *
 * Por que não deixar um domínio fixo como padrão: foi exatamente assim que o
 * endereço morto sobreviveu à perda do domínio, em silêncio, dentro de três
 * arquivos de produção.
 */
function resolverSiteUrl(): string {
  const declarado = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (declarado) return declarado.replace(/\/+$/, "");

  // A Vercel entrega só o host, sem protocolo.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolverSiteUrl();
