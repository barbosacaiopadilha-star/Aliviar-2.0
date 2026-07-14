import { expect, test } from "@playwright/test";

test("home page loads and shows the landing hero", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Uma escolha de cuidado, nunca sozinho." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "É isso que você recebe" })).toBeVisible();
});
