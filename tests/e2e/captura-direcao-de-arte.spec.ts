/**
 * FERRAMENTA TEMPORÁRIA — captura para a direção de arte.
 *
 * Não é um teste: não afirma nada, não falha por conteúdo. Só percorre os
 * ambientes com cada papel e salva a tela inteira, para que a revisão de
 * direção de arte seja feita sobre o que a pessoa realmente vê, e não sobre
 * o que o código sugere que ela veria.
 *
 * Reaproveita o `loginAs` já usado por toda a suíte e o mesmo alvo local
 * guardado por `assertLocalSupabase()` em `playwright.config.ts`.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { test, type Page } from "@playwright/test";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../.capturas");

function contas(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json ausente. Rode `npm run bootstrap:test-users`.");
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

function conta(role: string): TestAccount {
  const encontrada = contas().find((a) => a.role === role);
  if (!encontrada) throw new Error(`conta de teste ausente: ${role}`);
  return encontrada;
}

async function loginAs(page: Page, account: TestAccount) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function capturar(page: Page, rota: string, nome: string) {
  mkdirSync(DESTINO, { recursive: true });
  await page.goto(rota, { waitUntil: "domcontentloaded" });
  // Espera pelo conteúdo, nunca por `networkidle` — a casa tem imagens de
  // ambiente que podem nunca "assentar" a rede.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  // eslint-disable-next-line no-console
  console.log(`capturado: ${nome} (${rota})`);
}

/**
 * Fora do CI por padrão: capturar 19 telas leva ~45s e não afirma nada, então
 * não tem lugar numa suíte de regressão. Roda sob demanda, quando houver uma
 * rodada de direção de arte:
 *
 *   CAPTURA=1 CAPTURA_DIR=<destino> node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/captura-direcao-de-arte.spec.ts --workers=1
 */
test.skip(!process.env.CAPTURA, "captura sob demanda — defina CAPTURA=1");

test.describe.configure({ mode: "serial" });

test("captura — fachada (público)", async ({ page }) => {
  await capturar(page, "/", "01-landing");
});

test("captura — porta de entrada", async ({ page }) => {
  await capturar(page, "/login", "02-login");
});

test("captura — recepção (paciente)", async ({ page }) => {
  await loginAs(page, conta("paciente"));
  await capturar(page, "/sua-historia", "03-recepcao-capa");
  await capturar(page, "/sua-historia/motivo", "04-recepcao-motivo");
  await capturar(page, "/sua-historia/revisao", "05-recepcao-revisao");
});

test("captura — casa da paciente", async ({ page }) => {
  await loginAs(page, conta("paciente"));
  await capturar(page, "/paciente", "06-paciente-home");
  await capturar(page, "/paciente/curadoria", "07-paciente-curadoria");
  await capturar(page, "/paciente/linha-do-tempo", "08-paciente-linha-do-tempo");
  await capturar(page, "/paciente/documentos", "09-paciente-documentos");
  await capturar(page, "/paciente/perfil", "10-paciente-perfil");
});

test("captura — curadoria", async ({ page }) => {
  await loginAs(page, conta("curador_medico"));
  await capturar(page, "/coa/curadoria", "11-curadoria-fila");
});

test("captura — concierge e atendimento", async ({ page }) => {
  await loginAs(page, conta("administrador"));
  await capturar(page, "/acompanhamento", "12-concierge");
  await capturar(page, "/atendimento", "13-atendimento");
});

test("captura — administração", async ({ page }) => {
  await loginAs(page, conta("administrador"));
  await capturar(page, "/admin", "14-admin-painel");
  await capturar(page, "/admin/pacientes", "15-admin-pacientes");
  await capturar(page, "/admin/crm", "16-admin-crm");
});

test("captura — profissional", async ({ page }) => {
  await loginAs(page, conta("profissional"));
  await capturar(page, "/profissional", "17-profissional");
});

test("captura — fachada em mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await capturar(page, "/", "18-landing-mobile");
});

test("captura — casa da paciente em mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAs(page, conta("paciente"));
  await capturar(page, "/paciente", "19-paciente-home-mobile");
});
