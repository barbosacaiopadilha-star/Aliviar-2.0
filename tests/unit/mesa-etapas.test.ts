import { describe, expect, it } from "vitest";

import {
  buildMesaEtapas,
  MESA_ETAPAS,
  mesaProgress,
  proximaDecisao,
  type MesaFacts,
} from "@/modules/curadoria/mesa-etapas";

const ZERADO: MesaFacts = {
  profileValidated: true,
  budgetsComplete: false,
  professionalsFound: 0,
  awaitingAreaDeclaration: 0,
  eligible: 0,
  criteriaAwaiting: 0,
  selected: 0,
  reportExists: false,
  reportApproved: false,
  reportEmitted: false,
};

const COMPLETO: MesaFacts = {
  profileValidated: true,
  budgetsComplete: true,
  professionalsFound: 4,
  awaitingAreaDeclaration: 0,
  eligible: 3,
  criteriaAwaiting: 0,
  selected: 3,
  reportExists: true,
  reportApproved: true,
  reportEmitted: true,
};

function etapaDe(facts: MesaFacts, id: (typeof MESA_ETAPAS)[number]) {
  return buildMesaEtapas(facts).find((entrada) => entrada.id === id)!;
}

describe("As sete etapas da Mesa", () => {
  it("existem todas, sempre, na ordem da investigação", () => {
    const etapas = buildMesaEtapas(ZERADO);
    expect(etapas.map((entrada) => entrada.id)).toEqual([...MESA_ETAPAS]);
  });

  it("cada etapa carrega a pergunta que o Curador responde nela", () => {
    for (const etapa of buildMesaEtapas(COMPLETO)) {
      expect(etapa.question, etapa.id).toMatch(/\?$/);
    }
  });

  it("nenhuma etapa é bloqueada — a investigação é do Curador", () => {
    // "AGUARDA" diz de que depende; nunca fecha a porta.
    const estados = buildMesaEtapas(ZERADO).map((entrada) => entrada.status);
    expect(estados).not.toContain("BLOQUEADA");
    for (const etapa of buildMesaEtapas(ZERADO)) {
      if (etapa.status === "AGUARDA") expect(etapa.waitingOn, etapa.id).toBeTruthy();
    }
  });
});

describe("Uma decisão por vez", () => {
  it("Perfil não validado é o bloqueio de verdade — nada mais importa antes disso", () => {
    const decisao = proximaDecisao(buildMesaEtapas(ZERADO), false);
    expect(decisao.etapa).toBe("PERFIL");
    expect(decisao.blocked).toBe(true);
    expect(decisao.label).toContain("validado pela pessoa");
  });

  it("do zero, a próxima decisão é distribuir os pontos", () => {
    const decisao = proximaDecisao(buildMesaEtapas(ZERADO), true);
    expect(decisao.etapa).toBe("PERFIL");
    expect(decisao.label).toContain("Distribuir os pontos");
    expect(decisao.blocked).toBe(false);
  });

  it("com pontos fechados, passa a ser declarar área de quem falta", () => {
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 4, awaitingAreaDeclaration: 4 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.etapa).toBe("REDE");
    expect(decisao.label).toContain("4 profissional");
  });

  it("com área declarada, passa a ser avaliar os critérios que faltam", () => {
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 4, eligible: 3, criteriaAwaiting: 12 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.etapa).toBe("AVALIACAO");
    expect(decisao.label).toContain("12 critério");
  });

  it("com tudo avaliado, passa a ser selecionar os três", () => {
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 4, eligible: 3 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.etapa).toBe("CAMINHOS");
    expect(decisao.label).toContain("Selecionar 3 de 3");
  });

  it("com os três, passa a ser o Relatório — e cada passo dele é dito por nome", () => {
    const base = { ...ZERADO, budgetsComplete: true, professionalsFound: 4, eligible: 3, selected: 3 };

    expect(proximaDecisao(buildMesaEtapas(base), true).label).toContain("rascunho");
    expect(proximaDecisao(buildMesaEtapas({ ...base, reportExists: true }), true).label).toContain("aprovar");
    expect(
      proximaDecisao(buildMesaEtapas({ ...base, reportExists: true, reportApproved: true }), true).label,
    ).toContain("Emitir");
  });

  it("emitido, a Mesa diz que acabou em vez de inventar pendência", () => {
    const decisao = proximaDecisao(buildMesaEtapas(COMPLETO), true);
    expect(decisao.label).toBe("Curadoria concluída.");
    expect(decisao.blocked).toBe(false);
  });

  it("quando nada depende do Curador, a Mesa diz do que depende — nunca silêncio mudo", () => {
    // Pontos fechados, mas a Rede não tem ninguém: não há decisão dele a tomar.
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 0 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.blocked).toBe(true);
    expect(decisao.label).toContain("Nenhum profissional publicado");
  });
});

describe("Menos de três elegíveis", () => {
  it("os caminhos aguardam, dizendo quantos há — sem cobrar o Curador", () => {
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 2, eligible: 2 };
    const caminhos = etapaDe(facts, "CAMINHOS");
    expect(caminhos.status).toBe("AGUARDA");
    expect(caminhos.waitingOn).toContain("2 elegíveis");
    expect(caminhos.waitingOn).toContain("exige três");
  });

  it("um elegível não vira 'elegíveis' no plural", () => {
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 1, eligible: 1 };
    expect(etapaDe(facts, "CAMINHOS").waitingOn).toContain("1 elegível");
  });
});

describe("Progresso da investigação", () => {
  it("do zero, nenhuma etapa respondeu", () => {
    expect(mesaProgress(buildMesaEtapas(ZERADO))).toEqual({ done: 0, total: 7 });
  });

  it("completo, as sete responderam", () => {
    expect(mesaProgress(buildMesaEtapas(COMPLETO))).toEqual({ done: 7, total: 7 });
  });

  it("o progresso conta o que está pronto, não o que foi visitado", () => {
    const facts = { ...ZERADO, budgetsComplete: true, professionalsFound: 4, eligible: 3, criteriaAwaiting: 6 };
    const { done } = mesaProgress(buildMesaEtapas(facts));
    // Perfil e Rede prontos; avaliação e compatibilidade pendentes.
    expect(done).toBe(2);
  });
});
