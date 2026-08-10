/**
 * A3a · MEDIÇÃO TEMPORÁRIA — overflow horizontal da Home nos quatro viewports.
 *
 * Não afirma domínio: mede `scrollWidth` contra `clientWidth` no documento e em
 * cada descendente do `<main>`, e imprime o primeiro elemento que estoura. É a
 * mesma técnica que localizou a causa do P0 da A1 (um `sr-only` absoluto
 * escapando do clip), e existe aqui só para provar que a A3a não regrediu.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../.capturas");
const VIEWPORTS = [390, 430, 768, 1440];

function conta(role: string): TestAccount {
  if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json ausente.");
  const encontrada = (JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8")) as TestAccount[]).find(
    (a) => a.role === role,
  );
  if (!encontrada) throw new Error(`conta de teste ausente: ${role}`);
  return encontrada;
}

async function loginAs(page: Page, account: TestAccount) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.skip(!process.env.CAPTURA, "medição sob demanda — defina CAPTURA=1");
test.describe.configure({ mode: "serial" });

test("A3a · a Home não estoura na horizontal em 390 / 430 / 768 / 1440", async ({ page }) => {
  await loginAs(page, conta("paciente"));
  const linhas: string[] = ["viewport | docScrollW | docClientW | primeiro elemento que estoura"];

  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/paciente", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const medida = await page.evaluate(() => {
      const doc = document.documentElement;

      /**
       * A3b · uma regra só para as duas sondas. Um elemento dentro de um
       * contêiner que rola ou recorta na horizontal pode passar da viewport sem que a
       * PÁGINA estoure — é o caso da régua da jornada, cujo scroll interno é
       * legítimo. Esta sonda nunca havia topado com isso porque a conta sem
       * Case não renderiza a régua; a da A3b topou no primeiro 390px.
       */
      const contidoPorAncestral = (el: Element): boolean => {
        let pai = el.parentElement;
        while (pai && pai !== doc) {
          if (getComputedStyle(pai).overflowX !== "visible") return true;
          pai = pai.parentElement;
        }
        return false;
      };

      const culpados: string[] = [];
      for (const el of Array.from(document.querySelectorAll("#patient-main *"))) {
        const r = el.getBoundingClientRect();
        if ((r.right > doc.clientWidth + 1 || r.left < -1) && !contidoPorAncestral(el)) {
          culpados.push(
            `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(/\s+/).slice(0, 2).join(".")} [${Math.round(r.left)}→${Math.round(r.right)}]`,
          );
        }
      }
      return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, culpados: culpados.slice(0, 3) };
    });

    linhas.push(
      `${width} | ${medida.scrollW} | ${medida.clientW} | ${medida.culpados.length === 0 ? "nenhum" : medida.culpados.join(" ; ")}`,
    );

    expect(medida.scrollW, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(
      medida.clientW,
    );
    expect(medida.culpados, `elemento fora da viewport em ${width}px`).toEqual([]);
  }

  mkdirSync(DESTINO, { recursive: true });
  writeFileSync(path.join(DESTINO, "medicao-overflow.txt"), linhas.join("\n"));
   
  console.log(linhas.join("\n"));
});
