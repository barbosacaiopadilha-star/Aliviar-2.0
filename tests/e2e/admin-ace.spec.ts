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
  // Sempre parte de uma sessão limpa: /login redireciona quem já está
  // autenticado, então trocar de papel dentro do mesmo teste nunca chegaria ao
  // formulário. A sessão do browser vive em cookies (createBrowserClient do
  // pacote @supabase/ssr) — é o cookie que precisa sair.
  await page.context().clearCookies();
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

  // O rótulo real na sidebar é "Observabilidade ACE", no grupo Analytics
  // (shell/nav-items.ts) — o link não foi adicionado nem renomeado para o
  // teste; o teste é que passou a usar o nome que existe.
  test("link de Observabilidade ACE aparece na navegação do administrador", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Observabilidade ACE" })
      .first()
      .click();
    await expect(page).toHaveURL("/admin/ace");
  });
});
