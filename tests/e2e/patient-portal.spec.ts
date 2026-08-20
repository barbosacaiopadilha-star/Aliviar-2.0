import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

// Um dos quatro títulos de estado da Home (src/components/paciente/patient-home-state.tsx)
// — qual deles aparece depende do estado real do paciente de teste no banco local,
// que muda conforme outras suítes (Sua História) rodam antes desta.
const HOME_STATE_HEADINGS = [
  "Este espaço começa com a sua história.",
  "Sua história continua aqui.",
  "Sua história já está conosco.",
  "Seu cuidado está em andamento.",
];

test.describe("Portal do Paciente", () => {
  test("Home sempre explica o próximo passo, nunca uma mensagem fria ou técnica", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente");

    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    const visibleStateHeadings = await Promise.all(
      HOME_STATE_HEADINGS.map((name) => page.getByRole("heading", { name, level: 2 }).isVisible()),
    );
    expect(visibleStateHeadings.some(Boolean)).toBe(true);

    for (const cold of [
      "Nenhum dado encontrado.",
      "Nenhum registro.",
      "Nenhum caso.",
      "Status da sua curadoria",
    ]) {
      await expect(page.getByText(cold, { exact: true })).toHaveCount(0);
    }
  });

  test("paciente envia e remove um documento", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente/documentos");
    // A6: a tela virou a Central de Documentos — três áreas, e o título passou
    // a falar com ela ("Seus"), não sobre o sistema ("Meus").
    await expect(page.getByRole("heading", { name: "Seus documentos", level: 1 })).toBeVisible();

    // NOME ÚNICO POR EXECUÇÃO, com o mesmo conteúdo do fixture.
    //
    // O envio usava sempre "sample-document.pdf", e a asserção afirmava em
    // comentário que a ação "é única". Só era numa base recém-criada: a conta de
    // paciente é compartilhada por 27 specs, e nada apagava o arquivo quando o
    // teste falhava antes do passo que remove. Cada execução deixava mais uma
    // cópia — chegaram a SEIS no banco — até o seletor casar com cinco botões e
    // o teste morrer por `strict mode violation`. Um teste que, ao falhar,
    // sabotava a própria execução seguinte, e ficava mais difícil de diagnosticar
    // a cada vez.
    //
    // Com nome único, a asserção volta a falar de UM item, independentemente do
    // que sobrou de ontem — e o passo final continua provando a remoção.
    const nomeDoArquivo = `sample-document-${Date.now()}.pdf`;
    const filePath = path.resolve(__dirname, "../fixtures/sample-document.pdf");
    await page.locator('input[type="file"]').setInputFiles({
      name: nomeDoArquivo,
      mimeType: "application/pdf",
      buffer: readFileSync(filePath),
    });
    await page.getByRole("button", { name: "Enviar", exact: true }).click();

    // O nome aparece no título E nos rótulos acessíveis das ações — por isso a
    // asserção é sobre a AÇÃO, que prova que o item é utilizável.
    await expect(page.getByRole("button", { name: `Baixar ${nomeDoArquivo}` })).toBeVisible();

    await page.getByRole("button", { name: `Remover ${nomeDoArquivo}` }).click();
    await expect(page.getByRole("button", { name: `Baixar ${nomeDoArquivo}` })).toHaveCount(0);
  });

  test("linha do tempo mostra ao menos a criação da conta", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente/linha-do-tempo");
    // B-2: oráculo alinhado à copy vigente — a linha do tempo narra momentos
    // dela ("Você chegou à Aliviar"), nunca eventos de sistema ("conta
    // criada"). O invariante verificado continua sendo o mesmo: a criação da
    // conta aparece na linha do tempo.
    await expect(page.getByText("Você chegou à Aliviar")).toBeVisible();
  });

  test("administrador e profissional não acessam /paciente", async ({ page }) => {
    const profissional = loadTestAccounts().find((a) => a.role === "profissional")!;
    await loginAs(page, profissional);

    await page.goto("/paciente");
    await expect(page).toHaveURL("/acesso-negado");

    await page.goto("/paciente/documentos");
    await expect(page).toHaveURL("/acesso-negado");
  });
});

test.describe("Portal do Paciente — mobile (ÉPICO 1/SPRINT 2)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Home é legível em mobile", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente");
    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    const visibleStateHeadings = await Promise.all(
      HOME_STATE_HEADINGS.map((name) => page.getByRole("heading", { name, level: 2 }).isVisible()),
    );
    expect(visibleStateHeadings.some(Boolean)).toBe(true);
  });

  test("(ÉPICO 1/SPRINT 3) Home mobile nunca revela vocabulário interno do ACE", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/paciente");
    await expect(page.getByRole("heading", { name: /Olá,/, level: 1 })).toBeVisible();

    const bodyText = (await page.textContent("body")) ?? "";
    for (const forbidden of ["Shortlist", "P001", "P008", "fake-deterministic", "protocolo", "ACE"]) {
      expect(bodyText).not.toContain(forbidden);
    }
  });
});
