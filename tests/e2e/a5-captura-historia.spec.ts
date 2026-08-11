/**
 * A5 · CAPTURA DE SUA HISTÓRIA — os passos do wizard, com sessão real.
 *
 * Mesmo mecanismo das anteriores: a credencial entra por variável de ambiente
 * e não fica persistida em lugar nenhum.
 *
 *   A5_EMAIL=… A5_SENHA=… CAPTURA=1 CAPTURA_DIR=… \
 *     node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/a5-captura-historia.spec.ts --workers=1
 */
import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../.capturas");
const EMAIL = process.env.A5_EMAIL ?? "";
const SENHA = process.env.A5_SENHA ?? "";

/** O passo narrativo é o mais representativo: pergunta aberta, campo grande. */
const PASSOS: Array<[rota: string, nome: string]> = [
  ["/sua-historia/historia", "historia"],
  ["/sua-historia/revisao", "revisao"],
];

async function entrar(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function capturar(page: Page, rota: string, nome: string) {
  mkdirSync(DESTINO, { recursive: true });
  await page.goto(rota, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  console.log(`capturado: ${nome} (${rota})`);
}

test.skip(!process.env.CAPTURA || !EMAIL || !SENHA, "captura sob demanda — A5_EMAIL/A5_SENHA");
test.describe.configure({ mode: "serial" });

test("A5 · Sua História — desktop 1440", async ({ page }) => {
  await entrar(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [rota, nome] of PASSOS) await capturar(page, rota, `${nome}-desktop`);
});

test("A5 · Sua História — mobile 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  for (const [rota, nome] of PASSOS) await capturar(page, rota, `${nome}-mobile`);
});

test("A5 · zero overflow em 390 / 430 / 768 / 1440, em todo passo", async ({ page }) => {
  await entrar(page);

  for (const width of [390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });

    for (const [rota] of PASSOS) {
      await page.goto(rota, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      const medida = await page.evaluate(() => {
        const doc = document.documentElement;
        // Mesma regra das outras sondas: só `overflow-x: visible` deixa um
        // filho vazar de verdade — quem rola ou recorta contém o seu.
        const contido = (el: Element): boolean => {
          // O próprio elemento fixo já não empurra a página.
          if (getComputedStyle(el).position === "fixed") return true;
          let pai = el.parentElement;
          while (pai && pai !== doc) {
            const s = getComputedStyle(pai);
            if (s.overflowX !== "visible") return true;
            /**
             * `position: fixed` sai do fluxo do documento: o menu lateral do
             * `PatientShell`, fechado, fica deslocado para fora da tela à
             * direita e não soma um pixel ao `scrollWidth`. Sem esta linha a
             * sonda acusava o `aside` do menu como estouro em 390px — com o
             * documento medindo 390/390.
             */
            if (s.position === "fixed") return true;
            pai = pai.parentElement;
          }
          return false;
        };
        /**
         * `sr-only` é `position:absolute` com `clip: rect(0,0,0,0)` e 1px de
         * lado: ele existe para o leitor de tela e não desenha nada. O
         * retângulo dele pode cair fora da viewport sem que a página estoure —
         * foi assim que a A1 quase culpou o elemento errado. Quem é recortado,
         * ou não tem largura, não empurra ninguém.
         */
        const invisivel = (el: Element): boolean => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return (
            r.width <= 1 ||
            r.height <= 1 ||
            s.visibility === "hidden" ||
            s.display === "none" ||
            (s.clip !== "auto" && s.clip !== "") ||
            (s.clipPath !== "none" && s.clipPath !== "")
          );
        };

        const culpados: string[] = [];
        for (const el of Array.from(document.querySelectorAll("main *"))) {
          const r = el.getBoundingClientRect();
          if (
            (r.right > doc.clientWidth + 1 || r.left < -1) &&
            !contido(el) &&
            !invisivel(el)
          ) {
            culpados.push(el.tagName.toLowerCase());
          }
        }
        return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, culpados: culpados.slice(0, 3) };
      });

      console.log(`${width} | ${rota} | ${medida.scrollW}/${medida.clientW} | ${medida.culpados.length === 0 ? "nenhum" : medida.culpados.join(",")}`);
      expect(medida.scrollW, `overflow em ${width}px · ${rota}`).toBeLessThanOrEqual(medida.clientW);
      expect(medida.culpados, `elemento fora da viewport em ${width}px · ${rota}`).toEqual([]);
    }
  }
});
