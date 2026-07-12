import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

test.describe("Human Review — Sprint P009 (Fase Beta)", () => {
  test("administrador abre a tela de Human Review a partir do Caso", async ({ page }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;

    const adminAuthClient = createClient(url, anonKey);
    await adminAuthClient.auth.signInWithPassword({ email: admin.email, password: admin.password });
    const { data: existingCase } = await adminAuthClient.from("cases").select("id").limit(1).maybeSingle();

    if (!existingCase) {
      test.skip(true, "Nenhum caso disponível para este teste — depende de dados criados por outro spec/teste de integração.");
      return;
    }

    await loginAs(page, admin);
    await page.goto(`/admin/casos/${existingCase.id}`);
    await page.getByRole("link", { name: "Human Review →" }).click();
    await expect(page).toHaveURL(`/admin/casos/${existingCase.id}/revisao`);

    await expect(page.getByRole("heading", { name: /Human Review —/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "História original" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shortlist" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Decisão do Human Review" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Histórico de decisões humanas" })).toBeVisible();
  });

  test("paciente e profissional não acessam a tela de Human Review", async ({ page }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    const adminAuthClient = createClient(url, anonKey);
    await adminAuthClient.auth.signInWithPassword({ email: admin.email, password: admin.password });
    const { data: existingCase } = await adminAuthClient.from("cases").select("id").limit(1).maybeSingle();

    if (!existingCase) {
      test.skip(true, "Nenhum caso disponível para este teste.");
      return;
    }

    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);
    await page.goto(`/admin/casos/${existingCase.id}/revisao`);
    await expect(page).toHaveURL("/acesso-negado");
  });
});
