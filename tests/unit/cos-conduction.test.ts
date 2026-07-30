import { describe, expect, it } from "vitest";

import { conduct, detectAlerts, detectInconsistencies } from "@/modules/curadoria/cos/conduction";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import { COS_PHASE_DEFINITIONS, COS_PHASE_ORDER } from "@/modules/curadoria/cos/phases";
import { COS_PHASES, type CuradoriaRecord } from "@/modules/curadoria/cos/types";
import { CURADORIA_STEPS } from "@/modules/curadoria/types";

const marina = MOCK_RECORDS["caso-2041"]!;
const joaquim = MOCK_RECORDS["caso-2038"]!;
const rosa = MOCK_RECORDS["caso-2024"]!;

describe("definição das fases", () => {
  it("cobre as nove fases, em ordem, sem buraco", () => {
    expect(COS_PHASE_ORDER).toHaveLength(9);
    expect(COS_PHASE_ORDER).toEqual([...COS_PHASES]);
    COS_PHASE_ORDER.forEach((phase, index) => {
      expect(COS_PHASE_DEFINITIONS[phase].order).toBe(index + 1);
    });
  });

  it("toda fase ancora em uma etapa do raciocínio canônico", () => {
    for (const phase of COS_PHASE_ORDER) {
      expect(CURADORIA_STEPS).toContain(COS_PHASE_DEFINITIONS[phase].reasoningStep);
    }
  });

  it("toda fase declara objetivo, critérios de saída e rastreabilidade", () => {
    for (const phase of COS_PHASE_ORDER) {
      const definition = COS_PHASE_DEFINITIONS[phase];
      expect(definition.objective.trim().length).toBeGreaterThan(0);
      expect(definition.exitCriteria.length).toBeGreaterThan(0);
      expect(definition.traceability.length).toBeGreaterThan(0);
      for (const citation of definition.traceability) {
        expect(citation.rule.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Motor de Condução — onde estou", () => {
  it("aponta a primeira fase não concluída, nunca a mais avançada com dado", () => {
    expect(conduct(marina).currentPhase).toBe("PRIORIDADES");
    expect(conduct(joaquim).currentPhase).toBe("CURADORIA_TECNICA");
    expect(conduct(rosa).currentPhase).toBe("DEVOLUTIVA");
  });

  it("informa a etapa do raciocínio correspondente", () => {
    expect(conduct(marina).currentReasoningStep).toBe("PRIORIZAR");
    expect(conduct(joaquim).currentReasoningStep).toBe("COMPARAR");
  });
});

describe("Motor de Condução — o que já foi concluído", () => {
  it("marca como concluídas as fases cujos critérios de saída foram atendidos", () => {
    const state = conduct(joaquim);
    expect(state.completedPhases).toEqual([
      "ACOLHIMENTO",
      "HISTORIA",
      "CASO",
      "FILTROS",
      "PRIORIDADES",
      "VALIDACAO",
    ]);
  });

  it("nunca marca uma fase como concluída sem seus critérios", () => {
    const state = conduct(marina);
    expect(state.completedPhases).not.toContain("PRIORIDADES");
    expect(state.completedPhases).not.toContain("VALIDACAO");
  });
});

describe("Motor de Condução — o que falta", () => {
  it("diz exatamente o que falta na fase atual", () => {
    const state = conduct(marina);
    expect(state.missing.join(" ")).toContain("Mapa de Prioridades");
  });

  it("bloqueia fases cujos critérios de entrada não foram atendidos", () => {
    const state = conduct(marina);
    const tecnica = state.phases.find((phase) => phase.phase === "CURADORIA_TECNICA");
    expect(tecnica?.status).toBe("BLOQUEADA");
    expect(tecnica?.reason).toContain("Perfil de Prioridades");
  });
});

describe("Motor de Condução — próximo passo", () => {
  it("oferece exatamente um próximo passo", () => {
    const state = conduct(marina);
    expect(state.nextStep.label.trim().length).toBeGreaterThan(0);
    expect(state.nextStep.kind).toBe("acao");
  });

  it("quando a bola está com o paciente, não oferece ação de cobrança", () => {
    const state = conduct(rosa);
    expect(state.nextStep.kind).toBe("aguardando");
    expect(state.nextStep.label).toContain("sem cobrar");
  });

  it("um alerta de bloqueio assume o próximo passo", () => {
    const semElegiveis: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: { ...joaquim.curadoriaTecnica, analyses: [joaquim.curadoriaTecnica.analyses[0]!] },
    };
    const state = conduct(semElegiveis);
    expect(state.nextStep.label).toContain("Menos de três");
  });
});

describe("Motor de Condução — inconsistências", () => {
  it("detecta o mesmo aspecto como filtro e como critério (I-03)", () => {
    const found = detectInconsistencies(marina);
    const i03 = found.filter((entry) => entry.code === "I-03");
    expect(i03).toHaveLength(1);
    expect(i03[0]?.description).toContain("Ou elimina, ou pesa");
  });

  it("não acusa I-01 enquanto o Perfil ainda está em construção", () => {
    expect(detectInconsistencies(marina).some((entry) => entry.code === "I-01")).toBe(false);
  });

  it("acusa I-01 quando um Perfil validado não soma 100", () => {
    const quebrado: CuradoriaRecord = {
      ...rosa,
      prioridades: { ...rosa.prioridades, weights: rosa.prioridades.weights.slice(0, 2) },
    };
    expect(detectInconsistencies(quebrado).some((entry) => entry.code === "I-01")).toBe(true);
  });

  it("detecta peso sem evidência (I-02)", () => {
    const semEvidencia: CuradoriaRecord = {
      ...joaquim,
      prioridades: {
        ...joaquim.prioridades,
        weights: joaquim.prioridades.weights.map((weight, index) =>
          index === 0 ? { ...weight, evidence: "  " } : weight,
        ),
      },
    };
    expect(detectInconsistencies(semEvidencia).some((entry) => entry.code === "I-02")).toBe(true);
  });

  it("detecta seleção sem autor humano (I-12)", () => {
    const semAutor: CuradoriaRecord = {
      ...rosa,
      curadoriaTecnica: { ...rosa.curadoriaTecnica, selectedBy: null },
    };
    expect(detectInconsistencies(semAutor).some((entry) => entry.code === "I-12")).toBe(true);
  });

  it("detecta seleção com número diferente de três (I-09)", () => {
    const duas: CuradoriaRecord = {
      ...rosa,
      curadoriaTecnica: {
        ...rosa.curadoriaTecnica,
        selectedProfessionalIds: ["prof-114", "prof-087"],
      },
    };
    expect(detectInconsistencies(duas).some((entry) => entry.code === "I-09")).toBe(true);
  });

  it("os casos limpos não acusam nada", () => {
    expect(detectInconsistencies(joaquim)).toEqual([]);
    expect(detectInconsistencies(rosa)).toEqual([]);
  });
});

describe("Motor de Condução — alertas", () => {
  it("não emite alerta antes da comparação existir", () => {
    expect(detectAlerts(marina)).toEqual([]);
  });

  it("detecta empate sem desempatar (C-01)", () => {
    const alerts = detectAlerts(joaquim);
    const c01 = alerts.find((alert) => alert.code === "C-01");
    expect(c01).toBeDefined();
    expect(c01?.detail).toContain("não desempata");
  });

  it("detecta menos de três elegíveis como bloqueio (E-02)", () => {
    const poucos: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: { ...joaquim.curadoriaTecnica, analyses: joaquim.curadoriaTecnica.analyses.slice(0, 2) },
    };
    const alert = detectAlerts(poucos).find((entry) => entry.code === "E-02");
    expect(alert?.severity).toBe("bloqueio");
    expect(alert?.detail).toContain("nunca um ajuste do sistema");
  });

  it("detecta universo esvaziado pelos filtros (E-01)", () => {
    const vazio: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: { ...joaquim.curadoriaTecnica, analyses: [] },
    };
    const alert = detectAlerts(vazio).find((entry) => entry.code === "E-01");
    expect(alert?.severity).toBe("bloqueio");
  });

  it("detecta cobertura baixa do cadastro (C-06)", () => {
    const semCadastro: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        analyses: joaquim.curadoriaTecnica.analyses.map((entry) => ({ ...entry, coveredWeight: 30 })),
      },
    };
    expect(detectAlerts(semCadastro).some((entry) => entry.code === "C-06")).toBe(true);
  });

  it("nenhum alerta sugere a resolução — o Motor nomeia e para", () => {
    for (const alert of detectAlerts(joaquim)) {
      expect(alert.detail.toLowerCase()).not.toContain("recomendamos");
      expect(alert.detail.toLowerCase()).not.toContain("sugerimos");
    }
  });
});

describe("Motor de Condução — pendências", () => {
  it("toda pendência tem dono nomeado", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      for (const pendency of conduct(record).pendencies) {
        expect(["CURADOR", "PACIENTE", "EQUIPE"]).toContain(pendency.owner);
        expect(pendency.description.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("a espera pela decisão do paciente é pendência dele, não do Curador", () => {
    const pendencies = conduct(rosa).pendencies;
    const devolutiva = pendencies.find((entry) => entry.phase === "DEVOLUTIVA");
    expect(devolutiva?.owner).toBe("PACIENTE");
  });
});

describe("determinismo", () => {
  it("a mesma Memória sempre produz a mesma condução", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      expect(JSON.stringify(conduct(record))).toBe(JSON.stringify(conduct(record)));
    }
  });
});
