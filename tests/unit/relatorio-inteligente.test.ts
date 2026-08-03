import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SUBCRITERION_CATALOG, SUBCRITERION_GROUPS } from "@/modules/curadoria/mapa-prioridades";
import {
  generateReportDraft,
  GENERATOR_VERSION,
  type DraftInput,
  type OptionDraftInput,
  type PriorityRef,
} from "@/modules/curadoria/relatorio-inteligente";

/**
 * O gerador certificado — ADR-042.
 *
 * O que estes testes protegem não é formatação: é a recusa a inventar. Toda
 * frase precisa dizer de onde veio, o mesmo dado precisa gerar o mesmo texto,
 * e nenhuma lacuna pode virar conclusão.
 */

// A ordem do RELATÓRIO é a do Mapa (grupos do Modelo v1.0 → display_order),
// não a ordem de emissão do catálogo gerado (eixos do banco): os dois vêm da
// mesma fonte, mas o Relatório apresenta pelo vocabulário do Mapa.
const CODIGOS = [...SUBCRITERION_CATALOG]
  .sort((a, b) =>
    a.group === b.group
      ? a.displayOrder - b.displayOrder
      : SUBCRITERION_GROUPS.indexOf(a.group) - SUBCRITERION_GROUPS.indexOf(b.group),
  )
  .map((s) => s.code);
const [PRIMEIRO, SEGUNDO, TERCEIRO] = CODIGOS;

function opcao(id: string, states: OptionDraftInput["states"] = []): OptionDraftInput {
  return {
    professionalProfileId: id,
    states,
    areaDeclaration: {
      compatibility: "COMPATIVEL",
      rationale: null,
      declaredBy: "Dra. Curadora",
      declaredAt: "2026-07-01T10:00:00Z",
    },
    openCriticalDivergences: 0,
  };
}

function entrada(
  priorities: PriorityRef[],
  options: OptionDraftInput[] = [opcao("a"), opcao("b"), opcao("c")],
): DraftInput {
  return { areaRequirement: "Ortopedia de coluna", priorities, options };
}

/** Mapa completo — todos os subcritérios ativos classificados. */
const COMPLETO: PriorityRef[] = SUBCRITERION_CATALOG.filter((s) => s.active).map((s) => ({
  subcriterionCode: s.code,
  importance: "IMPORTANTE" as const,
}));

describe("Ordenação — pelo Mapa, nunca por peso", () => {
  it("ordena pelo ordinal da importância, do mais para o menos importante", () => {
    const draft = generateReportDraft(
      entrada([
        { subcriterionCode: PRIMEIRO!, importance: "POUCO_IMPORTANTE" },
        { subcriterionCode: SEGUNDO!, importance: "MUITO_IMPORTANTE" },
        { subcriterionCode: TERCEIRO!, importance: "RELEVANTE" },
      ]),
    );

    const nomes = draft.options[0]!.relacaoPrioridades.sentences.map(
      (s) => s.provenance[0]!.subcriterion,
    );
    expect(nomes).toEqual([SEGUNDO, TERCEIRO, PRIMEIRO]);
  });

  it("no empate respeita a ordem canônica do catálogo, não a de gravação", () => {
    // Gravados de trás para frente, mesmo nível: a saída precisa vir na ordem
    // do catálogo — senão o mesmo Case gera textos diferentes por acaso.
    const invertido = [...CODIGOS].reverse().map((code) => ({
      subcriterionCode: code,
      importance: "IMPORTANTE" as const,
    }));
    const draft = generateReportDraft(entrada(invertido));

    const nomes = draft.options[0]!.relacaoPrioridades.sentences.map(
      (s) => s.provenance[0]!.subcriterion,
    );
    expect(nomes).toEqual(CODIGOS);
  });

  it("subcritério fora do catálogo não vira frase", () => {
    const draft = generateReportDraft(
      entrada([
        { subcriterionCode: PRIMEIRO!, importance: "IMPORTANTE" },
        { subcriterionCode: "CODIGO_QUE_NAO_EXISTE", importance: "MUITO_IMPORTANTE" },
      ]),
    );
    expect(draft.options[0]!.relacaoPrioridades.sentences).toHaveLength(1);
  });
});

describe("Completude — vem do Mapa", () => {
  it("Mapa completo é declarado completo, e sem limitação de completude", () => {
    const draft = generateReportDraft(entrada(COMPLETO));
    expect(draft.completude.status).toBe("COMPLETE");
    expect(draft.limitacoes.some((l) => l.provenance[0]!.sourceType === "completude_do_mapa")).toBe(
      false,
    );
  });

  it("Mapa parcial nunca aparece como completo", () => {
    const draft = generateReportDraft(
      entrada([{ subcriterionCode: PRIMEIRO!, importance: "IMPORTANTE" }]),
    );
    expect(draft.completude.status).toBe("IN_PROGRESS");
    const limitacao = draft.limitacoes.find(
      (l) => l.provenance[0]!.sourceType === "completude_do_mapa",
    );
    expect(limitacao?.text).toContain("em construção");
  });

  it("Mapa vazio é declarado não iniciado", () => {
    const draft = generateReportDraft(entrada([]));
    expect(draft.completude.status).toBe("NOT_STARTED");
    expect(draft.limitacoes[0]!.text).toContain("ainda não foi iniciado");
  });
});

describe("Motor de Compatibilidade — as quatro conclusões e as cinco origens", () => {
  function frase(states: OptionDraftInput["states"], importance: PriorityRef["importance"]) {
    const draft = generateReportDraft(
      entrada(
        [{ subcriterionCode: PRIMEIRO!, importance }],
        [opcao("a", states), opcao("b"), opcao("c")],
      ),
    );
    return draft.options[0]!.relacaoPrioridades.sentences[0]!;
  }

  it("alta compatibilidade: confirmado no que é muito importante", () => {
    const s = frase([{ subcriterionCode: PRIMEIRO!, status: "CONFIRMADO" }], "MUITO_IMPORTANTE");
    expect(s.provenance[0]!.compatibility).toBe("ALTA_COMPATIBILIDADE");
    expect(s.text).toContain("muito importante para este caso");
    expect(s.text).toContain("está confirmada para o profissional");
  });

  it("média compatibilidade: confirmado no que é relevante", () => {
    const s = frase([{ subcriterionCode: PRIMEIRO!, status: "CONFIRMADO" }], "RELEVANTE");
    expect(s.provenance[0]!.compatibility).toBe("MEDIA_COMPATIBILIDADE");
    expect(s.text).toContain("classificado como relevante");
  });

  it("NAO_CONFIRMADO não vira confirmado, não vira alta, e não vira 'incompatível'", () => {
    const s = frase([{ subcriterionCode: PRIMEIRO!, status: "NAO_CONFIRMADO" }], "MUITO_IMPORTANTE");
    expect(s.provenance[0]!.compatibility).not.toBe("ALTA_COMPATIBILIDADE");
    expect(s.text).toContain("não foi confirmada para o profissional");
    expect(s.text).not.toMatch(/incompatível|inadequado|reprovado/i);
  });

  it("a lacuna distingue ausência de registro de NAO_INFORMADO", () => {
    // Ambos viram LACUNA_DE_INFORMACAO no Motor. O texto precisa separá-los:
    // "ninguém perguntou" e "perguntaram e não havia" pedem conversas
    // diferentes.
    const semRegistro = frase([], "MUITO_IMPORTANTE");
    const naoInformado = frase(
      [{ subcriterionCode: PRIMEIRO!, status: "NAO_INFORMADO" }],
      "MUITO_IMPORTANTE",
    );

    expect(semRegistro.provenance[0]!.compatibility).toBe("LACUNA_DE_INFORMACAO");
    expect(naoInformado.provenance[0]!.compatibility).toBe("LACUNA_DE_INFORMACAO");

    expect(semRegistro.text).toContain("ainda não foi investigado");
    expect(naoInformado.text).toContain("não há informação suficiente");
    expect(semRegistro.text).not.toBe(naoInformado.text);

    // E a proveniência também os separa.
    expect(semRegistro.provenance[0]!.status).toBeNull();
    expect(naoInformado.provenance[0]!.status).toBe("NAO_INFORMADO");
  });

  it("NAO_INFLUENCIA não vira ponto de atenção nem pergunta", () => {
    const draft = generateReportDraft(
      entrada([{ subcriterionCode: PRIMEIRO!, importance: "NAO_INFLUENCIA" }]),
    );
    const opcaoA = draft.options[0]!;
    expect(opcaoA.relacaoPrioridades.sentences[0]!.text).toContain("não influencia a decisão");
    expect(opcaoA.pontosDeAtencao.items).toHaveLength(0);
    expect(opcaoA.perguntasSugeridas).toHaveLength(0);
    expect(opcaoA.pontosFavoraveis).toHaveLength(0);
  });

  it("nenhum quinto estado é inventado", () => {
    const draft = generateReportDraft(entrada(COMPLETO));
    const resultados = new Set(
      draft.options.flatMap((o) =>
        o.relacaoPrioridades.sentences.flatMap((s) => s.provenance.map((p) => p.compatibility)),
      ),
    );
    for (const r of resultados) {
      expect([
        "ALTA_COMPATIBILIDADE",
        "MEDIA_COMPATIBILIDADE",
        "LACUNA_DE_INFORMACAO",
        "NAO_RELEVANTE",
      ]).toContain(r);
    }
  });
});

describe("Linguagem — nenhum ponto sobrevive", () => {
  const draft = generateReportDraft(
    entrada(COMPLETO, [
      opcao("a", [{ subcriterionCode: PRIMEIRO!, status: "CONFIRMADO" }]),
      opcao("b", [{ subcriterionCode: SEGUNDO!, status: "NAO_CONFIRMADO" }]),
      opcao("c"),
    ]),
  );

  const todoTexto = [
    ...draft.limitacoes.map((l) => l.text),
    ...draft.options.flatMap((o) => [
      o.justificativa.text,
      o.relacaoPrioridades.text,
      ...o.pontosDeAtencao.items.map((i) => i.text),
      ...o.pontosFavoraveis.map((i) => i.text),
      ...o.perguntasSugeridas.map((i) => i.text),
    ]),
  ].join(" ");

  it("nenhum texto menciona pontos, orçamento ou distribuição", () => {
    expect(todoTexto).not.toMatch(/\bpontos?\b|orçamento|distribuiç|\bpesos?\b/i);
  });

  it("nenhum score, ranking, porcentagem ou 'melhor profissional'", () => {
    expect(todoTexto).not.toMatch(/%|score|ranking|nota \d|melhor profissional|1º|primeiro lugar/i);
  });

  it("usa a linguagem do Mapa", () => {
    expect(todoTexto).toMatch(/foi considerado muito importante|foi classificado como/);
  });
});

describe("Rastreabilidade e determinismo", () => {
  const input = entrada(COMPLETO, [
    opcao("a", [{ subcriterionCode: PRIMEIRO!, status: "CONFIRMADO" }]),
    opcao("b", [{ subcriterionCode: SEGUNDO!, status: "NAO_INFORMADO" }]),
    opcao("c"),
  ]);

  it("toda frase carrega origem estruturada", () => {
    const draft = generateReportDraft(input);
    const frases = draft.options.flatMap((o) => [
      ...o.justificativa.sentences,
      ...o.relacaoPrioridades.sentences,
      ...o.pontosDeAtencao.items,
      ...o.pontosFavoraveis,
      ...o.perguntasSugeridas,
    ]);
    expect(frases.length).toBeGreaterThan(0);
    for (const frase of frases) {
      expect(frase.provenance.length, frase.text).toBeGreaterThan(0);
    }
  });

  it("a origem amarra subcritério, importância, estado e resultado do Motor", () => {
    const draft = generateReportDraft(input);
    const ref = draft.options[0]!.relacaoPrioridades.sentences[0]!.provenance[0]!;
    expect(ref.subcriterion).toBeTruthy();
    expect(ref.importance).toBeTruthy();
    expect(ref.compatibility).toBeTruthy();
    expect(ref).toHaveProperty("status");
  });

  it("mesma entrada, mesma saída — byte a byte", () => {
    expect(JSON.stringify(generateReportDraft(input))).toBe(
      JSON.stringify(generateReportDraft(input)),
    );
  });

  it("a versão do gerador é gravada e mudou com a virada", () => {
    expect(generateReportDraft(input).generatorVersion).toBe(GENERATOR_VERSION);
    expect(GENERATOR_VERSION).toContain("2.1.0");
  });

  it("nunca escreve pelo Curador", () => {
    for (const opcaoGerada of generateReportDraft(input).options) {
      expect(opcaoGerada.observacoesDoCurador).toBe("");
    }
  });

  it("sem confirmação nenhuma, a justificativa fica pendente em vez de ser inventada", () => {
    const draft = generateReportDraft(entrada(COMPLETO));
    expect(draft.options[0]!.justificativa.requiresCurator).toBe(true);
  });

  it("sem ponto de atenção algum, o campo fica pendente — opção só com virtudes é recomendação", () => {
    const tudoConfirmado = SUBCRITERION_CATALOG.filter((s) => s.active).map((s) => ({
      subcriterionCode: s.code,
      status: "CONFIRMADO" as const,
    }));
    const draft = generateReportDraft(
      entrada(COMPLETO, [
        opcao("a", tudoConfirmado),
        opcao("b", tudoConfirmado),
        opcao("c", tudoConfirmado),
      ]),
    );
    expect(draft.options[0]!.pontosDeAtencao.requiresCurator).toBe(true);
  });
});

describe("Dados parciais — declara a limitação, não a preenche", () => {
  it("não quebra com Mapa do Case incompleto e Mapa do Profissional vazio", () => {
    expect(() =>
      generateReportDraft(entrada([{ subcriterionCode: PRIMEIRO!, importance: "MUITO_IMPORTANTE" }])),
    ).not.toThrow();
  });

  it("declara quantos itens ainda não foram investigados", () => {
    const draft = generateReportDraft(
      entrada([{ subcriterionCode: PRIMEIRO!, importance: "MUITO_IMPORTANTE" }]),
    );
    expect(draft.limitacoes.some((l) => l.text.includes("não investigado"))).toBe(true);
  });

  it("sem nenhum item Muito importante, ainda gera e continua determinístico", () => {
    const input = entrada([{ subcriterionCode: PRIMEIRO!, importance: "POUCO_IMPORTANTE" }]);
    expect(JSON.stringify(generateReportDraft(input))).toBe(
      JSON.stringify(generateReportDraft(input)),
    );
  });

  it("com tudo em Não influencia, declara que não há base para diferenciar", () => {
    const nenhum = SUBCRITERION_CATALOG.filter((s) => s.active).map((s) => ({
      subcriterionCode: s.code,
      importance: "NAO_INFLUENCIA" as const,
    }));
    const draft = generateReportDraft(entrada(nenhum));
    expect(draft.limitacoes.some((l) => l.text.includes("não influentes"))).toBe(true);
  });

  it("continua exigindo exatamente três opções distintas", () => {
    expect(() => generateReportDraft(entrada(COMPLETO, [opcao("a"), opcao("b")]))).toThrow(
      /exatamente três/,
    );
    expect(() =>
      generateReportDraft(entrada(COMPLETO, [opcao("a"), opcao("a"), opcao("c")])),
    ).toThrow(/distintas/);
  });
});

describe("O Relatório não lê mais os modelos antigos", () => {
  const gerador = readFileSync(
    join(process.cwd(), "src/modules/curadoria/relatorio-inteligente.ts"),
    "utf8",
  );
  const montador = readFileSync(
    join(process.cwd(), "src/modules/curadoria/relatorio-assistido.ts"),
    "utf8",
  );

  function semComentarios(fonte: string): string {
    return fonte
      .split("\n")
      .filter((linha) => {
        const limpa = linha.trimStart();
        return !limpa.startsWith("//") && !limpa.startsWith("*") && !limpa.startsWith("/*");
      })
      .join("\n");
  }

  it("o gerador não conhece BLOCK_POINTS, cobertura em pontos nem peso", () => {
    expect(semComentarios(gerador)).not.toMatch(
      /BLOCK_POINTS|coverageSentence|coveredWeight|\bweight\b/,
    );
  });

  it("o montador não lê cruzamento_weights nem priority_weights", () => {
    expect(semComentarios(montador)).not.toMatch(
      /loadCruzamentoWeights|cruzamento_weights|priority_weights/,
    );
  });

  it("o montador consome Mapa de Prioridades e Mapa do Profissional", () => {
    expect(montador).toContain("loadCasePriorityMap");
    expect(montador).toContain("loadProfessionalMap");
  });

  it("a tabela ordinal não foi recopiada no Relatório", () => {
    expect(semComentarios(gerador)).toContain("importanceOrdinal");
    expect(semComentarios(gerador)).not.toMatch(/MUITO_IMPORTANTE:\s*5/);
  });
});
