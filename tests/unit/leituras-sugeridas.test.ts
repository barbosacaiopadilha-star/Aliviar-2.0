import { describe, expect, it } from "vitest";

import { leiturasSugeridas } from "@/modules/curadoria/leituras-sugeridas";

// A leitura proposta é o que o Curador devolve a ela para reconhecer. Uma
// sugestão que acrescente conteúdo faz ela reconhecer uma frase que nunca
// disse — e o reconhecimento é ato exclusivo dela (ADR-042).
describe("Leituras sugeridas — ajudam a escrever, nunca escrevem sozinhas", () => {
  it("sem nada declarado, não sugere nada", () => {
    expect(leiturasSugeridas({ opcoesMarcadas: [], grau: null })).toEqual([]);
  });

  // Este é o teste que importa. Uma frase genérica ("entendi o que você quis
  // dizer") seria pior que campo vazio: daria ao Curador algo para confirmar
  // sem ter ouvido nada.
  it("nunca inventa conteúdo — tudo que aparece foi declarado", () => {
    const sugestoes = leiturasSugeridas({
      opcoesMarcadas: ["Sair com o retorno já marcado"],
      grau: "ESSENCIAL",
    });

    for (const sugestao of sugestoes) {
      const miolo = sugestao.texto
        .replace("Pelo que você me contou, entendi que ", "")
        .replace(" É isso?", "");
      // O miolo só pode conter o que ela marcou, o peso que ela deu, e a
      // costura mínima em português.
      expect(miolo.toLowerCase()).toContain("sair com o retorno já marcado");
    }
  });

  it("oferece mais de um ângulo — é o Curador que sabe qual soa como ela", () => {
    const sugestoes = leiturasSugeridas({
      opcoesMarcadas: ["Explicação sem termos técnicos", "Tempo para perguntar"],
      grau: "ESSENCIAL",
    });

    expect(sugestoes.length).toBeGreaterThanOrEqual(2);
    expect(new Set(sugestoes.map((s) => s.texto)).size).toBe(sugestoes.length);
  });

  it("lista as opções como se fala, com 'e' antes da última", () => {
    const [primeira] = leiturasSugeridas({
      opcoesMarcadas: ["Explicação sem termos técnicos", "Tempo para perguntar"],
      grau: null,
    });

    expect(primeira.texto).toContain("explicação sem termos técnicos e tempo para perguntar");
  });

  it("o peso dela vira frase, não rótulo de formulário", () => {
    const sugestoes = leiturasSugeridas({
      opcoesMarcadas: ["Sair com o retorno já marcado"],
      grau: "ESSENCIAL",
    });

    const comPeso = sugestoes.find((s) => s.rotulo === "Com o peso que ela deu")!;
    expect(comPeso.texto).toContain("sem isso o cuidado não funciona para você");
    // O rótulo do formulário não serve para ser lido de volta a ela.
    expect(comPeso.texto).not.toContain("Essencial —");
  });

  // Onde o Protocolo autoriza texto guiado, ela falou com as próprias
  // palavras. Nenhuma opção de catálogo representa melhor do que isso.
  it("as palavras dela vêm primeiro quando existem", () => {
    const sugestoes = leiturasSugeridas({
      opcoesMarcadas: ["Tempo para perguntar"],
      grau: "DESEJAVEL",
      textoGuiado: "tenho medo de operar sem precisar.",
    });

    expect(sugestoes[0].rotulo).toBe("Nas palavras dela");
    expect(sugestoes[0].texto).toBe(
      "Pelo que você me contou, entendi que tenho medo de operar sem precisar. É isso?",
    );
  });

  it("toda sugestão abre e fecha na forma do Protocolo", () => {
    const sugestoes = leiturasSugeridas({
      opcoesMarcadas: ["Sábado"],
      grau: "PESA_MUITO",
      textoGuiado: "só consigo aos sábados",
    });

    expect(sugestoes.length).toBeGreaterThan(0);
    for (const sugestao of sugestoes) {
      expect(sugestao.texto.startsWith("Pelo que você me contou, entendi que ")).toBe(true);
      expect(sugestao.texto.endsWith("É isso?")).toBe(true);
    }
  });
});
