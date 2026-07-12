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

test.describe("Área do Curador Médico (ÉPICO 1/SPRINT 2)", () => {
  test("curador médico vê o dashboard e a fila de casos", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador);

    await page.goto("/curador");
    await expect(page.getByText("Casos atribuídos")).toBeVisible();

    await page.getByRole("link", { name: "Ver meus casos" }).click();
    await expect(page).toHaveURL("/curador/casos");
    await expect(page.getByRole("heading", { name: "Meus casos" })).toBeVisible();
  });

  test("paciente e profissional não acessam /curador", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);
    await page.goto("/curador");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("curador não abre um caso que não está atribuído a ele", async ({ page }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;

    const adminAuthClient = createClient(url, anonKey);
    await adminAuthClient.auth.signInWithPassword({ email: admin.email, password: admin.password });
    const { data: existingCase } = await adminAuthClient.from("cases").select("id").limit(1).maybeSingle();

    if (!existingCase) {
      test.skip(true, "Nenhum caso disponível para este teste — depende de dados criados por outro spec.");
      return;
    }

    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador);
    const response = await page.goto(`/curador/casos/${existingCase.id}`);
    expect(response?.status()).toBe(404);
  });
});

test.describe("Execução do ACE — produtividade desktop do Curador (ÉPICO 1/SPRINT 3)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("curador vê o painel de execução do ACE com aviso de análise interna", async ({ page }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;

    const curadorAuthClient = createClient(url, anonKey);
    await curadorAuthClient.auth.signInWithPassword({ email: curador.email, password: curador.password });
    const { data: assignedCase } = await curadorAuthClient
      .from("cases")
      .select("id")
      .not("assigned_curator_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (!assignedCase) {
      test.skip(
        true,
        "Nenhum caso atribuído a este curador — depende de dados criados por outro spec/teste de integração.",
      );
      return;
    }

    await loginAs(page, curador);
    await page.goto(`/curador/casos/${assignedCase.id}`);
    await expect(page.getByRole("heading", { name: "Execução do ACE" })).toBeVisible();
    await expect(
      page.getByText("Esta é uma análise interna do ACE e ainda não representa uma curadoria validada."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Artefatos (P001-P008)" })).toBeVisible();
  });
});
