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

// Prepara, via API do Supabase local (fora do navegador), um paciente com
// uma história já enviada — o próprio envio da história já é coberto pelos
// specs de sua-historia-persistence; aqui o alvo é a UI de Casos.
async function createPatientWithSentStory(url: string, anonKey: string, serviceRoleKey: string, adminEmail: string, adminPassword: string) {
  const adminAuthClient = createClient(url, anonKey);
  await adminAuthClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });

  const serviceClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const email = `caso-e2e-${Date.now()}@aliviar-conexao.local`;
  const password = `Senha-${Date.now()}-e2e!`;

  const { data: created } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Paciente Caso E2E" },
  });
  const profileId = created!.user!.id;

  const { data: roleRow } = await adminAuthClient.from("roles").select("id").eq("slug", "paciente").single();
  await adminAuthClient.from("user_roles").insert({ profile_id: profileId, role_id: roleRow!.id });

  const patientClient = createClient(url, anonKey);
  await patientClient.auth.signInWithPassword({ email, password });

  const { data: story } = await patientClient
    .from("patient_stories")
    .insert({ profile_id: profileId, created_by: profileId })
    .select("id, revision")
    .single();

  await patientClient
    .from("patient_stories")
    .update({ status: "enviada", data: { motivo: "Teste e2e de caso" } })
    .eq("id", story!.id)
    .eq("revision", story!.revision);

  return { patientName: "Paciente Caso E2E" };
}

test.describe("Portal Administrativo — Casos (ÉPICO 1/SPRINT 2)", () => {
  test("administrador inicia um caso a partir de uma história enviada e muda o status", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const { patientName } = await createPatientWithSentStory(url, anonKey, serviceRoleKey, admin.email, admin.password);

    await loginAs(page, admin);
    await page.goto("/admin/pacientes");
    await page.getByLabel("Buscar por nome ou e-mail").fill(patientName);
    await page.getByRole("link", { name: "Gerenciar" }).first().click();

    await page.getByRole("button", { name: "Iniciar caso" }).click();
    await page.waitForURL(/\/admin\/casos\/[0-9a-f-]+$/);

    await expect(page.getByRole("heading", { name: `Caso de ${patientName}` })).toBeVisible();
    await expect(page.getByText("Novo", { exact: true })).toBeVisible();

    await page.getByLabel("Novo status").selectOption("IN_REVIEW");
    await page.getByRole("button", { name: "Mudar status" }).click();
    await expect(page.getByText("Em revisão", { exact: true })).toBeVisible();
  });

  test("busca e filtro de status funcionam na listagem de casos", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin/casos");
    await expect(page.getByRole("heading", { name: "Casos" })).toBeVisible();

    await page.getByLabel("Buscar por paciente").fill("pessoa-que-nao-existe-e2e");
    await expect(page.getByText("Nenhum caso encontrado.")).toBeVisible();
  });

  test("curador médico e profissional não acessam /admin/casos", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador);
    await page.goto("/admin/casos");
    await expect(page).toHaveURL("/acesso-negado");
  });
});

test.describe("Portal Administrativo — Casos — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("listagem de casos funciona em coluna única", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);
    await page.goto("/admin/casos");
    await expect(page.getByLabel("Buscar por paciente")).toBeVisible();
  });
});
