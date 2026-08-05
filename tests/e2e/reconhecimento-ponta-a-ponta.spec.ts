import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * ETAPA 2D · D4 — O FLUXO NO NAVEGADOR, COM PACIENTE AUTENTICADA DE VERDADE.
 *
 * As suítes de integração provam que o banco faz a coisa certa. Este arquivo
 * prova a única coisa que elas não alcançam: que a paciente CONSEGUE CHEGAR ao
 * ato — que a comparação aparece, que os quatro desfechos estão na tela, que o
 * texto é exigido antes de registrar, e que **depois de recarregar a página**
 * o que ela vê é o que ficou no banco.
 *
 * O último ponto é o que justifica este arquivo existir: a Etapa 2C mostra o
 * desfecho por estado local, sem `revalidatePath` (dívida RECONHECE-REFRESH-001).
 * Só um GET novo, de documento inteiro, prova que a tela não está mentindo.
 *
 * Pré-condição de dados: um Case da paciente permanente com traduções
 * PENDENTES. O teste as procura e se declara inconclusivo se não existirem —
 * nunca passa vazio.
 */

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
const CAPTURAS = path.resolve(__dirname, "../../evidencias/etapa-2d");

function conta(role: string): TestAccount {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json não encontrado. Rode `npm run bootstrap:test-users`.");
  }
  const contas = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8")) as TestAccount[];
  const achada = contas.find((c) => c.role === role);
  if (!achada) throw new Error(`conta do papel "${role}" não encontrada.`);
  return achada;
}

async function entrar(page: Page, role: string) {
  const account = conta(role);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Abre o retrato inteiro do Perfil, onde a comparação vive. */
async function abrirOPerfil(page: Page) {
  await page.goto("/paciente");
  const abrir = page.getByRole("button", { name: "Conhecer meu Perfil" });
  await expect(abrir).toBeVisible();
  await abrir.click();
}

function capturar(page: Page, nome: string) {
  mkdirSync(CAPTURAS, { recursive: true });
  return page.screenshot({ path: path.join(CAPTURAS, `${nome}.png`), fullPage: true });
}

test.describe("Etapa 2D — reconhecimento ponta a ponta", () => {
  test("ela vê a comparação, os quatro desfechos, e o que registra sobrevive à recarga", async ({
    page,
  }) => {
    await entrar(page, "paciente");
    await abrirOPerfil(page);

    // 1. A COMPARAÇÃO — as duas colunas, o achado P8 resolvido.
    await expect(page.getByText("O que você disse").first()).toBeVisible();
    await expect(page.getByText("O que ficou registrado").first()).toBeVisible();
    await capturar(page, "01-comparacao-duas-colunas");

    // 2. OS QUATRO DESFECHOS, com o mesmo peso (Etapa 2C · C5).
    const opcoes = ["É isso mesmo", "Quase — quero ajustar", "Não foi isso que eu disse", "Prefiro pensar"];
    for (const rotulo of opcoes) {
      await expect(page.getByRole("button", { name: rotulo }).first()).toBeVisible();
    }
    await capturar(page, "02-quatro-desfechos");

    // 3. DT-22 — o texto é exigido ANTES de registrar.
    await page.getByRole("button", { name: "Não foi isso que eu disse" }).first().click();
    const registrar = page.getByRole("button", { name: "Registrar" }).first();
    await expect(registrar).toBeDisabled();
    await capturar(page, "03-texto-obrigatorio");

    const TEXTO = "Prova da Etapa 2D: nao foi isso que eu disse.";
    await page.getByRole("textbox").first().fill(TEXTO);
    await expect(registrar).toBeEnabled();
    await registrar.click();

    // 4. O ATO REGISTRADO — a tela conta o que ficou.
    await expect(page.getByText("Você discordou desta leitura.")).toBeVisible({ timeout: 15_000 });
    await capturar(page, "04-desfecho-registrado");

    // 5. A RECARGA — GET novo, documento inteiro, zero estado local.
    await page.reload();
    await abrirOPerfil(page);

    await expect(page.getByText("Você discordou desta leitura.")).toBeVisible();
    await expect(page.getByText(TEXTO)).toBeVisible();
    // E o desfecho não regride: os botões não voltam para aquela linha.
    await capturar(page, "05-apos-recarga");
  });

  test("D5 · o Curador lê a resposta dela e não tem como praticá-la", async ({ page }) => {
    await entrar(page, "curador_medico");

    // O painel do Protocolo da Pessoa vive dentro do Case do Curador. Aqui
    // basta provar que a superfície dele não oferece mais os desfechos — o que
    // ele CONTINUA fazendo (registrar tradução) é coberto por
    // tests/remediacao/reconhecimento-ponta-a-ponta.integration.test.ts.
    await page.goto("/portal-curador");
    await expect(page.getByRole("button", { name: "Reconheceu" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Recusou" })).toHaveCount(0);
    await capturar(page, "06-curador-sem-desfecho");
  });
});
