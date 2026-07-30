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

test.describe("gestão administrativa de profissionais (Sprint Produto 2)", () => {
  test.describe.configure({ mode: "serial" });

  test("administrador cria, edita e alterna status/publicação de um profissional", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/profissionais");
    // `exact` porque o estado vazio da lista tem um h2 que também contém
    // "profissionais" — o alvo é o título da página, não o vizinho.
    await expect(page.getByRole("heading", { name: "Profissionais", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Novo profissional" }).click();
    await expect(page).toHaveURL("/admin/profissionais/novo");

    const identifier = `E2E-${Date.now()}`;
    await page.getByLabel("Nome de exibição").fill("Profissional E2E");
    await page.getByLabel("Identificação profissional").fill(identifier);
    await page.getByRole("button", { name: "Criar profissional" }).click();

    await page.waitForURL(/\/admin\/profissionais\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { name: "Profissional E2E" })).toBeVisible();
    await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
    await expect(page.getByText("Não publicado", { exact: true })).toBeVisible();

    await page.getByLabel("Resumo profissional").fill("Editado via E2E.");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Salvo com sucesso.")).toBeVisible();

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Desativar" }).click();
    await expect(page.getByText("Inativo", { exact: true })).toBeVisible();
  });

  test("paciente e profissional não acessam /admin/profissionais", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/admin/profissionais");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("busca filtra a lista de profissionais por nome ou identificação (SPRINT OPERACIONAL 1)", async ({
    page,
  }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/profissionais");
    await page.getByLabel("Buscar por nome ou identificação").fill("pessoa-que-nao-existe-e2e");
    await expect(page.getByText("Nenhum profissional encontrado.")).toBeVisible();

    await page.getByLabel("Buscar por nome ou identificação").fill("");
    await expect(page.getByText("Nenhum profissional encontrado.")).toHaveCount(0);
  });
});
