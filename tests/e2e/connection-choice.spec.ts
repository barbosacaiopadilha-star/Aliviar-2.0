import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createCuradoriaClient } from "../integration/curadoria-client";
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
import * as curadoria from "@/modules/curadoria/repository";
import { preencherMapaEBlocoRelacional } from "./apoio-mapa";
import * as reports from "@/modules/curadoria/report-repository";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
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

// G1/ETAPA-2 (FS-04): o parecer da fixture carrega conteúdo real — o vazio
// silencioso era o defeito, nunca o payload "normal".
const PONTOS_FAVORAVEIS_DO_PARECER = ["Acompanha casos como o dela ao longo do tempo."];

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
  /** Os profissionais criados por ESTA execução — âncora do cleanup. */
  createdProfessionalIds: string[];
  /** A seleção humana que o Relatório materializa. */
  curatedSelectionId: string;
  /** Âncora canônica da entrega — `connection_records.curadoria_report_id`. */
  reportId: string;
  /** Os três que a Curadoria de fato entregou, com o nome que aparece na tela. */
  selectedProfessionals: Array<{ id: string; name: string }>;
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
  // A Curadoria canônica exige um Curador responsável pelo Case. O mesmo
  // usuário acumula os dois papéis para manter a fixture com uma identidade só.
  await adminClient.from("user_roles").insert({
    profile_id: adminUserId,
    role_id: (
      await adminClient.from("roles").select("id").eq("slug", "curador_medico").single()
    ).data!.id,
  });

  const adminSessionClient = createCuradoriaClient(url, anonKey);
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

  // Nomes únicos por execução: o E2E localiza o profissional pelo nome
  // acessível, e nomes fixos colidiam quando uma execução anterior deixava
  // resíduo — três registros distintos chamados "Ana E2E" fazem o localizador
  // resolver múltiplos rádios. Unicidade dá tolerância a interrupção; o
  // cleanup abaixo dá a higiene normal. Um não substitui o outro.
  const runId = unique("run");
  const createdProfessionalIds: string[] = [];
  for (const nome of ["Ana", "Bruno", "Carla"]) {
    createdProfessionalIds.push(
      await seedPresentableProfessional(
        adminClient,
        adminUserId,
        `${nome} E2E ${runId}`,
      ),
    );
  }

  // ENTREGA CANÔNICA — o mesmo caminho que as telas percorrem: Acolhimento,
  // contexto, critérios, validação, comparação, seleção humana, Relatório,
  // emissão e entrega. Nenhum protocolo do ACE participa.
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

  const priorityProfileId = await curadoria.createPriorityProfile(
    cliente,
    created.id,
    adminUserId,
  );
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

  // Quem são os três é decidido pela comparação sobre a rede real — a fixture
  // NÃO assume que os semeados serão os escolhidos. Os nomes exibidos na tela
  // vêm daqui, do que foi de fato entregue.
  // M3: o record do COS não carrega mais as análises legadas — a fixture lê a
  // tabela histórica diretamente, que é exatamente o cenário que ela monta.
  const { data: redeRows } = await cliente
      .from("professional_profiles")
      .select("id")
      .eq("status", "ativo")
      .eq("is_demo", false)
      .eq("publication_status", "publicado");
  const tres = (redeRows ?? [])
    .slice(0, 3)
    .map((row) => ({ professionalId: row.id as string }));
  if (tres.length < 3) {
    throw new Error("Fixture E2E: a rede local não tem três profissionais elegíveis.");
  }

  // Nomes pela fonte canônica — as análises não carregam mais display name.
  const { data: nomesRows } = await cliente
    .from("professional_profiles")
    .select("id, display_name")
    .in("id", tres.map((a) => a.professionalId));
  const nomeDe = new Map((nomesRows ?? []).map((row) => [row.id as string, row.display_name as string]));

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

  return {
    patientEmail,
    patientPassword: patientAccount.password,
    patientProfileId: patientAccount.profileId,
    caseId: created.id,
    reportId: report!.id,
    curatedSelectionId: selection!.id,
    createdProfessionalIds,
    selectedProfessionals: tres.map((a) => ({
      id: a.professionalId,
      name: nomeDe.get(a.professionalId) ?? "Profissional",
    })),
    professionalDisplayNames: tres.map((a) => nomeDe.get(a.professionalId) ?? "Profissional"),
  };
}

async function cleanupFixture(fixture: DeliveredFixture | undefined) {
  // A preparação pode ter falhado antes de produzir a fixture. Sem esta
  // guarda, o cleanup lança um TypeError que aparece no relatório NO LUGAR do
  // erro real — foi assim que "papel não encontrado" ficou escondido atrás de
  // "Cannot read properties of undefined".
  if (!fixture) return;

  const adminClient = createAdminSupabaseClient();

  // Profissionais SEMPRE por último, e só depois que o Case tiver saído: a
  // Curadoria canônica grava `curated_selection_options` e
  // `curadoria_report_options` com FK para `professional_profiles`. Inverter a
  // ordem faz o DELETE falhar por FK — silenciosamente, se o erro não for lido.
  const removerProfissionais = async () => {
    const ids = fixture.createdProfessionalIds ?? [];
    if (ids.length === 0) return;

    await adminClient
      .from("professional_competency_areas")
      .delete()
      .in("professional_profile_id", ids);
    const { error } = await adminClient.from("professional_profiles").delete().in("id", ids);
    if (error) {
      throw new Error(`Falha ao remover profissionais da fixture: ${error.message}`);
    }
  };

  // Fixture parcial: o paciente pode nem ter sido criado. Os profissionais que
  // já existem precisam sair mesmo assim, senão uma preparação interrompida
  // deixa resíduo — e resíduo com nome colidente foi o que travou este spec.
  if (!fixture.patientProfileId) {
    await removerProfissionais();
    return;
  }

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

  await removerProfissionais();
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
      // Exatamente um: nomes únicos por execução são o que garante que o
      // localizador semântico do paciente resolva um só profissional.
      await expect(page.getByRole("radio", { name })).toHaveCount(1);
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
    await page.getByRole("button", { name: `Quero seguir com ${first}` }).click();
    await expect(
      page.getByText(`Você escolheu seguir com ${first}.`),
    ).toBeVisible();

    await page.getByRole("button", { name: `Seguir com ${first}` }).click();

    // A PROVA É A CONNECTION, NÃO O TEXTO.
    //
    // `Você escolheu seguir com X.` aparece também no passo de revisão, ANTES
    // da confirmação — usá-la sozinha deixava passar um clique que não
    // persistia nada, e foi o que escondeu por várias execuções o fato de
    // nenhuma Connection estar sendo criada.
    await expect(async () => {
      const admin = createAdminSupabaseClient();
      const { data } = await admin
        .from("connection_records")
        .select("id, curadoria_report_id, professional_profile_id, status")
        .eq("case_id", fixture.caseId);

      expect(data, "a confirmação precisa persistir exatamente uma Connection").toHaveLength(1);
      expect(data![0]!.curadoria_report_id).toBe(fixture.reportId);
      expect(data![0]!.professional_profile_id).toBe(
        fixture.selectedProfessionals[0]!.id,
      );
      expect(data![0]!.status).toBe("DECISAO_REGISTRADA");
    }).toPass({ timeout: 10_000 });

    // A escolha não pode ter gravado um segundo fato de domínio.
    {
      const admin = createAdminSupabaseClient();
      const { data: decisions } = await admin
        .from("patient_curadoria_decisions")
        .select("id")
        .eq("curated_selection_id", fixture.curatedSelectionId);
      expect(decisions ?? [], "a escolha não grava decisão paralela").toHaveLength(0);
    }

    await page.reload();
    await expect(
      page.getByText(`Você escolheu seguir com ${first}.`),
    ).toBeVisible();

    // Correção antes do contato.
    await page.getByRole("button", { name: "Alterar minha escolha" }).click();
    await page.getByRole("radio", { name: second }).check();
    await page.getByRole("button", { name: `Quero seguir com ${second}` }).click();
    await page.getByRole("button", { name: `Seguir com ${second}` }).click();

    // Esperar a correção PERSISTIR antes de recarregar.
    //
    // Sem isto o `reload` corria contra a Server Action: às vezes a página
    // recarregava antes da escrita terminar, e o teste falhava de forma
    // intermitente — passava numa execução e falhava na seguinte. A primeira
    // escolha já esperava assim; a correção não esperava nada.
    const idCorrigido = fixture.selectedProfessionals.find((p) => p.name === second)!.id;
    await expect(async () => {
      const admin = createAdminSupabaseClient();
      const { data } = await admin
        .from("connection_records")
        .select("id, professional_profile_id, curadoria_report_id")
        .eq("case_id", fixture.caseId);

      expect(data, "a correção não pode criar uma segunda Connection").toHaveLength(1);
      expect(data![0]!.professional_profile_id).toBe(idCorrigido);
      expect(data![0]!.curadoria_report_id).toBe(fixture.reportId);
    }).toPass({ timeout: 10_000 });

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
      await page.getByRole("button", { name: `Quero seguir com ${name}` }).click();
      await page
        .getByRole("button", { name: `Seguir com ${name}` })
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
      // Estado terminal: o painel não oferece mais NENHUMA ação sobre a
      // escolha. A asserção é escopada às ações proibidas, não à contagem de
      // botões da página inteira — o cabeçalho do paciente tem controles
      // legítimos, e exigir zero botões testava o layout, não o produto.
      for (const acao of [
        `Seguir com ${name}`,
        "Voltar aos caminhos",
        "Alterar minha escolha",
        "Já iniciei o contato",
        "O contato não avançou",
      ]) {
        await expect(page.getByRole("button", { name: acao })).toHaveCount(0);
      }
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
      await page.getByRole("button", { name: `Quero seguir com ${name}` }).click();
      await page
        .getByRole("button", { name: `Seguir com ${name}` })
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
      // Estado terminal: o painel não oferece mais NENHUMA ação sobre a
      // escolha. A asserção é escopada às ações proibidas, não à contagem de
      // botões da página inteira — o cabeçalho do paciente tem controles
      // legítimos, e exigir zero botões testava o layout, não o produto.
      for (const acao of [
        `Seguir com ${name}`,
        "Voltar aos caminhos",
        "Alterar minha escolha",
        "Já iniciei o contato",
        "O contato não avançou",
      ]) {
        await expect(page.getByRole("button", { name: acao })).toHaveCount(0);
      }
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
      await page.getByRole("button", { name: `Quero seguir com ${name}` }).click();
      await page
        .getByRole("button", { name: `Seguir com ${name}` })
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
      await page.getByRole("button", { name: `Quero seguir com ${name}` }).click();
      await page
        .getByRole("button", { name: `Seguir com ${name}` })
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
      // Estado terminal: o painel não oferece mais NENHUMA ação sobre a
      // escolha. A asserção é escopada às ações proibidas, não à contagem de
      // botões da página inteira — o cabeçalho do paciente tem controles
      // legítimos, e exigir zero botões testava o layout, não o produto.
      for (const acao of [
        `Seguir com ${name}`,
        "Voltar aos caminhos",
        "Alterar minha escolha",
        "Já iniciei o contato",
        "O contato não avançou",
      ]) {
        await expect(page.getByRole("button", { name: acao })).toHaveCount(0);
      }
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
      // O isolamento se prova pelo Case e pela Connection, NUNCA pelo nome do
      // profissional: o mesmo profissional pode legitimamente aparecer nas
      // Curadorias de dois pacientes, e usar o nome como sinal de vazamento
      // acusava o produto funcionando corretamente.
      //
      // Este paciente está no passo de escolha — logo não carrega nenhuma
      // decisão, muito menos a do outro.
      await expect(
        page.getByText("Você escolheu seguir com", { exact: false }),
      ).toHaveCount(0);

      // E o Case do outro paciente permanece fora do alcance da sessão dele.
      const outroClient = createCuradoriaClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      );
      await outroClient.auth.signInWithPassword({
        email: otherFixture.patientEmail,
        password: otherFixture.patientPassword,
      });
      const { data: alheias } = await outroClient
        .from("connection_records")
        .select("id")
        .eq("case_id", fixture.caseId);
      expect(alheias ?? [], "a Connection alheia não pode ser alcançada").toHaveLength(0);
    } finally {
      await cleanupFixture(otherFixture);
    }
  });
});
