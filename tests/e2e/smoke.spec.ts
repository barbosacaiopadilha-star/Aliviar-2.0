import { expect, test } from "@playwright/test";

// Smoke test da Landing — confirma só que a rota carrega e que marcos estáveis
// do topo, do meio e do fim da jornada estão presentes. Nunca testa
// timeline/GSAP/hover/alinhamento (isso é validação manual no preview).
//
// Os marcos foram atualizados com o redesenho editorial: a Biblioteca em
// formato de livro e o convite final (FinalCtaSection) deixaram de ser
// montados na Landing. Os três headings abaixo são os que a página realmente
// renderiza hoje, na ordem em que aparecem (src/app/(public)/page.tsx).
test("home page loads and shows the landing journey", async ({ page }) => {
  await page.goto("/");

  // Chegada.
  await expect(
    page.getByRole("heading", { name: /Você não precisa tomá-la sozinho/ }),
  ).toBeVisible();

  // Meio da jornada — quem conduz a Curadoria. ADR-082 (23/08): a sala
  // verde deu lugar à apresentação do Curador, no ato da Curadoria.
  await expect(
    page.getByRole("heading", { name: "Você não precisa escolher sozinho." }),
  ).toBeVisible();

  // Encerramento — o último ambiente montado (Dossiê da Landing
  // Responsiva, 23/08: o FAQ saiu da página; a copy segue congelada).
  await expect(
    page.getByRole("heading", { name: "Depois da escolha, continuamos com você." }),
  ).toBeVisible();

  // Ação principal disponível — "Solicitar atendimento" se repete de propósito
  // (Hero, convite final, rodapé): é a porta ÚNICA desde a C1 da auditoria de
  // 22/08 — o convite deixou de abrir o wizard adormecido (ADR-075).
  await expect(
    page.getByRole("link", { name: "Quero conversar com a Aliviar" }).first(),
  ).toBeVisible();
});
