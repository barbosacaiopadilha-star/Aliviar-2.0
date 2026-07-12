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

test.describe("Acesso a 'Sua História' (ADR-018 — nunca preenchimento anônimo)", () => {
  test("a raiz explicativa continua acessível sem sessão", async ({ page }) => {
    await page.goto("/sua-historia");
    await expect(page.getByRole("heading", { name: "Vamos entender como podemos ajudar." })).toBeVisible();
  });

  test("sem sessão, qualquer etapa do wizard redireciona para /login com next", async ({ page }) => {
    await page.goto("/sua-historia/para-quem");
    await expect(page).toHaveURL(/\/login\?next=%2Fsua-historia%2Fpara-quem/);

    await page.goto("/sua-historia/revisao");
    await expect(page).toHaveURL(/\/login\?next=%2Fsua-historia%2Frevisao/);
  });

  test("profissional autenticado sem papel paciente não acessa o wizard", async ({ page }) => {
    const profissional = loadTestAccounts().find((a) => a.role === "profissional")!;
    await loginAs(page, profissional);

    await page.goto("/sua-historia/para-quem");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("paciente autenticado acessa o wizard normalmente", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/sua-historia/para-quem");
    await expect(page.getByRole("heading", { name: "Para quem é esta busca?" })).toBeVisible();
  });
});
