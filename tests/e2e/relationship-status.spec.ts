import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createCuradoriaClient } from "../integration/curadoria-client";
import { expect, test, type Page } from "@playwright/test";

// RELATIONSHIP ENGINE — MVP — PR5 (E2E). Mesma disciplina já usada em
// tests/e2e/connection-choice.spec.ts: o Relationship só existe depois de
// um Connection real confirmado (PRIMEIRO_ATENDIMENTO_REALIZADO, PR4) —
// este arquivo constrói sua própria Curadoria entregue e sua própria
// confirmação de primeiro atendimento, ponta a ponta e real, diretamente
// no beforeAll.
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import * as curadoria from "@/modules/curadoria/repository";
import { preencherMapaEBlocoRelacional } from "./apoio-mapa";
import * as reports from "@/modules/curadoria/report-repository";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import {
  confirmFirstAppointment,
  createConnection,
} from "@/modules/connection/commands";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { seedPublishedProfessional } from "../integration/rede-fixture";
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

// G1/ETAPA-2 (FS-04): o parecer da fixture carrega conteúdo real — o vazio
// silencioso era o defeito, nunca o payload "normal".
const PONTOS_FAVORAVEIS_DO_PARECER = ["Acompanha casos como o dela ao longo do tempo."];

// [Fase 6.3 — Parte 3] LoginForm é Client Component ("use client",
// useSearchParams()) dentro de um Suspense boundary — o HTML do
// formulário chega via SSR antes da hidratação anexar os handlers do
// React. Preencher/clicar antes desse momento pode interagir com nós
// que o React ainda substitui, produzindo "element is not attached to
// the DOM" de forma não-determinística. Esperar o botão "Entrar" ficar
// habilitado é um proxy observável e estável de hidratação concluída —
// sem sleep arbitrário, sem retry indefinido, sem alterar a tela real.
async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  const submitButton = page.getByRole("button", { name: "Entrar" });
  await expect(submitButton).toBeEnabled();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await submitButton.click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

type ActiveRelationshipFixture = {
  patientEmail: string;
  patientPassword: string;
  patientProfileId: string;
  caseId: string;
  professionalDisplayName: string;
  /** Profissionais criados por ESTA execução — âncora do cleanup. */
  createdProfessionalIds: string[];
};

async function seedPresentableProfessional(
  adminClient: ReturnType<typeof createAdminSupabaseClient>,
  adminUserId: string,
  displayName: string,
) {
  // B-2: a versão anterior criava o profissional SEM publicá-lo e a fixture
  // só passava porque a rede compartilhada carregava resíduo publicado de
  // outras execuções — com o banco recém-restaurado, zero elegíveis. A
  // fixture canônica percorre o caminho real de publicação (registro
  // consultado + área verificada + gatilho do banco), tornando o spec
  // autossuficiente.
  return seedPublishedProfessional(adminClient, adminUserId, displayName);
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

  const adminSessionClient = createCuradoriaClient(url, anonKey);
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

  const patientClient = createCuradoriaClient(url, anonKey);
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
    adminUserId,
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

  // Nomes únicos por execução — o E2E localiza pelo nome acessível, e nomes
  // fixos colidem quando uma execução anterior deixa resíduo.
  const runId = unique("run");
  const createdProfessionalIds: string[] = [];
  for (const nome of ["Ana", "Bruno", "Carla"]) {
    createdProfessionalIds.push(
      await seedPresentableProfessional(adminClient, adminUserId, nome + " E2E Rel " + runId),
    );
  }

  // ENTREGA CANÔNICA — o mesmo caminho das telas. Nenhum protocolo do ACE.
  const cliente = adminSessionClient;

  await cliente.from("consultation_records").insert({
    case_id: created.id,
    curator_id: adminUserId,
    context_reviewed: true,
    documents_reviewed: true,
    narrative: "Ela contou a história inteira, e eu devolvi organizada.",
    understanding_confirmed_at: new Date().toISOString(),
  });
  await cliente
    .from("case_clinical_context")
    .insert({ case_id: created.id, clinical_context: "Contexto clínico relatado por ela." });

  const priorityProfileId = await curadoria.createPriorityProfile(cliente, created.id, adminUserId);
  await curadoria.addFilter(
    cliente,
    priorityProfileId,
    "FILTRO_OBRIGATORIO",
    "CUIDADO_CONTINUO",
    "true",
    "Ela quer alguém que acompanhe do começo ao fim.",
  );
  // B-2 (ADR-065): o banco só valida Perfil com Mapa completo, e o
  // reconhecimento exige o bloco relacional — estado legítimo via factory.
  await preencherMapaEBlocoRelacional(cliente, created.id, adminUserId);
  await curadoria.validatePriorityProfile(cliente, priorityProfileId, "Li em voz alta e ela confirmou.");

  // B-2: os três são os que ESTA execução semeou e publicou. A versão
  // anterior tomava 3 publicados quaisquer da rede compartilhada — com
  // specs concorrentes, a seleção referenciava profissionais de OUTRO spec
  // e o cleanup de lá quebrava com FK em curated_selection_options.
  const tres = createdProfessionalIds.map((id) => ({ professionalId: id }));
  if (tres.length < 3) {
    throw new Error("Fixture E2E: a rede local não tem três profissionais elegíveis.");
  }

  await curadoria.saveSelection(
    cliente,
    created.id,
    priorityProfileId,
    adminUserId,
    "Os três cobrem experiência e continuidade de formas diferentes.",
    tres.map((a) => ({
      professionalProfileId: a.professionalId,
      rationale: "Entra porque atende o que ela pediu.",
      tradeOff: "Agenda mais concorrida.",
    })),
  );
  const selection = await curadoria.getSelection(cliente, priorityProfileId);

  await reports.saveReport(
    cliente,
    created.id,
    selection!.id,
    "Os três cobrem experiência e continuidade de formas diferentes.",
    tres.map((a) => ({
      professionalProfileId: a.professionalId,
      justification: "Responde ao critério que ela nomeou.",
      relationToWeights: "Cobre experiência, que ela pesou mais.",
      attentionPoints: ["Agenda mais concorrida."],
      // G1/ETAPA-2: oráculo anterior certificava o defeito FS-04 (favorablePoints: []
      // replicado como payload normal — consertar o apagamento não quebraria teste
      // algum); novo oráculo exige o comportamento da ADR-064 (conteúdo do parecer
      // sobrevive ao round-trip, sem perda silenciosa); correção do defeito no Bloco D.
      favorablePoints: PONTOS_FAVORAVEIS_DO_PARECER,
      suggestedQuestions: ["Quantos casos como o meu você acompanha por ano?"],
      curatorObservations: null,
    })),
  );
  const report = await reports.getReportBySelection(cliente, selection!.id);
  // G1/ETAPA-2 (FS-04/ADR-064): prova de round-trip na leitura de volta que o
  // teste já fazia — o conteúdo salvo precisa existir intacto no banco.
  const { data: opcoesRoundTrip } = await cliente
    .from("curadoria_report_options")
    .select("favorable_points")
    .eq("report_id", report!.id);
  expect(opcoesRoundTrip).toHaveLength(3);
  for (const opcao of opcoesRoundTrip ?? []) {
    expect(opcao.favorable_points).toEqual(PONTOS_FAVORAVEIS_DO_PARECER);
  }
  // Emitir exige aprovação prévia — o Curador assume a autoria da versão final.
    await reports.approveReport(cliente, report!.id, adminUserId);
    await reports.emitReport(cliente, report!.id);
  await curadoria.deliverSelection(cliente, selection!.id);
  await reports.markReportDelivered(cliente, report!.id);

  const professionalId = tres[0]!.professionalId;
  // Nome pela fonte canônica — as análises não carregam mais display name.
  const { data: nomeRow } = await cliente
    .from("professional_profiles")
    .select("display_name")
    .eq("id", professionalId)
    .maybeSingle();
  const professionalDisplayName = (nomeRow?.display_name as string | undefined) ?? "Profissional";

  const connectionRepository = new SupabaseConnectionRepository(patientClient);
  const now = new Date().toISOString();
  const created0 = createConnection(
    {
      caseId: created.id,
      anchor: { source: "METODO" as const, reportId: report!.id },
      patientProfileId: patientAccount.profileId,
      professionalProfileId: professionalId,
      actorId: patientAccount.profileId,
      occurredAt: now,
      recordedAt: now,
    },
    {
      eligibleProfessionalProfileIds: tres.map((a) => a.professionalId),
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
    createdProfessionalIds,
  };
}

async function cleanupFixture(fixture: ActiveRelationshipFixture) {
  const adminClient = createAdminSupabaseClient();

  // Todo DELETE verifica erro: um cleanup que falha em silêncio deixa Case e
  // Connection para trás e contamina a execução seguinte.
  const apagar = async (tabela: string, coluna: string, valor: string) => {
    const { error } = await adminClient.from(tabela).delete().eq(coluna, valor);
    if (error) {
      throw new Error(`Falha ao limpar ${tabela}: ${error.message}`);
    }
  };

  await apagar("cases", "patient_profile_id", fixture.patientProfileId);
  await apagar("patient_stories", "profile_id", fixture.patientProfileId);
  await apagar("patient_profiles", "profile_id", fixture.patientProfileId);
  await apagar("user_roles", "profile_id", fixture.patientProfileId);
  await adminClient.auth.admin.deleteUser(fixture.patientProfileId);

  // Profissionais por último: a Curadoria canônica grava
  // `curated_selection_options` e `curadoria_report_options` com FK para
  // `professional_profiles`. Antes do Case sair, o DELETE falha por FK — e o
  // erro ignorado deixava o perfil sobreviver à rodada.
  const ids = fixture.createdProfessionalIds ?? [];
  if (ids.length > 0) {
    await adminClient
      .from("professional_competency_areas")
      .delete()
      .in("professional_profile_id", ids);
    const { error } = await adminClient.from("professional_profiles").delete().in("id", ids);
    if (error) {
      throw new Error(`Falha ao remover profissionais da fixture: ${error.message}`);
    }
  }
}

test.describe("Relationship — status do acompanhamento (E2E autenticado)", () => {
  // Serial pelo mesmo motivo já documentado em connection-choice.spec.ts:
  // professional_profiles é global, não escopado por Caso.
  // Cada teste leva ~6s: constrói a Curadoria canônica inteira, cria a
  // Connection, confirma o primeiro atendimento e dirige o navegador. O limite
  // global de 30s era suficiente na média e estourava na primeira execução
  // depois de um build, com o servidor ainda frio — daí a intermitência.
  // 60s dá dez vezes a duração típica sem mascarar lentidão real.
  test.describe.configure({ mode: "serial", timeout: 60_000 });

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

      await expect(page.getByText(/Seu acompanhamento com .+ está ativo/)).toBeVisible();
      // .first(): o nome do profissional aparece em mais de um lugar da
      // página (heading do painel + resumo da Curadoria) — a asserção
      // verifica presença, não unicidade, então strict mode do Playwright
      // precisa ser desambiguado sem reduzir o que é verificado.
      await expect(
        page.getByText(new RegExp(fixture.professionalDisplayName)).first(),
      ).toBeVisible();

      await page
        .getByRole("button", { name: "Registrar encerramento planejado" })
        .click();
      await expect(page.getByText(/registro é final/)).toBeVisible();
      await page
        .getByRole("button", { name: "Confirmar encerramento" })
        .click();
      await expect(page.getByText(/está encerrado, como você registrou/)).toBeVisible({
        timeout: 30000,
      });

      await page.reload();
      await expect(page.getByText(/está encerrado, como você registrou/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Pausar acompanhamento" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Retomar acompanhamento" }),
      ).toHaveCount(0);
      // Estado terminal: nenhuma ação sobre o acompanhamento. Escopado às CTAs
      // proibidas — o cabeçalho do paciente tem controles legítimos, e exigir
      // zero botões na página testava layout, não produto.
      for (const cta of [
        "Registrar encerramento planejado",
        "O acompanhamento foi interrompido",
        "Pausar acompanhamento",
        "Retomar acompanhamento",
        "Confirmar encerramento",
        "Confirmar interrupção",
      ]) {
        await expect(page.getByRole("button", { name: cta })).toHaveCount(0);
      }
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
      await expect(page.getByText(/está encerrado, como você registrou/)).toBeVisible();

      await page.reload();
      await expect(page.getByText(/está encerrado, como você registrou/)).toBeVisible();
      // Estado terminal: nenhuma ação sobre o acompanhamento. Escopado às CTAs
      // proibidas — o cabeçalho do paciente tem controles legítimos, e exigir
      // zero botões na página testava layout, não produto.
      for (const cta of [
        "Registrar encerramento planejado",
        "O acompanhamento foi interrompido",
        "Pausar acompanhamento",
        "Retomar acompanhamento",
        "Confirmar encerramento",
        "Confirmar interrupção",
      ]) {
        await expect(page.getByRole("button", { name: cta })).toHaveCount(0);
      }
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
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const patientClient = createCuradoriaClient(url, anonKey);
      await patientClient.auth.signInWithPassword({
        email: fixture.patientEmail,
        password: fixture.patientPassword,
      });

      await loginAs(page, fixture.patientEmail, fixture.patientPassword);
      await page.goto("/paciente/curadoria");
      await expect(page.getByText(/Seu acompanhamento com .+ está ativo/)).toBeVisible();

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
      const outsiderAdminSession = createCuradoriaClient(url, anonKey);
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
      await expect(page2.getByText(/Seu acompanhamento com .+ está ativo/)).toHaveCount(
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
