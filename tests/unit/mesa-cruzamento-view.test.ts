import { describe, expect, it } from "vitest";

import {
  buildComparison,
  classifyProfessional,
  headerCounts,
  nextStepSentence,
  stateSentence,
  summarySentence,
  type MandatoryFilterCheck,
} from "@/modules/curadoria/mesa-cruzamento-view";
import { crossPriorityAndProfessional } from "@/modules/curadoria/motor-compatibilidade";
import { SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";

const FILTROS_OK: MandatoryFilterCheck[] = [
  {
    label: "Atendimento em SP",
    requirement: "SP",
    professionalValue: "SP",
    passes: true,
    origin: "VERIFICADO",
    factDate: "2026-08-01T00:00:00.000Z",
  },
  {
    label: "Cuidado contínuo",
    requirement: "obrigatório",
    professionalValue: "oferece",
    passes: true,
    origin: "AUTODECLARADO",
    factDate: "2026-08-01T00:00:00.000Z",
  },
];

// O bloco "Orçamento de pontos" foi removido — ADR-042. Não há mais saldo a
// distribuir nem soma a fechar: o Case declara quanto cada subcritério importa.

describe("Elegibilidade — a ordem das perguntas importa", () => {
  it("sem declaração, aguarda o Curador — antes de qualquer cruzamento", () => {
    const result = classifyProfessional("p1", null, FILTROS_OK);
    expect(result.state).toBe("AGUARDANDO_DECLARACAO");
  });

  it("compatível com filtros atendidos é elegível", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null },
      FILTROS_OK,
    );
    expect(result.state).toBe("ELEGIVEL");
  });

  it("incompatível é eliminado — e não recebe avaliação ponderada", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "INCOMPATIVEL", confirmedByCurator: false, rationale: "Atua em joelho." },
      FILTROS_OK,
    );
    expect(result.state).toBe("ELIMINADO");
    expect(result.reason).toContain("incompatível");
  });

  it("parcial sem confirmação não participa; com confirmação, participa", () => {
    const base = { compatibility: "PARCIALMENTE_COMPATIVEL" as const, rationale: "Região, não a lesão." };
    expect(classifyProfessional("p1", { ...base, confirmedByCurator: false }, FILTROS_OK).state).toBe("ELIMINADO");
    expect(classifyProfessional("p1", { ...base, confirmedByCurator: true }, FILTROS_OK).state).toBe("ELEGIVEL");
  });

  it("informação insuficiente fica pendente — nunca eliminado", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "INFORMACAO_INSUFICIENTE", confirmedByCurator: false, rationale: "Falta o detalhe da área." },
      FILTROS_OK,
    );
    expect(result.state).toBe("PENDENTE_DE_INFORMACAO");
  });

  it("filtro obrigatório não atendido, COM VERIFICAÇÃO, elimina — com o filtro nomeado", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null },
      [
        {
          label: "Atendimento em SP",
          requirement: "SP",
          professionalValue: "RJ",
          passes: false,
          origin: "VERIFICADO",
          factDate: "2026-08-10T00:00:00.000Z",
        },
      ],
    );
    expect(result.state).toBe("ELIMINADO");
    expect(result.reason).toContain("Atendimento em SP");
  });

  it("filtro sem informação deixa pendente — verificar, não descartar", () => {
    const result = classifyProfessional(
      "p1",
      { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null },
      [
        {
          label: "Cuidado contínuo",
          requirement: "obrigatório",
          professionalValue: "informação não localizada",
          passes: null,
          origin: "AUSENTE",
          factDate: null,
        },
      ],
    );
    expect(result.state).toBe("PENDENTE_DE_INFORMACAO");
    expect(result.reason).toContain("Verificar o cadastro, não descartar");
  });
});

// ---------------------------------------------------------------------------
// ADR-088 — a decisão do Fundador sobre o filtro obrigatório (25/08/2026)
// ---------------------------------------------------------------------------
//
// A pergunta que a Curadoria simulada levantou: um filtro que ELIMINA alguém
// pode ser satisfeito pela palavra do próprio profissional? A resposta do
// Fundador: o fato autodeclarado entra na Mesa, mas não elimina — vira
// ressalva nomeada, e o juízo é do Curador.
//
// Estes casos existem porque a versão anterior eliminava em silêncio: a
// paciente jamais ficava sabendo do caminho que não lhe foi apresentado.
describe("Filtro obrigatório — só fato verificado elimina", () => {
  const compativel = { compatibility: "COMPATIVEL" as const, confirmedByCurator: false, rationale: null };

  it("autodeclaração que contraria a exigência NÃO elimina — vira ressalva", () => {
    const result = classifyProfessional("p1", compativel, [
      {
        label: "Cuidado contínuo",
        requirement: "obrigatório",
        professionalValue: "não oferece",
        passes: false,
        origin: "AUTODECLARADO",
        factDate: "2026-08-20T00:00:00.000Z",
      },
    ]);

    expect(result.state).toBe("ELEGIVEL");
    expect(result.reason).toContain("ressalva");
    expect(result.reason).toContain("Cuidado contínuo");
    // O Curador precisa saber que o ato é dele, e que há duas saídas legítimas.
    expect(result.reason).toContain("Confirme com ele antes de compor");
  });

  it("o mesmo fato, verificado com fonte, elimina", () => {
    const result = classifyProfessional("p1", compativel, [
      {
        label: "Cuidado contínuo",
        requirement: "obrigatório",
        professionalValue: "não oferece",
        passes: false,
        origin: "VERIFICADO",
        factDate: "2026-08-20T00:00:00.000Z",
      },
    ]);

    expect(result.state).toBe("ELIMINADO");
    expect(result.reason).toContain("com verificação");
  });

  it("ressalva não engole a pendência: falta de informação continua sendo a vez do cadastro", () => {
    const result = classifyProfessional("p1", compativel, [
      {
        label: "Atendimento em SP",
        requirement: "SP",
        professionalValue: "informação não localizada",
        passes: null,
        origin: "AUSENTE",
        factDate: null,
      },
      {
        label: "Cuidado contínuo",
        requirement: "obrigatório",
        professionalValue: "não oferece",
        passes: false,
        origin: "AUTODECLARADO",
        factDate: "2026-08-20T00:00:00.000Z",
      },
    ]);

    expect(result.state).toBe("PENDENTE_DE_INFORMACAO");
    // As duas coisas são ditas: o que falta, e o que foi declarado contra.
    expect(result.reason).toContain("Verificar o cadastro, não descartar");
    expect(result.reason).toContain("ressalva autodeclarada");
  });

  it("um verificado que elimina tem precedência sobre qualquer ressalva", () => {
    const result = classifyProfessional("p1", compativel, [
      {
        label: "Atendimento em SP",
        requirement: "SP",
        professionalValue: "RJ",
        passes: false,
        origin: "VERIFICADO",
        factDate: "2026-08-20T00:00:00.000Z",
      },
      {
        label: "Cuidado contínuo",
        requirement: "obrigatório",
        professionalValue: "não oferece",
        passes: false,
        origin: "AUTODECLARADO",
        factDate: "2026-08-20T00:00:00.000Z",
      },
    ]);

    expect(result.state).toBe("ELIMINADO");
    expect(result.reason).toContain("Atendimento em SP");
    expect(result.reason).not.toContain("Cuidado contínuo");
  });
});

describe("Cabeçalho — os números e a vez", () => {
  const eligibilities = [
    classifyProfessional("a", { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null }, FILTROS_OK),
    classifyProfessional("b", { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null }, FILTROS_OK),
    classifyProfessional("c", null, FILTROS_OK),
    classifyProfessional("d", { compatibility: "INCOMPATIVEL", confirmedByCurator: false, rationale: "Joelho." }, FILTROS_OK),
  ];

  it("conta cada estado sem misturar eliminado com pendente", () => {
    const counts = headerCounts(eligibilities, 0);
    expect(counts).toEqual({ found: 4, awaiting: 1, eligible: 2, eliminated: 1, pending: 0, selected: 0 });
  });

  it("a frase da vez segue a ordem do trabalho", () => {
    const counts = headerCounts(eligibilities, 0);
    expect(nextStepSentence(counts, false, false)).toContain("reconheceu este Perfil como seu");
    expect(nextStepSentence(counts, false, true)).toContain("classificar os subcritérios");
    expect(nextStepSentence(counts, true, true)).toContain("declarar a compatibilidade");
    const semPendencias = headerCounts(eligibilities.filter((e) => e.state !== "AGUARDANDO_DECLARACAO"), 0);
    expect(nextStepSentence(semPendencias, true, true)).toContain("selecionar três");
    expect(nextStepSentence({ ...semPendencias, selected: 3 }, true, true)).toContain("Relatório");
  });
});

describe("Comparação — explica, não elege", () => {
  const ATIVOS = SUBCRITERION_CATALOG.filter((s) => s.active);
  const CODIGOS = ATIVOS.map((s) => s.code);
  const [A, B, C] = CODIGOS;

  const PRIORIDADES = [
    { subcriterionCode: A!, importance: "MUITO_IMPORTANTE" as const },
    { subcriterionCode: B!, importance: "RELEVANTE" as const },
    { subcriterionCode: C!, importance: "NAO_INFLUENCIA" as const },
  ];

  function leitura(estados: { subcriterionCode: string; status: "CONFIRMADO" | "NAO_CONFIRMADO" | "NAO_INFORMADO" }[]) {
    return crossPriorityAndProfessional({
      casePriorities: PRIORIDADES,
      professionalStates: estados,
      activeSubcriterionCodes: CODIGOS,
    });
  }

  const COMPLETO = leitura([
    { subcriterionCode: A!, status: "CONFIRMADO" },
    { subcriterionCode: B!, status: "CONFIRMADO" },
    { subcriterionCode: C!, status: "CONFIRMADO" },
  ]);

  const COM_LACUNAS = leitura([
    { subcriterionCode: A!, status: "CONFIRMADO" },
    { subcriterionCode: B!, status: "NAO_INFORMADO" },
  ]);

  it("cada célula traz o estado do Motor e a origem factual", () => {
    const [column] = buildComparison(["a"], new Map([["a", COMPLETO]]));
    const alta = column!.cells.find((cell) => cell.subcriterionCode === A)!;
    expect(alta.result).toBe("ALTA_COMPATIBILIDADE");
    expect(alta.status).toBe("CONFIRMADO");
  });

  it("a Mesa não recalcula a matriz — a célula repete o que o Motor disse", () => {
    const [column] = buildComparison(["a"], new Map([["a", COMPLETO]]));
    for (const cell of column!.cells) {
      const doMotor = COMPLETO.rows.find((r) => r.subcriterionCode === cell.subcriterionCode)!;
      expect(cell.result).toBe(doMotor.result);
      expect(cell.status).toBe(doMotor.status);
    }
  });

  it("ausência de registro continua distinta de NAO_INFORMADO", () => {
    const [column] = buildComparison(["b"], new Map([["b", COM_LACUNAS]]));
    const naoInformado = column!.cells.find((cell) => cell.subcriterionCode === B)!;
    const semRegistro = column!.cells.find((cell) => cell.subcriterionCode === C)!;

    expect(naoInformado.status).toBe("NAO_INFORMADO");
    expect(semRegistro.status).toBeNull();
    expect(naoInformado.stateSentence).toBe("Analisado, mas sem informação suficiente");
    expect(semRegistro.stateSentence).toBe("Ainda não investigado");
    expect(naoInformado.stateSentence).not.toBe(semRegistro.stateSentence);
  });

  it("o que não influencia aparece como tal, e nunca como lacuna", () => {
    const [column] = buildComparison(["a"], new Map([["a", COMPLETO]]));
    const irrelevante = column!.cells.find((cell) => cell.subcriterionCode === C)!;
    expect(irrelevante.result).toBe("NAO_RELEVANTE");
  });

  it("o resumo conta itens por estado — nunca um total que pareça nota", () => {
    const frase = summarySentence(COMPLETO.summary);
    expect(frase).toContain("alta");
    expect(frase).toContain("lacuna");
    expect(frase).not.toMatch(/%|de 100|pontos|score/i);
  });

  it("apresenta sem posições, medalhas ou vocabulário de pódio", () => {
    const columns = buildComparison(
      ["a", "b"],
      new Map([
        ["a", COMPLETO],
        ["b", COM_LACUNAS],
      ]),
    );

    expect(columns).toHaveLength(2);
    const texto = JSON.stringify(columns).toLowerCase();
    for (const proibido of ["melhor", "vencedor", "recomendado", "ranking", "colocado", "posição"]) {
      expect(texto, `vocabulário de pódio: ${proibido}`).not.toContain(proibido);
    }
    expect(Object.keys(columns[0]!)).not.toContain("position");
    expect(columns[0]!.summary).not.toHaveProperty("total");
  });

  it("o Motor não ordena profissionais — a ordem de entrada é preservada", () => {
    const columns = buildComparison(
      ["b", "a"],
      new Map([
        ["a", COMPLETO],
        ["b", COM_LACUNAS],
      ]),
    );
    expect(columns.map((c) => c.professionalProfileId)).toEqual(["b", "a"]);
  });

  it("profissional sem leitura não vira coluna vazia com nota zero", () => {
    expect(buildComparison(["c"], new Map())).toHaveLength(0);
  });

  it("stateSentence cobre as quatro origens factuais", () => {
    expect(stateSentence("CONFIRMADO")).toBe("Confirmado");
    expect(stateSentence("NAO_CONFIRMADO")).toBe("Não confirmado");
    expect(stateSentence("NAO_INFORMADO")).toBe("Analisado, mas sem informação suficiente");
    expect(stateSentence(null)).toBe("Ainda não investigado");
  });
});
