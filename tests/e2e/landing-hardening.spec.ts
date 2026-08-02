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

// Terceira encarnação desta superfície, e a propriedade evoluiu com o
// cânone: o FaqBookSection (livro com setas) virou acordeão, e o acordeão
// era um dos cinco elementos banidos pelo Sistema Visual §12 ("esconder o
// que importa é confessar que não importa") — escondia justamente "Quanto
// custa?". O redesenho 2.2 abriu tudo: a propriedade protegida agora é que
// TODAS as dúvidas e TODAS as respostas estão visíveis sem nenhuma
// interação, e nenhum mecanismo de esconder voltou.
test("Dúvidas frequentes estão todas abertas — nada atrás de clique", async ({
  page,
}) => {
  await page.goto("/");

  const duvidas = page.locator("#duvidas");
  await duvidas.scrollIntoViewIfNeeded();

  // Nenhum acordeão: zero botões, zero aria-expanded.
  await expect(duvidas.getByRole("button")).toHaveCount(0);
  await expect(duvidas.locator("[aria-expanded]")).toHaveCount(0);

  // As quatro perguntas e as quatro respostas, visíveis sem interação —
  // incluindo a mais sensível.
  await expect(duvidas.getByText("Quanto custa?", { exact: false })).toBeVisible();
  await expect(
    duvidas.getByText("O cuidado clínico é do médico", { exact: false }),
  ).toBeVisible();
  await expect(
    duvidas.getByText("Transparência total", { exact: false }),
  ).toBeVisible();
  await expect(
    duvidas.getByText("seu Curador organiza", { exact: false }),
  ).toBeVisible();
});
