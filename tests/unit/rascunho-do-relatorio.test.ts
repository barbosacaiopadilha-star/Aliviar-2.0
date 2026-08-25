import { describe, expect, it } from "vitest";

import type { ResumoDoCandidato } from "@/modules/curadoria/composicao-dos-tres";
import { rascunharRelatorio } from "@/modules/curadoria/rascunho-do-relatorio";

function resumo(parcial: Partial<ResumoDoCandidato["essenciais"]>, id = "helena"): ResumoDoCandidato {
  const essenciais = {
    atende: 0,
    naoAtende: 0,
    semInformacao: 0,
    frasesQueAtende: [],
    frasesQueNaoAtende: [],
    ...parcial,
  };
  return { profissionalId: id, nome: "Dra. Helena", essenciais, tudo: essenciais };
}

describe("O rascunho fala com ELA, não com o sistema", () => {
  it("usa a segunda pessoa e cita a frase dela", () => {
    const [rascunho] = rascunharRelatorio(
      [resumo({ atende: 1, frasesQueAtende: ["Preciso de atendimento presencial"] })],
      ["helena"],
    );

    expect(rascunho.relationToWeights).toContain("Você disse que era essencial");

    // A escolha dela é CITADA, com as palavras e a maiúscula que o Catálogo
    // ofereceu — não rebaixada a minúscula no meio da frase. Os rótulos são
    // escritos na primeira pessoa dela ("Preciso de…"), e sem aspas a oração
    // misturava duas pessoas gramaticais: "Você disse que preciso de
    // atendimento presencial era essencial". Só apareceu ao ler a saída com o
    // caso real — nenhum teste de tipo pega erro de português.
    expect(rascunho.relationToWeights).toContain("“Preciso de atendimento presencial”");

    // "atende ao subcritério ACESSO_MODALIDADE" é frase para máquina.
    expect(rascunho.relationToWeights).not.toMatch(/[A-Z]{4,}_[A-Z]/);
  });

  // Separar o custo em outro parágrafo é como um relatório esconde sem mentir.
  it("o que NÃO se confirma vem na mesma respiração do que se confirma", () => {
    const [rascunho] = rascunharRelatorio(
      [
        resumo({
          atende: 1,
          naoAtende: 1,
          frasesQueAtende: ["Preciso de atendimento presencial"],
          frasesQueNaoAtende: ["Sair com o retorno já marcado"],
        }),
      ],
      ["helena"],
    );

    expect(rascunho.relationToWeights).toContain("Este caminho responde a isso.");
    expect(rascunho.relationToWeights).toContain("aqui isso não se confirma");
  });

  it("a lacuna é dita, não suposta", () => {
    const [rascunho] = rascunharRelatorio([resumo({ semInformacao: 2 })], ["helena"]);

    expect(rascunho.relationToWeights).toContain("2 pontos");
    expect(rascunho.relationToWeights).toContain("preferimos dizer isso a supor");
  });

  // Uma Curadoria que apresenta três caminhos sem custo apresentou três
  // propagandas — e é por isso que o contrato exige ao menos um ponto.
  it("cada coisa que ele não atende vira ponto de atenção", () => {
    const [rascunho] = rascunharRelatorio(
      [resumo({ naoAtende: 1, frasesQueNaoAtende: ["Sair com o retorno já marcado"] })],
      ["helena"],
    );

    expect(rascunho.attentionPoints).toHaveLength(1);
    expect(rascunho.attentionPoints[0]).toContain("Não se confirmou “Sair com o retorno já marcado”");
    expect(rascunho.attentionPoints[0]).toContain("que você disse ser essencial");
  });

  // Inventar um custo seria pôr na boca da Aliviar uma afirmação que ninguém
  // verificou. Melhor devolver vazio e deixar o campo obrigatório para quem
  // sabe o que a tela não viu.
  it("não inventa custo quando não há — devolve vazio", () => {
    const [rascunho] = rascunharRelatorio(
      [resumo({ atende: 3, frasesQueAtende: ["a", "b", "c"] })],
      ["helena"],
    );

    expect(rascunho.attentionPoints).toEqual([]);
  });

  it("sem nada declarado por ela, não produz relação com peso nenhum", () => {
    const [rascunho] = rascunharRelatorio([resumo({})], ["helena"]);
    expect(rascunho.relationToWeights).toBe("");
  });
});

describe("A ordem é de quem compôs", () => {
  it("segue a ordem dos escolhidos, não a dos resumos", () => {
    const resumos = [
      resumo({ atende: 1, frasesQueAtende: ["x"] }, "a"),
      resumo({ atende: 1, frasesQueAtende: ["y"] }, "b"),
      resumo({ atende: 1, frasesQueAtende: ["z"] }, "c"),
    ];

    const rascunhos = rascunharRelatorio(resumos, ["c", "a", "b"]);
    expect(rascunhos.map((r) => r.profissionalId)).toEqual(["c", "a", "b"]);
  });

  it("escolhido sem resumo não vira linha fantasma", () => {
    const rascunhos = rascunharRelatorio([resumo({ atende: 1, frasesQueAtende: ["x"] })], [
      "helena",
      "quem-nao-existe",
    ]);

    expect(rascunhos).toHaveLength(1);
  });
});
