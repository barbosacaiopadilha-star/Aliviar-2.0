/**
 * O ENDEREÇO PÚBLICO DO SITE — uma fonte só.
 *
 * Estava escrito à mão em três arquivos (`layout.tsx`, `robots.ts`,
 * `sitemap.ts`), todos apontando para `www.aliviarcuradoriamedica.com.br`,
 * que naquele momento não respondia. O efeito não era cosmético: o
 * `sitemap.xml` listava URLs mortas, o `robots.txt` apontava para um sitemap
 * morto, e o `metadataBase` fazia toda URL canônica e todo link
 * compartilhado (Open Graph) nascer com o endereço errado.
 *
 * **CORREÇÃO DE FATO, 31/08/2026 (`SIM-72`).** Até aqui este comentário dizia
 * *"domínio que a Aliviar não tem mais"*. **É falso, e a premissa falsa é que
 * mantém o site se anunciando como `aliviar-2-0.vercel.app`.** Medido no RDAP
 * do registro.br: `aliviarcuradoriamedica.com.br` está **`active`, registrado
 * em nome de Caio Padilha, com validade até 13/07/2027**, e o DNS na Hostinger
 * **já aponta para a Vercel**. O que não existe é a ligação do domínio a um
 * projeto — ele ficou com o projeto `aliviar-curadoria-medica-prod`, que foi
 * apagado, e o projeto `aliviar` nunca o recebeu. Daí o `DEPLOYMENT_NOT_FOUND`.
 *
 * O endereço vem do ambiente, nesta ordem:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — **o caminho de volta ao domínio próprio.** Ligue
 *    o domínio ao projeto no painel da Vercel e defina esta variável; canonical,
 *    Open Graph, `robots.txt` e `sitemap.xml` passam a nascer certos, e
 *    **nenhuma linha de código muda.**
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — o domínio de produção do projeto, que
 *    a própria Vercel injeta. É o caso de hoje, e é por isso que ninguém
 *    precisa manter uma constante à mão.
 * 3. `localhost` — desenvolvimento.
 *
 * **Por que continuar sem domínio fixo como padrão, mesmo depois de religar o
 * próprio:** foi um endereço fixo em três arquivos que sobreviveu, em silêncio,
 * ao dia em que o domínio parou de responder. A resolução por ambiente é o
 * conserto certo — o que estava errado era só a razão registrada aqui.
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
