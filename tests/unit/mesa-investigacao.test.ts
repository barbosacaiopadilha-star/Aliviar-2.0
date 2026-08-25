import { describe, expect, it } from "vitest";

import {
  aplicarFiltros,
  celulaEstado,
  CELULA_LABEL,
  CELULA_MARCA,
  filtrosDisponiveis,
  foiAvaliado,
  hipoteseDe,
  itensDeAtencao,
  linhaDeInvestigacao,
  recorteSentence,
  type InvestigacaoProfissional,
} from "@/modules/curadoria/mesa-investigacao";

function profissional(
  patch: Partial<InvestigacaoProfissional> & { id: string },
): InvestigacaoProfissional {
  return {
    nome: `Profissional ${patch.id}`,
    estado: "ELEGIVEL",
    areaDeclarada: true,
    temDivergencia: false,
    filtrosSemInformacao: 0,
    criteriosPendentes: 0,
    criteriosInsuficientes: 0,
    ...patch,
  };
}

describe("Linha de investigação — o raciocínio, não o workflow", () => {
  const base = {
    mapaCompleto: true,
    eligible: 2,
    criteriaDeclared: 0,
    criteriaTotal: 12,
    selected: 0,
  };

  it("começa na hipótese, antes de qualquer declaração", () => {
    const linha = linhaDeInvestigacao(base);
    expect(linha.find((etapa) => etapa.status === "agora")?.id).toBe("HIPOTESE");
  });

  it("passa a reunir evidências assim que a primeira declaração existe", () => {
    const linha = linhaDeInvestigacao({ ...base, criteriaDeclared: 1 });
    expect(linha.find((etapa) => etapa.status === "agora")?.id).toBe("EVIDENCIAS");
    expect(linha[0]!.status).toBe("percorrida");
  });

  it("chega à conferência quando nada mais falta declarar", () => {
    const linha = linhaDeInvestigacao({ ...base, criteriaDeclared: 12 });
    expect(linha.find((etapa) => etapa.status === "agora")?.id).toBe("CONFERENCIA");
  });

  it("conclui com os três caminhos selecionados", () => {
    const linha = linhaDeInvestigacao({ ...base, criteriaDeclared: 12, selected: 3 });
    expect(linha.find((etapa) => etapa.status === "agora")?.id).toBe("CONCLUSAO");
    expect(linha.every((etapa) => etapa.status !== "adiante")).toBe(true);
  });

  it("não avança sozinha quando não há o que declarar", () => {
    const linha = linhaDeInvestigacao({ ...base, criteriaTotal: 0, criteriaDeclared: 0 });
    expect(linha.find((etapa) => etapa.status === "agora")?.id).toBe("HIPOTESE");
  });
});

describe("Filtros instantâneos", () => {
  const rede = [
    profissional({ id: "a", temDivergencia: true }),
    profissional({ id: "b", criteriosPendentes: 3 }),
    profissional({ id: "c", estado: "AGUARDANDO_DECLARACAO", areaDeclarada: false }),
    profissional({ id: "d", filtrosSemInformacao: 1, estado: "PENDENTE_DE_INFORMACAO" }),
  ];

  it("sem filtro ativo, a Rede inteira — o padrão nunca esconde nada", () => {
    expect(aplicarFiltros(rede, [])).toHaveLength(4);
    expect(recorteSentence(4, 4, 0)).toBe("4 profissionais na Rede deste Case.");
  });

  it("cada filtro alcança quem deve", () => {
    expect(aplicarFiltros(rede, ["DIVERGENCIA"]).map((p) => p.id)).toEqual(["a"]);
    expect(aplicarFiltros(rede, ["SEM_DECLARACAO"]).map((p) => p.id)).toEqual(["c"]);
    expect(aplicarFiltros(rede, ["INSUFICIENTE"]).map((p) => p.id)).toEqual(["d"]);
    expect(aplicarFiltros(rede, ["AVALIADO"]).map((p) => p.id)).toEqual(["a"]);
  });

  it("filtros somam, nunca se anulam", () => {
    expect(aplicarFiltros(rede, ["DIVERGENCIA", "SEM_DECLARACAO"]).map((p) => p.id)).toEqual([
      "a",
      "c",
    ]);
  });

  it("todo recorte é dito — filtro que esconde em silêncio faz decidir sobre um universo falso", () => {
    expect(recorteSentence(1, 4, 1)).toBe("1 de 4 exibido — 1 filtro ativo.");
    expect(recorteSentence(2, 4, 2)).toBe("2 de 4 exibidos — 2 filtros ativos.");
  });

  it("filtro sem nenhum alcance continua visível, com contagem zero", () => {
    const filtros = filtrosDisponiveis([profissional({ id: "x" })], []);
    const semDeclaracao = filtros.find((filtro) => filtro.id === "SEM_DECLARACAO")!;
    expect(semDeclaracao.count).toBe(0);
    expect(filtros).toHaveLength(6);
  });

  it("só é 'já avaliado' quem é elegível e não deve critério", () => {
    expect(foiAvaliado(profissional({ id: "a" }))).toBe(true);
    expect(foiAvaliado(profissional({ id: "b", criteriosPendentes: 1 }))).toBe(false);
    expect(foiAvaliado(profissional({ id: "c", estado: "ELIMINADO" }))).toBe(false);
  });
});

describe("Painel inteligente — só o que ainda está aberto", () => {
  it("não repete o que já foi resolvido", () => {
    expect(itensDeAtencao([profissional({ id: "a" })])).toEqual([]);
  });

  it("divergência vem antes de tudo, e diz onde se resolve", () => {
    const itens = itensDeAtencao([
      profissional({ id: "a", criteriosPendentes: 2 }),
      profissional({ id: "b", temDivergencia: true }),
    ]);
    expect(itens[0]!.tipo).toBe("DIVERGENCIA");
    expect(itens[0]!.etapa).toBe("REDE");
  });

  it("informação não localizada nunca é dita como reprovação", () => {
    const [item] = itensDeAtencao([profissional({ id: "a", filtrosSemInformacao: 2 })]);
    expect(item!.frase).toContain("verificar o cadastro, não descartar");
    expect(item!.frase).not.toMatch(/não atende|reprovad/i);
  });

  it("critério sem avaliação só é cobrado de quem é elegível", () => {
    const itens = itensDeAtencao([
      profissional({ id: "a", estado: "ELIMINADO", criteriosPendentes: 6 }),
    ]);
    expect(itens.some((item) => item.tipo === "AVALIACAO")).toBe(false);
  });
});

describe("Hipóteses — leitura do que o Curador declarou, nunca recomendação", () => {
  const celulas = [
    { label: "Formação Profissional", importancia: "MUITO_IMPORTANTE" as const, resultado: "ALTA_COMPATIBILIDADE" as const },
    { label: "Continuidade do Cuidado", importancia: "IMPORTANTE" as const, resultado: "ALTA_COMPATIBILIDADE" as const },
    { label: "Acesso", importancia: "IMPORTANTE" as const, resultado: "MEDIA_COMPATIBILIDADE" as const },
  ];

  it("devolve o padrão nas palavras do próprio Curador", () => {
    const hipotese = hipoteseDe({
      professionalProfileId: "a",
      nome: "Dra. Helena",
      celulas,
      pendentes: [],
    });
    expect(hipotese.frase).toContain("Você encontrou alta compatibilidade");
    expect(hipotese.frase).toContain("Formação Profissional (muito importante)");
    expect(hipotese.status).toBe("CONFERIDA");
  });

  it("nunca compara profissionais nem usa superlativo — a escolha é do Curador", () => {
    const hipotese = hipoteseDe({
      professionalProfileId: "a",
      nome: "Dra. Helena",
      celulas,
      pendentes: [],
    });
    for (const proibido of [
      "melhor",
      "recomend",
      "ideal",
      "mais indicad",
      "muito bem",
      "destaca",
      "supera",
    ]) {
      expect(hipotese.frase.toLowerCase(), `vocabulário de recomendação: ${proibido}`).not.toContain(
        proibido,
      );
    }
  });

  it("fica em investigação enquanto houver critério sem avaliação", () => {
    const hipotese = hipoteseDe({
      professionalProfileId: "a",
      nome: "Dra. Helena",
      celulas,
      pendentes: ["Histórico Profissional"],
    });
    expect(hipotese.status).toBe("EM_INVESTIGACAO");
    expect(hipotese.lacunas).toContain("Histórico Profissional: sem avaliação registrada.");
  });

  it("informação insuficiente conclui parcialmente, e a lacuna aparece nomeada", () => {
    const hipotese = hipoteseDe({
      professionalProfileId: "a",
      nome: "Dra. Helena",
      celulas: [
        ...celulas,
        {
          label: "Histórico Profissional",
          importancia: "MUITO_IMPORTANTE" as const,
          resultado: "LACUNA_DE_INFORMACAO" as const,
        },
      ],
      pendentes: [],
    });
    expect(hipotese.status).toBe("PARCIALMENTE_CONFERIDA");
    expect(hipotese.lacunas).toContain("Histórico Profissional: informação insuficiente.");
  });

  it("sem declaração nenhuma, diz isso — não inventa padrão", () => {
    const hipotese = hipoteseDe({
      professionalProfileId: "a",
      nome: "Dra. Helena",
      celulas: [{ label: "Acesso", importancia: "IMPORTANTE", resultado: "LACUNA_DE_INFORMACAO" }],
      pendentes: ["Acesso"],
    });
    expect(hipotese.frase).toBe("Ainda não há declaração registrada para este profissional.");
  });
});

describe("Estados visuais — identidade própria, nunca só cor", () => {
  it("cada estado tem marca e texto distintos", () => {
    const marcas = Object.values(CELULA_MARCA);
    const labels = Object.values(CELULA_LABEL);
    expect(new Set(marcas).size).toBe(marcas.length);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("ausência de declaração não vira 'não atende'", () => {
    expect(celulaEstado(null)).toBe("SEM_DECLARACAO");
    expect(celulaEstado("INFORMACAO_INSUFICIENTE")).toBe("INSUFICIENTE");
    expect(celulaEstado("NAO_ATENDE")).toBe("NAO_ATENDE");
  });
});

/**
 * S-4(texto) · a frase da contagem deixa de afirmar um ato que não houve.
 *
 * `criteriosInsuficientes` soma três causas distintas:
 *
 *   assistencial `status = null`    → ninguém olhou       ← "declarado" é falso
 *   assistencial `NAO_INFORMADO`    → olharam, não havia  ← "declarado" é verdade
 *   relacional sem evidência        → ninguém declarou    ← "declarado" é falso
 *
 * A frase antiga afirmava "declarados" para os três. A nova descreve o que se
 * conta sem prometer que tudo ali teve ato humano.
 *
 * **O número não muda.** S-4(cálculo) — decidir o que a contagem DEVE medir —
 * é decisão normativa (ADR-065 §10.3) e permanece fora daqui.
 */
describe("S-4 · a redação da contagem, sem tocar a contagem", () => {
  const insuficientes = (n: number) =>
    itensDeAtencao([profissional({ id: "p1", criteriosInsuficientes: n })]).filter(
      (item) => item.id === "p1:insuficientes",
    );

  it("S4-T1 · a frase nova está lá, no singular e no plural", () => {
    expect(insuficientes(1)[0]?.frase).toBe("1 critério sem informação suficiente.");
    expect(insuficientes(4)[0]?.frase).toBe("4 critérios sem informação suficiente.");
  });

  it("S4-T2 · a frase antiga sumiu — ela afirmava ato que ninguém praticou", () => {
    for (const n of [1, 2, 9]) {
      const frase = insuficientes(n)[0]?.frase ?? "";
      expect(frase.length).toBeGreaterThan(0); // o alvo existe (anti-vacuidade)
      expect(frase).not.toContain("declarado");
      expect(frase).not.toContain("declarados");
    }
  });

  /**
   * S4-T3 · a prova de que só o texto mudou.
   *
   * Nada aqui olha a redação: é o CONTRATO da contagem — quando emite, quantos
   * itens emite, qual número carrega, e como alimenta o filtro. Este teste
   * passa igual na versão anterior da frase; é assim que ele serve de
   * antes-e-depois.
   */
  it("S4-T3 · o valor de `criteriosInsuficientes` não mudou (invariante de cálculo)", () => {
    for (const n of [0, 1, 2, 7, 42]) {
      const itens = insuficientes(n);
      // Emite um item — e apenas um — exatamente quando a contagem é positiva.
      expect(itens).toHaveLength(n > 0 ? 1 : 0);
      if (n === 0) continue;
      // O número que chega à tela é o número que entrou: sem recontar, sem
      // filtrar por causa, sem somar nada por fora.
      const numeros = (itens[0]!.frase.match(/\d+/g) ?? []).map(Number);
      expect(numeros).toEqual([n]);
      expect(itens[0]!.tipo).toBe("INSUFICIENTE");
      expect(itens[0]!.etapa).toBe("AVALIACAO");
    }
  });

  it("S4-T3b · e o filtro que a consome segue com o mesmo recorte", () => {
    const rede = [
      profissional({ id: "zero", criteriosInsuficientes: 0 }),
      profissional({ id: "um", criteriosInsuficientes: 1 }),
      profissional({ id: "muitos", criteriosInsuficientes: 5 }),
    ];
    expect(aplicarFiltros(rede, ["INSUFICIENTE"]).map((p) => p.id)).toEqual(["um", "muitos"]);
  });
});

// ---------------------------------------------------------------------------

// O JUÍZO PENDENTE — o alimento que a Mesa nova traz e a antiga não tinha
// (ADR-093, painel de atenção).
//
// A Mesa antiga alimenta `criteriosPendentes` com `criterion_declarations`, do
// regime `LEGADO_6XN` que hoje vive atrás de flag. No regime padrão quem
// conclui a etapa são os JUÍZOS da ADR-067 §5. São unidades diferentes do
// Método, e somá-las repetiria o `SIM-40` — que confundiu conceito com juízo e
// ensinou "três" onde o Método exige seis.
describe("Juízo pendente é contado como juízo, nunca como critério", () => {
  it("o juízo que falta vira item próprio, com a palavra certa", () => {
    const [item] = itensDeAtencao([profissional({ id: "a", juizosPendentes: 3 })]);

    expect(item!.tipo).toBe("JUIZO");
    expect(item!.frase).toBe("3 juízos seus ainda não foram registrados.");
    // A palavra "critério" não pode aparecer aqui: é outra unidade do Método.
    expect(item!.frase).not.toMatch(/critério/i);
  });

  it("juízo e critério legado convivem como DOIS itens, nunca somados num só", () => {
    const itens = itensDeAtencao([
      profissional({ id: "a", juizosPendentes: 3, criteriosPendentes: 2 }),
    ]);

    expect(itens.map((i) => i.tipo)).toEqual(["JUIZO", "AVALIACAO"]);
    expect(itens.find((i) => i.tipo === "JUIZO")!.frase).toContain("3 juízos");
    expect(itens.find((i) => i.tipo === "AVALIACAO")!.frase).toContain("2 critérios");
  });

  it("o juízo só é cobrado de quem é elegível — de quem não passou pela porta, não se cobra", () => {
    const itens = itensDeAtencao([
      profissional({ id: "a", estado: "AGUARDANDO_DECLARACAO", areaDeclarada: false, juizosPendentes: 3 }),
    ]);

    expect(itens.some((i) => i.tipo === "JUIZO")).toBe(false);
  });

  // A Mesa antiga não alimenta o campo. Ausente tem de significar "nada a
  // dizer", e não um item fantasma com "undefined juízos".
  it("sem o campo, nenhum item de juízo aparece", () => {
    expect(itensDeAtencao([profissional({ id: "a" })])).toEqual([]);
  });
});
