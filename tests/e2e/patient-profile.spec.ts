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

test.describe("perfil do paciente (Sprint Produto 2)", () => {
  test.describe.configure({ mode: "serial" });

  test("paciente visualiza e atualiza o próprio perfil", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/paciente/perfil");
    await expect(page.getByRole("heading", { name: "Meu perfil" })).toBeVisible();

    await page.getByLabel("Telefone").fill("11987654321");
    await page.getByLabel("Cidade").fill("Belo Horizonte");
    await page.getByLabel("Estado").selectOption("MG");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible();

    // Recarrega para confirmar que os dados persistiram de verdade.
    await page.reload();
    await expect(page.getByLabel("Cidade")).toHaveValue("Belo Horizonte");
    await expect(page.getByLabel("Estado")).toHaveValue("MG");
  });

  test("mensagem de erro aparece próxima ao campo quando o telefone é inválido", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/paciente/perfil");
    await page.getByLabel("Telefone").fill("abc");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Informe um telefone válido.")).toBeVisible();
  });

  test("outros papéis não acessam /paciente/perfil", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "profissional")!;
    await loginAs(page, account);

    await page.goto("/paciente/perfil");
    await expect(page).toHaveURL("/acesso-negado");
  });
});

test.describe("perfil do paciente — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("formulário em coluna única, labels visíveis, sem dependência de hover", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, account);

    await page.goto("/paciente/perfil");

    const phoneInput = page.getByLabel("Telefone");
    const cityInput = page.getByLabel("Cidade");
    await expect(phoneInput).toBeVisible();
    await expect(cityInput).toBeVisible();

    const phoneBox = await phoneInput.boundingBox();
    const cityBox = await cityInput.boundingBox();
    expect(phoneBox).not.toBeNull();
    expect(cityBox).not.toBeNull();
    // Coluna única: um campo aparece inteiramente acima do outro, nunca lado a lado.
    expect(cityBox!.y).toBeGreaterThan(phoneBox!.y + phoneBox!.height - 1);

    const saveButton = page.getByRole("button", { name: "Salvar" });
    const buttonBox = await saveButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    // Alvo de toque mínimo recomendado (~44px).
    expect(buttonBox!.height).toBeGreaterThanOrEqual(40);
  });
});
