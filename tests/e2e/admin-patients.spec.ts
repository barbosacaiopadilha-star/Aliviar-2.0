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

test.describe("gestão administrativa de pacientes (correção de regra de negócio)", () => {
  test.describe.configure({ mode: "serial" });

  test("administrador cria paciente, vê credenciais uma única vez, e o paciente consegue logar", async ({
    page,
    context,
  }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/pacientes");
    await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cadastre-se" })).toHaveCount(0);

    await page.getByRole("link", { name: "Novo paciente" }).click();
    await expect(page).toHaveURL("/admin/pacientes/novo");

    const email = `e2e-paciente-${Date.now()}@aliviar-conexao.local`;
    await page.getByLabel("Nome do paciente").fill("Paciente E2E");
    await page.getByLabel("E-mail (será o login)").fill(email);
    await page.getByRole("button", { name: "Criar paciente e gerar senha" }).click();

    await expect(page.getByRole("heading", { name: "Credenciais de acesso" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    const passwordText = await page.locator("dd.font-mono").nth(1).textContent();
    expect(passwordText).toBeTruthy();
    const password = passwordText!.trim();

    // A senha só aparece aqui — navegar para longe e voltar não a recupera.
    await page.getByRole("link", { name: "Concluir" }).click();
    await expect(page).toHaveURL("/admin/pacientes");
    await page.goto("/admin/pacientes");
    await expect(page.getByText(password)).toHaveCount(0);

    await page.getByRole("button", { name: "Sair" }).click();

    // O paciente recém-criado consegue logar normalmente com as credenciais entregues.
    const patientPage = await context.newPage();
    await patientPage.goto("/login");
    await patientPage.getByLabel("E-mail").fill(email);
    await patientPage.getByLabel("Senha").fill(password);
    await patientPage.getByRole("button", { name: "Entrar" }).click();
    await patientPage.waitForURL((url) => !url.pathname.startsWith("/login"));
    await expect(patientPage).toHaveURL("/paciente");
  });

  test("paciente e profissional não acessam /admin/pacientes", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/admin/pacientes");
    await expect(page).toHaveURL("/acesso-negado");

    await page.goto("/admin/pacientes/novo");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("não existe rota de cadastro público", async ({ page }) => {
    // D2 (auditoria 22/08): rota desconhecida agora atravessa o middleware e
    // recebe o 404 direto — que é a prova MAIS forte do que este teste sempre
    // quis: /cadastro e /signup não são "protegidas", são AUSENTES, e o
    // visitante vê isso sem ser convidado a entrar.
    await page.goto("/cadastro");
    await expect(page).toHaveURL(/\/cadastro$/);
    await expect(page.getByRole("heading", { name: "Não encontramos esta página" })).toBeVisible();

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "Não encontramos esta página" })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("link", { name: /cadastr/i })).toHaveCount(0);

    // Autenticado, o middleware deixa de interceptar essas rotas — e como
    // nenhum page.tsx existe nesses caminhos, o Next responde 404 de verdade.
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    const response = await page.goto("/cadastro");
    expect(response?.status()).toBe(404);

    const response2 = await page.goto("/signup");
    expect(response2?.status()).toBe(404);
  });

  test("busca filtra a lista de pacientes por nome ou e-mail (SPRINT OPERACIONAL 1)", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/pacientes");
    await page.getByLabel("Buscar por nome ou e-mail").fill("pessoa-que-nao-existe-e2e");
    await expect(page.getByText("Nenhum paciente encontrado.")).toBeVisible();

    await page.getByLabel("Buscar por nome ou e-mail").fill("");
    await expect(page.getByText("Nenhum paciente encontrado.")).toHaveCount(0);
  });
});

test.describe("gestão administrativa de pacientes — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("lista e formulário de novo paciente funcionam em coluna única", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/pacientes/novo");
    const nameInput = page.getByLabel("Nome do paciente");
    const emailInput = page.getByLabel("E-mail (será o login)");

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();

    const nameBox = await nameInput.boundingBox();
    const emailBox = await emailInput.boundingBox();
    expect(nameBox).not.toBeNull();
    expect(emailBox).not.toBeNull();
    expect(emailBox!.y).toBeGreaterThan(nameBox!.y + nameBox!.height - 1);
  });
});
