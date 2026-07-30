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
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        elegibilidade: { ...joaquim.curadoriaTecnica.elegibilidade, eligible: 1 },
        leituras: [joaquim.curadoriaTecnica.leituras[0]!],
      },
    };
    const state = conduct(semElegiveis);
    expect(state.nextStep.label).toContain("Menos de três");
  });
});

describe("Motor de Condução — inconsistências", () => {
  // M3 (ADR-042): I-01 a I-05 policiavam o modelo de pesos e morreram com
  // ele. As inconsistências vigentes falam de seleção e elegibilidade.
  it("nenhuma inconsistência de pesos existe mais", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      for (const entry of detectInconsistencies(record)) {
        expect(["I-09", "I-10", "I-11", "I-12"]).toContain(entry.code);
      }
    }
  });

  it("detecta opção selecionada fora dos elegíveis da Mesa (I-11)", () => {
    const foraDaMesa: CuradoriaRecord = {
      ...rosa,
      curadoriaTecnica: {
        ...rosa.curadoriaTecnica,
        selectedProfessionalIds: ["prof-114", "prof-087", "prof-999"],
      },
    };
    const found = detectInconsistencies(foraDaMesa);
    expect(found.some((entry) => entry.code === "I-11")).toBe(true);
    expect(found.find((entry) => entry.code === "I-11")?.description).toContain("elegíveis da Mesa");
  });

  it("não acusa I-11 numa Curadoria já entregue — a Rede mudar depois é história", () => {
    const entregue: CuradoriaRecord = {
      ...rosa,
      relatorio: { ...rosa.relatorio, deliveredAt: "2026-07-22T10:00:00-03:00" },
      curadoriaTecnica: {
        ...rosa.curadoriaTecnica,
        selectedProfessionalIds: ["prof-114", "prof-087", "prof-999"],
      },
    };
    expect(detectInconsistencies(entregue).some((entry) => entry.code === "I-11")).toBe(false);
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
    expect(detectInconsistencies(marina)).toEqual([]);
    expect(detectInconsistencies(joaquim)).toEqual([]);
    expect(detectInconsistencies(rosa)).toEqual([]);
  });
});

describe("Motor de Condução — alertas", () => {
  it("não emite alerta antes do reconhecimento e do Mapa completo", () => {
    expect(detectAlerts(marina)).toEqual([]);
  });

  it("não emite alerta enquanto houver área por declarar — é tarefa, não achado", () => {
    const areaPendente: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        elegibilidade: { ...joaquim.curadoriaTecnica.elegibilidade, awaitingArea: 2 },
      },
    };
    expect(detectAlerts(areaPendente)).toEqual([]);
  });

  it("detecta menos de três elegíveis como bloqueio (E-02), contando o universo da Mesa", () => {
    const poucos: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        elegibilidade: { ...joaquim.curadoriaTecnica.elegibilidade, eligible: 2 },
        leituras: joaquim.curadoriaTecnica.leituras.slice(0, 2),
      },
    };
    const alert = detectAlerts(poucos).find((entry) => entry.code === "E-02");
    expect(alert?.severity).toBe("bloqueio");
    expect(alert?.detail).toContain("2 profissionais elegíveis");
    expect(alert?.detail).toContain("nunca um ajuste do sistema");
  });

  it("detecta universo sem nenhum elegível (E-01), com o desdobramento da Mesa", () => {
    const vazio: CuradoriaRecord = {
      ...joaquim,
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        elegibilidade: { found: 6, awaitingArea: 0, eligible: 0, eliminated: 4, pendingInfo: 2 },
        leituras: [],
      },
    };
    const alert = detectAlerts(vazio).find((entry) => entry.code === "E-01");
    expect(alert?.severity).toBe("bloqueio");
    expect(alert?.detail).toContain("4 eliminados");
    expect(alert?.detail).toContain("2 pendentes");
  });

  it("três ou mais elegíveis não geram E-01 nem E-02", () => {
    const alerts = detectAlerts(joaquim);
    expect(alerts.some((entry) => entry.code === "E-01" || entry.code === "E-02")).toBe(false);
  });

  it("C-01 e C-05 não existem mais — nenhum alerta raciocina por pontos ou bandas", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      for (const alert of detectAlerts(record)) {
        expect(alert.code).not.toBe("C-01");
        expect(alert.code).not.toBe("C-05");
        expect(`${alert.title} ${alert.detail}`.toLowerCase()).not.toMatch(/ponto|banda|moderada|score/);
      }
    }
  });

  it("C-06 lê o Mapa do Profissional e distingue não avaliado de analisado sem informação", () => {
    // joaquim: 3 gaps sem registro (2 do Ismael + 1 do Rafael) e 3 analisados
    // sem informação suficiente (1 Ismael + 1 Solange + 1 Rafael).
    const alert = detectAlerts(joaquim).find((entry) => entry.code === "C-06");
    expect(alert).toBeDefined();
    expect(alert?.detail).toContain("3 subcritérios ainda não avaliados no Mapa do Profissional");
    expect(alert?.detail).toContain("3 analisados sem informação suficiente");
    expect(alert?.severity).toBe("atencao");
  });

  it("sem lacunas, C-06 não aparece", () => {
    expect(detectAlerts(rosa).some((entry) => entry.code === "C-06")).toBe(false);
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
