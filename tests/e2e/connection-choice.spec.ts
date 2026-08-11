import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "../integration/curadoria-client";

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
