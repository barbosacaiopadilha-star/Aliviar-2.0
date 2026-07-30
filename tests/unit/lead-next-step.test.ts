import { describe, expect, it } from "vitest";

import { nextStepForLead, sortLeadQueue } from "@/modules/crm/lead-next-step";

const NOVO = { qualifiedAt: null, patientProfileId: null, caseId: null, createdAt: "2026-07-01" };
const QUALIFICADO = { qualifiedAt: "2026-07-02", patientProfileId: null, caseId: null, createdAt: "2026-07-02" };
const CONVERTIDO = { qualifiedAt: "2026-07-02", patientProfileId: "p1", caseId: null, createdAt: "2026-07-03" };
const COM_CASE = { qualifiedAt: "2026-07-02", patientProfileId: "p1", caseId: "c1", createdAt: "2026-07-04" };

describe("próximo passo do lead", () => {
  it("percorre a jornada na ordem certa", () => {
    expect(nextStepForLead(NOVO).action).toBe("Qualificar lead");
    expect(nextStepForLead(QUALIFICADO).action).toBe("Converter em paciente");
    expect(nextStepForLead(CONVERTIDO).action).toBe("Abrir atendimento");
    expect(nextStepForLead(COM_CASE).action).toBe("Encaminhar ao Curador");
  });

  // Rótulo genérico obriga quem clica a adivinhar o que vai acontecer — e três
  // dessas quatro ações são irreversíveis.
  it("nenhum rótulo é genérico", () => {
    for (const lead of [NOVO, QUALIFICADO, CONVERTIDO, COM_CASE]) {
      expect(nextStepForLead(lead).action).not.toMatch(/^(Continuar|Avançar|Próximo|Salvar|OK)$/i);
    }
  });

  // O estado vem de fatos do banco, não de um campo de etapa que alguém
  // precisa lembrar de atualizar. Um lead com Case está com Case, mesmo que
  // o `pipeline_stage` diga outra coisa.
  it("deriva de fatos, nunca de um rótulo de etapa", () => {
    expect(nextStepForLead({ qualifiedAt: null, patientProfileId: "p1", caseId: "c1" }).key).toBe("encaminhar");
  });

  it("depois de entregar ao Curador, o Atendente só acompanha", () => {
    expect(nextStepForLead({ ...COM_CASE, handedOff: true }).key).toBe("concluido");
  });
});

describe("fila do Atendente", () => {
  it("põe o trabalho por fazer na frente do já adiantado", () => {
    const fila = sortLeadQueue([COM_CASE, CONVERTIDO, NOVO, QUALIFICADO]);
    expect(fila.map((l) => nextStepForLead(l).key)).toEqual(["qualificar", "converter", "abrir", "encaminhar"]);
  });

  // Quem espera há mais tempo na mesma etapa vem primeiro.
  it("desempata pelo mais antigo", () => {
    const antigo = { ...NOVO, createdAt: "2026-07-01" };
    const recente = { ...NOVO, createdAt: "2026-07-20" };
    expect(sortLeadQueue([recente, antigo])[0].createdAt).toBe("2026-07-01");
  });

  it("não altera o array recebido", () => {
    const original = [COM_CASE, NOVO];
    sortLeadQueue(original);
    expect(original[0]).toBe(COM_CASE);
  });
});
