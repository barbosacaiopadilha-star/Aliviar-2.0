import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// RELEASE GATE 4 — o painel executivo deixou de ser conferido só pelo rótulo.
//
// A lacuna que este arquivo fecha: o oráculo antigo afirmava getByText("De
// Curadoria até o Concierge") — e esse texto está visível IGUALZINHO quando o
// valor degradou para "Informação indisponível" (asserção tautológica, a
// mesma classe que a auditoria G1 já caçou noutros lugares). Foi assim que um
// 42501 permanente atravessou a suíte inteira sem corar.
//
// Agora o spec SEMEIA o histórico que o indicador mede — um Case que entra em
// Curadoria (started_at, gatilho do banco) e passa o bastão ao Concierge pela
// ÚNICA porta que existe (transfer_case_responsibility, security definer) — e
// exige o número na tela.
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "../integration/curadoria-client";

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

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe("dashboard administrativo (SPRINT OPERACIONAL 1 + RELEASE GATE 4)", () => {
  test.describe.configure({ mode: "serial" });

  const adminClient = createAdminSupabaseClient();
  let caseId = "";
  let patientProfileId = "";
  /** Guardado do beforeAll — o descarte administrativo exige o ator. */
  let adminUserIdParaLimpeza = "";

  test.beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const contas = loadTestAccounts();
    const admin = contas.find((a) => a.role === "administrador")!;
    const concierge = contas.find((a) => a.role === "concierge")!;

    const adminSession = createCuradoriaClient(url, anonKey);
    const { error: loginError } = await adminSession.auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    });
    if (loginError) throw new Error(`login do administrador: ${loginError.message}`);
    const adminUserId = (await adminSession.auth.getUser()).data.user!.id;
    adminUserIdParaLimpeza = adminUserId;

    // O id do concierge sai da PRÓPRIA sessão dele, nunca de listUsers: a
    // busca paginada acha só os 200 primeiros, e as seis contas permanentes
    // são as mais antigas do banco — o mesmo defeito que derrubou o
    // bootstrap quando o acúmulo de fixtures passou de 200.
    const conciergeSession = createCuradoriaClient(url, anonKey);
    const { error: erroConcierge } = await conciergeSession.auth.signInWithPassword({
      email: concierge.email,
      password: concierge.password,
    });
    if (erroConcierge) throw new Error(`login do concierge: ${erroConcierge.message}`);
    const conciergeUserId = (await conciergeSession.auth.getUser()).data.user!.id;

    // A cadeia canônica, a mesma das telas — nenhum atalho de SQL no caminho
    // que o indicador mede.
    const pacienteEmail = unique("dashboard-e2e-paciente") + "@aliviar-conexao.local";
    const conta = await createPatientAccount(
      adminClient,
      adminSession,
      { email: pacienteEmail, displayName: "Paciente E2E Dashboard" },
      adminUserId,
    );
    patientProfileId = conta.profileId;

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email: pacienteEmail, password: conta.password });
    const draft = await getOrCreateActiveStory(patientClient, conta.profileId);
    await saveStoryDraft(
      patientClient,
      draft.id,
      draft.revision,
      { motivo: "Preciso de acompanhamento contínuo para a coluna." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(patientClient, conta.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(adminSession, draft.id, adminUserId, adminUserId);
    caseId = created.id;
    // NEW → IN_REVIEW → READY_FOR_CURATION → IN_CURATION: o gatilho do banco
    // grava started_at na entrada em Curadoria — o "de" do indicador.
    await changeCaseStatus(adminSession, caseId, "IN_REVIEW", adminUserId);
    await changeCaseStatus(adminSession, caseId, "READY_FOR_CURATION", adminUserId);
    await changeCaseStatus(adminSession, caseId, "IN_CURATION", adminUserId);

    // A passagem de bastão ao Concierge — o "até" do indicador — pela única
    // porta que escreve o rastro (security definer; Release Gate 3).
    const { error: transferError } = await adminSession
      .schema("curadoria")
      .rpc("transfer_case_responsibility", {
        _case_id: caseId,
        _new_responsible_id: conciergeUserId,
        _new_role: "concierge",
        _reason: "Seed determinístico do Release Gate 4 — histórico mínimo do indicador.",
      });
    if (transferError) throw new Error(`transferência ao concierge: ${transferError.message}`);
  });

  test.afterAll(async () => {
    // Case com troca de responsável não sai pelo DELETE comum (gatilho
    // append-only). A saída é a mesma porta administrativa da produção
    // (ADR-038) — o padrão da limpeza da suíte de integração.
    if (caseId) {
      const { error } = await adminClient.from("cases").delete().eq("id", caseId);
      if (error && /append-only|descarte administrativo autorizado/i.test(error.message)) {
        await adminClient.rpc("discard_case_admin", {
          _case_id: caseId,
          _reason: "Descarte do Case sintético do E2E do dashboard (Release Gate 4).",
          _executed_by: adminUserIdParaLimpeza,
        });
      }
    }
    if (patientProfileId) {
      await adminClient.from("patient_stories").delete().eq("profile_id", patientProfileId);
      await adminClient.from("patient_profiles").delete().eq("profile_id", patientProfileId);
      await adminClient.from("user_roles").delete().eq("profile_id", patientProfileId);
      await adminClient.auth.admin.deleteUser(patientProfileId);
    }
  });

  test("mostra indicadores, pendências e atividade recente reais, não o placeholder genérico", async ({
    page,
  }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");

    await expect(page.getByText("Leads novos", { exact: true })).toBeVisible();
    await expect(page.getByText("Em qualificação", { exact: true })).toBeVisible();
    await expect(page.getByText("Conversão lead → paciente", { exact: true })).toBeVisible();
    await expect(page.getByText("Pacientes ativos", { exact: true })).toBeVisible();
    await expect(page.getByText("De Curadoria até o Concierge", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pessoas por papel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pendências" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Atividade recente" })).toBeVisible();

    await expect(page.getByText("Ainda não há informações para exibir.")).toHaveCount(0);
  });

  test("Release Gate 4 — o indicador de handoff carrega a fonte real, não a degradação honesta", async ({
    page,
  }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");

    // A página inteira não pode ter caído no error boundary.
    await expect(page.getByText("Algo não saiu como esperado")).toHaveCount(0);

    // O card, pelo contêiner mais interno que contém o rótulo — o mesmo
    // padrão de desambiguação dos demais specs.
    const card = page
      .locator("div")
      .filter({ has: page.getByText("De Curadoria até o Concierge", { exact: true }) })
      .last();

    // Com o seed garantindo ao menos um par (started_at → handoff), a
    // degradação é PROIBIDA: nem o travessão do formatMetric(null), nem a
    // legenda de indisponibilidade podem aparecer neste card.
    await expect(card).not.toContainText("Informação indisponível");
    await expect(card).not.toContainText("—");

    // E o valor é um número em horas, compatível com o cenário semeado
    // (started_at e transferência a segundos de distância → "0 h"; a
    // asserção aceita qualquer número pt-BR, nunca texto de degradação).
    await expect(card).toContainText(/\d+(,\d+)?\s*h/);
  });
});
