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

async function loginAs(page: import("@playwright/test").Page, account: TestAccount) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("AppShell visual (TASK-005B)", () => {
  test.describe.configure({ mode: "serial" });

  // "paciente" não usa mais o AppShell compartilhado (ver PatientShell,
  // testado em "PatientShell visual" abaixo) — admin/curador continuam
  // intocados neste shell.
  for (const scenario of [
    { role: "administrador", route: "/admin", label: "Início" },
    { role: "profissional", route: "/profissional", label: "Início" },
  ] as const) {
    test(`sidebar desktop navega para ${scenario.route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const account = loadTestAccounts().find((item) => item.role === scenario.role);
      expect(account).toBeDefined();

      await loginAs(page, account!);
      await page.goto(scenario.route);

      await page.getByRole("complementary").getByRole("link", { name: scenario.label }).click();
      await expect(page).toHaveURL(scenario.route);
      await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    });

    test(`drawer mobile navega para ${scenario.route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const account = loadTestAccounts().find((item) => item.role === scenario.role);
      expect(account).toBeDefined();

      await loginAs(page, account!);
      await page.goto(scenario.route);

      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: scenario.label }).click();
      await expect(page).toHaveURL(scenario.route);
      await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    });
  }
});

test.describe("PatientShell visual (ambiente exclusivo do paciente)", () => {
  test.describe.configure({ mode: "serial" });

  test("header desktop navega para /paciente e não expõe sidebar administrativa", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const account = loadTestAccounts().find((item) => item.role === "paciente");
    expect(account).toBeDefined();

    await loginAs(page, account!);
    await page.goto("/paciente/perfil");

    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Início" }).click();
    await expect(page).toHaveURL("/paciente");
    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    // Nunca deve existir sidebar administrativa na área do paciente.
    await expect(page.getByRole("complementary")).toHaveCount(0);
  });

  test("drawer mobile navega para /paciente", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const account = loadTestAccounts().find((item) => item.role === "paciente");
    expect(account).toBeDefined();

    await loginAs(page, account!);
    await page.goto("/paciente/perfil");

    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Início" }).click();
    await expect(page).toHaveURL("/paciente");
    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();
  });
});
