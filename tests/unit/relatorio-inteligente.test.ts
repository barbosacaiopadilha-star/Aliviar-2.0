import { describe, expect, it } from "vitest";

import { cruzar, type CriterionEvaluation, type CriterionWeight } from "@/modules/curadoria/cruzamento";
import {
  generateReportDraft,
  GENERATOR_VERSION,
  type DraftInput,
  type OptionDraftInput,
} from "@/modules/curadoria/relatorio-inteligente";

const TECNICO: CriterionWeight[] = [
  { criterion: "FORMACAO", weight: 30 },
  { criterion: "EXPERIENCIA", weight: 50 },
  { criterion: "HISTORICO", weight: 20 },
];
const PRIORIDADES: CriterionWeight[] = [
  { criterion: "ACESSO", weight: 30 },
  { criterion: "CONTINUIDADE_DO_CUIDADO", weight: 50 },
  { criterion: "MODELO_DE_ATENDIMENTO", weight: 20 },
];

function evals(map: Record<string, CriterionEvaluation["assessment"]>): CriterionEvaluation[] {
  return Object.entries(map).map(([criterion, assessment]) => ({
    criterion: criterion as CriterionEvaluation["criterion"],
    assessment,
    evidence: `Evidência declarada para ${criterion}.`,
  }));
}

function option(id: string, assessments: Record<string, CriterionEvaluation["assessment"]>, overrides: Partial<OptionDraftInput> = {}): OptionDraftInput {
  return {
    professionalProfileId: id,
    result: cruzar({
      professionalProfileId: id,
      technicalWeights: TECNICO,
      patientWeights: PRIORIDADES,
      evaluations: evals(assessments),
    }),
    areaDeclaration: {
      compatibility: "COMPATIVEL",
      rationale: null,
      declaredBy: "curador-1",
      declaredAt: "2026-07-27T12:00:00.000Z",
    },
    declarationAuthors: Object.fromEntries(
      Object.keys(assessments).map((criterion) => [criterion, { declaredBy: "curador-1", declaredAt: "2026-07-27T12:00:00.000Z" }]),
    ),
    openCriticalDivergences: 0,
    ...overrides,
  };
}

// As três fixtures da certificação, na escala do Modelo v1.0.
const FIXTURE_A = option("a", {
  FORMACAO: "ATENDE_PLENAMENTE",
  EXPERIENCIA: "ATENDE_PLENAMENTE",
  HISTORICO: "ATENDE_PARCIALMENTE",
  ACESSO: "ATENDE_PLENAMENTE",
  CONTINUIDADE_DO_CUIDADO: "ATENDE_PLENAMENTE",
  MODELO_DE_ATENDIMENTO: "ATENDE_PLENAMENTE",
});
const FIXTURE_B = option("b", {
  FORMACAO: "ATENDE_PLENAMENTE",
  EXPERIENCIA: "ATENDE_PLENAMENTE",
  HISTORICO: "ATENDE_PLENAMENTE",
  ACESSO: "ATENDE_PARCIALMENTE",
  CONTINUIDADE_DO_CUIDADO: "ATENDE_PLENAMENTE",
  MODELO_DE_ATENDIMENTO: "INFORMACAO_INSUFICIENTE",
});
const FIXTURE_C = option("c", {
  FORMACAO: "ATENDE_PARCIALMENTE",
  EXPERIENCIA: "ATENDE_PLENAMENTE",
  HISTORICO: "ATENDE_PARCIALMENTE",
  ACESSO: "ATENDE_PLENAMENTE",
  CONTINUIDADE_DO_CUIDADO: "ATENDE_PLENAMENTE",
  MODELO_DE_ATENDIMENTO: "ATENDE_PLENAMENTE",
});

const INPUT: DraftInput = { areaRequirement: "Ortopedia de coluna", options: [FIXTURE_A, FIXTURE_B, FIXTURE_C] };

const VOCABULARIO_PROIBIDO = [
  "melhor opção",
  "mais recomendado",
  "primeira opção",
  "segunda opção",
  "terceira opção",
  "vencedor",
  "ranking",
  "nota final",
  "percentual de sucesso",
  "garantia",
  "escolha ideal",
  "médico perfeito",
  "maior pontuação",
];

const VOCABULARIO_ANTIGO = ["Trajetória", "Forma de Cuidado", "Compatibilidade Pessoal"];

function allText(draft: ReturnType<typeof generateReportDraft>): string {
  return JSON.stringify(draft);
}

describe("Determinismo e rastreabilidade", () => {
  it("mesma entrada produz exatamente a mesma saída", () => {
    const primeira = generateReportDraft(INPUT);
    const segunda = generateReportDraft(INPUT);
    expect(JSON.stringify(primeira)).toBe(JSON.stringify(segunda));
    expect(primeira.generatorVersion).toBe(GENERATOR_VERSION);
  });

  it("cada frase gerada carrega ao menos uma origem", () => {
    const draft = generateReportDraft(INPUT);
    for (const opt of draft.options) {
      const sentences = [
        ...opt.justificativa.sentences,
        ...opt.relacaoTecnica.sentences,
        ...opt.relacaoPrioridades.sentences,
        ...opt.pontosDeAtencao.items,
        ...opt.pontosFavoraveis,
        ...opt.perguntasSugeridas,
      ];
      expect(sentences.length).toBeGreaterThan(0);
      for (const sentence of sentences) {
        expect(sentence.provenance.length, `frase sem origem: "${sentence.text}"`).toBeGreaterThan(0);
      }
    }
  });

  it("declaração humana carrega autor e data na proveniência", () => {
    const draft = generateReportDraft(INPUT);
    const avaliadas = draft.options[0]!.relacaoTecnica.sentences.flatMap((s) => s.provenance)
      .filter((p) => p.sourceType === "avaliacao_de_criterio");
    expect(avaliadas.length).toBeGreaterThan(0);
    expect(avaliadas.every((p) => p.author === "curador-1")).toBe(true);
  });

  it("sem nenhuma aderência declarada, a justificativa fica pendente do Curador — nunca inventada", () => {
    const semNada = option("x", {
      FORMACAO: "INFORMACAO_INSUFICIENTE",
      EXPERIENCIA: "INFORMACAO_INSUFICIENTE",
      HISTORICO: "INFORMACAO_INSUFICIENTE",
      ACESSO: "INFORMACAO_INSUFICIENTE",
      CONTINUIDADE_DO_CUIDADO: "INFORMACAO_INSUFICIENTE",
      MODELO_DE_ATENDIMENTO: "INFORMACAO_INSUFICIENTE",
    });
    const draft = generateReportDraft({ areaRequirement: null, options: [semNada, FIXTURE_B, FIXTURE_C] });
    const opt = draft.options.find((o) => o.professionalProfileId === "x")!;
    expect(opt.justificativa.requiresCurator).toBe(true);
    expect(opt.justificativa.text).not.toContain("foi incluída por apresentar");
  });
});

describe("Informação insuficiente e cobertura", () => {
  it("informação insuficiente vira lacuna, nunca reprovação", () => {
    const draft = generateReportDraft(INPUT);
    const b = draft.options.find((o) => o.professionalProfileId === "b")!;

    expect(b.lacunas).toContain("Modelo de Atendimento");
    expect(b.relacaoPrioridades.text).toContain("não pôde ser avaliada porque não havia informação suficiente");
    expect(b.relacaoPrioridades.text).not.toContain("Modelo de Atendimento não atende");
  });

  it("as coberturas técnica e assistencial ficam separadas — sem cobertura geral nem total", () => {
    const draft = generateReportDraft(INPUT);
    const b = draft.options.find((o) => o.professionalProfileId === "b")!;

    // Só a assistencial da B tem lacuna: a frase de cobertura aparece na
    // relação com as prioridades e não na técnica.
    expect(b.relacaoPrioridades.text).toContain("Avaliação construída sobre 80 dos 100 pontos possíveis.");
    expect(b.relacaoTecnica.text).not.toContain("construída sobre");
    expect(allText(draft)).not.toContain('"total"');
  });

  it("cobertura nunca é apresentada como percentual de qualidade", () => {
    const draft = generateReportDraft(INPUT);
    expect(allText(draft)).not.toMatch(/compatibilidade foi de \d+%/i);
    expect(allText(draft)).not.toMatch(/\d+%/);
  });
});

describe("Campos obrigatórios", () => {
  it("justificativa existe para cada opção e nasce dos dados", () => {
    const draft = generateReportDraft(INPUT);
    for (const opt of draft.options) {
      expect(opt.justificativa.text).toContain("foi incluída");
      expect(opt.justificativa.requiresCurator).toBe(false);
    }
  });

  it("ponto de atenção é obrigatório — e 'nenhum identificado' jamais é escrito", () => {
    const draft = generateReportDraft(INPUT);
    for (const opt of draft.options) {
      expect(opt.pontosDeAtencao.items.length).toBeGreaterThan(0);
    }
    expect(allText(draft)).not.toContain("Nenhum ponto de atenção");
  });

  it("quando os dados não produzem ponto de atenção, o campo exige o Curador em vez de inventar", () => {
    const perfeita = option("p", {
      FORMACAO: "ATENDE_PLENAMENTE",
      EXPERIENCIA: "ATENDE_PLENAMENTE",
      HISTORICO: "ATENDE_PLENAMENTE",
      ACESSO: "ATENDE_PLENAMENTE",
      CONTINUIDADE_DO_CUIDADO: "ATENDE_PLENAMENTE",
      MODELO_DE_ATENDIMENTO: "ATENDE_PLENAMENTE",
    });
    const draft = generateReportDraft({ areaRequirement: null, options: [perfeita, FIXTURE_B, FIXTURE_C] });
    const opt = draft.options.find((o) => o.professionalProfileId === "p")!;
    expect(opt.pontosDeAtencao.items).toHaveLength(0);
    expect(opt.pontosDeAtencao.requiresCurator).toBe(true);
  });

  it("a observação do Curador nasce vazia — o sistema nunca escreve por ele", () => {
    const draft = generateReportDraft(INPUT);
    expect(draft.options.every((opt) => opt.observacoesDoCurador === "")).toBe(true);
  });

  it("campos opcionais podem ficar vazios sem quebrar nada", () => {
    const semPergunta = draft(FIXTURE_A);
    expect(Array.isArray(semPergunta.perguntasSugeridas)).toBe(true);

    function draft(o: OptionDraftInput) {
      return generateReportDraft({ areaRequirement: null, options: [o, FIXTURE_B, FIXTURE_C] }).options[0]!;
    }
  });
});

describe("Perguntas sugeridas — sempre amarradas a uma lacuna real", () => {
  it("informação insuficiente em Modelo de Atendimento gera a pergunta da participação familiar", () => {
    const draft = generateReportDraft(INPUT);
    const b = draft.options.find((o) => o.professionalProfileId === "b")!;
    const textos = b.perguntasSugeridas.map((p) => p.text);
    expect(textos).toContain("Há possibilidade de participação de um familiar nas consultas e decisões?");
    expect(textos).toContain("Quais etapas do acompanhamento precisam ocorrer presencialmente?");
  });

  it("sem lacuna, a pergunta correspondente não nasce", () => {
    const draft = generateReportDraft(INPUT);
    const a = draft.options.find((o) => o.professionalProfileId === "a")!;
    expect(a.perguntasSugeridas.map((p) => p.text)).not.toContain(
      "Há possibilidade de participação de um familiar nas consultas e decisões?",
    );
  });
});

describe("Vocabulário", () => {
  it("nenhum termo proibido aparece em nenhum texto gerado", () => {
    const texto = allText(generateReportDraft(INPUT)).toLowerCase();
    for (const proibido of VOCABULARIO_PROIBIDO) {
      expect(texto, `vocabulário proibido: ${proibido}`).not.toContain(proibido.toLowerCase());
    }
  });

  it("os nomes oficiais falam; os antigos não voltam", () => {
    const texto = allText(generateReportDraft(INPUT));
    expect(texto).toContain("Histórico Profissional");
    expect(texto).toContain("Continuidade do Cuidado");
    expect(texto).toContain("Modelo de Atendimento");
    for (const antigo of VOCABULARIO_ANTIGO) {
      expect(texto, `vocabulário antigo: ${antigo}`).not.toContain(antigo);
    }
  });

  it("as três fixtures produzem narrativas diferentes, nenhuma apresentada como vencedora", () => {
    const draft = generateReportDraft(INPUT);
    const textos = draft.options.map((opt) => opt.justificativa.text + opt.relacaoTecnica.text);
    expect(new Set(textos).size).toBe(3);
  });
});

describe("Seleção inválida", () => {
  it("recusa duas, quatro e opção repetida", () => {
    expect(() => generateReportDraft({ areaRequirement: null, options: [FIXTURE_A, FIXTURE_B] })).toThrow(/exatamente três/);
    expect(() =>
      generateReportDraft({ areaRequirement: null, options: [FIXTURE_A, FIXTURE_B, FIXTURE_C, FIXTURE_A] }),
    ).toThrow(/exatamente três/);
    expect(() =>
      generateReportDraft({ areaRequirement: null, options: [FIXTURE_A, FIXTURE_A, FIXTURE_B] }),
    ).toThrow(/distintas/);
  });
});
