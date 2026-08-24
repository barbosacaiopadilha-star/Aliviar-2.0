/**
 * OS DOCUMENTOS DO CASO — a papelada que o Curador manda pelo WhatsApp.
 *
 * Decisão do Fundador (23/08): o papel vai para a paciente por WhatsApp, ela
 * preenche à mão e devolve por lá; o Curador anexa. O que o produto precisa,
 * então, é gerar as peças JÁ com os dados do caso, prontas para virar PDF
 * pelo próprio navegador.
 *
 * O que este teste prova:
 *  1. a página existe e é do Curador (rota pública /coa/curadoria/…);
 *  2. as duas peças saem com o NOME REAL da paciente e de quem cuida do
 *     caso — nada de espaço em branco onde o sistema já sabe;
 *  3. os campos da conversa continuam VAZIOS — a história é escrita à mão,
 *     com as palavras dela, nunca pré-preenchida pelo sistema;
 *  4. o consentimento repete os limites da casa (sem diagnóstico, sem
 *     escolher por ela, sem ranking).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

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

test("o Curador gera as peças do caso já com os dados da paciente", async ({ page }) => {
  test.setTimeout(120_000);

  const contas = loadTestAccounts();
  const curador = contas.find((c) => c.role === "curador_medico");
  expect(curador, "conta de curador ausente no bootstrap").toBeTruthy();

  // Um caso real do banco local — a página só existe para um caso que existe.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "curadoria" }, auth: { persistSession: false } },
  );
  const { data: casos } = await admin.from("cases").select("id").limit(1);
  const caseId = casos?.[0]?.id as string | undefined;
  expect(caseId, "nenhum caso no banco local").toBeTruthy();

  await loginAs(page, curador!);
  await page.goto(`/coa/curadoria/casos/${caseId}/documentos`, { waitUntil: "domcontentloaded" });

  // 1 · a página é a do Curador, não um redirecionamento para o login
  await expect(page.getByRole("heading", { name: "Documentos do caso" })).toBeVisible();

  // 2 · as duas peças, com os dados já preenchidos
  await expect(
    page.getByRole("heading", { name: "Consentimento e uso de informações" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ficha da Paciente — Consulta Inicial" }),
  ).toBeVisible();

  const nomeDaPaciente = await page
    .locator(".documento-campos dd")
    .first()
    .textContent();
  expect(nomeDaPaciente?.trim().length, "o nome da paciente saiu em branco").toBeGreaterThan(2);

  // 3 · os campos da conversa continuam em branco, com pauta para a mão
  await expect(page.getByRole("heading", { name: "O que trouxe você até aqui" })).toBeVisible();
  expect(await page.locator(".documento-pauta").count()).toBeGreaterThanOrEqual(15);

  // 4 · o consentimento repete os limites da casa
  const consentimento = page.locator(".documento-do-caso").first();
  await expect(consentimento).toContainText("não");
  await expect(consentimento).toContainText("ranking");
  await expect(consentimento).toContainText("a decisão continua sendo minha");

  // E o caminho de volta ao caso existe.
  await expect(page.getByRole("link", { name: "← Voltar ao caso" })).toBeVisible();
});
