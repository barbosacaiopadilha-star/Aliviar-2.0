import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "../integration/curadoria-client";
import {
  cleanupLegacyAceChain,
  seedLegacyFinalCuradoriaDelivery,
} from "../integration/legacy-ace-chain-fixture";
import { seedPublishedProfessional } from "../integration/rede-fixture";

const URL_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const ANON_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const META_H4 = "Buscando apoio para dores recorrentes.";

/** Contas fixas locais — mesma convenção dos demais specs de e2e. */
function loadTestAccounts(): Array<{ role: string; email: string; password: string }> {
  const arquivo = path.resolve(__dirname, "../../test-users.local.json");
  if (!existsSync(arquivo)) {
    throw new Error("test-users.local.json ausente — rode bootstrap:test-users:local.");
  }
  return JSON.parse(readFileSync(arquivo, "utf-8"));
}

// B1R: a fixture da Curadoria entregue saiu daqui para um helper compartilhado.
// Ela é a mesma — mesma cadeia canônica, mesmos fatos — e agora também serve
// à suíte que prova o portão de entrega.
import {
  cleanupFixture,
  seedDeliveredCase,

  type DeliveredFixture,
} from "../apoio/apoio-curadoria-entregue";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
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
  test("Caminho 1 — intenção de contato, depois confirmação de atendimento (estado terminal)", async ({
    page,
  }) => {
    const f = await seedDeliveredCase({ decidir: "CHOSEN" });
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
    const f = await seedDeliveredCase({ decidir: "CHOSEN" });
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
    const f = await seedDeliveredCase({ decidir: "CHOSEN" });
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
    const f = await seedDeliveredCase({ decidir: "CHOSEN" });
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
    // Canônico como os demais: sem decisão a superfície de conexão nem existe
    // (H3), e o teste falharia por ausência de tela em vez de provar
    // isolamento. A decisão dela é dela; a Connection do outro Caso continua
    // sendo o que se prova inalcançável.
    const otherFixture = await seedDeliveredCase({ decidir: "CHOSEN" });
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

  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // B3-RI-SPEC-A · o teste legado fica POR ÚLTIMO, de propósito.
  //
  // Ele afirma escolha entre TRÊS e correção para outro profissional — o que
  // H2/H4 removeram do caminho canônico e preservaram só no legado
  // (`!curadoria && delivery`). O describe é serial por causa do pool global
  // de profissionais (ver comentário no topo), então uma falha interrompe o
  // que vem DEPOIS: com ele no fim, sua falha conhecida não produz mais
  // "did not run" nos canônicos.
  //
  // Não é pulado nem enfraquecido: espera a passagem B, que o migra para
  // `seedLegacyFinalCuradoriaDelivery`.
  // ---------------------------------------------------------------------------

  test("H4 legado — a rota projeta a entrega histórica com três profissionais", async ({
    page,
  }) => {
    const service = createAdminSupabaseClient();
    const admin = loadTestAccounts().find((c) => c.role === "administrador")!;
    const adminSession = createCuradoriaClient(URL_LOCAL, ANON_LOCAL);
    const { data: sessaoAdmin } = await adminSession.auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    });
    const adminId = sessaoAdmin!.user!.id;

    const email = `h4-legado-${Date.now()}@aliviar-conexao.local`;
    const paciente = await createPatientAccount(
      service,
      adminSession,
      { email, displayName: "Paciente H4 Legado" },
      adminId,
    );

    const pacienteClient = createCuradoriaClient(URL_LOCAL, ANON_LOCAL);
    await pacienteClient.auth.signInWithPassword({ email, password: paciente.password });
    const rascunho = await getOrCreateActiveStory(pacienteClient, paciente.profileId);
    await saveStoryDraft(pacienteClient, rascunho.id, rascunho.revision, { motivo: META_H4 }, "motivo");
    const atualizado = await getOrCreateActiveStory(pacienteClient, paciente.profileId);
    await submitStory(pacienteClient, rascunho.id, atualizado.revision);

    const caso = await createCase(adminSession, rascunho.id, adminId, adminId);
    await changeCaseStatus(adminSession, caso.id, "IN_REVIEW", adminId);
    await changeCaseStatus(adminSession, caso.id, "READY_FOR_CURATION", adminId);

    const providerProfileIds = [
      await seedPublishedProfessional(service, adminId, `H4 Um ${Date.now()}`),
      await seedPublishedProfessional(service, adminId, `H4 Dois ${Date.now()}`),
      await seedPublishedProfessional(service, adminId, `H4 Tres ${Date.now()}`),
    ];

    const legada = await seedLegacyFinalCuradoriaDelivery({
      service,
      caseId: caso.id,
      patientProfileId: paciente.profileId,
      actorId: adminId,
      providerProfileIds,
      patientGoal: META_H4,
    });

    try {
      // O estado H4: entrega legada existe, Curadoria estruturada NÃO.
      const { data: entregas } = await service
        .from("final_curadoria_deliveries")
        .select("id")
        .eq("case_id", caso.id);
      expect(entregas ?? [], "a entrega legada precisa existir").toHaveLength(1);

      const { data: selecoes } = await service
        .from("curated_selections")
        .select("id")
        .eq("case_id", caso.id);
      expect(selecoes ?? [], "H4 exige AUSÊNCIA de Curadoria estruturada").toHaveLength(0);

      const { data: decisoesAntes } = await service
        .from("patient_curadoria_decisions")
        .select("id")
        .eq("case_id", caso.id);
      expect(decisoesAntes ?? [], "H4 nasce sem decisão canônica").toHaveLength(0);

      // Os nomes vêm de providerIds — a ordem neutra da cadeia legada.
      const { data: perfis } = await service
        .from("professional_profiles")
        .select("id, display_name")
        .in("id", legada.providerIds);
      const nomes = (perfis ?? []).map((r) => r.display_name as string);
      expect(nomes, "a entrega legada carrega três profissionais").toHaveLength(3);

      await loginAs(page, email, paciente.password);
      await page.goto("/paciente/curadoria");

      // A rota projeta H4: painel de conexão legado, com os TRÊS.
      await expect(
        page.getByRole("heading", { name: "Com quem você gostaria de seguir?" }),
      ).toBeVisible();
      for (const nome of nomes) {
        await expect(page.getByRole("radio", { name: nome })).toHaveCount(1);
      }

      // Responsável continua Curador. A prova NÃO é procurar "Equipe Aliviar"
      // no texto: a palavra aparece no cabeçalho institucional da página, e a
      // asserção ingênua achava quatro ocorrências legítimas. O que distingue
      // o estado é a AUSÊNCIA da superfície canônica de decisão — sem ela não
      // houve handoff, e o handoff é o único caminho para o Concierge.
      await expect(page.getByText("Sua decisão está registrada.")).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Registrar minha decisão" }),
      ).toHaveCount(0);

      // -------------------------------------------------------------------
      // INTERAÇÃO LEGADA — escolha, confirmação, correção e persistência.
      //
      // É o que H4 preserva e o caminho canônico removeu: escolher entre TRÊS
      // no painel de conexão e depois CORRIGIR para outro profissional. A
      // âncora aqui é `final_curadoria_delivery_id`; `curadoria_report_id`
      // permanece nulo, porque não existe Curadoria estruturada.
      // -------------------------------------------------------------------
      const [idPrimeiro, idSegundo] = legada.providerIds;
      const nomeDe = new Map((perfis ?? []).map((r) => [r.id as string, r.display_name as string]));
      const primeiro = nomeDe.get(idPrimeiro!)!;
      const segundo = nomeDe.get(idSegundo!)!;

      /** A âncora legada e a ausência de decisão, medidas juntas. */
      async function provarAncoraLegada(profissionalEsperado: string) {
        await expect(async () => {
          const { data: conexoes } = await service
            .from("connection_records")
            .select("id, professional_profile_id, final_curadoria_delivery_id, curadoria_report_id")
            .eq("case_id", caso.id);

          expect(conexoes, "exatamente uma Connection").toHaveLength(1);
          expect(conexoes![0]!.professional_profile_id).toBe(profissionalEsperado);
          expect(conexoes![0]!.final_curadoria_delivery_id).toBe(legada.finalDeliveryId);
          expect(conexoes![0]!.curadoria_report_id, "H4 não ancora em Relatório").toBeNull();
        }).toPass({ timeout: 10_000 });

        const { data: decisoes } = await service
          .from("patient_curadoria_decisions")
          .select("id")
          .eq("case_id", caso.id);
        expect(decisoes ?? [], "a conexão legada nunca cria decisão canônica").toHaveLength(0);
      }

      // Escolha + revisão + confirmação.
      await page.getByRole("radio", { name: primeiro }).check();
      await page.getByRole("button", { name: `Quero seguir com ${primeiro}` }).click();
      await expect(page.getByText(`Você escolheu seguir com ${primeiro}.`)).toBeVisible();
      await page.getByRole("button", { name: `Seguir com ${primeiro}` }).click();
      await provarAncoraLegada(idPrimeiro!);

      // Primeiro reload: a escolha sobrevive, e a correção continua ofertada.
      await page.reload();
      await expect(page.getByText(`Você escolheu seguir com ${primeiro}.`)).toBeVisible();
      await expect(page.getByRole("button", { name: "Alterar minha escolha" })).toBeVisible();
      await provarAncoraLegada(idPrimeiro!);

      // A correção que só o legado preserva.
      await page.getByRole("button", { name: "Alterar minha escolha" }).click();
      await page.getByRole("radio", { name: segundo }).check();
      await page.getByRole("button", { name: `Quero seguir com ${segundo}` }).click();
      await page.getByRole("button", { name: `Seguir com ${segundo}` }).click();
      await provarAncoraLegada(idSegundo!);

      // Segundo reload: a correção persiste, e o primeiro deixou de ser a
      // escolha ativa.
      await page.reload();
      await expect(page.getByText(`Você escolheu seguir com ${segundo}.`)).toBeVisible();
      await expect(page.getByText(`Você escolheu seguir com ${primeiro}.`)).toHaveCount(0);
      await provarAncoraLegada(idSegundo!);

      // Responsabilidade ao fim: sem decisão canônica, o handoff não ocorreu.
      await expect(page.getByText("Sua decisão está registrada.")).toHaveCount(0);
    } finally {
      // A Connection criada pela interação segura a entrega legada por FK
      // (`connection_records_final_curadoria_delivery_id_fkey`). Sai primeiro,
      // com os próprios eventos — só então a cadeia histórica pode ser
      // desmontada de trás para frente.
      const { data: conexoesDoCaso } = await service
        .from("connection_records")
        .select("id")
        .eq("case_id", caso.id);
      for (const conexao of conexoesDoCaso ?? []) {
        await service.from("connection_events").delete().eq("connection_id", conexao.id);
      }
      await service.from("connection_records").delete().eq("case_id", caso.id);

      await cleanupLegacyAceChain(service, legada);
      await service.from("professional_competency_areas").delete().in("professional_profile_id", providerProfileIds);
      await service.from("professional_profiles").delete().in("id", providerProfileIds);
      await service.auth.admin.deleteUser(paciente.profileId).catch(() => undefined);
    }
  });
});
