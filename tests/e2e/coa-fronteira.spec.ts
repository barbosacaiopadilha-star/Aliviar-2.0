import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * COA-H1 · A FRONTEIRA DO ÍNDICE `/coa`, NA ROTA REAL.
 *
 * `/coa` tinha ramo para "um nível" e ramo implícito para "vários", e nenhum
 * para **nenhum**. Quem não resolvia nível nenhum — paciente, profissional,
 * atendente sem nível COA — caía no render e recebia o Centro de Operações com
 * HTTP 200 e a grade vazia. Não vazava dado, e mesmo assim era fronteira aberta:
 * a existência do painel operacional é informação, e a próxima pessoa a mexer
 * ali herdaria a suposição de que quem chega já foi autorizado.
 *
 * A cobertura anterior era cega a isso por um motivo simples e verificável:
 * `authorization.spec.ts` percorre `/admin`, `/profissional` e `/paciente`, e
 * **nunca visita `/coa`**. Nenhuma função pura poderia ter pego — o defeito
 * estava na composição da rota, não no contrato.
 *
 *   node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/coa-fronteira.spec.ts --workers=1
 *
 * Exige `npm run bootstrap:test-users:local` (contas sintéticas locais).
 */

type ContaDeTeste = { role: string; email: string; password: string };

const CONTAS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function carregarContas(): ContaDeTeste[] {
  if (!existsSync(CONTAS_PATH)) {
    throw new Error(
      "test-users.local.json não encontrado. Execute `npm run bootstrap:test-users:local` antes destes testes.",
    );
  }
  return JSON.parse(readFileSync(CONTAS_PATH, "utf-8"));
}

function conta(papel: string): ContaDeTeste {
  const encontrada = carregarContas().find((c) => c.role === papel);
  if (!encontrada) throw new Error(`conta de teste do papel "${papel}" não existe`);
  return encontrada;
}

/** Marcas do hub. Se qualquer uma aparecer, o índice foi renderizado. */
const MARCAS_DO_HUB = ["Centro de Operações Aliviar", "Escolha sua área operacional"] as const;

async function entrarComo(page: Page, papel: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  const c = conta(papel);
  await page.getByLabel("E-mail").fill(c.email);
  await page.getByLabel("Senha").fill(c.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * O hub não pode ter aparecido — nem agora, nem num flash antes do redirect.
 *
 * A comparação é case-insensitive porque o nome do sistema é maiusculizado por
 * CSS (`uppercase`), e `innerText` devolve o texto renderizado: procurar a
 * marca com a caixa da fonte a deixaria muda. Medido durante a prova de perda.
 */
async function semHub(page: Page) {
  const corpo = (await page.locator("body").innerText()).toLowerCase();
  for (const marca of MARCAS_DO_HUB) {
    expect(
      corpo,
      `o hub operacional foi renderizado para quem não tem nível: "${marca}"`,
    ).not.toContain(marca.toLowerCase());
  }
}

test.describe("COA-H1 · o índice /coa fecha para quem não tem nível", () => {
  // Contas sintéticas compartilhadas: em série, para que um logout não invalide
  // a sessão de outro cenário rodando ao mesmo tempo.
  test.describe.configure({ mode: "serial" });

  test("T6 · anônimo continua indo para o login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/login\?next=%2Fcoa$/);
    await semHub(page);
  });

  test("T1 · paciente termina em /acesso-negado, sem ver o hub", async ({ page }) => {
    await entrarComo(page, "paciente");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/acesso-negado$/);
    await semHub(page);
  });

  test("T2 · profissional termina em /acesso-negado", async ({ page }) => {
    await entrarComo(page, "profissional");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/acesso-negado$/);
    await semHub(page);
  });

  test("T2 · atendente sem nível COA termina em /acesso-negado", async ({ page }) => {
    await entrarComo(page, "atendente");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/acesso-negado$/);
    await semHub(page);
  });

  test("T7 · paciente continua bloqueada nas rotas filhas", async ({ page }) => {
    await entrarComo(page, "paciente");
    // A única rota filha viva é a Curadoria — e ela nega por papel.
    await page.goto("/coa/curadoria");
    await expect(page, "/coa/curadoria deixou a paciente passar").toHaveURL(/\/acesso-negado$/);

    // /coa/atendimento e /coa/concierge SAÍRAM (auditoria operacional F-3):
    // eram dashboards sobre os mesmos dados das jornadas. Para a paciente o
    // destino agora é 404 — bloqueio igual, por inexistência. O que este
    // teste segue garantindo é o essencial: nenhum conteúdo operacional
    // vaza para ela por esses endereços.
    for (const removida of ["/coa/atendimento", "/coa/concierge"]) {
      const resposta = await page.goto(removida);
      expect(resposta?.status(), `${removida} voltou a existir`).toBe(404);
    }
  });

  test("T8 · /acesso-negado não devolve ninguém para /coa", async ({ page }) => {
    await entrarComo(page, "paciente");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/acesso-negado$/);
    // Espera curta e deliberada: se houvesse laço, a URL sairia daqui sozinha.
    await page.waitForTimeout(1500);
    await expect(page, "houve laço entre /acesso-negado e /coa").toHaveURL(/\/acesso-negado$/);
  });
});

test.describe("COA-H1 · a matriz legítima permanece intacta", () => {
  test.describe.configure({ mode: "serial" });

  // O hub deixou de existir como tela (fusão de 21/08): /coa virou
  // redirecionamento puro para a casa do papel, via resolveCoaHomePath.
  // A matriz agora é: cada papel legítimo termina na PRÓPRIA jornada — e o
  // hub não aparece para NINGUÉM, nem num flash (semHub em todos).

  test("T3 · Curador médico continua sendo levado à Curadoria", async ({ page }) => {
    await entrarComo(page, "curador_medico");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/coa\/curadoria$/);
    await semHub(page);
  });

  test("T3b · o endereço antigo da discordância não vira 404", async ({ page }) => {
    // Auditoria visual de 22/08: o redirect específico ficava DEPOIS do
    // coringa /portal-curador/:path* — o coringa engolia primeiro e mandava
    // para /coa/curadoria/discordancia, que é 404 desde a redução de 21/08.
    // A regra subiu para antes do coringa; este teste prende a ordem.
    await entrarComo(page, "curador_medico");
    for (const antigo of ["/portal-curador/discordancia", "/coa/curadoria/discordancia"]) {
      await page.goto(antigo);
      await expect(page, `${antigo} deixou de pousar na Curadoria`).toHaveURL(/\/coa\/curadoria$/);
    }
  });

  test("T4 · administrador é levado direto ao Atendimento — o hub não renderiza", async ({ page }) => {
    await entrarComo(page, "administrador");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/atendimento$/);
    await semHub(page);
  });

  test("T5 · concierge é levado direto ao Acompanhamento — e Curadoria não aparece", async ({ page }) => {
    await entrarComo(page, "concierge");
    await page.goto("/coa");
    await expect(page).toHaveURL(/\/acompanhamento$/);
    await semHub(page);
    await expect(page.locator("body")).not.toContainText("Curadoria Médica");
  });
});
