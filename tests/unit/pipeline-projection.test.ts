import { describe, expect, it } from "vitest";

import {
  LEAD_EDITABLE_STAGES,
  projectPipelineStage,
  type CaseProjectionFacts,
} from "@/modules/crm/pipeline-projection";
import { PIPELINE_STAGES } from "@/modules/crm/pipeline";

// GOLDEN TESTS da projeção do pipeline — Convergência B2.
//
// Cada caso pina: entrada canônica → etapa derivada → justificativa.
// A projeção é a ÚNICA fonte da etapa pós-Atendimento; se alguém mudar uma
// regra, este arquivo obriga a mudança a ser consciente.

function facts(overrides: Partial<CaseProjectionFacts> = {}): CaseProjectionFacts {
  return {
    status: "IN_CURATION",
    responsibleRole: "curador_medico",
    startedAt: null,
    closedAt: null,
    delivered: false,
    ...overrides,
  };
}

describe("fronteira lead × case", () => {
  it("toda etapa editável de lead existe no enum do pipeline", () => {
    for (const stage of LEAD_EDITABLE_STAGES) {
      expect(PIPELINE_STAGES).toContain(stage);
    }
  });

  it("nenhuma etapa de Case é editável como lead", () => {
    for (const derived of ["sent_to_curator", "curation_in_progress", "report_ready", "report_delivered", "doctor_selected", "scheduling_support", "completed"]) {
      expect(LEAD_EDITABLE_STAGES).not.toContain(derived);
    }
  });

  it("sem Case, a etapa é do lead — a projeção não opina", () => {
    const p = projectPipelineStage(null);
    expect(p.kind).toBe("lead");
  });
});

describe("derivação por fatos canônicos (golden)", () => {
  const golden: Array<[string, CaseProjectionFacts, string]> = [
    ["Curador responsável, Consulta não iniciada", facts(), "sent_to_curator"],
    ["Curador responsável, Consulta iniciada", facts({ startedAt: "2026-07-25T10:00:00Z" }), "curation_in_progress"],
    ["Entrega registrada", facts({ startedAt: "2026-07-25T10:00:00Z", delivered: true }), "report_delivered"],
    ["Com o Concierge, antes do registro de entrega", facts({ responsibleRole: "concierge" }), "doctor_selected"],
    ["Com o Concierge, após a entrega", facts({ responsibleRole: "concierge", delivered: true }), "scheduling_support"],
    ["Encerrado", facts({ closedAt: "2026-07-26T10:00:00Z", status: "CLOSED" }), "completed"],
    ["Pré-Correção (sem responsável) com Consulta iniciada", facts({ responsibleRole: null, startedAt: "2026-07-24T09:00:00Z" }), "curation_in_progress"],
  ];

  it.each(golden)("%s", (_nome, entrada, esperada) => {
    const p = projectPipelineStage(entrada);
    expect(p.kind).toBe("case");
    if (p.kind === "case") {
      expect(p.stage).toBe(esperada);
      // Justificativa é parte do contrato — auditoria lê o porquê, não só o quê.
      expect(p.reason.length).toBeGreaterThan(10);
    }
  });

  it("transferência de responsabilidade muda a etapa derivada sem regressão", () => {
    // O MESMO Case atravessando a jornada: a etapa só anda para frente.
    const ordem = ["sent_to_curator", "curation_in_progress", "report_delivered", "scheduling_support", "completed"];
    const passos: CaseProjectionFacts[] = [
      facts(),
      facts({ startedAt: "t" }),
      facts({ startedAt: "t", delivered: true }),
      facts({ startedAt: "t", delivered: true, responsibleRole: "concierge" }),
      facts({ startedAt: "t", delivered: true, responsibleRole: "concierge", closedAt: "t2", status: "CLOSED" }),
    ];
    const derivadas = passos.map((f) => {
      const p = projectPipelineStage(f);
      return p.kind === "case" ? p.stage : "?";
    });
    expect(derivadas).toEqual(ordem);
  });
});

describe("estados incompletos e desconhecidos — nunca convertidos em silêncio", () => {
  it("Case com o Atendente segue na fase de lead", () => {
    const p = projectPipelineStage(facts({ responsibleRole: "atendente" }));
    expect(p.kind).toBe("lead");
  });

  it("cancelamento não vira 'completed' — é indeterminação declarada", () => {
    const p = projectPipelineStage(facts({ status: "CANCELLED" }));
    expect(p.kind).toBe("indeterminada");
  });

  it("combinação sem regra declara indeterminação com os fatos no motivo", () => {
    const p = projectPipelineStage(facts({ responsibleRole: null, startedAt: null }));
    expect(p.kind).toBe("indeterminada");
    if (p.kind === "indeterminada") {
      expect(p.reason).toContain("sem regra");
    }
  });
});
