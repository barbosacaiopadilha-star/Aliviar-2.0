import { expect, test } from "@playwright/test";

// Smoke test da Landing — confirma só que a rota carrega e que marcos
// estáveis do topo, do meio e do fim da jornada estão presentes. Nunca
// testa timeline/GSAP/hover/alinhamento do Fio (isso é validação manual
// no preview). Os três headings e o link escolhidos são reais e existem
// tanto na branch animada quanto na branch de `prefers-reduced-motion`
// (H1 vem de FRAMES[0].content em ambas; os dois H2 e o link "Contar
// minha história" não têm nenhuma branch condicional própria) — o teste
// não força nenhuma preferência de movimento porque não precisa.
test("home page loads and shows the landing journey", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Uma escolha de cuidado, nunca sozinho." }),
  ).toBeVisible();

  // Marco posterior ao topo — heading real da Biblioteca.
  await expect(
    page.getByRole("heading", { name: "Perguntas que costumam vir antes do primeiro passo" }),
  ).toBeVisible();

  // Marco de encerramento — heading real do convite final.
  await expect(
    page.getByRole("heading", { name: "Estamos aqui — sem pressa e sem urgência artificial." }),
  ).toBeVisible();

  // Ação principal disponível — "Contar minha história" se repete de
  // propósito (Chegada, convite final, rodapé); .first() desambigua
  // texto igual repetido por design, não é dependência de posição
  // estrutural frágil.
  await expect(page.getByRole("link", { name: "Contar minha história" }).first()).toBeVisible();
});
