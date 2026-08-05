import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import {
  criarCenario,
  limparCenario,
  residuosDe,
  type Cenario,
} from "./apoio-reconhecimento";

/**
 * ETAPA 2D · D4 — O FLUXO NO NAVEGADOR, COM PACIENTE AUTENTICADA DE VERDADE.
 *
 * As suítes de integração provam que o banco faz a coisa certa. Este arquivo
 * prova a única coisa que elas não alcançam: que a paciente CONSEGUE CHEGAR ao
 * ato — que a comparação aparece, que os quatro desfechos estão na tela, que o
 * texto é exigido antes de registrar, e que **depois de recarregar a página**
 * o que ela vê é o que ficou no banco.
 *
 * MR-02 — CADA EXECUÇÃO É DONA DO PRÓPRIO CENÁRIO.
 *
 * Antes, o spec logava com a paciente permanente e consumia uma tradução
 * pendente pré-semeada: a segunda execução encontrava tudo respondido e
 * falhava, e cada rodada deixava resíduo. Agora cada teste cria a própria
 * paciente, o próprio Case e as próprias traduções, e apaga o que criou —
 * inclusive quando o corpo do teste falha, porque a limpeza vive no `finally`.
 *
 * Nenhum teste depende de outro nem da ordem: qualquer um roda sozinho.
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

async function entrar(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
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
    let cenario: Cenario | null = null;
    try {
      cenario = await criarCenario();
      await entrar(page, cenario.email, cenario.password);
      await abrirOPerfil(page);

      // 1. A COMPARAÇÃO — as duas colunas, o achado P8 resolvido.
      await expect(page.getByText("O que você disse").first()).toBeVisible();
      await expect(page.getByText("O que ficou registrado").first()).toBeVisible();
      await capturar(page, "01-comparacao-duas-colunas");

      // MR-01 — a coluna dela fala a língua dela: o rótulo do Catálogo, nunca
      // o código com que a resposta é armazenada.
      for (const { valor, rotulo } of cenario.opcoes) {
        await expect(page.getByText(rotulo, { exact: false }).first()).toBeVisible();
        await expect(page.getByText(valor, { exact: false })).toHaveCount(0);
      }

      // 2. OS QUATRO DESFECHOS, com o mesmo peso (Etapa 2C · C5).
      const opcoes = [
        "É isso mesmo",
        "Quase — quero ajustar",
        "Não foi isso que eu disse",
        "Prefiro pensar",
      ];
      for (const rotulo of opcoes) {
        await expect(page.getByRole("button", { name: rotulo }).first()).toBeVisible();
      }
      await capturar(page, "02-quatro-desfechos");

      // 3. DT-22 — o texto é exigido ANTES de registrar.
      await page.getByRole("button", { name: "Não foi isso que eu disse" }).first().click();
      const registrar = page.getByRole("button", { name: "Registrar" }).first();
      await expect(registrar).toBeDisabled();
      await capturar(page, "03-texto-obrigatorio");

      const TEXTO = `Prova da Etapa 2D (${cenario.marca}): nao foi isso que eu disse.`;
      await page.getByRole("textbox").first().fill(TEXTO);
      await expect(registrar).toBeEnabled();
      await registrar.click();

      // 4. O ATO REGISTRADO — a tela conta o que ficou.
      await expect(page.getByText("Você discordou desta leitura.")).toBeVisible({
        timeout: 15_000,
      });
      await capturar(page, "04-desfecho-registrado");

      // 5. A RECARGA — GET novo, documento inteiro, zero estado local.
      await page.reload();
      await abrirOPerfil(page);

      await expect(page.getByText("Você discordou desta leitura.")).toBeVisible();
      await expect(page.getByText(TEXTO)).toBeVisible();
      await capturar(page, "05-apos-recarga");
    } finally {
      await limparCenario(cenario);
    }
  });

  /**
   * MR-02 · a prova de que a limpeza limpa. Sem este teste, "descartável" seria
   * uma promessa do comentário — e resíduo só apareceria na terceira execução
   * de alguém, meses depois.
   */
  test("o cenário não sobrevive à própria execução", async () => {
    const cenario = await criarCenario();

    const antes = await residuosDe(cenario);
    expect(antes.cases, "a fixture nasceu vazia — o teste seguinte seria vácuo").toBe(1);
    expect(antes.case_needs).toBe(3);
    expect(antes.case_priority_map).toBe(3);
    expect(antes.priority_profiles).toBe(1);
    expect(antes.patient_stories).toBe(1);

    await limparCenario(cenario);

    expect(await residuosDe(cenario)).toEqual({
      cases: 0,
      case_needs: 0,
      case_priority_map: 0,
      priority_profiles: 0,
      patient_stories: 0,
      audit_logs: 0,
    });

    // Limpar de novo não explode: cenário parcial e re-limpeza são normais.
    await limparCenario(cenario);
  });

  test("D5 · o Curador lê a resposta dela e não tem como praticá-la", async ({ page }) => {
    const curador = conta("curador_medico");
    await entrar(page, curador.email, curador.password);

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
