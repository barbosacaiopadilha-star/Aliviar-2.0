import { describe, expect, it } from "vitest";

import { candidatosDaSelecao, foraDaSelecao } from "@/modules/curadoria/mesa-selecao";
import type { ComparisonColumn, ProfessionalEligibility } from "@/modules/curadoria/mesa-cruzamento-view";

/**
 * M1 — a seleção nasce dos elegíveis da Mesa com a leitura do Motor.
 *
 * O que estes testes fixam: a fonte dos candidatos é a comparação (Motor),
 * a ordem é a de entrada e eliminado nunca vira candidato. (A banda legada,
 * que a M1 ainda tolerava como compatibilidade de contrato, saiu na M2.)
 */

function coluna(id: string, resumo = "1 alta · 0 médias · 0 lacunas · 0 sem influência"): ComparisonColumn {
  return {
    professionalProfileId: id,
    summary: {
      totalSubcriteria: 1,
      highCompatibility: 1,
      mediumCompatibility: 0,
      informationGaps: 0,
      notRelevant: 0,
      gapsWithoutAnyRecord: 0,
      notDeclaredByCase: 0,
    },
    cells: [
      {
        subcriterionCode: "FORMACAO_RESIDENCIA",
        label: "Residência médica",
        importance: "MUITO_IMPORTANTE",
        status: "CONFIRMADO",
        result: "ALTA_COMPATIBILIDADE",
        stateSentence: "Confirmado",
      },
    ],
    resumo,
  };
}

function elegibilidade(
  id: string,
  state: ProfessionalEligibility["state"],
  reason: string,
): { professionalProfileId: string; displayName: string; eligibility: ProfessionalEligibility } {
  return {
    professionalProfileId: id,
    displayName: `Dr. ${id}`,
    eligibility: { professionalProfileId: id, state, reason, filters: [] },
  };
}

describe("candidatosDaSelecao — a fonte é o Motor", () => {
  it("mapeia cada coluna da comparação para um candidato, com nome, resumo e células", () => {
    const candidatos = candidatosDaSelecao([coluna("a")], (id) => `Dr. ${id}`);

    expect(candidatos).toHaveLength(1);
    expect(candidatos[0]).toMatchObject({
      professionalProfileId: "a",
      nome: "Dr. a",
      resumo: "1 alta · 0 médias · 0 lacunas · 0 sem influência",
    });
    expect(candidatos[0]!.celulas[0]!.result).toBe("ALTA_COMPATIBILIDADE");
  });

  it("preserva a ordem de entrada — nunca ordena por resultado", () => {
    const entrada = [
      coluna("c", "0 altas · 0 médias · 9 lacunas · 0 sem influência"),
      coluna("a", "9 altas · 0 médias · 0 lacunas · 0 sem influência"),
      coluna("b", "3 altas · 3 médias · 3 lacunas · 0 sem influência"),
    ];

    const candidatos = candidatosDaSelecao(entrada, (id) => id);

    expect(candidatos.map((c) => c.professionalProfileId)).toEqual(["c", "a", "b"]);
  });

  it("comparação vazia (Case antigo sem Mapa) devolve lista vazia, sem inventar candidato", () => {
    expect(candidatosDaSelecao([], () => "x")).toEqual([]);
  });
});

describe("foraDaSelecao — quem não participa, com o motivo da Mesa", () => {
  const profissionais = [
    elegibilidade("a", "ELEGIVEL", "Área declarada compatível e filtros obrigatórios atendidos."),
    elegibilidade("b", "ELIMINADO", "Área de atuação incompatível com o que este caso exige."),
    elegibilidade("c", "PENDENTE_DE_INFORMACAO", "Sem informação registrada: Cuidado contínuo."),
    elegibilidade("d", "AGUARDANDO_DECLARACAO", "A compatibilidade de área ainda não foi declarada pelo Curador."),
  ];

  it("lista somente quem não é elegível, cada um com o motivo da própria classificação", () => {
    const fora = foraDaSelecao(profissionais);

    expect(fora.map((entry) => entry.professionalProfileId)).toEqual(["b", "c", "d"]);
    expect(fora[0]!.motivo).toContain("incompatível");
  });

  it("profissional eliminado por área nunca aparece entre os candidatos", () => {
    // A comparação só carrega elegíveis — este teste fixa a disjunção.
    const candidatos = candidatosDaSelecao([coluna("a")], (id) => id);
    const fora = foraDaSelecao(profissionais);

    const idsCandidatos = new Set(candidatos.map((c) => c.professionalProfileId));
    for (const excluido of fora) {
      expect(idsCandidatos.has(excluido.professionalProfileId)).toBe(false);
    }
  });
});
