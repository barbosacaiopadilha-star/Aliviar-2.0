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

// O login sem `next` na URL aterrissa na home do papel resolvido
// (src/modules/auth/role-home.ts). Espera o redirecionamento pós-login se
// estabilizar antes de prosseguir, evitando corrida entre o clique e a
// navegação seguinte do teste.
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
    // /admin deixou de usar o painel genérico ("Papel atual: …") quando passou
    // a mostrar a visão executiva real. A prova de que é a home do
    // Administrador, e não a de outro papel, é o próprio subtítulo da página.
    await expect(page.getByText("Visão executiva da operação da Aliviar.")).toBeVisible();

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
    // A Jornada deixou de usar o painel genérico ("Papel atual: …") quando
    // ganhou o próprio shell. A prova de que a pessoa chegou à casa dela é a
    // saudação pelo nome, que existe em qualquer estado da jornada.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Olá,");

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
    // "Acesso negado" é o title da aba; o que a pessoa lê na tela é uma frase
    // inteira, escrita para não soar como punição.
    await expect(
      page.getByRole("heading", { name: "Esta área não está disponível para você" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Voltar para a minha área" }).click();
    await expect(page).toHaveURL("/paciente");
  });

  test("rota inexistente apresenta o estado 404 (autenticado)", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    const response = await page.goto("/esta-rota-nao-existe-de-verdade");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Não encontramos esta página" })).toBeVisible();
  });

  test("logout encerra a sessão e impede novo acesso às rotas protegidas", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/paciente");
    await expect(page).toHaveURL("/paciente");

    // A plataforma passou a ter um único componente de usuário autenticado:
    // "Sair" vive dentro do menu do usuário, não solto no cabeçalho.
    await page.getByRole("button", { name: /^Menu do usuário/ }).click();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL("/login");

    await page.goto("/paciente");
    await expect(page).toHaveURL("/login?next=%2Fpaciente");
  });
});
