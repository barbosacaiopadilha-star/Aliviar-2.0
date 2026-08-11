/**
 * A6 · CAPTURA DA CENTRAL DE DOCUMENTOS — sessão real, mesmo mecanismo da A5.
 *
 * A credencial entra por variável de ambiente e não fica persistida em lugar
 * nenhum. O diretório de destino separa BEFORE de AFTER.
 *
 *   A6_EMAIL=… A6_SENHA=… CAPTURA=1 CAPTURA_DIR=evidencias/a6/before \
 *     node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/a6-captura-documentos.spec.ts --workers=1
 */
import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../evidencias/a6");
const EMAIL = process.env.A6_EMAIL ?? "";
const SENHA = process.env.A6_SENHA ?? "";

const ROTA = "/paciente/documentos";

async function entrar(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function capturar(page: Page, nome: string) {
  mkdirSync(DESTINO, { recursive: true });
  await page.goto(ROTA, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  console.log(`capturado: ${nome}`);
}

test.skip(!process.env.CAPTURA || !EMAIL || !SENHA, "captura sob demanda — A6_EMAIL/A6_SENHA");
test.describe.configure({ mode: "serial" });

test("A6 · Central de Documentos — desktop 1440", async ({ page }) => {
  await entrar(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await capturar(page, "documentos-desktop");
});

test("A6 · Central de Documentos — mobile 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await capturar(page, "documentos-mobile");
});

/**
 * O §22 é obrigatório: 390 sem scroll horizontal. Medido no documento, não a
 * olho — a régua é o `scrollWidth` contra o `clientWidth`.
 */
test("A6 · zero overflow em 390 / 430 / 768 / 1440", async ({ page }) => {
  await entrar(page);

  for (const width of [390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ROTA, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(0);
  }
});
