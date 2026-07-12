import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

type TestAccount = {
  role: string;
  email: string;
  password: string;
};

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não encontrado. Execute `npm run bootstrap:test-users` antes dos testes E2E.",
    );
  }

  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const GENERIC_RESET_SUCCESS =
  "Se o e-mail existir em nossa base, você receberá instruções para redefinir sua senha.";

test.describe("autenticação (E2E)", () => {
  test("login válido redireciona para a área inicial do papel", async ({ page }) => {
    const paciente = loadTestAccounts().find((account) => account.role === "paciente");
    expect(paciente).toBeDefined();

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(paciente!.email);
    await page.getByLabel("Senha").fill(paciente!.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Aliviar Conexão" })).toBeVisible();
  });

  test("login inválido mostra erro e permanece na página de login", async ({ page }) => {
    const account = loadTestAccounts()[0];

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill("senha-invalida-de-proposito");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("form").getByRole("alert")).toContainText("Credenciais inválidas.");
  });

  test("logout encerra a sessão e retorna para /login", async ({ page }) => {
    const account = loadTestAccounts().find((item) => item.role === "profissional");
    expect(account).toBeDefined();

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(account!.email);
    await page.getByLabel("Senha").fill(account!.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/recuperar-senha");
    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/area-restrita");
    await expect(page).toHaveURL(/\/login\?next=%2Farea-restrita$/);
  });

  test("recuperação de senha exibe mensagem genérica de sucesso", async ({ page }) => {
    await page.goto("/recuperar-senha");
    await page.getByLabel("E-mail").fill("usuario.exemplo@aliviar.test");
    await page.getByRole("button", { name: "Enviar instruções" }).click();

    await expect(page.locator("form").getByRole("alert")).toContainText(GENERIC_RESET_SUCCESS);
  });

  test("redirecionamento pós-login respeita next seguro e ignora next inseguro", async ({
    page,
    context,
  }) => {
    const account = loadTestAccounts().find((item) => item.role === "administrador");
    expect(account).toBeDefined();

    await page.goto("/login?next=//evil.com");
    await page.getByLabel("E-mail").fill(account!.email);
    await page.getByLabel("Senha").fill(account!.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");

    await context.clearCookies();

    await page.goto("/login?next=%2Farea-restrita");
    await page.getByLabel("E-mail").fill(account!.email);
    await page.getByLabel("Senha").fill(account!.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/area-restrita");
  });

  test("rota protegida sem sessão redireciona para /login", async ({ page }) => {
    await page.goto("/area-restrita");

    await expect(page).toHaveURL(/\/login\?next=%2Farea-restrita$/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});
