/**
 * A4 · CAPTURA DA JORNADA — Home e rota detalhada, com Caso aberto.
 *
 * Mesma conta e mesmo mecanismo da A3b: a paciente sintética do seed, cuja
 * credencial entra por variável de ambiente e não fica persistida em lugar
 * nenhum.
 *
 *   A4_EMAIL=… A4_SENHA=… CAPTURA=1 CAPTURA_DIR=… \
 *     node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/a4-captura-jornada.spec.ts --workers=1
 */
import { mkdirSync } from "node:fs";
import path from "node:path";

import { test, type Page } from "@playwright/test";

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../.capturas");
const EMAIL = process.env.A4_EMAIL ?? "";
const SENHA = process.env.A4_SENHA ?? "";

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
  // Nunca `networkidle`: a casa tem cena de ambiente que pode não assentar.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  console.log(`capturado: ${nome} (${rota})`);
}

test.skip(!process.env.CAPTURA || !EMAIL || !SENHA, "captura sob demanda — A4_EMAIL/A4_SENHA");
test.describe.configure({ mode: "serial" });

test("A4 · Home e Jornada — desktop 1440", async ({ page }) => {
  await entrar(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await capturar(page, "/paciente", "home-desktop");
  await capturar(page, "/paciente/linha-do-tempo", "jornada-desktop");
});

test("A4 · Jornada — mobile 390", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await capturar(page, "/paciente/linha-do-tempo", "jornada-mobile");
});
