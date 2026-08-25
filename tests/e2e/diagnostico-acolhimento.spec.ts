// =============================================================================
// DIAGNÓSTICO DIRECIONADO — PASSO 6, e nada mais.
//
// Usa um Case JÁ EXISTENTE (id via DIAG_CASE_ID): não recria paciente,
// profissional, história nem documento. O objetivo é um só: ver o caminho
// inteiro da consolidação do Caso Clínico — entrada, payload, resposta,
// re-render, persistência — e dizer exatamente ONDE ele para, se parar.
//
// Instrumentação: todo console do browser, toda falha de página, toda
// requisição de server action (POST com next-action) com status e tamanho da
// resposta, e todo 404 de asset. No fim, o teste imprime a linha do tempo.
// =============================================================================
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
const CASE_ID = process.env.DIAG_CASE_ID ?? "";

function loadCurador(): { email: string; password: string } {
  if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não encontrado.");
  const users = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8")) as {
    role: string;
    email: string;
    password: string;
  }[];
  return users.find((u) => u.role === "curador_medico")!;
}

test.describe("diagnóstico do Acolhimento (Case existente)", () => {
  test.skip(!CASE_ID, "Defina DIAG_CASE_ID com o id de um Case existente.");
  test.setTimeout(120_000);

  test("consolidação: digitar → salvar → confirmar → reabrir → persistir → Mesa", async ({ page }) => {
    const linhaDoTempo: string[] = [];
    const marca = (evento: string) => linhaDoTempo.push(`${new Date().toISOString()} ${evento}`);

    page.on("console", (mensagem) => {
      if (["error", "warning"].includes(mensagem.type())) {
        marca(`console.${mensagem.type()}: ${mensagem.text().slice(0, 300)}`);
      }
    });
    page.on("pageerror", (erro) => marca(`pageerror: ${erro.message.slice(0, 300)}`));
    page.on("response", async (resposta) => {
      const req = resposta.request();
      if (req.method() === "POST" && req.headers()["next-action"]) {
        let corpo = "";
        try {
          corpo = (await resposta.text()).slice(0, 200);
        } catch {
          corpo = "(corpo indisponível)";
        }
        marca(
          `ACTION ${resposta.status()} next-action=${req.headers()["next-action"]?.slice(0, 12)} ` +
            `payload=${(req.postData() ?? "").slice(0, 160).replaceAll("\n", " ")} → ${corpo.replaceAll("\n", " ")}`,
        );
      }
      if (resposta.status() === 404 && resposta.url().includes("/_next/")) {
        marca(`ASSET 404: ${resposta.url()}`);
      }
    });

    const curador = loadCurador();
    marca("login do curador");
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(curador.email);
    await page.getByLabel("Senha").fill(curador.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));

    marca("abrindo o Acolhimento");
    await page.goto(`/coa/curadoria/casos/${CASE_ID}/acolhimento`);
    await expect(page.getByText(/A história, nas palavras de/)).toBeVisible();
    marca("história automática visível");

    // Pré-requisitos da fase, se ainda pendentes nesta retomada.
    const revisao = page.getByLabel("Revisei o que já se sabe sobre o paciente");
    if (await revisao.isVisible().catch(() => false)) {
      if (!(await revisao.isChecked())) {
        await revisao.check();
        await page.getByLabel("Revisei os documentos disponíveis").check();
        await page.getByRole("button", { name: "Registrar revisão" }).click();
        marca("revisão registrada");
      }
    }

    const confirmacaoHistoria = page.getByLabel(
      "Fiz a devolução e o paciente reconheceu a própria história",
    );
    if (await confirmacaoHistoria.isVisible().catch(() => false)) {
      await confirmacaoHistoria.check();
      await page.getByRole("button", { name: "Registrar a história" }).click();
      marca("registro da história disparado");
      await expect(
        page.getByText("✓ O paciente reconheceu a própria história — registrado e permanente."),
      ).toBeVisible({ timeout: 30_000 });
      marca("registro da história CONFIRMADO pelo servidor");
    } else {
      marca("história já registrada anteriormente");
    }

    const casoTexto = `Consolidação do diagnóstico direcionado [${Date.now()}]`;
    const campo = page.getByLabel("Contexto clínico relatado");
    await campo.fill(casoTexto);
    marca("consolidação digitada");

    await page.getByRole("button", { name: "Registrar o contexto clínico" }).click();
    marca("salvamento disparado");

    // O desfecho tem de ser UM destes dois — nunca silêncio:
    const linkMesa = page.getByRole("link", { name: "Abrir a Mesa de Curadoria" });
    const alerta = page.getByRole("alert").filter({ hasText: /Não foi possível|ref\./ });
    await expect(linkMesa.or(alerta).first()).toBeVisible({ timeout: 30_000 });

    if (await alerta.first().isVisible().catch(() => false)) {
      marca(`ERRO NA TELA: ${await alerta.first().innerText()}`);
      console.log("\nLINHA DO TEMPO:\n" + linhaDoTempo.join("\n"));
      throw new Error("A consolidação foi recusada — ver linha do tempo acima.");
    }
    marca("link da Mesa visível — servidor confirmou a gravação");

    // Reabrir do zero: a persistência precisa sobreviver à navegação real.
    await page.goto(`/coa/curadoria/casos/${CASE_ID}/acolhimento`);
    await expect(page.getByLabel("Contexto clínico relatado")).toHaveValue(casoTexto, {
      timeout: 15_000,
    });
    marca("REABERTURA: consolidação persistida e idêntica");

    // A história original permanece intocada na leitura de referência.
    await expect(page.getByText(/A história, nas palavras de/)).toBeVisible();

    // E a Mesa abre.
    await page.getByRole("link", { name: "Abrir a Mesa de Curadoria" }).click();
    await page.waitForURL(/mesa/);
    await expect(page.getByText("Mesa de Curadoria").first()).toBeVisible();
    marca("MESA ABERTA");

    console.log("\nLINHA DO TEMPO:\n" + linhaDoTempo.join("\n"));
  });
});
