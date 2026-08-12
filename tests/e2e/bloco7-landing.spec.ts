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

const ANCORAS = ["quem-somos", "para-quem", "como-funciona", "metodo", "concierge"] as const;

async function capturar(page: Page, nome: string) {
  if (!CAPTURANDO) return;
  mkdirSync(DESTINO, { recursive: true });
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  console.log(`capturado: ${nome}`);
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
        // As cinco etapas VERTICAIS: cada uma começa abaixo da anterior.
        const topos = await page.evaluate(() => {
          const secao = document.querySelector("#como-funciona");
          return [...(secao?.querySelectorAll("ol > li") ?? [])].map((li) =>
            Math.round(li.getBoundingClientRect().top),
          );
        });
        expect(topos, "as cinco etapas precisam existir").toHaveLength(5);
        for (let i = 1; i < topos.length; i += 1) {
          expect(topos[i]!, "as etapas ficaram lado a lado em 390px").toBeGreaterThan(topos[i - 1]!);
        }
        await capturar(page, "EV-7-003-como-funciona-vertical-390");
      }

      if (largura === 320) await capturar(page, "EV-7-005-nada-quebra-320");
    }
  });

  test("T-7-2/T-7-3 — a navegação leva às seções, e Começar leva a /sua-historia", async ({
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
    await page.getByRole("link", { name: "Concierge" }).first().click();
    await expect(page.locator("#concierge")).toBeInViewport({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Você não faz isso sozinha." })).toBeVisible();

    await page.getByRole("link", { name: "Nossa curadoria" }).first().click();
    await expect(page.locator("#metodo")).toBeInViewport({ timeout: 10_000 });

    // O convite anônimo: rótulo, destino, foco por teclado e alvo medido.
    const comecar = page.getByRole("link", { name: "Começar", exact: true }).first();
    await expect(comecar).toHaveAttribute("href", "/sua-historia");
    await comecar.focus();
    await expect(comecar).toBeFocused();
    const caixa = (await comecar.boundingBox())!;
    expect(Math.round(caixa.height), "alvo mínimo de 44px").toBeGreaterThanOrEqual(44);

    // As capturas saem AQUI, com a Landing na tela. Fotografá-las depois do
    // clique produziu a página do wizard: `/sua-historia` também tem um `h1`,
    // então a espera passou na página errada e a evidência mentiu.
    await page.evaluate(() => window.scrollTo(0, 0));
    await capturar(page, "EV-7-001-landing-completa-1440");
    await capturar(page, "EV-7-002-hero-duas-colunas-1440");

    // E só então: a rota de destino existe de verdade.
    await comecar.click();
    await page.waitForURL(/\/sua-historia/, { timeout: 30_000 });
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
    const comecar = page.getByRole("link", { name: "Começar", exact: true }).first();
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
