import { describe, expect, it } from "vitest";

import { buildSuggestions, hasBothSides } from "@/modules/briefing/suggestions";
import { buildMockBriefing } from "@/modules/briefing/mock-briefing";
import type {
  CuratorObservation,
  PatientAlignmentAnswer,
  ProfessionalAlignmentAnswer,
} from "@/modules/briefing/types";

function pa(questionId: PatientAlignmentAnswer["questionId"], option: string, verbatim?: string): PatientAlignmentAnswer {
  return {
    questionId,
    option,
    verbatim: verbatim ?? null,
    answeredAt: "2026-07-20T10:00:00.000Z",
    dataClass: "PREFERENCIA",
    origin: "PACIENTE",
  };
}

function me(
  questionId: ProfessionalAlignmentAnswer["questionId"],
  option: string | null,
  declaredText?: string,
): ProfessionalAlignmentAnswer {
  return {
    questionId,
    option,
    declaredText: declaredText ?? null,
    declaredAt: "2026-06-01T12:00:00.000Z",
    dataClass: "FATO",
    origin: "MEDICO",
  };
}

function obs(kind: CuratorObservation["kind"], note: string): CuratorObservation {
  return {
    id: `o-${kind}`,
    caseId: "case-1",
    kind,
    note,
    authorId: "cur-1",
    authorName: "Curador",
    observedAt: "2026-07-20T11:00:00.000Z",
    dataClass: "INTERPRETACAO",
    origin: "CURADOR",
  };
}

function build(patient: PatientAlignmentAnswer[], professional: ProfessionalAlignmentAnswer[], observations: CuratorObservation[] = []) {
  return buildSuggestions({
    patientAnswers: patient,
    professionalAnswers: professional,
    professionalName: "Dra. Teste",
    observations,
  });
}

describe("o Briefing nunca mede — proibições absolutas", () => {
  const todas = buildMockBriefing().suggestions;
  const textoInteiro = JSON.stringify(todas).toLowerCase();

  // ACE_PRINCIPLES P2: compatibilidade não é medida. O vocabulário proibido
  // não entra nem para ser negado (P9 da Guided Experience).
  it("nenhuma sugestão contém score, nota, percentual, ranking, estrela ou selo", () => {
    for (const proibido of ["score", "nota ", "%", "ranking", "estrela", "medalha", "selo", "pontuaç", "melhor opção", "recomendamos"]) {
      expect(textoInteiro, `vocabulário proibido: ${proibido}`).not.toContain(proibido);
    }
  });

  it("nenhuma sugestão contém número que possa ser lido como medida", () => {
    for (const s of todas) {
      expect(s.suggestion).not.toMatch(/\b\d{1,3}\s*%/);
      expect(s.suggestion).not.toMatch(/\b\d+\s*(de|\/)\s*\d+\b/);
    }
  });

  it("nenhuma sugestão recomenda escolher um profissional", () => {
    for (const s of todas) {
      expect(s.suggestion.toLowerCase()).not.toMatch(/escolha (este|esta|o|a) /);
      expect(s.suggestion.toLowerCase()).not.toContain("indicamos");
    }
  });
});

describe("toda sugestão é explicável (P6)", () => {
  it("carrega justificativa legível — nunca 'o algoritmo calculou'", () => {
    for (const s of buildMockBriefing().suggestions) {
      expect(s.because.length).toBeGreaterThan(20);
      expect(s.because.toLowerCase()).not.toContain("algoritmo");
      expect(s.because.toLowerCase()).not.toContain("modelo");
      expect(s.because.toLowerCase()).not.toContain("calculou");
    }
  });

  it("carrega ao menos uma evidência com origem e classe", () => {
    for (const s of buildMockBriefing().suggestions) {
      expect(s.evidence.length).toBeGreaterThan(0);
      for (const e of s.evidence) {
        expect(e.origin).toBeTruthy();
        expect(e.dataClass).toBeTruthy();
        expect(e.statement.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("as duas pontas — uma ponta só não é encontro", () => {
  it("alinhamento exige paciente E médico", () => {
    const so_paciente = build([pa("PA1", "LER_SOZINHO")], []);
    const alinhamentos = so_paciente.filter((s) => s.kind === "ALINHAMENTO");
    expect(alinhamentos).toHaveLength(0);
  });

  it("com as duas pontas, o alinhamento aparece", () => {
    const s = build([pa("PA1", "LER_SOZINHO")], [me("ME1", "TAMBEM_POR_ESCRITO")]);
    const alinhamento = s.find((x) => x.kind === "ALINHAMENTO");
    expect(alinhamento).toBeDefined();
    const origens = new Set(alinhamento!.evidence.map((e) => e.origin));
    expect(origens).toEqual(new Set(["PACIENTE", "MEDICO"]));
  });

  it("hasBothSides barra sugestão órfã antes da tela", () => {
    expect(
      hasBothSides({
        id: "x",
        kind: "ALINHAMENTO",
        suggestion: "…",
        because: "…",
        evidence: [{ origin: "PACIENTE", dataClass: "PREFERENCIA", statement: "…", at: null }],
      }),
    ).toBe(false);
  });
});

describe("fato, preferência e interpretação nunca se misturam (P4)", () => {
  it("cada evidência mantém a classe da sua origem", () => {
    const s = build(
      [pa("PA1", "LER_SOZINHO")],
      [me("ME1", "TAMBEM_POR_ESCRITO")],
      [obs("CU3", "Falar sobre a distância antes de decidir.")],
    );
    for (const sug of s) {
      for (const e of sug.evidence) {
        if (e.origin === "PACIENTE") expect(e.dataClass).toBe("PREFERENCIA");
        if (e.origin === "MEDICO") expect(e.dataClass).toBe("FATO");
        if (e.origin === "CURADOR") expect(e.dataClass).toBe("INTERPRETACAO");
      }
    }
  });

  it("a fala do paciente tem precedência sobre o rótulo da opção", () => {
    const fala = "Eu preciso ler com calma antes de responder.";
    const s = build([pa("PA1", "LER_SOZINHO", fala)], [me("ME1", "TAMBEM_POR_ESCRITO")]);
    const evidenciaPaciente = s[0].evidence.find((e) => e.origin === "PACIENTE");
    expect(evidenciaPaciente?.statement).toBe(fala);
  });
});

describe("ausência é ausência, nunca negativa (P9)", () => {
  it("sem respostas do paciente, gera lacuna — não julgamento", () => {
    const s = build([], [me("ME1", "TAMBEM_POR_ESCRITO")]);
    const lacuna = s.find((x) => x.kind === "LACUNA");
    expect(lacuna).toBeDefined();
    expect(lacuna!.because.toLowerCase()).toContain("ausência");
  });

  it("profissional sem declarações vira lacuna que nega ser sinal de qualidade", () => {
    const s = build([pa("PA1", "LER_SOZINHO")], []);
    const lacuna = s.find((x) => x.id.startsWith("L2"));
    expect(lacuna?.because.toLowerCase()).toContain("jamais sinal de qualidade menor");
  });
});

describe("a leitura do Curador tem precedência (P8, risco R2)", () => {
  it("discordância registrada (CU4) vira ponto de atenção com precedência declarada", () => {
    const s = build(
      [pa("PA1", "LER_SOZINHO")],
      [me("ME1", "TAMBEM_POR_ESCRITO")],
      [obs("CU4", "Discordo: ela disse que consegue às sextas.")],
    );
    const discordancia = s.find((x) => x.id.startsWith("OBS-o-CU4"));
    expect(discordancia?.kind).toBe("ATENCAO");
    expect(discordancia?.because).toContain("precedência sobre a do sistema");
  });
});

describe("determinismo — mesma entrada, mesma saída", () => {
  it("duas execuções produzem exatamente o mesmo resultado", () => {
    const entrada = () => build([pa("PA2", "DECIDIR_JUNTO")], [me("ME1", "CONVERSO_E_RESPONDO")]);
    expect(JSON.stringify(entrada())).toBe(JSON.stringify(entrada()));
  });

  it("o Briefing nunca reordena nem seleciona profissional", () => {
    // Duas opções: cada uma gera suas sugestões, nenhuma é comparada à outra.
    const a = build([pa("PA1", "LER_SOZINHO")], [me("ME1", "TAMBEM_POR_ESCRITO")]);
    const b = build([pa("PA1", "LER_SOZINHO")], [me("ME1", "CONVERSO_E_RESPONDO")]);
    const juntas = JSON.stringify([...a, ...b]).toLowerCase();
    expect(juntas).not.toContain("mais indicado");
    expect(juntas).not.toContain("melhor que");
    expect(juntas).not.toContain("primeiro lugar");
  });
});

describe("respostas 'prefiro não dizer' não geram sugestão", () => {
  it("são ignoradas pelo motor", () => {
    const s = build([pa("PA1", "PREFIRO_NAO_DIZER"), pa("PA2", "PREFIRO_NAO_DIZER")], [me("ME1", "TAMBEM_POR_ESCRITO")]);
    expect(s.filter((x) => x.kind === "ALINHAMENTO")).toHaveLength(0);
    expect(s.some((x) => x.kind === "LACUNA")).toBe(true);
  });
});
