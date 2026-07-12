import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não encontrado. Execute `npm run bootstrap:test-users` antes destes testes.",
    );
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

async function loginAs(page: Page, account: TestAccount) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Observabilidade do ACE — /admin/ace (sprint intermediária)", () => {
  test("administrador vê o dashboard operacional do ACE", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin/ace");
    await expect(page.getByRole("heading", { name: "Observabilidade do ACE" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Health Check do Método" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Métricas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Histórico de execuções" })).toBeVisible();
  });

  test("curador médico e paciente não acessam /admin/ace", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador);
    await page.goto("/admin/ace");
    await expect(page).toHaveURL("/acesso-negado");

    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);
    await page.goto("/admin/ace");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("link 'Observabilidade do ACE' aparece na navegação do administrador", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");
    await page.getByRole("link", { name: "Observabilidade do ACE" }).click();
    await expect(page).toHaveURL("/admin/ace");
  });
});
