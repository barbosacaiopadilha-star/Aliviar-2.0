import { describe, expect, it } from "vitest";

import {
  PARECER_PROMPTS,
  emptyParecer,
  validateMesaClosure,
  type MesaClosureInput,
  type ParecerDraft,
} from "@/modules/curadoria/mesa";

const NAMES: Record<string, string> = {
  "prof-114": "Dra. Beatriz Fontenelle",
  "prof-087": "Dr. Ismael Cardoso",
  "prof-203": "Dra. Solange Vieira",
};

function fullParecer(professionalId: string): ParecerDraft {
  return {
    professionalId,
    whyIncluded: "Responde ao que o paciente colocou como mais importante: começar logo.",
    prioritiesServed: "Disponibilidade (35) e forma do primeiro encontro (30).",
    limitations: "Menos tempo de trajetória que as outras duas opções.",
    questions: "Como funciona o acompanhamento entre consultas?",
    observations: "",
  };
}

function validInput(overrides: Partial<MesaClosureInput> = {}): MesaClosureInput {
  return {
    selectedIds: ["prof-114", "prof-087", "prof-203"],
    pareceres: ["prof-114", "prof-087", "prof-203"].map(fullParecer),
    compositionRationale:
      "As três respondem à prioridade dominante por caminhos diferentes — o paciente escolhe qual troca faz sentido.",
    curatorName: "Helena Vasconcelos",
    namesById: NAMES,
    ...overrides,
  };
}

describe("estrutura do parecer", () => {
  it("sugere estrutura, nunca conteúdo — nenhum campo nasce preenchido", () => {
    const parecer = emptyParecer("prof-114");
    expect(parecer.whyIncluded).toBe("");
    expect(parecer.prioritiesServed).toBe("");
    expect(parecer.limitations).toBe("");
    expect(parecer.questions).toBe("");
    expect(parecer.observations).toBe("");
  });

  it("exige o porquê, as prioridades e as limitações; perguntas e observações são opcionais", () => {
    const required = PARECER_PROMPTS.filter((prompt) => prompt.required).map((prompt) => prompt.field);
    const optional = PARECER_PROMPTS.filter((prompt) => !prompt.required).map((prompt) => prompt.field);
    expect(required).toEqual(["whyIncluded", "prioritiesServed", "limitations"]);
    expect(optional).toEqual(["questions", "observations"]);
  });

  it("limitações são obrigatórias — opção só com virtudes é recomendação disfarçada", () => {
    const limitations = PARECER_PROMPTS.find((prompt) => prompt.field === "limitations");
    expect(limitations?.required).toBe(true);
    expect(limitations?.guidance).toContain("recomendação disfarçada");
  });
});

describe("encerramento da Curadoria Técnica (Barreira 4)", () => {
  it("com três opções, pareceres completos e composição, nada falta", () => {
    expect(validateMesaClosure(validInput())).toEqual([]);
  });

  it("exige exatamente três — nunca duas, nunca quatro", () => {
    const duas = validateMesaClosure(
      validInput({ selectedIds: ["prof-114", "prof-087"] }),
    );
    expect(duas.join(" ")).toContain("exatamente três");

    const quatro = validateMesaClosure(
      validInput({ selectedIds: ["prof-114", "prof-087", "prof-203", "prof-999"] }),
    );
    expect(quatro.join(" ")).toContain("exatamente três");
  });

  it("recusa o mesmo profissional duas vezes", () => {
    const missing = validateMesaClosure(
      validInput({ selectedIds: ["prof-114", "prof-114", "prof-203"] }),
    );
    expect(missing.length).toBeGreaterThan(0);
  });

  it("nenhuma opção existe sem parecer — e a falta é nomeada pelo profissional", () => {
    const missing = validateMesaClosure(
      validInput({ pareceres: ["prof-114", "prof-087"].map(fullParecer) }),
    );
    expect(missing.join(" ")).toContain("Dra. Solange Vieira");
  });

  it("parecer sem limitações não fecha — em linguagem de pessoa, nunca 'campo obrigatório'", () => {
    const pareceres = validInput().pareceres.map((parecer) =>
      parecer.professionalId === "prof-087" ? { ...parecer, limitations: "  " } : parecer,
    );
    const missing = validateMesaClosure(validInput({ pareceres }));
    expect(missing).toHaveLength(1);
    expect(missing[0]).toContain("Dr. Ismael Cardoso");
    // O rótulo do campo passou a ser o mesmo do Relatório ("o que esta opção
    // custa", antes "quais limitações possui") — a Mesa e o documento final
    // deixaram de nomear diferente a mesma coisa. O que este teste prova não
    // mudou: a falta é dita nomeando o campo, em linguagem de pessoa.
    expect(missing[0]).toContain("o que esta opção custa");
    expect(missing[0]?.toLowerCase()).not.toContain("campo obrigatório");
  });

  it("exige a justificativa da composição", () => {
    const missing = validateMesaClosure(validInput({ compositionRationale: "" }));
    expect(missing.join(" ")).toContain("juntas");
  });

  it("exige autoria humana (I-12)", () => {
    const missing = validateMesaClosure(validInput({ curatorName: "" }));
    expect(missing.join(" ")).toContain("autor humano");
  });
});
