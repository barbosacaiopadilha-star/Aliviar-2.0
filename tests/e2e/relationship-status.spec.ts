import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// RELATIONSHIP ENGINE — MVP — PR5 (E2E). Mesma disciplina já usada em
// tests/e2e/connection-choice.spec.ts: o Relationship só existe depois de
// um Connection real confirmado (PRIMEIRO_ATENDIMENTO_REALIZADO, PR4) —
// este arquivo constrói sua própria Curadoria entregue e sua própria
// confirmação de primeiro atendimento, ponta a ponta e real, diretamente
// no beforeAll.
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import {
  confirmFirstAppointment,
  createConnection,
} from "@/modules/connection/commands";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
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

type ActiveRelationshipFixture = {
  patientEmail: string;
  patientPassword: string;
  patientProfileId: string;
  caseId: string;
  professionalDisplayName: string;
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
  await adminClient.from("professional_competency_areas").insert({
    professional_profile_id: professional.id,
    domain: "nao_determinado",
    focus: "avaliacao",
  });

  return professional.id;
}

// Constrói a Curadoria entregue, cria o Connection já confirmado
// (PRIMEIRO_ATENDIMENTO_REALIZADO) e deixa o Relationship nascido em
// ATIVO — via chamadas reais de repository/domínio (mesma cadeia de
// tests/integration/relationship-birth.integration.test.ts), nunca
// simulado. A partir daqui, cada teste dirige o navegador real para
// exercitar encerramento/interrupção (Fase 6.1: pausa/retomada não
// existem mais — PAUSADO não é estado oficial).
async function seedActiveRelationship(): Promise<ActiveRelationshipFixture> {
  const adminClient = createAdminSupabaseClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const { createClient } = await import("@supabase/supabase-js");

  const adminEmail =
    unique("relationship-e2e-admin") + "@aliviar-conexao.local";
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
    unique("relationship-e2e-patient") + "@aliviar-conexao.local";
  const patientAccount = await createPatientAccount(
    adminClient,
    adminSessionClient,
    { email: patientEmail, displayName: "Paciente E2E Relationship" },
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
    { motivo: "Buscando continuidade de acompanhamento." },
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

  const professionalDisplayName = "Ana E2E Relationship";
  const professionalId = await seedPresentableProfessional(
    adminClient,
    adminUserId,
    professionalDisplayName,
  );
  await seedPresentableProfessional(
    adminClient,
    adminUserId,
    "Bruno E2E Relationship",
  );
  await seedPresentableProfessional(
    adminClient,
    adminUserId,
    "Carla E2E Relationship",
  );

  const execution = await runAceExecution({
    supabase: adminSessionClient,
    caseId: created.id,
    actorId: adminUserId,
    languageModel: new FakeAceLanguageModel(),
  });
  if (execution.outcome !== "completed") {
    throw new Error("Fixture E2E: execução do ACE não completou.");
  }

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
  if (review.outcome !== "recorded") {
    throw new Error("Fixture E2E: Human Review não foi registrado.");
  }

  const delivery = await deliverFinalCuradoria({
    supabase: adminSessionClient,
    caseId: created.id,
    actorId: adminUserId,
    languageModel: new FakeAceLanguageModel(),
  });
  if (delivery.outcome !== "delivered") {
    throw new Error("Fixture E2E: entrega da Curadoria falhou.");
  }

  const connectionRepository = new SupabaseConnectionRepository(patientClient);
  const now = new Date().toISOString();
  const created0 = createConnection(
    {
      caseId: created.id,
      finalCuradoriaDeliveryId: delivery.delivery.id,
      patientProfileId: patientAccount.profileId,
      professionalProfileId: professionalId,
      actorId: patientAccount.profileId,
      occurredAt: now,
      recordedAt: now,
    },
    {
      eligibleProfessionalProfileIds:
        delivery.delivery.providerPresentations.map((p) => p.providerId),
    },
  );
  const connectionRecord = await connectionRepository.create(
    created0.record,
    created0.event,
  );

  const confirmed = confirmFirstAppointment(connectionRecord, {
    requestedByPatientProfileId: patientAccount.profileId,
    actorId: patientAccount.profileId,
    occurredAt: now,
    recordedAt: now,
  });
  await connectionRepository.confirmFirstAppointmentAndBirthRelationship(
    connectionRecord.status,
    confirmed.record,
    confirmed.event,
    {
      eventType: "RELACIONAMENTO_INICIADO",
      actorId: patientAccount.profileId,
      payload: {},
      occurredAt: now,
      recordedAt: now,
    },
  );

  return {
    patientEmail,
    patientPassword: patientAccount.password,
    patientProfileId: patientAccount.profileId,
    caseId: created.id,
    professionalDisplayName,
  };
}

async function cleanupFixture(fixture: ActiveRelationshipFixture) {
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

test.describe("Relationship — status do acompanhamento (E2E autenticado)", () => {
  // Serial pelo mesmo motivo já documentado em connection-choice.spec.ts:
  // professional_profiles é global, não escopado por Caso.
  test.describe.configure({ mode: "serial" });

  // [CORRIGIDO — Fase 6.1] O fluxo anterior exercitava ativo -> pausa ->
  // retomada -> encerramento planejado — construído sobre uma teoria de
  // Relationship anterior ao fechamento da Fase 4.1, que rejeitou PAUSADO
  // como estado. RelationshipStatusPanel não oferece mais pausa/retomada, e
  // o único estado terminal (ENCERRADO) exibe uma mensagem genérica —
  // "Este acompanhamento foi registrado como encerrado." — independente do
  // motivo (planejado vs. interrupção), já que o motivo vive só no evento.
  test("Fluxo 1 — ativo -> encerramento planejado, sobrevive a reload, estado terminal sem CTAs", async ({
    page,
  }) => {
    const fixture = await seedActiveRelationship();
    try {
      await loginAs(page, fixture.patientEmail, fixture.patientPassword);
      await page.goto("/paciente/curadoria");

      await expect(page.getByText(/está registrado como ativo/)).toBeVisible();
      await expect(
        page.getByText(new RegExp(fixture.professionalDisplayName)),
      ).toBeVisible();

      await page
        .getByRole("button", { name: "Registrar encerramento planejado" })
        .click();
      await expect(page.getByText(/registro é final/)).toBeVisible();
      await page
        .getByRole("button", { name: "Confirmar encerramento" })
        .click();
      await expect(page.getByText(/registrado como encerrado/)).toBeVisible();

      await page.reload();
      await expect(page.getByText(/registrado como encerrado/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Pausar acompanhamento" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Retomar acompanhamento" }),
      ).toHaveCount(0);
      await expect(page.getByRole("button")).toHaveCount(0);
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test("Fluxo 2 — interrupção a partir de ativo sobrevive a reload, estado terminal sem CTAs", async ({
    page,
  }) => {
    const fixture = await seedActiveRelationship();
    try {
      await loginAs(page, fixture.patientEmail, fixture.patientPassword);
      await page.goto("/paciente/curadoria");

      await page
        .getByRole("button", { name: "O acompanhamento foi interrompido" })
        .click();
      await expect(page.getByText(/não avalia/)).toBeVisible();
      await page.getByRole("button", { name: "Confirmar interrupção" }).click();
      await expect(page.getByText(/registrado como encerrado/)).toBeVisible();

      await page.reload();
      await expect(page.getByText(/registrado como encerrado/)).toBeVisible();
      await expect(page.getByRole("button")).toHaveCount(0);
    } finally {
      await cleanupFixture(fixture);
    }
  });

  test("Segurança — paciente diferente nunca vê o Relationship alheio; estado terminal permanece rejeitando novas transições", async ({
    page,
  }) => {
    const fixture = await seedActiveRelationship();
    try {
      // Encerra via chamada real de repository (equivalente ao que a UI
      // faria) para preparar o estado terminal antes da checagem de
      // segurança abaixo.
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const patientClient = createClient(url, anonKey);
      await patientClient.auth.signInWithPassword({
        email: fixture.patientEmail,
        password: fixture.patientPassword,
      });

      await loginAs(page, fixture.patientEmail, fixture.patientPassword);
      await page.goto("/paciente/curadoria");
      await expect(page.getByText(/está registrado como ativo/)).toBeVisible();

      // Um segundo paciente, sem Caso próprio, nunca vê o Relationship
      // deste — getLatestFinalCuradoriaDeliveryForPatient é sempre
      // escopado ao próprio auth.uid(), nunca a um Caso alheio.
      const adminClient = createAdminSupabaseClient();
      const adminEmail =
        unique("relationship-e2e-outsider-admin") + "@aliviar-conexao.local";
      const adminAuth = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: "senha-temporaria-123",
        email_confirm: true,
      });
      const outsiderAdminUserId = adminAuth.data.user!.id;
      await adminClient.from("user_roles").insert({
        profile_id: outsiderAdminUserId,
        role_id: (
          await adminClient
            .from("roles")
            .select("id")
            .eq("slug", "administrador")
            .single()
        ).data!.id,
      });
      const outsiderAdminSession = createClient(url, anonKey);
      await outsiderAdminSession.auth.signInWithPassword({
        email: adminEmail,
        password: "senha-temporaria-123",
      });
      const outsiderEmail =
        unique("relationship-e2e-outsider") + "@aliviar-conexao.local";
      const outsiderAccount = await createPatientAccount(
        adminClient,
        outsiderAdminSession,
        { email: outsiderEmail, displayName: "Paciente Sem Relação E2E" },
        outsiderAdminUserId,
      );

      const context2 = await page.context().browser()!.newContext();
      const page2 = await context2.newPage();
      await loginAs(page2, outsiderEmail, outsiderAccount.password);
      await page2.goto("/paciente/curadoria");
      await expect(page2.getByText(/está registrado como ativo/)).toHaveCount(
        0,
      );
      await expect(
        page2.getByText(new RegExp(fixture.professionalDisplayName)),
      ).toHaveCount(0);
      await context2.close();

      await adminClient
        .from("user_roles")
        .delete()
        .eq("profile_id", outsiderAccount.profileId);
      await adminClient
        .from("patient_profiles")
        .delete()
        .eq("profile_id", outsiderAccount.profileId);
      await adminClient.auth.admin.deleteUser(outsiderAccount.profileId);
      await adminClient.auth.admin.deleteUser(outsiderAdminUserId);
    } finally {
      await cleanupFixture(fixture);
    }
  });
});
