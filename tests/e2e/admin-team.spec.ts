import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { createCuradoriaClient } from "../integration/curadoria-client";

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

type TeamMemberFixture = {
  email: string;
  profileId: string;
  serviceClient: ReturnType<typeof createCuradoriaClient>;
};

// Uma pessoa cadastrada de verdade, com id gerado pelo Supabase Auth — é o
// caminho pelo qual toda pessoa real entra no sistema.
async function createTeamMember(): Promise<TeamMemberFixture> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const serviceClient = createCuradoriaClient(url, serviceRoleKey);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `equipe-e2e-${suffix}@aliviar-conexao.local`;

  const { data: created, error } = await serviceClient.auth.admin.createUser({
    email,
    password: `Senha-${suffix}-e2e!`,
    email_confirm: true,
    user_metadata: { display_name: "Pessoa Equipe E2E" },
  });
  if (error || !created?.user) {
    throw new Error(`fixture: pessoa não criada — ${error?.message ?? "sem usuário retornado"}`);
  }

  return { email, profileId: created.user.id, serviceClient };
}

async function cleanupTeamMember({ serviceClient, profileId }: TeamMemberFixture) {
  const { error } = await serviceClient.from("user_roles").delete().eq("profile_id", profileId);
  await serviceClient.auth.admin.deleteUser(profileId);
  if (error) {
    throw new Error(`cleanup da fixture falhou — user_roles: ${error.message}`);
  }
}

async function loginAs(page: Page, account: TestAccount) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("gestão de equipe e papéis internos (SPRINT OPERACIONAL 1)", () => {
  test.describe.configure({ mode: "serial" });

  // A concessão acontece sobre uma pessoa criada aqui, não sobre a conta
  // compartilhada `profissional.teste`: as contas semeadas usam identificadores
  // como `00000000-0000-0000-0000-000000000002`, que não são UUID válido pela
  // RFC 4122 e por isso são recusados pela validação da própria Server Action
  // (`teamRoleActionSchema`). A validação está certa — em produção o id vem do
  // Supabase Auth e é sempre válido; o que estava errado era o dado do teste.
  test("administrador concede e revoga o papel Curador Médico", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    const pessoa = await createTeamMember();

    try {
      await loginAs(page, admin);

      await page.goto("/admin/equipe");
      await expect(page.getByRole("heading", { name: "Equipe" })).toBeVisible();

      await page.getByLabel("Buscar por nome ou e-mail").fill(pessoa.email);
      const row = page.getByRole("row").filter({ hasText: pessoa.email });
      await expect(row).toBeVisible();

      await row.getByRole("button", { name: "Conceder Curador Médico" }).click();
      await expect(row.getByText("Curador Médico", { exact: true })).toBeVisible();

      await row.getByRole("button", { name: "Revogar Curador Médico" }).click();
      await expect(row.getByText("Curador Médico", { exact: true })).toHaveCount(0);
    } finally {
      await cleanupTeamMember(pessoa);
    }
  });

  test("administrador não pode revogar o próprio papel de administrador", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin/equipe");
    await page.getByLabel("Buscar por nome ou e-mail").fill(admin.email);
    const row = page.getByRole("row").filter({ hasText: admin.email });

    await expect(row.getByRole("button", { name: "Revogar Administrador" })).toBeDisabled();
  });

  test("paciente e profissional não acessam /admin/equipe", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/admin/equipe");
    await expect(page).toHaveURL("/acesso-negado");
  });
});
