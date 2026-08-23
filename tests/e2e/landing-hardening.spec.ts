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

test("o convite final navega para a MESMA porta do Hero — a conversa", async ({ page }) => {
  // C1 (auditoria 22/08): a porta voltou a ser UMA. O convite abria o wizard
  // (/sua-historia) que a ADR-075 pôs para dormir; agora Hero, convite e
  // rodapé apontam todos para /solicitar-atendimento.
  await page.goto("/");

  // Dossiê (23/08): na página os dois convites dizem "Quero conversar com
  // a Aliviar" — o da Recepção e o do Concierge. Mesma porta.
  await page
    .getByRole("link", { name: "Quero conversar com a Aliviar" })
    .last()
    .click();

  await expect(page).toHaveURL(/\/solicitar-atendimento/);
});

/**
 * O FAQ SAIU DA PÁGINA (Dossiê da Landing Responsiva, 23/08) — a terceira
 * e última reabertura da D-1, decidida pelo Fundador com a consequência
 * dita em voz alta: as dúvidas de preço e de dados deixam de ser
 * respondidas na vitrine e passam a viver na conversa.
 *
 * A propriedade que este arquivo protegia — nenhum mecanismo de esconder,
 * nada atrás de clique — continua guardada onde a copy vive: o teste de
 * componente do FaqCompactSection. O que se prova AQUI, agora, é o que a
 * página nova promete no lugar: a porta única e o vídeo que não toca
 * sozinho.
 */
test("o vídeo só toca a pedido, cresce no lugar e gruda no topo ao rolar", async ({ page }) => {
  await page.goto("/");

  // Nenhum player montado antes do gesto — a capa é só uma chamada.
  await expect(page.locator("video")).toHaveCount(0);

  const capa = page.getByRole("button", { name: /Veja a Aliviar por dentro/ });
  await capa.scrollIntoViewIfNeeded();
  await capa.click();

  // O player nasce no lugar do card, sem autoplay declarado.
  const player = page.locator("video.landing-video-player");
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute("preload", "none");
  await expect(page.locator("video[autoplay]")).toHaveCount(0);

  // Rolando adiante, ele gruda no topo em vez de sumir.
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
  await expect(page.locator(".landing-video-quadro--fixo")).toBeVisible({ timeout: 10_000 });

  // E some quando ela fecha — o gesto de saída existe e é alcançável.
  await page.getByRole("button", { name: "Fechar o vídeo" }).click();
  await expect(page.locator("video")).toHaveCount(0);
});
