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

  // Meio da jornada — quem conduz a Curadoria.
  await expect(page.getByRole("heading", { name: "Curadores independentes." })).toBeVisible();

  // Encerramento — a última seção montada.
  await expect(page.getByRole("heading", { name: "Dúvidas frequentes" })).toBeVisible();

  // Ação principal disponível — "Contar minha história" se repete de propósito
  // (Chegada, rodapé); .first() desambigua texto igual repetido por design,
  // não é dependência de posição estrutural frágil.
  await expect(page.getByRole("link", { name: "Contar minha história" }).first()).toBeVisible();
});
