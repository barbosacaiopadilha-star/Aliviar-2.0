import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { removerProfissionaisPorPrefixo } from "../apoio/limpar-profissionais";

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

test.describe("gestão administrativa de profissionais (Sprint Produto 2)", () => {
  test.describe.configure({ mode: "serial" });

  // O pool de profissionais é global na stack local: o que este spec cria
  // pela tela pesa na Shortlist de todos os outros. Sai no fim.
  test.afterAll(async () => {
    await removerProfissionaisPorPrefixo("E2E-");
  });

  test("administrador cria, edita e alterna status/publicação de um profissional", async ({ page }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/profissionais");
    // `exact` porque o estado vazio da lista tem um h2 que também contém
    // "profissionais" — o alvo é o título da página, não o vizinho.
    await expect(page.getByRole("heading", { name: "Profissionais", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Novo profissional" }).click();
    await expect(page).toHaveURL("/admin/profissionais/novo");

    const identifier = `E2E-${Date.now()}`;
    await page.getByLabel("Nome de exibição").fill("Profissional E2E");
    await page.getByLabel("Identificação profissional").fill(identifier);
    await page.getByRole("button", { name: "Criar profissional" }).click();

    await page.waitForURL(/\/admin\/profissionais\/[0-9a-f-]+\/cadastro$/);
    await expect(page.getByRole("heading", { name: "Profissional E2E" })).toBeVisible();
    await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
    await expect(page.getByText("Não publicado", { exact: true })).toBeVisible();

    await page.getByLabel("Resumo profissional").fill("Editado via E2E.");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Salvo com sucesso.")).toBeVisible();

    // A porta de publicação (política de fontes): o painel diz o que falta —
    // e cada condição é cumprida pela interface, nunca por SQL manual.
    //
    // ORÁCULO ATUALIZADO (2026-08-19): a ficha do profissional deixou de ser
    // página única e virou fluxo por etapas (hoje quatro — fusão de 21/08). A porta de publicação mora
    // na etapa "Rede"; os dados básicos, na etapa "Cadastro". O teste
    // passa a navegar entre elas — o produto mudou de propósito, e o que este
    // teste prova continua o mesmo.
    await page.getByRole("link", { name: "Rede", exact: true }).click();
    await page.waitForURL(/\/rede$/);
    await expect(page.getByText(/Pendências para publicação/)).toBeVisible();
    await expect(page.getByText("O CRM não foi informado.")).toBeVisible();
    await expect(page.getByText("O registro no conselho ainda não foi verificado.")).toBeVisible();
    await expect(page.getByText("A Área de Atuação não foi definida.")).toBeVisible();

    // 1. CRM + UF no cadastro — de volta à primeira etapa.
    await page.getByRole("link", { name: "Cadastro", exact: true }).click();
    await page.waitForURL(/\/cadastro$/);
    await page.getByLabel("CRM (quando aplicável)").fill("123456");
    await page.getByLabel("UF do CRM").selectOption("SP");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Salvo com sucesso.")).toBeVisible();

    // 2. Verificação do registro, com fonte — na etapa de Publicação.
    await page.getByRole("link", { name: "Rede", exact: true }).click();
    await page.waitForURL(/\/rede$/);
    await page.getByLabel("Situação verificada").selectOption("regular");
    await page.getByLabel("Fonte da verificação").fill("Portal do CFM, consulta E2E");
    await page.getByRole("button", { name: "Registrar verificação" }).click();
    // A confirmação é o SELO vindo do servidor, com a data do registro — não
    // um aviso que vive na memória da tela e some quando ela se atualiza.
    await expect(page.getByText(/Verificação registrada em \d{2}\/\d{2}\/\d{4}/)).toBeVisible();

    // 3. Área de Atuação verificada, com fonte.
    await page.getByLabel("Descrição (texto original, sempre preservado)").fill("Ortopedia — coluna e dor crônica");
    await page.getByLabel("Tags normalizadas (separadas por vírgula)").fill("ortopedia, coluna, dor crônica");
    await page.getByLabel("Fonte", { exact: true }).fill("Site institucional (E2E)");
    await page.getByLabel("Marcar como verificada (exige fonte)").check();
    await page.getByRole("button", { name: "Salvar área de atuação" }).click();
    await expect(page.getByText(/Área de atuação salva/)).toBeVisible();

    // Sem pendências, a porta abre.
    await expect(page.getByText(/Pendências para publicação/)).toHaveCount(0);
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Despublicar" })).toBeVisible();

    // Catálogo 1.0.0 no cadastro (ETAPA 5): os cinco eixos, preenchimento,
    // rascunho, retomada e registro — uma única fonte, nenhuma lista paralela.
    //
    // ORÁCULO ATUALIZADO (2026-08-20): o Protocolo é a etapa 5 do fluxo, não
    // mais um bloco da mesma página.
    await page.getByRole("link", { name: "Protocolo", exact: true }).click();
    await page.waitForURL(/\/protocolo$/);
    for (const eixo of [
      "Acesso ao cuidado",
      "Continuidade do cuidado",
      "Modelo de atendimento",
      "Prática e trajetória",
      "Viabilidade de acesso",
    ]) {
      await expect(page.getByRole("button", { name: eixo })).toBeVisible();
    }

    // Múltipla escolha + escolha única + condicional (condição obrigatória).
    await page.getByLabel("Presencial", { exact: true }).check();
    await page.getByLabel("Primeira remota, sob condição").check();
    await page.getByLabel("Condição — Modalidade de atendimento").fill("Após avaliação do caso pela equipe");
    await page.getByLabel("Até 7 dias", { exact: true }).check();

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("Rascunho salvo. Você pode retomar quando quiser.")).toBeVisible();

    // Retomada: sair e voltar restaura condição e respostas.
    await page.reload();
    await expect(page.getByText(/Rascunho retomado/)).toBeVisible();
    await expect(page.getByLabel("Presencial", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Primeira remota, sob condição")).toBeChecked();
    await expect(page.getByLabel("Condição — Modalidade de atendimento")).toHaveValue(
      "Após avaliação do caso pela equipe",
    );
    await expect(page.getByLabel("Até 7 dias", { exact: true })).toBeChecked();

    // Registro na Base de Evidências, com proveniência da equipe.
    await page.getByRole("button", { name: "Revisar e submeter" }).click();
    await page.getByRole("button", { name: "Registrar pelo cadastro" }).click();
    await expect(page.getByText(/respostas registradas pela equipe/)).toBeVisible();

    // TIRAR DA REDE PELO CAMINHO QUE O MODELO PERMITE.
    //
    // Este passo clicava em "Desativar" no cabeçalho e esperava "Inativo".
    // Nunca poderia passar depois de publicar: o banco recusa, com a frase
    // "Publicar e despublicar são mudanças de ciclo. Use a transição do ciclo
    // de vida — `status` e `publication_status` apenas a espelham." O teste
    // cobrava um ato que o Método proíbe, e a falha era legítima.
    //
    // O cabeçalho deixou de oferecer o botão quando o profissional está
    // publicado, e passou a apontar para a etapa "Rede" (fusão 6→4 de 21/08:
    // Publicação + Ciclo de vida viraram uma etapa). É por lá que se sai da
    // Rede — com motivo declarado e autoria registrada, que é justamente o
    // que a mudança de ciclo existe para garantir.
    // O que este spec guarda é o CABEÇALHO: publicado, ele não oferece mais um
    // ato que o banco recusa, e diz para onde ir. Percorrer a transição de
    // ciclo inteira aqui seria duplicar — ela já é coberta, e melhor, por
    // `tests/integration/c7-ciclo-do-profissional.integration.test.ts` e pelos
    // testes de unidade do mesmo módulo, que exercitam destino, motivo e
    // autoria sem depender de tela.
    await expect(page.getByRole("button", { name: "Desativar" })).toHaveCount(0);
    await expect(page.getByText(/Para tirar da Rede, use/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Rede", exact: true }).first()).toBeVisible();
  });

  test("paciente e profissional não acessam /admin/profissionais", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/admin/profissionais");
    await expect(page).toHaveURL("/acesso-negado");
  });

  test("busca filtra a lista de profissionais por nome ou identificação (SPRINT OPERACIONAL 1)", async ({
    page,
  }) => {
    const account = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, account);

    await page.goto("/admin/profissionais");
    await page.getByLabel("Buscar por nome ou identificação").fill("pessoa-que-nao-existe-e2e");
    await expect(page.getByText("Nenhum profissional encontrado.")).toBeVisible();

    await page.getByLabel("Buscar por nome ou identificação").fill("");
    await expect(page.getByText("Nenhum profissional encontrado.")).toHaveCount(0);
  });
});
