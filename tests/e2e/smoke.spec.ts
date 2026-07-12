import { expect, test } from "@playwright/test";

test("home page loads and shows status", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Aliviar Conexão" })).toBeVisible();
  await expect(page.getByText("status: ok")).toBeVisible();
});
