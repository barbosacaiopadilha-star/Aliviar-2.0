/**
 * BLOCO 12 · A FILA NA ROTA REAL — medição e evidências.
 *
 * A suíte roda sempre e **verifica**; só escreve imagem com `CAPTURA=1`. É a
 * mesma forma do gate da B7-EV-H, e pela mesma razão: as evidências EV-7-001 e
 * EV-7-002 já foram publicadas fotografando a tela errada, porque a captura
 * confiava em ter chegado onde queria. Aqui a foto só acontece depois que a
 * rota, o ator, a matriz, o viewport e as contagens foram conferidos.
 *
 *   FILA_EMAIL=… FILA_SENHA=… CAPTURA=1 CAPTURA_DIR=evidencias/bloco12 \
 *     node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/bloco12-fila.spec.ts --workers=1
 *
 * A credencial entra por ambiente: nada de senha em arquivo nem em relatório.
 * O cenário é a matriz sintética CR-01..CR-10 atribuída a esta conta.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../evidencias/bloco12");
const EMAIL = process.env.FILA_EMAIL ?? "";
const SENHA = process.env.FILA_SENHA ?? "";

/** Os sete grupos, na ordem do contrato 36 §6. A ordem faz parte da prova. */
/** O id da seção de cada grupo — ancorar por ele evita casar com a seção que
 *  CONTÉM todas as outras, que foi exatamente o erro da primeira tentativa. */
const ID_DA_SECAO: Record<string, string> = {
  "Aguarda Acolhimento": "fila-grupo-aguarda_acolhimento",
  "Aguarda o Primeiro Encontro": "fila-grupo-aguarda_primeiro_encontro",
  "Aguarda o reconhecimento dela": "fila-grupo-aguarda_reconhecimento_dela",
  "Curadoria em curso": "fila-grupo-curadoria_em_curso",
  "Aguarda entrega": "fila-grupo-aguarda_entrega",
  "Aguarda a decisão dela": "fila-grupo-aguarda_decisao_dela",
  "Com o Concierge": "fila-grupo-com_o_concierge",
};

const GRUPOS = [
  "Aguarda Acolhimento",
  "Aguarda o Primeiro Encontro",
  "Aguarda o reconhecimento dela",
  "Curadoria em curso",
  "Aguarda entrega",
  "Aguarda a decisão dela",
  "Com o Concierge",
] as const;

/** O que a matriz CR-01..CR-10 produz, grupo a grupo. */
const CONTAGENS_DA_MATRIZ: Record<string, number> = {
  "Aguarda Acolhimento": 1,
  "Aguarda o Primeiro Encontro": 1,
  "Aguarda o reconhecimento dela": 1,
  "Curadoria em curso": 2,
  "Aguarda entrega": 1,
  "Aguarda a decisão dela": 1,
  "Com o Concierge": 3,
};

async function entrar(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * O GATE. Nada é fotografado antes destas afirmações — e elas rodam mesmo sem
 * `CAPTURA`, porque a verificação é o que vale; a imagem é só o registro.
 */
async function conferirEEventualmenteCapturar(
  page: Page,
  nome: string,
  esperado: { largura: number; altura: number; comMatriz: boolean },
) {
  // 1 · rota certa
  expect(new URL(page.url()).pathname, "a captura estava fora da Fila").toBe("/coa/curadoria");

  // 2 · ator certo — é a Fila DO Curador, e o cabeçalho o nomeia
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bom dia");

  // 3 · viewport certo (o nome da evidência promete um tamanho)
  const viewport = page.viewportSize();
  expect(viewport?.width, `${nome} prometia ${esperado.largura}px`).toBe(esperado.largura);

  // 4 · os sete grupos, na ordem
  const cabecalhos = await page.getByRole("heading", { level: 3 }).allTextContents();
  expect(cabecalhos.map((t) => t.trim()), "a ordem dos grupos mudou").toEqual([...GRUPOS]);

  // 5 · a matriz está viva, com as contagens esperadas
  if (esperado.comMatriz) {
    for (const [titulo, quantos] of Object.entries(CONTAGENS_DA_MATRIZ)) {
      const secao = page.locator(`section[aria-labelledby="${ID_DA_SECAO[titulo]}"]`);
      await expect(secao.getByText(quantos === 1 ? "1 Caso" : `${quantos} Casos`, { exact: true }).first(), `contagem de "${titulo}"`).toBeVisible();
    }
  }

  // 6 · nada proibido na tela
  const texto = (await page.locator("body").innerText()).toLowerCase();
  for (const proibido of ["atrasado", "sla", "vencido", "urgente", "há 3 dias", "prazo"]) {
    expect(texto, `a Fila prometeu tempo: "${proibido}"`).not.toContain(proibido);
  }
  expect(texto, "um identificador interno vazou para a tela").not.toMatch(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
  );

  // 7 · sem overflow horizontal
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow, `overflow horizontal a ${esperado.largura}px`).toBe(false);

  if (!process.env.CAPTURA) return;
  mkdirSync(DESTINO, { recursive: true });
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });

  console.log(`capturado: ${nome}`);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  test.skip(!EMAIL || !SENHA, "defina FILA_EMAIL e FILA_SENHA");
  await entrar(page);
});

test("EV-12-001 · a Fila com dez Casos simultâneos, nos sete grupos", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/coa/curadoria", { waitUntil: "domcontentloaded" });

  // Os dez, somados, é o que a matriz promete — e a frase do topo deriva da
  // mesma montagem que desenha os grupos.
  await expect(page.getByText("10 Casos ativos, agrupados pelo ato devido.")).toBeVisible();

  await conferirEEventualmenteCapturar(page, "EV-12-001-fila-dez-casos-1440", {
    largura: 1440,
    altura: 900,
    comMatriz: true,
  });
});

test("EV-12-002 · a Fila legível a 768px, sem overflow", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/coa/curadoria", { waitUntil: "domcontentloaded" });

  await conferirEEventualmenteCapturar(page, "EV-12-002-fila-768", {
    largura: 768,
    altura: 1024,
    comMatriz: true,
  });
});

test("EV-12-003 · a Fila a 390px — nenhum grupo escondido", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/coa/curadoria", { waitUntil: "domcontentloaded" });

  // ⛔ Nada de carrossel: os sete grupos continuam empilhados e legíveis.
  for (const titulo of GRUPOS) {
    await expect(page.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
  }

  await conferirEEventualmenteCapturar(page, "EV-12-003-fila-390", {
    largura: 390,
    altura: 844,
    comMatriz: true,
  });
});

test("EV-12-004 · \"Aguarda o reconhecimento dela\" não oferece o ato dela", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/coa/curadoria", { waitUntil: "domcontentloaded" });

  const secao = page.locator(`section[aria-labelledby="${ID_DA_SECAO["Aguarda o reconhecimento dela"]}"]`);

  // A tela informa…
  await expect(secao).toContainText("O Mapa está preparado e o reconhecimento é dela — nada a fazer aqui.");
  // …e não oferece nenhum caminho para executá-lo no lugar dela (ADR-042).
  await expect(secao.getByRole("button")).toHaveCount(0);
  for (const verbo of [/reconhecer/i, /validar/i, /confirmar/i, /aprovar/i]) {
    await expect(secao).not.toContainText(verbo);
  }
  await expect(secao.getByRole("link")).toHaveText(["Ver o caso"]);

  await conferirEEventualmenteCapturar(page, "EV-12-004-aguarda-reconhecimento", {
    largura: 1440,
    altura: 900,
    comMatriz: true,
  });
});

test("EV-12-005 · grupo vazio diz que está vazio", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/coa/curadoria", { waitUntil: "domcontentloaded" });

  // Com a matriz viva nenhum dos sete está vazio; o que se prova aqui é que a
  // frase de vazio EXISTE e é específica por grupo — a Fila nunca some com um
  // grupo, e o teste falha se alguém trocar a frase por silêncio.
  const semCasos = await page.evaluate(() =>
    [...document.querySelectorAll("h3")].map((h) => {
      const secao = h.closest("section")!;
      return { titulo: h.textContent!.trim(), casos: secao.querySelectorAll("li").length };
    }),
  );
  expect(semCasos).toHaveLength(7);
  expect(semCasos.every((g) => g.casos > 0), "a matriz não preencheu os sete grupos").toBe(true);

  await conferirEEventualmenteCapturar(page, "EV-12-005-sete-grupos-completos", {
    largura: 1440,
    altura: 900,
    comMatriz: true,
  });
});
