import { expect, test, type Page } from "@playwright/test";

import { createCuradoriaClient } from "../integration/curadoria-client";

// ADR-018 — nunca preenchimento anônimo. O wizard exige sessão + papel
// "paciente" (layout do route group (wizard) via requireRole), e sem isso cada
// etapa redireciona para /login. Estes testes deixaram de navegar anonimamente:
// a proteção não foi afrouxada, a jornada é que passou a começar autenticada.
//
// Cada teste cria a sua própria pessoa. Reaproveitar a conta compartilhada
// `paciente.teste` faria um teste herdar a história que o anterior enviou —
// há uma história ativa por pessoa, e depois de enviada não se preenche mais.

type PatientFixture = {
  email: string;
  password: string;
  profileId: string;
  serviceClient: ReturnType<typeof createCuradoriaClient>;
};

async function createPatient(): Promise<PatientFixture> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const serviceClient = createCuradoriaClient(url, serviceRoleKey);
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `historia-e2e-${suffix}@aliviar-conexao.local`;
  const password = `Senha-${suffix}-e2e!`;

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Paciente História E2E" },
  });
  if (createError || !created?.user) {
    throw new Error(
      `fixture: paciente não criado — ${createError?.message ?? "sem usuário retornado"}`,
    );
  }
  const profileId = created.user.id;

  const { data: roleRow, error: roleError } = await serviceClient
    .from("roles")
    .select("id")
    .eq("slug", "paciente")
    .single();
  if (roleError || !roleRow) {
    throw new Error(`fixture: papel "paciente" não encontrado — ${roleError?.message ?? "sem linha"}`);
  }

  const { error: grantError } = await serviceClient
    .from("user_roles")
    .insert({ profile_id: profileId, role_id: roleRow.id });
  if (grantError) {
    throw new Error(`fixture: papel não concedido — ${grantError.message}`);
  }

  return { email, password, profileId, serviceClient };
}

// Remove o que a fixture criou, na ordem das FKs. O crescimento de
// `auth.users` continua registrado como dívida: `deleteUser` é a única
// remoção disponível e o resultado não é conferível sem o Admin API.
async function cleanupPatient({ serviceClient, profileId }: PatientFixture) {
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

async function loginAs(page: Page, patient: PatientFixture) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(patient.email);
  await page.getByLabel("Senha").fill(patient.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("jornada Sua História (E2E)", () => {
  test("fluxo completo funciona do início ao fim", async ({ page }) => {
    const patient = await createPatient();
    try {
      await loginAs(page, patient);

      await page.goto("/sua-historia");
      await expect(
        page.getByRole("heading", { name: "Sua história merece ser contada com calma." }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Começar" }).click();

      await expect(page).toHaveURL("/sua-historia/para-quem");
      await page.getByLabel("Para mim").check();
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page).toHaveURL("/sua-historia/motivo");
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page).toHaveURL("/sua-historia/historia");
      await page.getByLabel("Sua resposta").fill("Tenho buscado apoio para lidar com a ansiedade.");
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page).toHaveURL("/sua-historia/informacoes");
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page).toHaveURL("/sua-historia/preferencias");
      await page.getByLabel("Online").check();
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page).toHaveURL("/sua-historia/revisao");
      await expect(page.getByText("Tenho buscado apoio para lidar com a ansiedade.")).toBeVisible();
      await page.getByRole("button", { name: "Enviar minha história" }).click();

      await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible();
    } finally {
      await cleanupPatient(patient);
    }
  });

  test("voltar preserva as respostas já preenchidas", async ({ page }) => {
    const patient = await createPatient();
    try {
      await loginAs(page, patient);

      await page.goto("/sua-historia/para-quem");
      await page.getByLabel("Para outra pessoa que eu acompanho").check();
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page).toHaveURL("/sua-historia/motivo");
      await page.getByRole("link", { name: "Voltar" }).click();

      await expect(page).toHaveURL("/sua-historia/para-quem");
      await expect(page.getByLabel("Para outra pessoa que eu acompanho")).toBeChecked();
    } finally {
      await cleanupPatient(patient);
    }
  });

  test("recarregar a página mantém a resposta salva automaticamente", async ({ page }) => {
    const patient = await createPatient();
    try {
      await loginAs(page, patient);

      await page.goto("/sua-historia/historia");
      await page.getByLabel("Sua resposta").fill("Um relato de teste para verificar o auto-save.");

      // O autosave roda sozinho depois da digitação; o reload só prova
      // persistência depois que a interface confirmou que salvou. A espera é
      // pelo próprio sinal da tela (AutosaveIndicator), nunca por um tempo fixo.
      await expect(page.getByText("Sua resposta foi salva.")).toBeVisible();

      await page.reload();

      await expect(page.getByLabel("Sua resposta")).toHaveValue(
        "Um relato de teste para verificar o auto-save.",
      );
    } finally {
      await cleanupPatient(patient);
    }
  });
});
