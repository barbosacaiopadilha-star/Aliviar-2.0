import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * BLOCO 7 / D-1 · T-7-7, T-7-8 e T-7-9 — a Landing medida no navegador.
 *
 * A Landing é **pública e anônima**: nenhuma conta, nenhuma fixture, nenhum
 * cleanup, nenhum resíduo possível. Quem chega aqui ainda não é paciente — é
 * exatamente por isso que este bloco existiu.
 *
 * As capturas ficam atrás de `CAPTURA=1`; as medições, não.
 */

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../evidencias/bloco7");
const CAPTURANDO = Boolean(process.env.CAPTURA);

// "metodo" saiu das âncoras: os quatro movimentos deixaram a página por
// decisão do Fundador (22/08) — redundantes com a jornada fotografada.
// ADR-081 (23/08): "para-quem" e "concierge" saíram junto com as seções —
// a vitrine enxuta tem duas âncoras, e nenhuma porta pintada.
const ANCORAS = ["quem-somos", "como-funciona"] as const;

/**
 * V-B7-1 · O PORTÃO DE CAPTURA.
 *
 * O `capturar()` anterior fotografava o que estivesse na tela. Foi assim que
 * `EV-7-001-landing-completa-1440.png` saiu contendo o **wizard**: a captura
 * acontecia depois de clicar em `Começar`, e `/sua-historia` também tem um
 * `h1` — a espera passou na página errada e a suíte ficou **6/6 mesmo com a
 * evidência mentindo**.
 *
 * Mover a chamada resolveu aquele ponto e não resolveu o problema: qualquer
 * chamada futura repetiria o erro. O que faltava era o portão.
 *
 * A verificação roda **sempre**, com ou sem `CAPTURA=1` — assim ela é uma
 * guarda permanente da suíte, e não um cuidado que só existe quando alguém
 * lembra de pedir imagem. A escrita, essa sim, só acontece com `CAPTURA=1`.
 *
 * Nenhuma condição sozinha basta: `page.url()` não distingue uma landing
 * quebrada de uma landing inteira, e conteúdo sozinho não distingue rota. Por
 * isso rota **e** conteúdo exclusivo **e** viewport **e** estado.
 */
const H1_DA_LANDING = "Uma decisão de saúde importante.Você não precisa tomá-la sozinho.";
// Dossiê da Landing Responsiva (23/08): o marcador exclusivo passa a ser a
// promessa da Recepção — a frase que só existe nesta página.
const MARCADOR_EXCLUSIVO = "A Aliviar organiza sua escolha:";

type Enquadramento = "pagina-inteira" | "hero";

type EspecificacaoDeEvidencia = {
  viewport: { width: number; height: number };
  enquadramento: Enquadramento;
  /** Quando presente, o drawer precisa estar aberto no momento da foto. */
  drawerAberto?: true;
  proposito: string;
};

/**
 * V-B7-5 · cada evidência tem finalidade PRÓPRIA e falseável.
 *
 * EV-7-001 e EV-7-002 eram a mesma foto duas vezes, diferindo só no quanto as
 * animações tinham avançado. Agora uma é a página inteira com os reveals
 * concluídos (prova a ordem dos blocos), e a outra é só a região do Hero
 * (prova as duas colunas e os dois CTAs). Enquadramentos diferentes, provas
 * diferentes.
 */
const EVIDENCIAS: Record<string, EspecificacaoDeEvidencia> = {
  "EV-7-001-landing-completa-1440": {
    viewport: { width: 1440, height: 900 },
    enquadramento: "pagina-inteira",
    proposito: "a página inteira, com os blocos na ordem e nenhuma faixa vazia por reveal pendente",
  },
  "EV-7-002-hero-duas-colunas-1440": {
    viewport: { width: 1440, height: 900 },
    enquadramento: "hero",
    proposito: "o Hero em duas colunas, com o header e os CTAs Começar e Entrar",
  },
  "EV-7-003-como-funciona-vertical-390": {
    viewport: { width: 390, height: 844 },
    enquadramento: "pagina-inteira",
    proposito: "as cinco etapas verticais em mobile",
  },
  "EV-7-004-drawer-aberto-390": {
    viewport: { width: 390, height: 844 },
    enquadramento: "pagina-inteira",
    drawerAberto: true,
    proposito: "o drawer aberto, com o CTA Começar visível na barra",
  },
  "EV-7-005-nada-quebra-320": {
    viewport: { width: 320, height: 568 },
    enquadramento: "pagina-inteira",
    proposito: "nada quebra na menor largura suportada",
  },
};

async function capturar(page: Page, nome: string) {
  const spec = EVIDENCIAS[nome];
  if (!spec) {
    throw new Error(
      `evidência desconhecida: "${nome}". Toda captura declara viewport, ` +
        `enquadramento e propósito em EVIDENCIAS — nome novo é ato deliberado.`,
    );
  }

  // 1 · A ROTA. `/sua-historia` é o vizinho perigoso: foi ele que virou
  // "landing completa" na primeira tentativa.
  const url = new URL(page.url());
  if (url.pathname !== "/") {
    throw new Error(
      `${nome}: a captura exige a landing pública em "/", e a página está em ` +
        `"${url.pathname}". Nenhum arquivo foi escrito.`,
    );
  }

  // 2 · O CONTEÚDO EXCLUSIVO. Rota sozinha não basta — uma landing quebrada
  // também responde em "/".
  const conferencia = await page.evaluate(
    ({ h1Esperado, marcador }) => {
      const h1s = [...document.querySelectorAll("h1")].map((h) =>
        (h.textContent ?? "").replace(/\s+/g, " ").trim(),
      );
      return {
        h1s,
        temMarcador: (document.body.textContent ?? "").includes(marcador),
        h1Bate: h1s.some(
          (t) => t.replace(/\s+/g, "") === h1Esperado.replace(/\s+/g, ""),
        ),
        largura: window.innerWidth,
        altura: window.innerHeight,
        drawer: Boolean(document.querySelector("#landing-drawer")),
        expandido:
          document.querySelector('[aria-controls="landing-drawer"]')?.getAttribute("aria-expanded") ??
          null,
      };
    },
    { h1Esperado: H1_DA_LANDING, marcador: MARCADOR_EXCLUSIVO },
  );

  if (!conferencia.temMarcador) {
    throw new Error(
      `${nome}: o marcador exclusivo da landing ("${MARCADOR_EXCLUSIVO}") não está na página. ` +
        `Nenhum arquivo foi escrito.`,
    );
  }
  if (!conferencia.h1Bate) {
    throw new Error(
      `${nome}: o h1 da landing não confere. Encontrados: ${JSON.stringify(conferencia.h1s)}. ` +
        `Nenhum arquivo foi escrito.`,
    );
  }
  // O h1 do wizard é o sinal exato do defeito reproduzido pelo Verificador.
  const h1DoWizard = conferencia.h1s.find((t) => t.startsWith("Sua história merece ser contada"));
  if (h1DoWizard) {
    throw new Error(`${nome}: isto é o wizard, não a landing ("${h1DoWizard}").`);
  }

  // 3 · O VIEWPORT precisa corresponder ao NOME. "…-390" fotografado em 1440
  // é evidência que descreve outra coisa.
  if (conferencia.largura !== spec.viewport.width) {
    throw new Error(
      `${nome}: declara viewport de ${spec.viewport.width}px e a página está em ` +
        `${conferencia.largura}px. Nenhum arquivo foi escrito.`,
    );
  }

  // 4 · O ESTADO, quando a evidência é de um estado.
  if (spec.drawerAberto && (!conferencia.drawer || conferencia.expandido !== "true")) {
    throw new Error(
      `${nome}: exige o drawer ABERTO (presente=${conferencia.drawer}, ` +
        `aria-expanded=${conferencia.expandido}). Nenhum arquivo foi escrito.`,
    );
  }

  console.log(`[GATE] ${nome} · ${url.pathname} · ${conferencia.largura}px · ${spec.proposito}`);
  if (!CAPTURANDO) return;

  mkdirSync(DESTINO, { recursive: true });
  const destino = path.join(DESTINO, `${nome}.png`);

  if (spec.enquadramento === "hero") {
    // Só a região do Hero, do topo da página até o fim da faixa — inclui o
    // header, e com ele os dois CTAs. Recorte próprio: reaproveitar a foto de
    // página inteira faria duas evidências dizerem a mesma coisa (V-B7-5).
    const caixa = await page.locator("section.landing-hero-immersive").boundingBox();
    if (!caixa) throw new Error(`${nome}: o Hero não foi encontrado para o recorte.`);
    await page.screenshot({
      path: destino,
      clip: { x: 0, y: 0, width: spec.viewport.width, height: Math.ceil(caixa.y + caixa.height) },
    });
  } else {
    await page.screenshot({ path: destino, fullPage: true });
  }
  console.log(`capturado: ${nome}`);
}

/**
 * Conclui os reveals antes da foto de página inteira.
 *
 * `RevealGroup` só marca `data-inview="true"` no que passou pelo
 * IntersectionObserver. Numa captura `fullPage`, o que nunca entrou na
 * viewport sai transparente — e a evidência vira faixas vazias que parecem
 * seções faltando. Manipulação de DOM no teste, nunca no produto.
 */
async function concluirReveals(page: Page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll(".landing-reveal")) {
      el.setAttribute("data-inview", "true");
    }
  });
}

/** Mede a página inteira — nunca por classe CSS. */
async function medir(page: Page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    const dentroDeScroller = (e: Element) => {
      for (let p = e.parentElement; p && p !== d; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
      return false;
    };
    const excedem = [...document.querySelectorAll("body *")]
      .filter((e) => e.getBoundingClientRect().right > d.clientWidth + 1)
      .filter((e) => !dentroDeScroller(e))
      .map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]}`);

    return {
      innerWidth: window.innerWidth,
      clientWidth: d.clientWidth,
      scrollWidth: d.scrollWidth,
      overflow: d.scrollWidth - d.clientWidth,
      excedem: [...new Set(excedem)],
    };
  });
}

test.describe("Bloco 7 · a Landing pública", () => {
  test("T-7-7 — 1280, 768, 390 e 320: nada transborda, e as etapas ficam verticais", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    for (const [largura, altura] of [
      [1280, 900],
      [768, 1024],
      [390, 844],
      [320, 568],
    ] as const) {
      await page.setViewportSize({ width: largura, height: altura });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      // O conteúdo precisa estar lá antes de medir — nunca um sleep.
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const m = await medir(page);
      console.log(`[BLOCO-7] ${largura}px → ${JSON.stringify(m)}`);

      expect(m.innerWidth, `${largura}: viewport`).toBe(largura);
      expect(m.scrollWidth, `${largura}: scrollWidth === clientWidth`).toBe(m.clientWidth);
      expect(m.overflow, `${largura}: rolagem horizontal`).toBeLessThanOrEqual(0);
      expect(m.excedem, `${largura}: elemento fora da viewport`).toEqual([]);

      if (largura === 390) {
        // Dossiê da Landing Responsiva (23/08): a prova de celular mudou de
        // objeto — em vez das cinco etapas verticais, o que se garante é o
        // essencial da nova página: a PROPOSTA e o CONVITE cabem na
        // primeira tela, sem rolar, e o card não encobre a cena inteira.
        const primeiraTela = await page.evaluate(() => {
          const cta = document.querySelector(".landing-porta")!.getBoundingClientRect();
          const micro = document.querySelector(".landing-microtexto")!.getBoundingClientRect();
          // Fusão de 23/08: a Recepção tem DOIS cards — o do vídeo no topo
          // e o da proposta no pé. A cena precisa respirar entre eles, e é
          // o card de CONTEÚDO que não pode subir demais.
          const card = document
            .querySelector(".landing-card-vidro:not(.landing-card-video)")!
            .getBoundingClientRect();
          return {
            ctaDentro: cta.bottom <= window.innerHeight,
            microDentro: micro.bottom <= window.innerHeight,
            // A cena precisa respirar acima do card (as pessoas ficam lá).
            cenaVisivelAcima: Math.round(card.top),
          };
        });
        expect(primeiraTela.ctaDentro, "o convite ficou abaixo da dobra").toBe(true);
        expect(primeiraTela.microDentro, "o microtexto ficou abaixo da dobra").toBe(true);
        expect(
          primeiraTela.cenaVisivelAcima,
          "o card comeu a cena inteira — as pessoas precisam aparecer",
        ).toBeGreaterThan(200);

        await concluirReveals(page);
        await capturar(page, "EV-7-003-como-funciona-vertical-390");
      }

      if (largura === 320) {
        await concluirReveals(page);
        await capturar(page, "EV-7-005-nada-quebra-320");
      }
    }
  });

  test("T-7-2/T-7-3 — a navegação leva às seções, e o convite leva a /solicitar-atendimento", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Os cinco destinos existem, e não são links mortos depois da hidratação.
    for (const id of ANCORAS) {
      await expect(page.locator(`#${id}`), `#${id} não existe`).toHaveCount(1);
    }

    // Navegar de verdade: clicar leva a seção para dentro da viewport.
    // Dossiê (23/08): "Quem somos" leva ao ambiente da Escolha — os três
    // médicos e a frase que devolve a decisão a ela.
    await page.getByRole("link", { name: "Quem somos" }).first().click();
    await expect(page.locator("#quem-somos")).toBeInViewport({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Três médicos selecionados. A escolha continua sendo sua." }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Nossa curadoria" }).first().click();
    await expect(page.locator("#como-funciona")).toBeInViewport({ timeout: 10_000 });

    // O convite anônimo: rótulo, destino, foco por teclado e alvo medido.
    //
    // ORÁCULO ATUALIZADO (2026-08-19). O teste exigia `Começar` levando a
    // `/sua-historia`. O commit 3c5b7bc (2026-08-12) desfez isso de
    // propósito: havia dois convites concorrentes e ambos levavam a uma rota
    // que EXIGE CONTA — "quem chegava sem conta batia numa porta trancada e
    // ia embora". O convite passou a ser um só, `Solicitar atendimento`, e é
    // público. O produto corrigiu um defeito; este teste ainda cobrava o
    // defeito.
    // Dossiê (23/08): no computador o rótulo do cabeçalho segue por
    // extenso; no celular ele encolhe para "Começar", mesma porta.
    const comecar = page.getByRole("link", { name: /Solicitar atendimento/ }).first();
    await expect(comecar).toHaveAttribute("href", "/solicitar-atendimento");
    await comecar.focus();
    await expect(comecar).toBeFocused();
    const caixa = (await comecar.boundingBox())!;
    expect(Math.round(caixa.height), "alvo mínimo de 44px").toBeGreaterThanOrEqual(44);

    // As capturas saem AQUI, com a Landing na tela — e agora o portão de
    // `capturar()` recusa qualquer outra rota, então a ordem deixou de ser o
    // único cuidado.
    await page.evaluate(() => window.scrollTo(0, 0));

    // EV-7-002 · só o Hero, ANTES de concluir os reveals: o recorte é do topo
    // da página, que já está visível, e os dois CTAs vivem no header.
    await expect(page.getByRole("link", { name: /Solicitar atendimento/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" }).first()).toBeVisible();
    // Dossiê (23/08): no computador o card vive na lateral ESQUERDA livre
    // da fotografia — a cena fica inteira à direita, sem ninguém coberto.
    const larguraDoCard = await page.evaluate(() => {
      const card = document
        .querySelector(".landing-card-vidro:not(.landing-card-video)")!
        .getBoundingClientRect();
      return { esquerda: Math.round(card.left), fracao: card.width / window.innerWidth };
    });
    expect(larguraDoCard.esquerda, "o card saiu da lateral esquerda").toBeLessThan(200);
    expect(larguraDoCard.fracao, "o card não pode cobrir a cena inteira").toBeLessThan(0.55);
    await capturar(page, "EV-7-002-hero-duas-colunas-1440");

    // EV-7-001 · a página inteira, com os reveals concluídos e a ordem dos
    // blocos provada no DOM antes da foto.
    await concluirReveals(page);
    // Ordem decidida pelo Fundador em 22/08 (sobre a tela): o "Como
    // funciona" — a jornada em cartões com fotografias — sobe para logo
    // após o vídeo, antes do Espelho. As demais seções mantêm a ordem
    // relativa do contrato 34 entre si.
    const ordemNoDom = await page.evaluate(() =>
      // ADR-081: sobraram duas âncoras — jornada antes da sala verde.
      ["como-funciona", "quem-somos"].map((id) =>
        Math.round(document.querySelector(`#${id}`)!.getBoundingClientRect().top + window.scrollY),
      ),
    );
    for (let i = 1; i < ordemNoDom.length; i += 1) {
      expect(ordemNoDom[i]!, "a ordem dos blocos mudou").toBeGreaterThan(ordemNoDom[i - 1]!);
    }
    await capturar(page, "EV-7-001-landing-completa-1440");

    // E só então: a rota de destino existe de verdade.
    await comecar.click();
    await page.waitForURL(/\/solicitar-atendimento/, { timeout: 30_000 });
  });

  test("T-7-8 — o vídeo não carrega sozinho", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const midia: string[] = [];
    page.on("request", (req) => {
      if (/\.(webm|mp4|mov)(\?|$)/i.test(req.url())) midia.push(req.url());
    });

    await page.goto("/", { waitUntil: "networkidle" });

    expect(
      midia,
      "o vídeo foi buscado sem ninguém pedir: autoplay/preload gasta dados de " +
        "quem só queria ler a página",
    ).toEqual([]);

    const preload = await page.evaluate(
      () => document.querySelector("video")?.getAttribute("preload") ?? null,
    );
    if (preload !== null) expect(preload, "preload precisa ser none/metadata").not.toBe("auto");
  });

  test("T-7-9 — o drawer abre, anuncia, fecha por Esc e prende o foco", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const botao = page.getByRole("button", { name: /menu de seções/i });
    await expect(botao).toBeVisible();
    await expect(botao).toHaveAttribute("aria-expanded", "false");

    // O CTA nunca some — ele fica na barra, fora do drawer.
    const comecar = page.getByRole("link", { name: "Solicitar atendimento", exact: true }).first();
    await expect(comecar).toBeVisible();

    await botao.click();
    await expect(botao).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#landing-drawer")).toBeVisible();
    await expect(comecar, "o convite sumiu atrás do menu").toBeVisible();

    // O foco entra no drawer sozinho.
    await expect(page.locator("#landing-drawer a").first()).toBeFocused();
    await capturar(page, "EV-7-004-drawer-aberto-390");

    // O foco fica PRESO: `Tab` a partir do último volta ao primeiro.
    const links = page.locator("#landing-drawer a");
    await links.last().focus();
    await page.keyboard.press("Tab");
    await expect(links.first(), "o foco escapou do drawer").toBeFocused();

    await page.keyboard.press("Escape");
    await expect(botao).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#landing-drawer")).toHaveCount(0);
    await expect(botao, "o foco precisa voltar para quem abriu").toBeFocused();
  });
});
