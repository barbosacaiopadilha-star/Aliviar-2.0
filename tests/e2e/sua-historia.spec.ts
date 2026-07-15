import { expect, test } from "@playwright/test";

test.describe("jornada Sua História (E2E)", () => {
  test("fluxo completo funciona do início ao fim", async ({ page }) => {
    await page.goto("/sua-historia");
    await expect(
      page.getByRole("heading", { name: "Sua história merece ser contada com calma." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Começar" }).click();

    await expect(page).toHaveURL("/sua-historia/para-quem");
    await page.getByLabel("Para mim").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL("/sua-historia/motivo");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL("/sua-historia/historia");
    await page.getByLabel("Sua resposta").fill("Tenho buscado apoio para lidar com a ansiedade.");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL("/sua-historia/informacoes");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL("/sua-historia/preferencias");
    await page.getByLabel("Online").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL("/sua-historia/revisao");
    await expect(page.getByText("Tenho buscado apoio para lidar com a ansiedade.")).toBeVisible();
    await page.getByRole("button", { name: "Enviar minha história" }).click();

    await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible();
  });

  test("voltar preserva as respostas já preenchidas", async ({ page }) => {
    await page.goto("/sua-historia/para-quem");
    await page.getByLabel("Para outra pessoa que eu acompanho").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL("/sua-historia/motivo");
    await page.getByRole("link", { name: "Voltar" }).click();

    await expect(page).toHaveURL("/sua-historia/para-quem");
    await expect(page.getByLabel("Para outra pessoa que eu acompanho")).toBeChecked();
  });

  test("recarregar a página mantém a resposta salva automaticamente", async ({ page }) => {
    await page.goto("/sua-historia/historia");
    await page.getByLabel("Sua resposta").fill("Um relato de teste para verificar o auto-save.");

    await page.reload();

    await expect(page.getByLabel("Sua resposta")).toHaveValue(
      "Um relato de teste para verificar o auto-save.",
    );
  });
});
