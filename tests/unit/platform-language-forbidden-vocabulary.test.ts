import { describe, expect, it } from "vitest";

import {
  inspectFields,
  inspectVocabulary,
  violatesVocabulary,
  type VocabularyPolicy,
} from "@/platform/language/forbidden-vocabulary";

// A política usada nos testes é inventada aqui de propósito: a camada de
// Plataforma não deve conhecer o vocabulário de nenhum domínio, e o teste
// prova isso ao funcionar com um vocabulário arbitrário.
const policy: VocabularyPolicy = {
  absolute: ["vencedor", "melhor opção"],
  unlessNegated: ["ranking", "classificação"],
};

describe("inspectVocabulary — lista absoluta", () => {
  it("acusa a expressão mesmo negada, porque negar já a introduz", () => {
    const findings = inspectVocabulary("Aqui não existe vencedor.", policy);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.kind).toBe("absolute");
    expect(findings[0]?.phrase).toBe("vencedor");
  });

  it("acusa todas as ocorrências, não apenas a primeira", () => {
    const findings = inspectVocabulary("vencedor de novo vencedor", policy);
    expect(findings.map((f) => f.index)).toEqual([0, 17]);
  });

  it("não acusa quando a expressão é apenas parte de outra palavra", () => {
    expect(violatesVocabulary("O time é invencedores?", policy)).toBe(false);
  });
});

describe("inspectVocabulary — negação na mesma cláusula", () => {
  it.each([
    "Isto não é um ranking.",
    "Nunca houve ranking aqui.",
    "Apresentamos sem ranking.",
    "Não há nenhum ranking entre as opções.",
    "Jamais foi um ranking.",
  ])("aceita a expressão negada: %s", (text) => {
    expect(violatesVocabulary(text, policy)).toBe(false);
  });

  it("acusa a expressão afirmada", () => {
    const findings = inspectVocabulary("Este é o ranking das opções.", policy);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.kind).toBe("unnegated");
  });

  it("acusa quando a negação está em outra frase", () => {
    expect(violatesVocabulary("Não decidimos por você. Segue o ranking.", policy)).toBe(true);
  });

  it.each(["mas", "porém", "contudo", "entretanto", "todavia", "no entanto"])(
    "acusa quando '%s' encerra a cláusula da negação",
    (conjunction) => {
      const text = `Não seria o caso, ${conjunction} o ranking mostra outra coisa.`;
      expect(violatesVocabulary(text, policy)).toBe(true);
    },
  );

  it("aceita negação separada por vírgula, que não encerra cláusula", () => {
    expect(violatesVocabulary("Não usamos, em momento algum, ranking.", policy)).toBe(false);
  });

  it("é indiferente a maiúsculas", () => {
    expect(violatesVocabulary("NÃO É UM RANKING", policy)).toBe(false);
    expect(violatesVocabulary("VEJA O RANKING", policy)).toBe(true);
  });

  it("aceita 'nao' sem til, porque as pessoas escrevem sem", () => {
    expect(violatesVocabulary("Isto nao e um ranking.", policy)).toBe(false);
  });
});

describe("inspectVocabulary — forma do achado", () => {
  it("devolve a cláusula em que a expressão apareceu", () => {
    const findings = inspectVocabulary("Uma explicação. Segue o ranking.", policy);
    expect(findings[0]?.clause).toBe("segue o");
  });

  it("ordena os achados pela posição no texto", () => {
    const findings = inspectVocabulary("Veja a classificação e o vencedor.", policy);
    expect(findings.map((f) => f.phrase)).toEqual(["classificação", "vencedor"]);
  });

  it("não acusa nada num texto limpo", () => {
    expect(
      inspectVocabulary("Três caminhos possíveis, com o que sustenta cada um.", policy),
    ).toEqual([]);
  });
});

describe("inspectFields", () => {
  it("diz em qual campo cada achado apareceu", () => {
    const findings = inspectFields(
      { titulo: "O vencedor", corpo: "Não é um ranking.", nota: null },
      policy,
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]?.field).toBe("titulo");
  });

  it("ignora campos vazios sem quebrar", () => {
    expect(inspectFields({ a: null, b: undefined, c: "" }, policy)).toEqual([]);
  });
});
