import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GUIAS_DE_LEITURA, PARA_ENTREGAR_AO_ASSISTIDO, KIT_DA_CURADORIA } from "@/components/admin/kit-da-curadoria-card";

/**
 * O cartão do Kit na Visão geral do admin não pode oferecer link morto:
 * cada href aponta para um arquivo que EXISTE em public/. E a Folha da
 * Mesa fica FORA por decisão do Fundador (22/08) — instrumento do Curador,
 * nunca item de download do cartão.
 */
describe("Kit da Curadoria — links vivos, lista decidida", () => {
  it("todo link do cartão aponta para um PDF que existe em public/", () => {
    for (const peca of KIT_DA_CURADORIA) {
      const arquivo = join(process.cwd(), "public", peca.href);
      expect(existsSync(arquivo), `link morto no cartão do Kit: ${peca.href}`).toBe(true);
    }
  });

  it("são as quatro peças decididas — e a Folha da Mesa não está entre elas", () => {
    expect(KIT_DA_CURADORIA).toHaveLength(4);
    for (const peca of KIT_DA_CURADORIA) {
      expect(peca.href.includes("Folha-da-Mesa"), "a Folha da Mesa entrou no cartão sem decisão").toBe(false);
    }
  });

  /**
   * 28/08 · os dez guias de leitura passam a ser baixáveis. O PDF deles vive em
   * `public/guias/`, gerado por `scripts/gerar-guias-pdf.mjs` a partir do HTML —
   * e é justamente por serem gerados que a checagem de link morto importa: quem
   * renomeia um fonte e esquece o mapa `PUBLICADOS` quebra o download sem que
   * nada mais reclame.
   */
  it("todo guia de leitura aponta para um PDF que existe em public/", () => {
    for (const guia of GUIAS_DE_LEITURA) {
      const arquivo = join(process.cwd(), "public", guia.href);
      expect(existsSync(arquivo), `link morto no Kit: ${guia.href}`).toBe(true);
    }
  });

  it("são os dez guias, na ordem de leitura — e nenhum repetido", () => {
    // Oito operacionais. Os três que se ENTREGAM à assistida saíram em 31/08,
    // por decisão do Fundador: o Kit é o que se imprime para trabalhar.
    expect(GUIAS_DE_LEITURA).toHaveLength(8);
    expect(PARA_ENTREGAR_AO_ASSISTIDO).toHaveLength(3);
    const hrefs = GUIAS_DE_LEITURA.map((g) => g.href);
    expect(new Set(hrefs).size, "há guia repetido no cartão").toBe(hrefs.length);
  });

  it("as duas listas não se misturam: guia não é peça de preencher", () => {
    // `Set<string>` explícito: as duas listas são `as const`, e sem isto o
    // `has()` recusaria em tempo de tipo justamente o que o teste quer conferir.
    const dePreencher = new Set<string>(KIT_DA_CURADORIA.map((p) => p.href));
    for (const guia of GUIAS_DE_LEITURA) {
      expect(dePreencher.has(guia.href), `${guia.href} está nas duas listas`).toBe(false);
      expect(guia.href.startsWith("/guias/"), `${guia.href} não vive em /guias/`).toBe(true);
    }
    for (const peca of KIT_DA_CURADORIA) {
      expect(peca.href.startsWith("/rede/"), `${peca.href} não vive em /rede/`).toBe(true);
    }
  });
});

/**
 * O ALCANCE DO SUPERVISOR DE JORNADA — ADR-114.
 *
 * Esta guarda existe por causa da forma de defeito que a ADR-114 registrou, e
 * que já apareceu três vezes neste projeto: **construção correta, completa e
 * desligada de quem precisa dela.** O Kit tinha os quinze documentos e vivia
 * só na Visão geral do `/admin`, cujo guard admite `administrador` ou
 * `concierge` — o Supervisor batia em `/acesso-negado`. O `/api/health` media
 * a saúde para um monitor externo que não existia. A ponte grau→importância
 * está no banco desde agosto sem uma linha de `src/` que a use.
 *
 * O conserto de 04/09 é uma linha de import e um item de navegação — e é
 * exatamente por ser pequeno que ele se perde numa refatoração distraída, sem
 * que nenhum outro teste reclame. Um teste que só provasse "o link não está
 * morto" continuaria verde com a tela inteira fora do alcance dele.
 */
describe("O Supervisor de Jornada alcança a documentação (ADR-114)", () => {
  const raiz = process.cwd();
  const paginaDoSupervisor = join(raiz, "src", "app", "atendimento", "documentos", "page.tsx");
  const layoutDoAtendimento = join(raiz, "src", "app", "atendimento", "layout.tsx");

  it("a página de documentos do Supervisor existe", () => {
    expect(
      existsSync(paginaDoSupervisor),
      "sumiu a tela que a ADR-114 exige: o Supervisor voltou a não ter documentação",
    ).toBe(true);
  });

  it("ela serve o MESMO Kit do admin — nunca uma segunda lista", () => {
    const fonte = readFileSync(paginaDoSupervisor, "utf8");
    expect(
      fonte.includes("KitDaCuradoriaCard"),
      "a tela do Supervisor deixou de renderizar o Kit — ou alguém criou uma segunda fonte da verdade sobre quais documentos são os vigentes",
    ).toBe(true);
  });

  it("o Supervisor chega lá pela navegação, não por adivinhação de URL", () => {
    const layout = readFileSync(layoutDoAtendimento, "utf8");
    expect(
      layout.includes(`"/atendimento/documentos"`),
      // Com as aspas: sem elas, `/atendimento/documentosXX` passaria, porque
      // um href é substring do outro. Descoberto quebrando de propósito.
      "o item de navegação sumiu: a tela existe e ninguém a encontra, que é o mesmo que não existir",
    ).toBe(true);
  });

  it("o guard da área continua admitindo o papel do Supervisor", () => {
    const layout = readFileSync(layoutDoAtendimento, "utf8");
    // `atendente` é o slug do Supervisor de Jornada no banco (ADR-097
    // fronteira 1: o slug é dado, não vocabulário). Se ele sair daqui, a
    // tela existe, o link existe, e a pessoa cai em /acesso-negado.
    expect(
      layout.includes('"atendente"'),
      "o papel do Supervisor saiu do guard de /atendimento",
    ).toBe(true);
  });
});
