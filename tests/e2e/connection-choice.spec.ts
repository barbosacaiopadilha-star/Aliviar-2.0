import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// O Connection só existe depois de uma FinalCuradoria real entregue — os
// quatro papéis fixos de test-users.local.json nunca têm um Caso entregue
// (eles são compartilhados por toda a suíte de E2E, em estado genérico).
// Por isso, ao contrário dos demais specs de tests/e2e/, este arquivo
// constrói sua própria Curadoria entregue, ponta a ponta e real (mesma
// cadeia de tests/integration/connection.integration.test.ts), diretamente
// no beforeAll — Playwright roda em Node, os mesmos módulos server-only
// funcionam aqui como funcionariam num script de seed.
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { deliverFinalCuradoria } from "@/modules/concierge/delivery-repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { submitHumanReview } from "@/modules/concierge/human-review-repository";
import { runAceExecution } from "@/modules/concierge/orchestrator";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import {
  getOrCreateActiveStory,
  saveStoryDraft,
  submitStory,
} from "@/modules/story/repository";

const envPath = path.resolve(__dirname, "../../.env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

type DeliveredFixture = {
  patientEmail: string;
  patientPassword: string;
  patientProfileId: string;
  caseId: string;
  professionalDisplayNames: string[];
};

async function seedPresentableProfessional(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  adminUserId: string,
  displayName: string,
) {
  const professional = await createProfessionalProfile(adminClient, {
    displayName,
    professionalIdentifier: unique("ident"),
    crm: null,
    crmUf: null,
    professionalSummary:
      "Profissional com experiência em acolhimento e escuta ativa.",
    institutionName: null,
    createdBy: adminUserId,
  });

  await adminClient
    .from("professional_profiles")
    .update({
      experience_level: "experiente",
      intake_approach: "ambos",
      offers_continuous_care: true,
      availability_window: "flexible",
    })
    .eq("id", professional.id);
  await adminClient
    .from("professional_competency_areas")
    .insert({
      professional_profile_id: professional.id,
      domain: "nao_determinado",
      focus: "avaliacao",
    });

  return professional.id;
}

async function seedDeliveredCase(): Promise<DeliveredFixture> {
  const adminClient = createAdminSupabaseClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const { createClient } = await import("@supabase/supabase-js");

  const adminEmail = unique("connection-e2e-admin") + "@aliviar-conexao.local";
  const adminAuth = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: "senha-temporaria-123",
    email_confirm: true,
  });
  const adminUserId = adminAuth.data.user!.id;
  await adminClient.from("user_roles").insert({
    profile_id: adminUserId,
    role_id: (
      await adminClient
        .from("roles")
        .select("id")
        .eq("slug", "administrador")
        .single()
    ).data!.id,
  });

  const adminSessionClient = createClient(url, anonKey);
  await adminSessionClient.auth.signInWithPassword({
    email: adminEmail,
    password: "senha-temporaria-123",
  });

  const patientEmail =
    unique("connection-e2e-patient") + "@aliviar-conexao.local";
  const patientAccount = await createPatientAccount(
    adminClient,
    adminSessionClient,
    { email: patientEmail, displayName: "Paciente E2E Connection" },
    adminUserId,
  );

  const patientClient = createClient(url, anonKey);
  await patientClient.auth.signInWithPassword({
    email: patientEmail,
    password: patientAccount.password,
  });
  const draft = await getOrCreateActiveStory(
    patientClient,
    patientAccount.profileId,
  );
  await saveStoryDraft(
    patientClient,
    draft.id,
    draft.revision,
    { motivo: "Buscando apoio para ansiedade recorrente." },
    "motivo",
  );
  const refreshed = await getOrCreateActiveStory(
    patientClient,
    patientAccount.profileId,
  );
  await submitStory(patientClient, draft.id, refreshed.revision);

  const created = await createCase(
    adminSessionClient,
    draft.id,
    undefined,
    adminUserId,
  );
  await changeCaseStatus(
    adminSessionClient,
    created.id,
    "IN_REVIEW",
    adminUserId,
  );
  await changeCaseStatus(
    adminSessionClient,
    created.id,
    "READY_FOR_CURATION",
    adminUserId,
  );

  const names = ["Ana E2E", "Bruno E2E", "Carla E2E"];
  for (const name of names) {
    await seedPresentableProfessional(adminClient, adminUserId, name);
  }

  const execution = await runAceExecution({
    supabase: adminSessionClient,
    caseId: created.id,
    actorId: adminUserId,
    languageModel: new FakeAceLanguageModel(),
  });
  if (execution.outcome !== "completed")
    throw new Error("Fixture E2E: execução do ACE não completou.");

  const review = await submitHumanReview(adminSessionClient, {
    caseId: created.id,
    reviewerId: adminUserId,
    reviewAction: "APPROVE",
    reviewRationale:
      "Composição adequada às necessidades relatadas na história.",
    evidenceReferences: ["Shortlist.compositionRationale"],
    changes: [],
    returnToProtocol: null,
  });
  if (review.outcome !== "recorded")
    throw new Error("Fixture E2E: Human Review não foi registrado.");

  const delivery = await deliverFinalCuradoria({
    supabase: adminSessionClient,
    caseId: created.id,
    actorId: adminUserId,
    languageModel: new FakeAceLanguageModel(),
  });
  if (delivery.outcome !== "delivered")
    throw new Error("Fixture E2E: entrega da Curadoria falhou.");

  return {
    patientEmail,
    patientPassword: patientAccount.password,
    patientProfileId: patientAccount.profileId,
    caseId: created.id,
    professionalDisplayNames: delivery.delivery.providerPresentations.map(
      (p) => p.displayName,
    ),
  };
}

async function cleanupFixture(fixture: DeliveredFixture) {
  const adminClient = createAdminSupabaseClient();
  await adminClient
    .from("cases")
    .delete()
    .eq("patient_profile_id", fixture.patientProfileId);
  await adminClient
    .from("patient_stories")
    .delete()
    .eq("profile_id", fixture.patientProfileId);
  await adminClient
    .from("patient_profiles")
    .delete()
    .eq("profile_id", fixture.patientProfileId);
  await adminClient
    .from("user_roles")
    .delete()
    .eq("profile_id", fixture.patientProfileId);
  await adminClient.auth.admin.deleteUser(fixture.patientProfileId);
}

test.describe("Connection — escolha do profissional (E2E autenticado)", () => {
  // Serial, não paralelo: cada teste deste arquivo popula professional_profiles
  // via seedDeliveredCase() — um recurso global no Supabase local, nunca
  // escopado por Caso (mesmo achado já documentado em
  // tests/integration/human-review.integration.test.ts e
  // final-curadoria-delivery.integration.test.ts). Com fullyParallel:true
  // (playwright.config.ts) os dois testes deste arquivo rodariam em workers
  // simultâneos, somando 6 profissionais no pool global e tornando a
  // Shortlist AMBIGUOUS_COMPOSITION em vez de COMPOSED.
  test.describe.configure({ mode: "serial" });

  let fixture: DeliveredFixture;

  test.beforeAll(async () => {
    fixture = await seedDeliveredCase();
  });

  test.afterAll(async () => {
    await cleanupFixture(fixture);
  });

  test("paciente escolhe, revisa, confirma, recarrega (persiste) e depois corrige a escolha (persiste)", async ({
    page,
  }) => {
    await loginAs(page, fixture.patientEmail, fixture.patientPassword);
    await page.goto("/paciente/curadoria");

    await expect(
      page.getByRole("heading", { name: "Com quem você gostaria de seguir?" }),
    ).toBeVisible();
    for (const name of fixture.professionalDisplayNames) {
      await expect(page.getByRole("radio", { name })).toBeVisible();
    }
    // Sem ranking — nenhum vocabulário de hierarquia em toda a página.
    const bodyBefore = (await page.textContent("body")) ?? "";
    for (const forbidden of [
      "melhor opção",
      "mais recomendado",
      "score",
      "ranking",
    ]) {
      expect(bodyBefore.toLowerCase()).not.toContain(forbidden);
    }

    const [first, second] = fixture.professionalDisplayNames;

    await page.getByRole("radio", { name: first }).check();
    await page.getByRole("button", { name: "Revisar e confirmar" }).click();
    await expect(
      page.getByText(`Você escolheu seguir com ${first}.`),
    ).toBeVisible();

    await page.getByRole("button", { name: "Confirmar minha escolha" }).click();
    await expect(
      page.getByText(`Você escolheu seguir com ${first}.`),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByText(`Você escolheu seguir com ${first}.`),
    ).toBeVisible();

    // Correção antes do contato.
    await page.getByRole("button", { name: "Alterar minha escolha" }).click();
    await page.getByRole("radio", { name: second }).check();
    await page.getByRole("button", { name: "Revisar e confirmar" }).click();
    await page.getByRole("button", { name: "Confirmar minha escolha" }).click();

    await page.reload();
    await expect(
      page.getByText(`Você escolheu seguir com ${second}.`),
    ).toBeVisible();
  });

  test("Caminho 1 — intenção de contato, depois confirmação de atendimento (estado terminal)", async ({
    page,
  }) => {
    const f = await seedDeliveredCase();
    try {
      await loginAs(page, f.patientEmail, f.patientPassword);
      await page.goto("/paciente/curadoria");

      const [name] = f.professionalDisplayNames;
      await page.getByRole("radio", { name }).check();
      await page.getByRole("button", { name: "Revisar e confirmar" }).click();
      await page
        .getByRole("button", { name: "Confirmar minha escolha" })
        .click();

      await expect(
        page.getByRole("button", { name: "Já iniciei o contato" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Já iniciei o contato" }).click();
      await expect(
        page.getByText(`Você registrou que iniciou o contato com ${name}.`),
      ).toBeVisible();

      await page.reload();
      await expect(
        page.getByText(`Você registrou que iniciou o contato com ${name}.`),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Já iniciei o contato" }),
      ).toHaveCount(0);

      await page
        .getByRole("button", { name: "Confirmar primeiro atendimento" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Confirmar primeiro atendimento" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Confirmar" }).click();
      await expect(
        page.getByRole("heading", { name: "Primeiro atendimento confirmado" }),
      ).toBeVisible();

      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Primeiro atendimento confirmado" }),
      ).toBeVisible();
      await expect(page.getByRole("button")).toHaveCount(0);
    } finally {
      await cleanupFixture(f);
    }
  });

  test("Caminho 2 — encerra diretamente sem passar por intenção de contato (estado terminal)", async ({
    page,
  }) => {
    const f = await seedDeliveredCase();
    try {
      await loginAs(page, f.patientEmail, f.patientPassword);
      await page.goto("/paciente/curadoria");

      const [name] = f.professionalDisplayNames;
      await page.getByRole("radio", { name }).check();
      await page.getByRole("button", { name: "Revisar e confirmar" }).click();
      await page
        .getByRole("button", { name: "Confirmar minha escolha" })
        .click();

      await page.getByRole("button", { name: "O contato não avançou" }).click();
      await expect(
        page.getByRole("heading", { name: "Encerrar sem continuar" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Confirmar encerramento" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Contato encerrado" }),
      ).toBeVisible();

      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Contato encerrado" }),
      ).toBeVisible();
      await expect(page.getByRole("button")).toHaveCount(0);
    } finally {
      await cleanupFixture(f);
    }
  });

  test("Caminho 3 — intenção de contato, depois encerramento (estado terminal)", async ({
    page,
  }) => {
    const f = await seedDeliveredCase();
    try {
      await loginAs(page, f.patientEmail, f.patientPassword);
      await page.goto("/paciente/curadoria");

      const [name] = f.professionalDisplayNames;
      await page.getByRole("radio", { name }).check();
      await page.getByRole("button", { name: "Revisar e confirmar" }).click();
      await page
        .getByRole("button", { name: "Confirmar minha escolha" })
        .click();
      await page.getByRole("button", { name: "Já iniciei o contato" }).click();

      await page.getByRole("button", { name: "O contato não avançou" }).click();
      await page
        .getByRole("button", { name: "Confirmar encerramento" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Contato encerrado" }),
      ).toBeVisible();

      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Contato encerrado" }),
      ).toBeVisible();
    } finally {
      await cleanupFixture(f);
    }
  });

  // Nota: "profissional fora da entrega rejeitado por requisição manipulada"
  // e "transição inválida rejeitada no banco" já estão comprovados nas
  // camadas mais baixas (tests/unit/connection-commands.test.ts e
  // tests/integration/connection.integration.test.ts, incluindo update
  // direto na tabela rejeitado pelo trigger do PR1) — este teste cobre
  // apenas o que é observável pela UI: nenhum caminho de correção ou nova
  // transição fica disponível uma vez que o estado avança.
  test("Segurança — correção não é possível depois de CONTATO_INICIADO, e estado terminal não oferece nenhuma ação", async ({
    page,
  }) => {
    const f = await seedDeliveredCase();
    try {
      await loginAs(page, f.patientEmail, f.patientPassword);
      await page.goto("/paciente/curadoria");

      const [name] = f.professionalDisplayNames;
      await page.getByRole("radio", { name }).check();
      await page.getByRole("button", { name: "Revisar e confirmar" }).click();
      await page
        .getByRole("button", { name: "Confirmar minha escolha" })
        .click();
      await page.getByRole("button", { name: "Já iniciei o contato" }).click();

      // Nenhum caminho de UI para corrigir depois de CONTATO_INICIADO.
      await expect(
        page.getByRole("button", { name: "Alterar minha escolha" }),
      ).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);

      await page.getByRole("button", { name: "O contato não avançou" }).click();
      await page
        .getByRole("button", { name: "Confirmar encerramento" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Contato encerrado" }),
      ).toBeVisible();

      // Estado terminal: nenhuma ação disponível na UI para tentar transicionar de novo.
      await expect(page.getByRole("button")).toHaveCount(0);
    } finally {
      await cleanupFixture(f);
    }
  });

  test("paciente diferente não acessa o Connection alheio", async ({
    page,
  }) => {
    const otherFixture = await seedDeliveredCase();
    try {
      await loginAs(
        page,
        otherFixture.patientEmail,
        otherFixture.patientPassword,
      );
      await page.goto("/paciente/curadoria");
      // A entrega do OUTRO paciente é a única que ele pode ver — nunca a
      // escolha registrada no teste anterior para fixture.caseId.
      await expect(
        page.getByRole("heading", {
          name: "Com quem você gostaria de seguir?",
        }),
      ).toBeVisible();
      const bodyText = (await page.textContent("body")) ?? "";
      expect(bodyText).not.toContain(fixture.professionalDisplayNames[0]);
    } finally {
      await cleanupFixture(otherFixture);
    }
  });
});
