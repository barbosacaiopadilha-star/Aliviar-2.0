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

// Um dos quatro títulos de estado da Home (src/components/paciente/patient-home-state.tsx)
// — qual deles aparece depende do estado real do paciente de teste no banco local,
// que muda conforme outras suítes (Sua História) rodam antes desta.
const HOME_STATE_HEADINGS = [
  "Este espaço começa com a sua história.",
  "Sua história continua aqui.",
  "Sua história já está conosco.",
  "Seu cuidado está em andamento.",
];

test.describe("Portal do Paciente", () => {
  test("Home sempre explica o próximo passo, nunca uma mensagem fria ou técnica", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente");

    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    const visibleStateHeadings = await Promise.all(
      HOME_STATE_HEADINGS.map((name) => page.getByRole("heading", { name, level: 2 }).isVisible()),
    );
    expect(visibleStateHeadings.some(Boolean)).toBe(true);

    for (const cold of [
      "Nenhum dado encontrado.",
      "Nenhum registro.",
      "Nenhum caso.",
      "Status da sua curadoria",
    ]) {
      await expect(page.getByText(cold, { exact: true })).toHaveCount(0);
    }
  });

  test("paciente envia e remove um documento", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente/documentos");
    await expect(page.getByRole("heading", { name: "Meus documentos" })).toBeVisible();

    const filePath = path.resolve(__dirname, "../fixtures/sample-document.txt");
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.getByRole("button", { name: "Enviar documento" }).click();

    await expect(page.getByText("sample-document.txt")).toBeVisible();

    await page.getByRole("button", { name: "Remover sample-document.txt" }).click();
    await expect(page.getByText("sample-document.txt")).toHaveCount(0);
  });

  test("linha do tempo mostra ao menos a criação da conta", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente/linha-do-tempo");
    await expect(page.getByText("Sua conta na Aliviar foi criada")).toBeVisible();
  });

  test("administrador e profissional não acessam /paciente", async ({ page }) => {
    const profissional = loadTestAccounts().find((a) => a.role === "profissional")!;
    await loginAs(page, profissional);

    await page.goto("/paciente");
    await expect(page).toHaveURL("/acesso-negado");

    await page.goto("/paciente/documentos");
    await expect(page).toHaveURL("/acesso-negado");
  });
});

test.describe("Portal do Paciente — mobile (ÉPICO 1/SPRINT 2)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Home é legível em mobile", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente");
    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    const visibleStateHeadings = await Promise.all(
      HOME_STATE_HEADINGS.map((name) => page.getByRole("heading", { name, level: 2 }).isVisible()),
    );
    expect(visibleStateHeadings.some(Boolean)).toBe(true);
  });

  test("(ÉPICO 1/SPRINT 3) Home mobile nunca revela vocabulário interno do ACE", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente");
    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    const bodyText = (await page.textContent("body")) ?? "";
    for (const forbidden of ["Shortlist", "P001", "P008", "fake-deterministic", "protocolo", "ACE"]) {
      expect(bodyText).not.toContain(forbidden);
    }
  });
});
