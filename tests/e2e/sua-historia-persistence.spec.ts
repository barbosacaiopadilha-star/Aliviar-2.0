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
    await page.getByRole("button", { name: "Enviar minha história" }).click();

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

    // G1/ETAPA-2: oráculo anterior certificava o defeito IM-04/FS-02 (asserção
    // tautológica — aceitava o heading de rascunho OU o de enviada, passando
    // nos dois mundos; AUDITORIA_06 §6); novo oráculo exige o comportamento
    // das ADR-048 (história enviada permanece enviada) e ADR-051 (nenhum
    // rascunho nasce por navegação): revisitar a revisão após o envio mostra
    // SOMENTE o estado enviado, sem botão de envio; DEVE FALHAR até os
    // Blocos C (guarda de status no banco) e D (ato explícito de nova
    // história). Edição sem execução — validação pendente no smoke do G1/G2.
    await page.goto("/sua-historia/revisao");
    await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Esta é a sua história." })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enviar minha história" })).toHaveCount(0);
  });
});
