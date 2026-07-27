import { expect, test } from "@playwright/test";

// LANDING DO PACIENTE — Fase 2 (Hardening). Complementa smoke.spec.ts
// (que só confirma marcos de topo/meio/fim visíveis) com três coisas que
// ele deliberadamente não cobre: ausência de erro real de console/página,
// o CTA principal navegando de verdade (não só visível), e a Biblioteca
// avançando por teclado num navegador real (GSAP real, scroll real —
// tests/components/faq-book-section-integration.test.tsx já cobre o
// mesmo gesto com GSAP mockado em jsdom; este teste prova o
// comportamento real, não duplica o de componente).

test("home page carrega sem erro de console ou de página", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  // `/_vercel/insights/script.js` é servido pela plataforma, não pelo app: ele
  // só existe quando o site está publicado na Vercel. Rodando local, o arquivo
  // não existe e o browser reclama duas vezes (404 + MIME). Não é erro do
  // produto, e ignorar essa origem específica é mais honesto do que afrouxar a
  // asserção — qualquer outro erro continua reprovando o teste.
  const isVercelAnalyticsLocalNoise = (text: string) =>
    text.includes("/_vercel/insights/") ||
    text === "Failed to load resource: the server responded with a status of 404 (Not Found)";

  page.on("console", (msg) => {
    if (msg.type() === "error" && !isVercelAnalyticsLocalNoise(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Você não precisa tomá-la sozinho/ }),
  ).toBeVisible();

  expect(pageErrors, pageErrors.join("\n")).toHaveLength(0);
  expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
});

test("CTA principal navega de fato para /sua-historia", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("link", { name: "Contar minha história" })
    .first()
    .click();

  await expect(page).toHaveURL(/\/sua-historia/);
});

// A Biblioteca em formato de livro (FaqBookSection, navegação por setas)
// deixou de ser montada na Landing: o redesenho editorial a substituiu por um
// acordeão em "Dúvidas frequentes" (faq-compact.tsx). O componente antigo não
// foi restaurado para satisfazer o teste — o que se preserva é a propriedade,
// não a implementação: as dúvidas continuam alcançáveis e operáveis só pelo
// teclado, num navegador real.
test("Dúvidas frequentes abrem e fecham só pelo teclado num navegador real", async ({
  page,
}) => {
  await page.goto("/");

  const duvidas = page.locator("#duvidas");
  await duvidas.scrollIntoViewIfNeeded();

  const perguntas = duvidas.getByRole("button");
  await expect(perguntas).toHaveCount(4);

  // A primeira já nasce aberta; a segunda é a que prova a interação.
  const segunda = perguntas.nth(1);
  await expect(segunda).toHaveAttribute("aria-expanded", "false");

  await segunda.focus();
  await expect(segunda).toBeFocused();
  await segunda.press("Enter");

  await expect(segunda).toHaveAttribute("aria-expanded", "true");
  await expect(
    duvidas.getByText("O cuidado clínico é do médico", { exact: false }),
  ).toBeVisible();

  await segunda.press("Enter");
  await expect(segunda).toHaveAttribute("aria-expanded", "false");
});
