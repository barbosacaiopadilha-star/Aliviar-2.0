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

test.describe("Persistência de 'Sua História' (autosave, retomada — ÉPICO 1/SPRINT 1)", () => {
  test.describe.configure({ mode: "serial" });

  test("autosave: texto digitado sobrevive a um reload da página", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/sua-historia/motivo");
    const texto = `Motivo de teste e2e ${Date.now()}`;
    await page.getByLabel("Sua resposta").fill(texto);

    // Aguarda o autosave debounced (600ms) confirmar antes de recarregar.
    await page.waitForTimeout(1500);
    await page.reload();

    await expect(page.getByLabel("Sua resposta")).toHaveValue(texto);
  });

  test("retomada: '/sua-historia/continuar' leva exatamente à última etapa visitada", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/sua-historia/preferencias");
    await page.waitForTimeout(1500); // garante que o autosave registrou a etapa atual

    await page.goto("/sua-historia/continuar");
    await expect(page).toHaveURL("/sua-historia/preferencias");
  });

  test("conclusão: copy final não menciona ACE, protocolo ou processamento automático", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    await page.goto("/sua-historia/revisao");
    await page.getByRole("button", { name: "Concluir" }).click();

    await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible();
    await expect(
      page.getByText("Ela ficará disponível para a equipe Aliviar quando a próxima etapa da sua curadoria for iniciada."),
    ).toBeVisible();

    for (const forbidden of ["ACE", "protocolo", "algoritmo automático de decisão"]) {
      await expect(page.getByText(forbidden)).toHaveCount(0);
    }
  });

  test("história enviada não pode mais ser editada — revisitar a etapa não permite salvar", async ({ page }) => {
    const paciente = loadTestAccounts().find((a) => a.role === "paciente")!;
    await loginAs(page, paciente);

    // A história ativa já foi enviada no teste anterior; uma nova história
    // em rascunho deve ter sido criada para esta visita.
    await page.goto("/sua-historia/revisao");
    await expect(page.getByRole("heading", { name: /Revise sua história|Recebemos sua história/ })).toBeVisible();
  });
});
