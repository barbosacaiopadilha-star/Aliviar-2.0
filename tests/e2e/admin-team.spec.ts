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

test.describe("gestão de equipe e papéis internos (SPRINT OPERACIONAL 1)", () => {
  test.describe.configure({ mode: "serial" });

  test("administrador concede e revoga o papel Curador Médico", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    const profissional = loadTestAccounts().find((a) => a.role === "profissional")!;
    await loginAs(page, admin);

    await page.goto("/admin/equipe");
    await expect(page.getByRole("heading", { name: "Equipe" })).toBeVisible();

    await page.getByLabel("Buscar por nome ou e-mail").fill(profissional.email);
    const row = page.getByRole("row").filter({ hasText: profissional.email });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "Conceder Curador Médico" }).click();
    await expect(row.getByText("Curador Médico", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: "Revogar Curador Médico" }).click();
    await expect(row.getByText("Curador Médico", { exact: true })).toHaveCount(0);
  });

  test("administrador não pode revogar o próprio papel de administrador", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin/equipe");
    await page.getByLabel("Buscar por nome ou e-mail").fill(admin.email);
    const row = page.getByRole("row").filter({ hasText: admin.email });

    await expect(row.getByRole("button", { name: "Revogar Administrador" })).toBeDisabled();
  });

  test("paciente e profissional não acessam /admin/equipe", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/admin/equipe");
    await expect(page).toHaveURL("/acesso-negado");
  });
});
