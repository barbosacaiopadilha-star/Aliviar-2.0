import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * MESA-390 · A MESA CHEGA NO TAMANHO DA TELA, COM NOME REAL DENTRO.
 *
 * O defeito não era overflow — era o contrário, e por isso passou batido: a
 * página **cabia** (`overflowHorizontal: false`) e mesmo assim chegava menor.
 * Item de grid nasce com `min-width: auto`; o rótulo de cada pessoa usa
 * `truncate`, que é `white-space: nowrap`, cuja largura mínima é o nome
 * INTEIRO. Um nome real longo passava a exigir mais que a tela (405px medidos
 * em 390), o cartão não podia encolher, e o Chrome móvel respondia esticando o
 * viewport de layout e reduzindo tudo ~6% — a Mesa saía ~5,8% menor que a Rede
 * e o Ciclo, sem nenhuma barra de rolagem para denunciar.
 *
 * Por isso o oráculo aqui é `window.innerWidth`, e não `scrollWidth` sozinho:
 * medir só o estouro é justamente o que não vê este defeito. E o nome longo é
 * injetado no DOM porque a semente local tem rótulos curtos — sem ele, o teste
 * passaria mesmo com o bug de volta.
 *
 *   node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/mesa-390-sem-shrink.spec.ts --workers=1
 *
 * Exige `npm run bootstrap:test-users:local` (contas sintéticas locais).
 */

type ContaDeTeste = { role: string; email: string; password: string };

const CONTAS_PATH = path.resolve(__dirname, "../../test-users.local.json");

/** Nome real plausível, longo — o que Production tem e a semente local não. */
const NOME_LONGO = "Maria Aparecida da Conceição Nascimento";

const VIEWPORTS = [
  { nome: "390x844 (celular)", width: 390, height: 844 },
  { nome: "768x1024 (tablet)", width: 768, height: 1024 },
  { nome: "1440x900 (desktop)", width: 1440, height: 900 },
];

function conta(papel: string): ContaDeTeste {
  if (!existsSync(CONTAS_PATH)) {
    throw new Error(
      "test-users.local.json não encontrado. Execute `npm run bootstrap:test-users:local` antes destes testes.",
    );
  }
  const contas: ContaDeTeste[] = JSON.parse(readFileSync(CONTAS_PATH, "utf-8"));
  const encontrada = contas.find((c) => c.role === papel);
  if (!encontrada) throw new Error(`conta de teste do papel "${papel}" não existe`);
  return encontrada;
}

async function entrarComo(page: Page, papel: string) {
  const credencial = conta(papel);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(credencial.email);
  await page.getByLabel("Senha").fill(credencial.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * Põe um nome real longo em TODOS os rótulos da lista e devolve as medidas.
 *
 * Em todos, não no primeiro: a linha que aperta é a que também mostra `meta`
 * (a origem do contato), porque esse rótulo não encolhe. Mirar só no primeiro
 * item fazia o teste passar com o defeito de volta — foi medido.
 */
async function medirComNomeLongo(page: Page, nomeLongo: string) {
  return page.evaluate((nome) => {
    const rotulos = Array.from(document.querySelectorAll("main ul li a, main ul li span")).filter(
      (el) => el.children.length === 0 && (el.textContent || "").trim().length > 0,
    );
    rotulos.forEach((el) => (el.textContent = nome));
    void document.documentElement.offsetWidth; // reflow

    const doc = document.documentElement;
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      docScrollWidth: doc.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      rotulosAtingidos: rotulos.length,
    };
  }, nomeLongo);
}

test.describe("MESA-390 · a Mesa não encolhe sozinha", () => {
  test.describe.configure({ mode: "serial" });

  for (const vp of VIEWPORTS) {
    test(`Mesa em ${vp.nome}: viewport íntegro e sem estouro`, async ({ browser }) => {
      // Contexto próprio por viewport: a emulação móvel (isMobile/hasTouch) é
      // o que faz o Chrome esticar o layout — sem ela o defeito não aparece.
      const ehCelular = vp.width < 768;
      const contexto = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: ehCelular,
        hasTouch: ehCelular,
      });
      const page = await contexto.newPage();

      try {
        await entrarComo(page, "administrador");
        await page.goto("/coa/atendimento", { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: "Atendimento" })).toBeVisible();

        const m = await medirComNomeLongo(page, NOME_LONGO);

        expect(
          m.rotulosAtingidos,
          "a Mesa precisa ter pessoas na lista — sem elas o teste passaria por vacuidade",
        ).toBeGreaterThan(0);
        expect(m.innerWidth, `viewport de layout esticado em ${vp.nome}`).toBe(vp.width);
        expect(m.innerHeight, `viewport de layout esticado em ${vp.nome}`).toBe(vp.height);
        expect(m.docScrollWidth, `documento estoura em ${vp.nome}`).toBeLessThanOrEqual(vp.width);
        expect(m.bodyScrollWidth, `body estoura em ${vp.nome}`).toBeLessThanOrEqual(vp.width);
      } finally {
        await contexto.close();
      }
    });
  }
});
