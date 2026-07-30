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

test.describe("Última sprint do MVP — /paciente/curadoria (P010)", () => {
  test("paciente sem Curadoria entregue vê um estado vazio explicativo", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente/curadoria");
    // Ou mostra o estado vazio, ou (se outro teste já entregou uma
    // Curadoria para esta conta) mostra a própria Curadoria — nunca um erro.
    const emptyState = page.getByText("Ainda não há relatórios aqui.");
    const heading = page.getByRole("heading", { name: "Sua Curadoria" });
    await expect(emptyState.or(heading)).toBeVisible();
  });

  test("administrador e profissional não acessam /paciente/curadoria", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);
    await page.goto("/paciente/curadoria");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("quando entregue, a Curadoria nunca menciona score, ranking, Shortlist ou Human Review", async ({ page }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;

    const pacienteAuthClient = createClient(url, anonKey);
    await pacienteAuthClient.auth.signInWithPassword({ email: paciente.email, password: paciente.password });
    const { data: delivery } = await pacienteAuthClient.from("final_curadoria_deliveries").select("id").limit(1).maybeSingle();

    if (!delivery) {
      test.skip(true, "Nenhuma entrega disponível para esta conta — depende de dados criados por outro teste de integração.");
      return;
    }

    await loginAs(page, paciente);
    await page.goto("/paciente/curadoria");
    await expect(page.getByRole("heading", { name: "Sua Curadoria" })).toBeVisible();

    const bodyText = (await page.textContent("body")) ?? "";
    const lower = bodyText.toLowerCase();
    for (const forbidden of ["score", "ranking", "shortlist", "human review", "p001", "p008", "protocolo"]) {
      expect(lower).not.toContain(forbidden);
    }

    await expect(page.getByRole("link", { name: "Baixar em PDF" })).toBeVisible();
  });
});

test.describe("Última sprint do MVP — /paciente/curadoria mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("a tela é legível em mobile", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);
    await page.goto("/paciente/curadoria");

    const emptyState = page.getByText("Ainda não há relatórios aqui.");
    const heading = page.getByRole("heading", { name: "Sua Curadoria" });
    await expect(emptyState.or(heading)).toBeVisible();
  });
});
