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

  /**
   * REESCRITO EM 01/09 — `SIM-62` grupo (b).
   *
   * Este teste exigia cinco indicadores que a **2ª passada de 24/08 removeu de
   * propósito**, com o motivo escrito em `src/app/admin/page.tsx`: *"'Cases
   * abertos' e 'Pacientes ativos' eram contagens das listas que o menu já abre
   * — lista disfarçada de indicador"*, e *"média com n=1 é ruído estatístico
   * vestido de gestão"*. **O teste estava vermelho desde então**, cobrando a
   * volta de algo que ninguém quer de volta.
   *
   * Agora ele faz o contrário: **guarda a decisão.** Afirma o que o painel é —
   * uma pergunta só, *"o que precisa de alguém agora?"* — e afirma que o que
   * saiu **continua fora**. Assim a remoção deliberada fica protegida em vez de
   * contestada, e quem a desfizer sem decidir de novo reprova aqui.
   */
  test("o painel responde UMA pergunta — e o que saiu em 24/08 continua fora", async ({
    page,
  }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");

    // O que o painel É hoje: onde agir, o que está pendente, e o Kit.
    await expect(page.getByRole("heading", { name: "Onde agir agora" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pendências" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kit da Curadoria" })).toBeVisible();

    // Os indicadores que sobreviveram são pendência de verdade, não contagem.
    for (const rotulo of ["Sem responsável", "Cases atrasados", "Documentos pendentes"]) {
      await expect(page.getByText(rotulo, { exact: true })).toBeVisible();
    }

    // O que a 2ª passada apagou não pode voltar sem uma decisão nova.
    for (const removido of [
      "Leads novos",
      "Em qualificação",
      "Conversão lead → paciente",
      "Pacientes ativos",
      "Cases abertos",
      "De Curadoria até o Concierge",
    ]) {
      await expect(
        page.getByText(removido, { exact: true }),
        `"${removido}" voltou ao painel — foi removido em 24/08 por ser lista disfarçada de indicador`,
      ).toHaveCount(0);
    }

    // "Pessoas por papel" e "Atividade recente" migraram para /admin/equipe.
    await expect(page.getByRole("heading", { name: "Pessoas por papel" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Atividade recente" })).toHaveCount(0);

    await expect(page.getByText("Ainda não há informações para exibir.")).toHaveCount(0);
  });

  /**
   * RE-ALVEJADO EM 01/09 — `SIM-62` grupo (b).
   *
   * O princípio deste gate continua inteiro: **onde há dado real, a
   * "degradação honesta" não pode aparecer no lugar dele** — nem o travessão
   * do `formatMetric(null)`, nem a legenda de indisponibilidade. O que mudou
   * foi o alvo: o cartão *"De Curadoria até o Concierge"* saiu na 2ª passada de
   * 24/08 (média com n=1 é ruído estatístico vestido de gestão), e o teste
   * ficou apontando para um elemento que não existe.
   *
   * Agora o gate mira **os indicadores que sobreviveram** — os de "Onde agir
   * agora", que são pendência de verdade e vêm do mesmo `indicators`. Zero é
   * um valor legítimo e aparece como `0`; travessão e "indisponível" não.
   *
   * **Dívida anotada, e é honesto dizer:** o `beforeAll` deste describe semeia
   * um Case com transferência ao Concierge só para dar substância ao cartão que
   * saiu. Com o novo alvo, esse seed não serve mais a nada — **pode ser
   * removido por quem conseguir rodar a suíte E2E para confirmar.** Não o
   * removi agora porque não teria como verificar.
   */
  test("Release Gate 4 — os indicadores carregam a fonte real, não a degradação honesta", async ({
    page,
  }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin);

    await page.goto("/admin");

    // A página inteira não pode ter caído no error boundary.
    await expect(page.getByText("Algo não saiu como esperado")).toHaveCount(0);

    const onde = page
      .locator("section, div")
      .filter({ has: page.getByRole("heading", { name: "Onde agir agora" }) })
      .last();

    // Cada indicador COM FONTE mostra número — zero inclusive, porque zero é
    // um fato, não uma ausência.
    for (const rotulo of ["Sem responsável", "Cases atrasados", "Tarefas vencidas"]) {
      const card = onde
        .locator("div")
        .filter({ has: page.getByText(rotulo, { exact: true }) })
        .last();
      await expect(card, `"${rotulo}" caiu na degradação em vez de mostrar o número`).toContainText(
        /\d/,
      );
      await expect(card).not.toContainText("Sem dados neste período");
    }

    /**
     * **"Documentos pendentes" fica de fora, e a ausência dele é o ACERTO.**
     *
     * `dashboard-repository` devolve `pendingDocuments: null` de propósito, com
     * o motivo escrito: *"`patient_documents` guarda documentos ENVIADOS, não
     * documentos pendentes — não existe no banco a noção de 'faltando'. Derivar
     * um número daqui seria inventar."* O travessão ali é a degradação honesta
     * **funcionando**, não falhando.
     *
     * Descoberto em 01/09: a primeira versão deste re-alvo exigia número dos
     * três e reprovou — e a reprovação estava certa sobre mim, não sobre o
     * produto. Fica a asserção invertida: enquanto o domínio não tiver a noção
     * de documento faltando, este card **não pode** exibir um número inventado.
     */
    const documentos = onde
      .locator("div")
      .filter({ has: page.getByText("Documentos pendentes", { exact: true }) })
      .last();
    await expect(
      documentos,
      "'Documentos pendentes' passou a exibir um número — o domínio ganhou a noção de pendência, ou alguém inventou o dado",
    ).not.toContainText(/\d/);
  });
});
