import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * FORMAÇÃO ACADÊMICA · a seção administrativa nos três viewports do contrato.
 *
 * O oráculo repete a lição da MESA-390: `window.innerWidth` além de
 * `scrollWidth`, porque encolhimento por viewport esticado não gera barra de
 * rolagem — a página "cabe" e chega menor.
 *
 *   node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/formacao-academica-responsiva.spec.ts --workers=1
 */

type ContaDeTeste = { role: string; email: string; password: string };

const CONTAS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const VIEWPORTS = [
  { nome: "390x844", width: 390, height: 844, movel: true },
  { nome: "768x1024", width: 768, height: 1024, movel: false },
  { nome: "1440x900", width: 1440, height: 900, movel: false },
];

function conta(papel: string): ContaDeTeste {
  if (!existsSync(CONTAS_PATH)) {
    throw new Error("test-users.local.json ausente. Rode `npm run bootstrap:test-users:local`.");
  }
  const contas: ContaDeTeste[] = JSON.parse(readFileSync(CONTAS_PATH, "utf-8"));
  const encontrada = contas.find((c) => c.role === papel);
  if (!encontrada) throw new Error(`conta ausente: ${papel}`);
  return encontrada;
}

async function entrarComoAdmin(page: Page) {
  const admin = conta("administrador");
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(admin.email);
  await page.getByLabel("Senha").fill(admin.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Formação acadêmica — admin em 390/768/1440", () => {
  test.describe.configure({ mode: "serial" });

  for (const vp of VIEWPORTS) {
    test(`a seção existe e o viewport permanece íntegro em ${vp.nome}`, async ({ browser }) => {
      const contexto = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: vp.movel,
        hasTouch: vp.movel,
      });
      const page = await contexto.newPage();

      try {
        await entrarComoAdmin(page);

        // Qualquer profissional serve: a lista administrativa leva ao primeiro.
        await page.goto("/admin/profissionais", { waitUntil: "domcontentloaded" });
        const primeira = page.locator("table tbody tr a").first();
        await primeira.waitFor({ timeout: 20_000 });
        await primeira.click();
        await page.waitForURL(/\/admin\/profissionais\/.+/);

        await expect(
          page.getByRole("heading", { name: "Formação acadêmica" }),
        ).toBeVisible({ timeout: 20_000 });

        const m = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        }));
        expect(m.innerWidth, `viewport esticado em ${vp.nome}`).toBe(vp.width);
        expect(m.innerHeight, `viewport esticado em ${vp.nome}`).toBe(vp.height);
        expect(m.docScrollWidth, `documento estoura em ${vp.nome}`).toBeLessThanOrEqual(vp.width);
        expect(m.bodyScrollWidth, `body estoura em ${vp.nome}`).toBeLessThanOrEqual(vp.width);
      } finally {
        await contexto.close();
      }
    });
  }
});
