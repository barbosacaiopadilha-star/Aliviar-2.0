// =============================================================================
// PORTEIRO DE AMBIENTE — falha em segundos, não em dez minutos.
//
// Um `next start` que sobreviveu a um rebuild responde 200 em tudo, serve HTML
// válido e ainda assim referencia chunks que não existem mais. O React remonta
// a tela sem parar, os elementos somem do DOM entre uma ação e outra, e o
// Playwright fica preso num `fill` até o timeout — 600 segundos para descobrir
// que o problema nunca esteve no formulário.
//
// Este arquivo roda ANTES do fluxo e reprova o ambiente na hora, com a
// classificação certa: ambiente, nunca aplicação.
// =============================================================================
import { expect, test } from "@playwright/test";

test.describe("ambiente íntegro antes do fluxo", () => {
  test.describe.configure({ timeout: 60_000 });

  test("o servidor serve exatamente o build que está em disco", async ({ page }) => {
    const resposta = await page.request.get("/api/build-info");
    expect(resposta.ok(), "o servidor não respondeu /api/build-info").toBe(true);

    const info = await resposta.json();

    expect(info.ambiente, "ambiente inesperado").toBe("local");
    expect(info.backendHost, "backend inesperado").toBe("127.0.0.1:54321");
    expect(info.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(info.buildTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // O contrato que denuncia o servidor obsoleto: o id embutido no bundle
    // contra o id lido do disco agora.
    expect(info.buildId, "build sem identificador").not.toBe("desconhecido");
    expect(
      info.buildIdEmDisco,
      `AMBIENTE CONTAMINADO: o processo serve o build ${info.buildId}, mas em disco está ${info.buildIdEmDisco}. ` +
        "Um `next start` sobreviveu a um rebuild — derrube-o (npm run build:local já faz isso) e rode de novo.",
    ).toBe(info.buildId);
  });

  test("a tela de login carrega seus assets — nenhum chunk 404, nenhum reload em laço", async ({
    page,
  }) => {
    const quatrocentoEQuatro: string[] = [];
    const erros: string[] = [];
    let carregamentos = 0;

    page.on("response", (resposta) => {
      if (resposta.status() === 404 && resposta.url().includes("/_next/")) {
        quatrocentoEQuatro.push(resposta.url());
      }
    });
    page.on("console", (mensagem) => {
      const texto = mensagem.text();
      if (/ChunkLoadError|Loading chunk .* failed|Hydration failed/i.test(texto)) {
        erros.push(texto);
      }
    });
    page.on("load", () => {
      carregamentos += 1;
    });

    await page.goto("/login", { waitUntil: "networkidle" });

    // O formulário precisa estar montado E estável — é a montagem instável
    // que fazia o `fill` esperar para sempre.
    const email = page.getByLabel("E-mail");
    await expect(email).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();

    // Se a página estiver remontando, o handle fica obsoleto entre as duas
    // leituras. Uma escrita real prova que o elemento sobrevive à interação.
    await email.fill("verificacao-de-ambiente@aliviar-conexao.local");
    await expect(email).toHaveValue("verificacao-de-ambiente@aliviar-conexao.local");

    expect(
      quatrocentoEQuatro,
      "AMBIENTE CONTAMINADO: assets do build respondendo 404 — o servidor não corresponde ao .next em disco",
    ).toEqual([]);
    expect(erros, "AMBIENTE CONTAMINADO: falha de carregamento de chunk ou de hidratação").toEqual(
      [],
    );
    expect(carregamentos, "AMBIENTE CONTAMINADO: a página recarregou em laço").toBeLessThanOrEqual(1);
  });
});
