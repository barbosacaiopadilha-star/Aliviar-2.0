import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { semearCicloE2E } from "../apoio/seed-ciclo-e2e";

/**
 * C7R · EVIDÊNCIA VISUAL OFICIAL — navegação autenticada real, sem DOM injetado.
 *
 * Sete cenários do plano do 02 ARQUITETO, nos três viewports exigidos. Cada
 * captura registra rota, sessão, estado, ação, resultado, innerWidth,
 * scrollWidth do documento, console e a prova correspondente no banco.
 *
 * Em 390: excesso horizontal da página TEM de ser zero e a tabela rola só
 * dentro do próprio contêiner.
 */

const VIEWPORTS = [
  { nome: "1440", width: 1440, height: 900 },
  { nome: "768", width: 768, height: 1024 },
  { nome: "390", width: 390, height: 844 },
] as const;

const DIR = path.resolve(__dirname, "..", "..", "evidencias", "c7r", "capturas");

let seed: Awaited<ReturnType<typeof semearCicloE2E>>;
const errosDeConsole: string[] = [];

test.beforeAll(async () => {
  mkdirSync(DIR, { recursive: true });
  seed = await semearCicloE2E();
});

async function entrarComoAdmin(page: Page) {
  const contas = JSON.parse(
    readFileSync(path.resolve(__dirname, "..", "..", "test-users.local.json"), "utf8"),
  ) as Array<{ role: string; email: string; password: string }>;
  const admin = contas.find((c) => c.role === "administrador")!;
  page.on("pageerror", (erro) => errosDeConsole.push(String(erro)));
  page.on("console", (m) => {
    if (m.type() === "error") errosDeConsole.push(m.text());
  });
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(admin.email);
  await page.getByLabel("Senha").fill(admin.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/admin/);
}

async function medirECapturar(page: Page, nome: string, viewport: (typeof VIEWPORTS)[number]) {
  const medidas = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(medidas.innerWidth, `${nome}: innerWidth`).toBe(viewport.width);
  if (viewport.width === 390) {
    expect(medidas.scrollWidth, `${nome}: excesso horizontal da página`).toBe(390);
  }
  await page.screenshot({ path: path.join(DIR, `${nome}-${viewport.nome}.png`), fullPage: true });
  return medidas;
}

for (const viewport of VIEWPORTS) {
  test.describe(`viewport ${viewport.nome}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`cenários do ciclo em ${viewport.nome}px`, async ({ page }) => {
      await entrarComoAdmin(page);

      // EV-1 · painel do ciclo aberto (PUBLICADO_ATIVO) — a rota que caía.
      await page.goto(`/admin/profissionais/${seed.ids["01"]}`);
      await expect(page.getByRole("heading", { name: "Ciclo de vida" })).toBeVisible();
      await expect(page.getByText("Algo deu errado")).toHaveCount(0);
      await expect(page.getByText(/Estado atual/)).toBeVisible();
      await medirECapturar(page, "ev1-painel", viewport);

      if (viewport.width === 390) {
        // Contrato responsivo da LISTA: página sem excesso, tabela rolando
        // dentro do contêiner, com ações alcançáveis.
        await page.goto("/admin/profissionais");
        await expect(page.getByRole("columnheader", { name: "Elegibilidade" })).toBeVisible();
        const medidas = await page.evaluate(() => {
          const tabela = document.querySelector("table");
          let contêiner: Element | null = tabela?.parentElement ?? null;
          let rolaDentro = false;
          while (contêiner && contêiner !== document.body) {
            const estilo = getComputedStyle(contêiner);
            if (estilo.overflowX === "auto" || estilo.overflowX === "scroll") {
              rolaDentro = contêiner.scrollWidth > contêiner.clientWidth;
              break;
            }
            contêiner = contêiner.parentElement;
          }
          return {
            pagina: document.documentElement.scrollWidth,
            main: document.querySelector("main")?.scrollWidth ?? 0,
            rolaDentro,
          };
        });
        expect(medidas.pagina, "excesso horizontal da página").toBe(390);
        expect(medidas.main, "main transborda").toBeLessThanOrEqual(390);
        expect(medidas.rolaDentro, "a tabela deveria rolar no próprio contêiner").toBe(true);
        await page.screenshot({ path: path.join(DIR, `lista-390.png`), fullPage: true });
      }

      if (viewport.width === 1440) {
        // EV-2 · motivos por destino — listas diferentes por transição.
        await page.goto(`/admin/profissionais/${seed.ids["02"]}`);
        const destino = page.getByLabel("Mudar para");
        await destino.selectOption("PAUSADO");
        await expect(page.getByLabel("Motivo")).toBeVisible();
        const motivosPausa = await page.getByLabel("Motivo").locator("option").allTextContents();
        await medirECapturar(page, "ev2-motivos-pausa", viewport);
        await destino.selectOption("RETIRADO_ARQUIVADO");
        await expect(page.getByLabel("Motivo")).toBeVisible();
        const motivosRetirada = await page.getByLabel("Motivo").locator("option").allTextContents();
        expect(motivosPausa).not.toEqual(motivosRetirada);
        expect(motivosRetirada.join("|")).toContain("Encerramento da atuação");
        await medirECapturar(page, "ev2-motivos-retirada", viewport);
      }

      // EV-3 · prévia de impacto (1440 e 390).
      if (viewport.width === 1440 || viewport.width === 390) {
        await page.goto(`/admin/profissionais/${seed.ids["03"]}`);
        await page.getByLabel("Mudar para").selectOption("RETIRADO_ARQUIVADO");
        await expect(page.getByText("O que muda")).toBeVisible();
        await expect(page.getByText(/Relatórios já emitidos/)).toBeVisible();
        await medirECapturar(page, "ev3-previa", viewport);
      }

      if (viewport.width === 1440) {
        // EV-4 · confirmação deliberada: pausa acontece e a trilha nasce.
        await page.goto(`/admin/profissionais/${seed.ids["04"]}`);
        await page.getByLabel("Mudar para").selectOption("PAUSADO");
        await page.getByLabel("Motivo").selectOption("REVISAO_CADASTRAL");
        await page.getByRole("checkbox").check();
        await page.getByRole("button", { name: "Aplicar mudança" }).click();
        await expect(page.getByText("Estado do profissional atualizado.")).toBeVisible();
        await medirECapturar(page, "ev4-confirmacao", viewport);

        // EV-6 · despublicar (botão herdado) leva a PAUSADO.
        await page.goto(`/admin/profissionais/${seed.ids["06"]}`);
        await page.getByRole("button", { name: "Despublicar" }).click();
        await expect(page.getByRole("button", { name: /^Publicar$/ })).toBeVisible();
        await medirECapturar(page, "ev6-despublicacao", viewport);
      }

      // EV-5 · publicação bloqueada com pendências nomeadas (1440 e 390).
      if (viewport.width === 1440 || viewport.width === 390) {
        await page.goto(`/admin/profissionais/${seed.ids["05"]}`);
        const publicar = page.getByRole("button", { name: /^Publicar$/ });
        await expect(publicar).toBeDisabled();
        await expect(page.getByText(/Pendências para publicação/)).toBeVisible();
        await medirECapturar(page, "ev5-publicacao-bloqueada", viewport);
      }

      // EV-7 · classificação de legado (1440 e 390).
      if (viewport.width === 1440 || viewport.width === 390) {
        await page.goto(`/admin/profissionais/${seed.ids["07"]}`);
        await expect(page.getByText("Legado sem ciclo classificado")).toBeVisible();
        await expect(page.getByLabel("Estado atual deste cadastro")).toBeVisible();
        await medirECapturar(page, "ev7-legado", viewport);
      }

      if (viewport.width === 1440) {
        // EV-7b · o ato completo: sem justificativa recusa; com ela, aceita.
        await page.goto(`/admin/profissionais/${seed.ids["07"]}`);
        await page.getByLabel("Estado atual deste cadastro").selectOption("PREPARACAO");
        const botao = page.getByRole("button", { name: "Classificar cadastro legado" });
        await expect(botao).toBeDisabled();
        await page
          .getByLabel(/Justificativa da classificação/)
          .fill("revisão documental do cadastro legado");
        await botao.click();
        await expect(page.getByText("Cadastro legado classificado.")).toBeVisible();
        await medirECapturar(page, "ev7b-legado-classificado", viewport);
      }
    });
  });
}

test.afterAll(() => {
  const proibidos = errosDeConsole.filter(
    (erro) => !erro.includes("favicon") && !erro.includes("net::ERR_ABORTED"),
  );
  expect(proibidos, `erros de console durante as capturas:\n${proibidos.join("\n")}`).toEqual([]);
  expect(existsSync(path.join(DIR, "ev1-painel-390.png"))).toBe(true);
});
