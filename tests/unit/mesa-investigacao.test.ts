import { describe, expect, it } from "vitest";

import {
  MESA_ATALHOS,
  acaoDaTecla,
  ATALHO_DESTINO,
} from "@/modules/curadoria/mesa-atalhos";
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

describe("Atalhos — aceleram, nunca decidem", () => {
  it("nenhum atalho executa ato irreversível", () => {
    expect(MESA_ATALHOS.every((atalho) => atalho.navegacao)).toBe(true);
    for (const atalho of MESA_ATALHOS) {
      expect(atalho.acao).not.toMatch(/APROVAR|EMITIR|GERAR|EXCLUIR|SELECIONAR/);
    }
  });

  it("o caminho do Relatório é destino, não execução", () => {
    expect(ATALHO_DESTINO.IR_RELATORIO).toBe("RELATORIO");
    expect(MESA_ATALHOS.find((a) => a.acao === "IR_RELATORIO")!.descricao).toContain(
      "por clique",
    );
  });

  it("resolve teclas simples e devolve nulo com modificador", () => {
    expect(acaoDaTecla("j")).toBe("PROFISSIONAL_PROXIMO");
    expect(acaoDaTecla("]")).toBe("ETAPA_PROXIMA");
    expect(acaoDaTecla("Escape")).toBe("FECHAR");
    expect(acaoDaTecla("c", { ctrl: true })).toBeNull();
    expect(acaoDaTecla("c", { meta: true })).toBeNull();
    expect(acaoDaTecla("z")).toBeNull();
  });

  it("nenhuma tecla é reivindicada por dois atalhos", () => {
    const teclas = MESA_ATALHOS.flatMap((atalho) => atalho.teclas);
    expect(new Set(teclas).size).toBe(teclas.length);
  });
});
