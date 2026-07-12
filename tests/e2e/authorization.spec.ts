import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

type TestAccount = {
  role: string;
  email: string;
  password: string;
};

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não encontrado. Execute `npm run bootstrap:test-users` antes destes testes.",
    );
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const ROLE_ROUTES = ["/admin", "/profissional", "/paciente"] as const;

// O login sem `next` na URL aterrissa em "/" (comportamento existente desde
// a TASK-004B, em src/components/auth/login-form.tsx — arquivo fora do
// escopo desta tarefa). Espera o redirecionamento pós-login se estabilizar
// antes de prosseguir, evitando corrida entre o clique e a navegação
// seguinte do teste.
async function loginAs(page: Page, account: TestAccount) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/");
}

test.describe("autorização por papel (TASK-005A)", () => {
  // As 3 contas de teste (paciente/profissional/administrador) são
  // compartilhadas entre todos os cenários. Rodar em série evita que um
  // teste concorrente (ex.: logout) invalide a sessão de outro que está
  // usando a mesma conta ao mesmo tempo.
  test.describe.configure({ mode: "serial" });

  test.describe("sem sessão", () => {
    for (const route of ROLE_ROUTES) {
      test(`${route} redireciona para /login?next=${encodeURIComponent(route)}`, async ({
        page,
      }) => {
        await page.goto(route);
        await expect(page).toHaveURL(`/login?next=${encodeURIComponent(route)}`);
      });
    }
  });

  test("administrador: acessa /admin, é barrado em /profissional e /paciente", async ({
    page,
  }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    await expect(page.getByText("Papel atual: administrador")).toBeVisible();

    await page.goto("/profissional");
    await expect(page).toHaveURL("/acesso-negado");

    await page.goto("/paciente");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("profissional: acessa /profissional, é barrado em /admin e /paciente", async ({
    page,
  }) => {
    const account = loadTestAccounts().find((a) => a.role === "profissional")!;
    await loginAs(page, account);

    await page.goto("/profissional");
    await expect(page).toHaveURL("/profissional");
    await expect(page.getByText("Papel atual: profissional")).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL("/acesso-negado");

    await page.goto("/paciente");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("paciente: acessa /paciente, é barrado em /admin e /profissional", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/paciente");
    await expect(page).toHaveURL("/paciente");
    await expect(page.getByText("Papel atual: paciente")).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL("/acesso-negado");

    await page.goto("/profissional");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("/acesso-negado não entra em loop e oferece volta para a área correta", async ({
    page,
  }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/admin");
    await expect(page).toHaveURL("/acesso-negado");
    await expect(page.getByRole("heading", { name: "Acesso negado" })).toBeVisible();

    await page.getByRole("link", { name: "Voltar para a minha área" }).click();
    await expect(page).toHaveURL("/paciente");
  });

  test("rota inexistente apresenta o estado 404 (autenticado)", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    const response = await page.goto("/esta-rota-nao-existe-de-verdade");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  });

  test("logout encerra a sessão e impede novo acesso às rotas protegidas", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/paciente");
    await expect(page).toHaveURL("/paciente");

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL("/login");

    await page.goto("/paciente");
    await expect(page).toHaveURL("/login?next=%2Fpaciente");
  });
});
