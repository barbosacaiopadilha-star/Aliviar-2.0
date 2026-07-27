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

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
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

test("Biblioteca de dúvidas avança por teclado num navegador real", async ({
  page,
}) => {
  await page.goto("/");

  // O grupo carrega `aria-roledescription="livro de perguntas frequentes"`
  // (faq-book-section.tsx), não `aria-label` — não filtra por nome
  // acessível, que ficaria vazio; é o único `role="group"` da página.
  const book = page.getByRole("group");
  await book.scrollIntoViewIfNeeded();
  await book.focus();

  await expect(page.getByText("Pergunta 1 de 6")).toBeVisible();

  await book.press("ArrowRight");

  await expect(page.getByText("Pergunta 2 de 6")).toBeVisible();
});
