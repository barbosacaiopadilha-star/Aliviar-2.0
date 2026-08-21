import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import { createCuradoriaClient } from "../integration/curadoria-client";
import { seedPublishedProfessional } from "../integration/rede-fixture";

const URL_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const ANON_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

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
  removerPacienteSintetico,
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

      // CANÔNICO · a pessoa já foi decidida no fato canônico. Ela aparece como
      // informação FIXA — não há rádio, não há o que escolher, e a linguagem
      // trata de começar, não de escolher.
      await expect(page.getByText(`Caminho escolhido: ${name}`)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      for (const legada of [
        "Com quem você gostaria de seguir",
        "um dos três",
        "Os profissionais foram apresentados",
      ]) {
        await expect(page.getByText(legada, { exact: false })).toHaveCount(0);
      }

      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();
      await expect(
        page.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();

      // Espera pelo ESTADO REAL, com teto explícito. Medido na B3-COPY-B2:
      // ~840ms de forma estável, em build frio e quente. 10s é ~12x a folga —
      // não mascara falha da action, que nunca renderiza este texto.
      await expect(page.getByText(`Acompanhamento aberto com ${name}.`)).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("button", { name: "Alterar minha escolha" })).toHaveCount(0);

      await expect(
        page.getByRole("button", { name: "Já iniciei o contato" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Já iniciei o contato" }).click();
      await expect(
        page.getByText(`Você registrou que iniciou o contato com ${name}.`),
      ).toBeVisible({ timeout: 10_000 });

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
        "Abrir meu acompanhamento",
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

      // CANÔNICO · a pessoa já foi decidida no fato canônico. Ela aparece como
      // informação FIXA — não há rádio, não há o que escolher, e a linguagem
      // trata de começar, não de escolher.
      await expect(page.getByText(`Caminho escolhido: ${name}`)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      for (const legada of [
        "Com quem você gostaria de seguir",
        "um dos três",
        "Os profissionais foram apresentados",
      ]) {
        await expect(page.getByText(legada, { exact: false })).toHaveCount(0);
      }

      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();
      await expect(
        page.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();

      await expect(page.getByText(`Acompanhamento aberto com ${name}.`)).toBeVisible();
      await expect(page.getByRole("button", { name: "Alterar minha escolha" })).toHaveCount(0);

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
        "Abrir meu acompanhamento",
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

      // CANÔNICO · a pessoa já foi decidida no fato canônico. Ela aparece como
      // informação FIXA — não há rádio, não há o que escolher, e a linguagem
      // trata de começar, não de escolher.
      await expect(page.getByText(`Caminho escolhido: ${name}`)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      for (const legada of [
        "Com quem você gostaria de seguir",
        "um dos três",
        "Os profissionais foram apresentados",
      ]) {
        await expect(page.getByText(legada, { exact: false })).toHaveCount(0);
      }

      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();
      await expect(
        page.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();

      await expect(page.getByText(`Acompanhamento aberto com ${name}.`)).toBeVisible();
      await expect(page.getByRole("button", { name: "Alterar minha escolha" })).toHaveCount(0);
      await page.getByRole("button", { name: "Já iniciei o contato" }).click();
      // Esperar o ESTADO REAL antes do gesto seguinte, nunca um sleep. O painel
      // desabilita os próprios botões enquanto a action está em voo — clicar
      // "O contato não avançou" no mesmo instante é o teste correndo contra o
      // produto, e foi o que produziu a intermitência medida na B3-COPY-B2.
      // Limite explícito: se a reprojeção não chegar em 10s, isto FALHA.
      await expect(
        page.getByText(`Você registrou que iniciou o contato com ${name}.`),
      ).toBeVisible({ timeout: 10_000 });

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

      // CANÔNICO · a pessoa já foi decidida no fato canônico. Ela aparece como
      // informação FIXA — não há rádio, não há o que escolher, e a linguagem
      // trata de começar, não de escolher.
      await expect(page.getByText(`Caminho escolhido: ${name}`)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      for (const legada of [
        "Com quem você gostaria de seguir",
        "um dos três",
        "Os profissionais foram apresentados",
      ]) {
        await expect(page.getByText(legada, { exact: false })).toHaveCount(0);
      }

      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();
      await expect(
        page.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();

      await expect(page.getByText(`Acompanhamento aberto com ${name}.`)).toBeVisible();
      await expect(page.getByRole("button", { name: "Alterar minha escolha" })).toHaveCount(0);
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
        "Abrir meu acompanhamento",
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

      const [proprio] = otherFixture.professionalDisplayNames;

      // A entrega do OUTRO paciente é a única que ele pode ver — nunca a
      // escolha registrada no teste anterior para fixture.caseId. Ele também
      // chega decidido: a conexão fala em COMEÇAR, com a pessoa dele como
      // informação fixa, sem rádio e sem nenhuma frase do legado.
      await expect(
        page.getByRole("heading", { name: "Começar seu acompanhamento" }),
      ).toBeVisible();
      await expect(page.getByText(`Caminho escolhido: ${proprio}`)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);
      for (const legada of [
        "Com quem você gostaria de seguir",
        "um dos três",
        "Os profissionais foram apresentados",
      ]) {
        await expect(page.getByText(legada, { exact: false })).toHaveCount(0);
      }

      // O isolamento se prova pelo Case e pela Connection, NUNCA pelo nome do
      // profissional: o mesmo profissional pode legitimamente aparecer nas
      // Curadorias de dois pacientes, e usar o nome como sinal de vazamento
      // acusava o produto funcionando corretamente.
      //
      // Este paciente decidiu, mas não abriu acompanhamento nenhum — logo não
      // carrega estado de conexão, muito menos o do outro.
      await expect(
        page.getByText("Você escolheu seguir com", { exact: false }),
      ).toHaveCount(0);
      await expect(
        page.getByText("Acompanhamento aberto com", { exact: false }),
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
