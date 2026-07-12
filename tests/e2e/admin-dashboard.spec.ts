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

test.describe("dashboard administrativo (SPRINT OPERACIONAL 1)", () => {
  test("mostra indicadores, pendências e atividade recente reais, não o placeholder genérico", async ({
    page,
  }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");

    await expect(page.getByText("Pacientes ativos")).toBeVisible();
    await expect(page.getByText("Profissionais ativos")).toBeVisible();
    await expect(page.getByText("Administradores")).toBeVisible();
    await expect(page.getByText("Curadores médicos")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pendências" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Atividade recente" })).toBeVisible();

    await expect(page.getByText("Ainda não há informações para exibir.")).toHaveCount(0);
  });
});
