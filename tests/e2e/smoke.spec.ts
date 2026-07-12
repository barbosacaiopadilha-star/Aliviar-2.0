import { expect, test } from "@playwright/test";

test("home page loads and shows the landing hero", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Cuidado encontrado com critério, não com anúncio." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Como funciona" })).toBeVisible();
});
