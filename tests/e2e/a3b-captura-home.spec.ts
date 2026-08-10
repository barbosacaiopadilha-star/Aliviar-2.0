/**
 * A3b · CAPTURA DA HOME COM CASO ABERTO — o caminho principal.
 *
 * O harness geral (`captura-direcao-de-arte.spec.ts`) entra com a conta padrão
 * de `test-users.local.json`, que **não tem Case** — ela exercita só o ramo
 * "sem Case" da Home. A repaginação da A3b incide sobre o outro ramo:
 * `AmbientHero`, `JourneyWalk`, `ProfileCard` e `CuradoriaCard` só existem lá.
 *
 * A conta com Case é a paciente sintética do seed da Mesa, cuja credencial é
 * emitida na criação e não fica persistida em lugar nenhum. Por isso ela entra
 * por variável de ambiente: nada de senha em arquivo, nem em relatório.
 *
 *   A3B_EMAIL=… A3B_SENHA=… CAPTURA=1 CAPTURA_DIR=… \
 *     node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/a3b-captura-home.spec.ts --workers=1
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../.capturas");
const EMAIL = process.env.A3B_EMAIL ?? "";
const SENHA = process.env.A3B_SENHA ?? "";

async function entrar(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function capturar(page: Page, nome: string) {
  mkdirSync(DESTINO, { recursive: true });
  await page.goto("/paciente", { waitUntil: "domcontentloaded" });
  // Nunca `networkidle`: a casa tem cena ambiente que pode não assentar.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
   
  console.log(`capturado: ${nome}`);
}

test.describe.configure({ mode: "serial" });

/**
 * A landing, para a comparação de continuidade — e ela precisa de um passeio
 * antes da foto.
 *
 * `reveal.tsx` revela as seções por `IntersectionObserver`. Numa captura
 * `fullPage` o observador nunca dispara para o que está fora da viewport, e a
 * página sai com o hero certo e o miolo em branco. Rolar de ponta a ponta
 * antes de fotografar é o que torna a imagem comparável.
 */
test("A3b · a landing, com as seções reveladas", async ({ page }) => {
  test.skip(!process.env.CAPTURA, "captura sob demanda — defina CAPTURA=1");

  for (const [largura, altura, nome] of [
    [1440, 900, "landing-desktop"],
    [390, 844, "landing-mobile"],
  ] as const) {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < total; y += Math.floor(altura * 0.7)) {
      await page.evaluate((topo) => window.scrollTo(0, topo), y);
      await page.waitForTimeout(220);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);

    mkdirSync(DESTINO, { recursive: true });
    await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
    console.log(`capturado: ${nome}`);
  }
});

/**
 * As capturas da Home exigem sessão; a da landing, não. Por isso a guarda é
 * por teste — `test.skip` no topo do arquivo valeria para todos, inclusive
 * para a landing, que não precisa de credencial nenhuma.
 */
function exigeSessao() {
  test.skip(!process.env.CAPTURA || !EMAIL || !SENHA, "captura sob demanda — A3B_EMAIL/A3B_SENHA");
}

test("A3b · Home com Caso aberto — desktop 1440", async ({ page }) => {
  exigeSessao();
  await entrar(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await capturar(page, "home-com-caso-desktop");
});

test("A3b · Home com Caso aberto — mobile 390", async ({ page }) => {
  exigeSessao();
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await capturar(page, "home-com-caso-mobile");
});

/**
 * A1 não pode regredir no caminho que a A3b repaginou. A medição da A3a roda
 * na conta sem Case; esta roda na Home com `AmbientHero`, régua, Perfil e
 * Curadoria em tela — que é onde a mudança aconteceu.
 */
test("A3b · zero overflow em 390 / 430 / 768 / 1440, com Caso aberto", async ({ page }) => {
  exigeSessao();
  await entrar(page);
  const linhas: string[] = ["viewport | docScrollW | docClientW | elemento que estoura"];

  for (const width of [390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/paciente", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const medida = await page.evaluate(() => {
      const doc = document.documentElement;

      /**
       * Um elemento DENTRO de um contêiner que rola ou recorta na horizontal
       * pode passar da viewport sem que a PÁGINA estoure: a régua da jornada
       * rola (scroll interno, que o §17 manda preservar) e a cena do hero é
       * recortada por `overflow: hidden`. Só `overflow-x: visible` deixa um
       * filho vazar de verdade — quem estoura é quem cruza a borda sem nenhum
       * ancestral que o contenha.
       */
      const contidoPorAncestral = (el: Element): boolean => {
        let pai = el.parentElement;
        while (pai && pai !== doc) {
          if (getComputedStyle(pai).overflowX !== "visible") return true;
          pai = pai.parentElement;
        }
        return false;
      };

      const culpados: string[] = [];
      for (const el of Array.from(document.querySelectorAll("#patient-main *"))) {
        const r = el.getBoundingClientRect();
        if ((r.right > doc.clientWidth + 1 || r.left < -1) && !contidoPorAncestral(el)) {
          culpados.push(
            `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(/\s+/).slice(0, 2).join(".")}`,
          );
        }
      }
      return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, culpados: culpados.slice(0, 3) };
    });

    linhas.push(
      `${width} | ${medida.scrollW} | ${medida.clientW} | ${medida.culpados.length === 0 ? "nenhum" : medida.culpados.join(" ; ")}`,
    );

    expect(medida.scrollW, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(medida.clientW);
    expect(medida.culpados, `elemento fora da viewport em ${width}px`).toEqual([]);
  }

  mkdirSync(DESTINO, { recursive: true });
  writeFileSync(path.join(DESTINO, "medicao-overflow-com-caso.txt"), linhas.join("\n"));
   
  console.log(linhas.join("\n"));
});
