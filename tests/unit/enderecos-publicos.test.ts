import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * O QUE O SITE MOSTRA PARA FORA — guarda da varredura visual de 01/09/2026.
 *
 * **Por que existe.** A varredura achou três coisas que não davam erro
 * nenhum, e por isso ninguém veria:
 *
 *   1. **O `sitemap.ts` tinha duas URLs** — a home e `/login`. Faltavam
 *      `/o-que-e` e `/solicitar-atendimento`, que são a explicação e a porta;
 *      sobrava `/login`, a única página que não tem por que ser encontrada em
 *      busca. Ficou assim porque foi escrito antes de as páginas existirem, e
 *      **rota nova não avisa o sitemap.**
 *   2. **Nenhuma página declarava `og:image`.** Todo link colado no WhatsApp
 *      saía como um retângulo cinza — e o WhatsApp é o canal de atendimento
 *      (ADR-111).
 *   3. **Não havia `canonical`**, então o mesmo conteúdo em dois hosts (o
 *      domínio próprio e o `*.vercel.app`) contava como páginas diferentes.
 *
 * Este teste lê **o sistema de arquivos de rotas**, não uma lista copiada:
 * cada página pública estática ou está no sitemap, ou está na tabela de
 * ausências abaixo **com o motivo escrito**. Motivo em branco é o mesmo que
 * não olhar.
 *
 * **Como reagir quando ele reprovar** (e ele vai, no dia em que nascer uma
 * página pública): acrescente-a ao `sitemap.ts` — é o caso comum; ou registre
 * a ausência aqui, dizendo por quê.
 */

const RAIZ = resolve(import.meta.dirname, "../..");
const DIR_PUBLICO = resolve(RAIZ, "src/app/(public)");
const SITEMAP = readFileSync(resolve(RAIZ, "src/app/sitemap.ts"), "utf8");
const LAYOUT = readFileSync(resolve(RAIZ, "src/app/layout.tsx"), "utf8");

/**
 * As rotas que o sitemap realmente emite — extraídas dos campos `url:`, não
 * procuradas no arquivo inteiro. A primeira versão deste teste fazia
 * `SITEMAP.includes("/login")` e reprovava por causa do **comentário** que
 * explica por que `/login` ficou de fora: a prosa do arquivo contava como
 * conteúdo do sitemap.
 */
const URLS_DO_SITEMAP: string[] = [
  ...SITEMAP.matchAll(/url:\s*(?:SITE_URL\b|`\$\{SITE_URL\}([^`]*)`)/g),
].map((m) => m[1] ?? "/");

/** As rotas estáticas de `(public)`, lidas do disco. */
function rotasPublicas(dir = DIR_PUBLICO, prefixo = ""): string[] {
  const achadas: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = resolve(dir, nome);
    if (nome === "page.tsx") {
      achadas.push(prefixo === "" ? "/" : prefixo);
      continue;
    }
    if (!statSync(caminho).isDirectory()) continue;
    // `(grupo)` não vira segmento de URL; `[slug]` não é endereço fixo.
    if (nome.startsWith("(")) achadas.push(...rotasPublicas(caminho, prefixo));
    else if (!nome.startsWith("[")) achadas.push(...rotasPublicas(caminho, `${prefixo}/${nome}`));
  }
  return achadas;
}

/** As páginas indexáveis e a rota que cada uma reivindica como sua. */
const PAGINAS_INDEXAVEIS: ReadonlyArray<readonly [string, string]> = [
  ["src/app/(public)/page.tsx", "/"],
  ["src/app/(public)/o-que-e/page.tsx", "/o-que-e"],
  ["src/app/(public)/solicitar-atendimento/page.tsx", "/solicitar-atendimento"],
];

/** Páginas públicas que ficam fora do sitemap de propósito, e por quê. */
const FORA_DO_SITEMAP: Readonly<Record<string, string>> = {
  "/termos":
    "Sem texto publicado, a página diz que o documento não existe. Página " +
    "vazia indexada é pior que página nenhuma — ela se declara `noindex` " +
    "sozinha até haver versão vigente. Quando houver, entra aqui.",
  "/termos/profissional":
    "Mesma razão de /termos: sem versão vigente no banco, a página só diz que " +
    "o documento não existe, e se declara `noindex` sozinha.",
  "/privacidade":
    "Mesma razão de /termos: sem versão vigente no banco, a página só diz que " +
    "o documento não existe, e se declara `noindex` sozinha.",
  "/consentimentos":
    "Índice do que foi publicado. Enquanto não há nada publicado, não há " +
    "índice — a página se declara `noindex` sozinha.",
  "/sua-historia":
    "A entrada do formulário da assistida: redireciona para o passo em que " +
    "ela parou. Endereço de fluxo, não de conteúdo.",
  ...Object.fromEntries(
    ["continuar", "historia", "informacoes", "motivo", "para-quem", "preferencias", "revisao"].map(
      (passo) => [
        `/sua-historia/${passo}`,
        "Passo interno do formulário da assistida. Chegar por busca no meio do " +
          "fluxo, sem o que veio antes, seria cair no escuro — a entrada é /sua-historia.",
      ],
    ),
  ),
};

describe("O sitemap cobre as páginas públicas", () => {
  const rotas = rotasPublicas();

  it("encontra as páginas públicas no disco", () => {
    // Se a varredura devolver quase nada, o teste inteiro passaria à toa.
    expect(rotas.length).toBeGreaterThanOrEqual(6);
    expect(rotas).toContain("/");
    expect(rotas).toContain("/o-que-e");
  });

  it("extrai as URLs do sitemap, e não a prosa do arquivo", () => {
    expect(URLS_DO_SITEMAP).toEqual(["/", "/o-que-e", "/solicitar-atendimento"]);
  });

  it.each(rotasPublicas())("%s está no sitemap ou tem ausência justificada", (rota) => {
    if (URLS_DO_SITEMAP.includes(rota)) return;

    const motivo = FORA_DO_SITEMAP[rota];
    expect(
      motivo,
      `A rota pública ${rota} não está no sitemap e não tem motivo escrito. ` +
        `Acrescente-a a src/app/sitemap.ts, ou registre a ausência em FORA_DO_SITEMAP.`,
    ).toBeTruthy();
    expect(motivo!.trim().length, `O motivo de ${rota} está vazio.`).toBeGreaterThan(30);
  });

  it("não convida a busca para a tela de login", () => {
    // Quem precisa do login já sabe onde ele fica; indexá-lo só gasta
    // orçamento de rastreio e coloca uma porta fechada na cara de quem busca.
    expect(URLS_DO_SITEMAP).not.toContain("/login");
  });

  it("não lista nenhuma área autenticada", () => {
    for (const area of ["/admin", "/paciente", "/profissional", "/portal-curador", "/coa"]) {
      const invasoras = URLS_DO_SITEMAP.filter((u) => u === area || u.startsWith(`${area}/`));
      expect(invasoras, `${area} não pode aparecer no sitemap`).toEqual([]);
    }
  });
});

describe("O link da Aliviar tem imagem e endereço canônico", () => {
  it("a imagem de compartilhamento existe e é leve o bastante", () => {
    const bytes = statSync(resolve(RAIZ, "public/og.jpg")).size;
    expect(bytes).toBeGreaterThan(20_000);
    // O robô que monta a prévia do WhatsApp desiste de imagem grande.
    expect(bytes, "public/og.jpg passou de 300 kB — rode scripts/gerar-og-image.mjs").toBeLessThan(
      300_000,
    );
  });

  it("a imagem é declarada uma vez só, com dimensão e tipo", () => {
    const fonte = readFileSync(resolve(RAIZ, "src/lib/metadata-publica.ts"), "utf8");
    expect(fonte).toContain('url: "/og.jpg"');
    expect(fonte).toContain("width: 1200");
    expect(fonte).toContain("height: 630");
    expect(fonte).toContain('type: "image/jpeg"');
    // O layout usa a mesma constante como padrão de quem não declara a sua.
    expect(LAYOUT).toContain("images: [OG_IMAGE]");
    expect(LAYOUT).toContain('from "@/lib/metadata-publica"');
  });

  /**
   * O canônico mora na PÁGINA, e a distinção não é estilo. O metadata de um
   * layout é herdado por todo filho que não o sobrescreve: um
   * `canonical: "/"` na raiz declararia `/o-que-e` e `/solicitar-atendimento`
   * como cópias da home — e o efeito de um canônico errado é justamente tirar
   * a página do índice. Foi o que quase entrou no conserto de 01/09.
   */
  it("o layout raiz NÃO declara canônico — ele seria herdado por todas", () => {
    expect(LAYOUT).not.toContain("alternates:");
    expect(LAYOUT).not.toContain('url: "/"');
  });

  it.each(PAGINAS_INDEXAVEIS)("%s usa o cabeçalho público, com a própria rota", (arquivo, rota) => {
    const fonte = readFileSync(resolve(RAIZ, arquivo), "utf8");
    expect(fonte).toContain("...metadataPublica({");
    expect(fonte).toContain(`rota: "${rota}"`);
    // Escrever `openGraph` à mão aqui TROCA o objeto herdado do layout e
    // perde a imagem junto — foi o defeito de 01/09. O helper existe para
    // que ninguém precise lembrar disso.
    expect(fonte).not.toMatch(/^\s*openGraph: \{/m);
    expect(fonte).not.toMatch(/^\s*alternates: \{/m);
  });

  it("toda rota do sitemap tem uma página que a declara como sua", () => {
    // A dupla que se desalinha em silêncio: entrar no sitemap sem canônico
    // deixa a página disputando com ela mesma em outro host.
    const declaradas = PAGINAS_INDEXAVEIS.map(([, rota]) => rota);
    expect([...URLS_DO_SITEMAP].sort()).toEqual([...declaradas].sort());
  });
});
