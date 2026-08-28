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
  // Todo cliente fala com o schema `curadoria`, o mesmo dos clients de
  // produção. Com o client padrão (schema `public`) a consulta a `roles`
  // voltava vazia e o papel do paciente nunca era concedido — a fixture
  // quebrava sem dizer por quê.
  const adminAuthClient = createCuradoriaClient(url, anonKey);
  await adminAuthClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword });

  const serviceClient = createCuradoriaClient(url, serviceRoleKey);
  const email = `caso-e2e-${Date.now()}@aliviar-conexao.local`;
  const password = `Senha-${Date.now()}-e2e!`;

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Paciente Caso E2E" },
  });
  if (createError || !created?.user) {
    throw new Error(`fixture: paciente não criado — ${createError?.message ?? "sem usuário retornado"}`);
  }
  const profileId = created.user.id;

  const { data: roleRow, error: roleError } = await adminAuthClient
    .from("roles")
    .select("id")
    .eq("slug", "paciente")
    .single();
  if (roleError || !roleRow) {
    throw new Error(`fixture: papel "paciente" não encontrado — ${roleError?.message ?? "sem linha"}`);
  }

  const { error: grantError } = await adminAuthClient
    .from("user_roles")
    .insert({ profile_id: profileId, role_id: roleRow.id });
  if (grantError) {
    throw new Error(`fixture: papel não concedido — ${grantError.message}`);
  }

  const patientClient = createCuradoriaClient(url, anonKey);
  await patientClient.auth.signInWithPassword({ email, password });

  const { data: story, error: storyError } = await patientClient
    .from("patient_stories")
    .insert({ profile_id: profileId, created_by: profileId })
    .select("id, revision")
    .single();
  if (storyError || !story) {
    throw new Error(`fixture: história não criada — ${storyError?.message ?? "sem linha"}`);
  }

  const { error: sendError } = await patientClient
    .from("patient_stories")
    .update({ status: "enviada", data: { motivo: "Teste e2e de caso" } })
    .eq("id", story.id)
    .eq("revision", story.revision);
  if (sendError) {
    throw new Error(`fixture: história não enviada — ${sendError.message}`);
  }

  return { patientName: "Paciente Caso E2E", profileId, serviceClient };
}

// Remove o que a fixture criou, na ordem das FKs. O crescimento de
// `auth.users` fica registrado como dívida: `deleteUser` é a única remoção
// disponível e não há caminho seguro para conferir o resultado sem o Admin
// API, então o erro é observado mas não interrompe o teardown.
async function cleanupPatient(
  serviceClient: ReturnType<typeof createCuradoriaClient>,
  profileId: string,
) {
  const falhas: string[] = [];
  for (const [table, column] of [
    ["cases", "patient_profile_id"],
    ["patient_stories", "profile_id"],
    ["patient_profiles", "profile_id"],
    ["user_roles", "profile_id"],
  ] as const) {
    const { error } = await serviceClient.from(table).delete().eq(column, profileId);
    if (error) falhas.push(`${table}: ${error.message}`);
  }
  await serviceClient.auth.admin.deleteUser(profileId);
  if (falhas.length > 0) {
    throw new Error(`cleanup da fixture falhou — ${falhas.join("; ")}`);
  }
}

test.describe("Portal Administrativo — Casos (ÉPICO 1/SPRINT 2)", () => {
  test("administrador inicia um caso a partir de uma história enviada e muda o status", async ({ page }) => {
    // Este é o teste mais longo da suíte: cria uma conta pela Admin API,
    // concede papel, envia uma história, faz login e percorre três telas
    // administrativas. As telas de /admin listam todas as pessoas pela Admin
    // API, então o tempo cresce com o tamanho do banco local. O orçamento
    // maior é para o trabalho real do teste — nenhuma asserção foi afrouxada.
    test.setTimeout(90_000);

    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const { patientName, profileId, serviceClient } = await createPatientWithSentStory(
      url,
      anonKey,
      serviceRoleKey,
      admin.email,
      admin.password,
    );

    try {
      await loginAs(page, admin);
      await page.goto("/admin/pacientes");
      await page.getByLabel("Buscar por nome ou e-mail").fill(patientName);

      // O "Gerenciar" é clicado dentro da linha da própria pessoa, e a espera é
      // pela navegação que ele provoca — nunca pelo primeiro link da página,
      // que a filtragem em curso pode trocar debaixo do clique.
      const row = page.getByRole("row").filter({ hasText: patientName });
      await expect(row).toBeVisible();
      // A espera é armada ANTES do clique: a listagem re-renderiza enquanto
      // filtra, e um clique que chega junto do re-render acerta um nó que já
      // saiu do documento — a navegação some sem erro nenhum.
      const gerenciar = row.getByRole("link", { name: "Gerenciar" });
      await expect(gerenciar).toBeVisible();
      await Promise.all([
        page.waitForURL(/\/admin\/pacientes\/[0-9a-f-]+$/),
        gerenciar.click(),
      ]);

      await page.getByRole("button", { name: "Iniciar caso" }).click();
      await page.waitForURL(/\/admin\/casos\/[0-9a-f-]+$/);

      await expect(page.getByRole("heading", { name: `Caso de ${patientName}` })).toBeVisible();

      // O alvo é o estado que o controle de status declara. "Novo" também
      // aparece no selo do cabeçalho e na linha do tempo; sem escopo, o
      // locator casaria com mais de um e o teste falharia por ambiguidade,
      // não por defeito.
      const statusAtual = page.getByText(/^Status atual:/);
      await expect(statusAtual).toContainText("Novo");

      await page.getByLabel("Novo status").selectOption("IN_REVIEW");
      await page.getByRole("button", { name: "Mudar status" }).click();
      await expect(statusAtual).toContainText("Em revisão");
    } finally {
      await cleanupPatient(serviceClient, profileId);
    }
  });

  test("busca e filtro de status funcionam na listagem de casos", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin/casos");
    // `exact`: com a lista vazia a página também renderiza o h2 "Ainda não há
    // casos iniciados.", que casa por substring com "Casos" e derruba o
    // strict mode. O oráculo passava só porque havia Case de outro spec —
    // num banco recém-reconstruído, caía.
    await expect(page.getByRole("heading", { name: "Casos", exact: true })).toBeVisible();

    await page.getByLabel("Buscar por assistido").fill("pessoa-que-nao-existe-e2e");
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
    await expect(page.getByLabel("Buscar por assistido")).toBeVisible();
  });
});
