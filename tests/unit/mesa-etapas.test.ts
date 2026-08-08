import { describe, expect, it } from "vitest";

import {
  buildMesaEtapas,
  MESA_ETAPAS,
  mesaProgress,
  proximaDecisao,
  type MesaFacts,
} from "@/modules/curadoria/mesa-etapas";

const ZERADO: MesaFacts = {
  profileAcknowledged: true,
  mapPending: 4,
  professionalsFound: 0,
  awaitingAreaDeclaration: 0,
  eligible: 0,
  criteriaAwaiting: 0,
  julgamentosAguardando: 0,
  regimeDaAvaliacao: "LEGADO_6XN",
  selected: 0,
  reportExists: false,
  reportApproved: false,
  reportEmitted: false,
};

const COMPLETO: MesaFacts = {
  profileAcknowledged: true,
  mapPending: 0,
  professionalsFound: 4,
  awaitingAreaDeclaration: 0,
  eligible: 3,
  criteriaAwaiting: 0,
  julgamentosAguardando: 0,
  regimeDaAvaliacao: "LEGADO_6XN",
  selected: 3,
  reportExists: true,
  reportApproved: true,
  reportEmitted: true,
};

function etapaDe(facts: MesaFacts, id: (typeof MESA_ETAPAS)[number]) {
  return buildMesaEtapas(facts).find((entrada) => entrada.id === id)!;
}

describe("As seis etapas da Mesa", () => {
  it("existem todas, sempre, na ordem da investigação", () => {
    const etapas = buildMesaEtapas(ZERADO);
    expect(etapas.map((entrada) => entrada.id)).toEqual([...MESA_ETAPAS]);
  });

  it("M4: existe uma única etapa de leitura do Motor, e ela não é CRUZAMENTO", () => {
    const ids = buildMesaEtapas(COMPLETO).map((entrada) => entrada.id);
    expect(ids.filter((id) => id === "COMPATIBILIDADE")).toHaveLength(1);
    expect(ids).not.toContain("CRUZAMENTO");
    expect(MESA_ETAPAS).toHaveLength(6);
  });

  it("a etapa de compatibilidade pergunta pelo que a pessoa declarou como importante", () => {
    const compatibilidade = etapaDe(COMPLETO, "COMPATIBILIDADE");
    expect(compatibilidade.question).toBe(
      "Quanto cada profissional responde ao que esta pessoa declarou como importante?",
    );
    expect(compatibilidade.label).toBe("Compatibilidade");
  });

  it("CAMINHOS permanece etapa separada, depois da leitura", () => {
    const ids = buildMesaEtapas(COMPLETO).map((entrada) => entrada.id);
    expect(ids.indexOf("CAMINHOS")).toBeGreaterThan(ids.indexOf("COMPATIBILIDADE"));
    expect(ids.indexOf("RELATORIO")).toBeGreaterThan(ids.indexOf("CAMINHOS"));
  });

  it("nenhuma pergunta ou pendência fala de dois cruzamentos, pontos, nota ou score", () => {
    for (const etapa of buildMesaEtapas(ZERADO).concat(buildMesaEtapas(COMPLETO))) {
      const texto = `${etapa.label} ${etapa.question} ${etapa.pending ?? ""} ${etapa.waitingOn ?? ""}`;
      expect(texto.toLowerCase(), etapa.id).not.toMatch(
        /dois cruzamentos|pontos|orçamento|score|banda|nota\b/,
      );
    }
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
  it("Perfil não reconhecido é o bloqueio de verdade — nada mais importa antes disso", () => {
    const decisao = proximaDecisao(buildMesaEtapas(ZERADO), false);
    expect(decisao.etapa).toBe("PERFIL");
    expect(decisao.blocked).toBe(true);
    expect(decisao.label).toContain("reconheceu este Perfil como seu");
  });

  it("do zero, a próxima decisão é classificar o Mapa de Prioridades", () => {
    const decisao = proximaDecisao(buildMesaEtapas(ZERADO), true);
    expect(decisao.etapa).toBe("PERFIL");
    expect(decisao.label).toContain("Mapa de Prioridades");
    expect(decisao.blocked).toBe(false);
  });

  it("com o Mapa completo, passa a ser declarar área de quem falta", () => {
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 4, awaitingAreaDeclaration: 4 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.etapa).toBe("REDE");
    expect(decisao.label).toBe("Declarar a área de 4 profissionais.");
  });

  it("com área declarada, passa a ser avaliar os critérios que faltam", () => {
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 4, eligible: 3, criteriaAwaiting: 12 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.etapa).toBe("AVALIACAO");
    expect(decisao.label).toContain("12 critério");
  });

  it("com tudo avaliado, passa a ser selecionar os três", () => {
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 4, eligible: 3 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.etapa).toBe("CAMINHOS");
    expect(decisao.label).toContain("Selecionar 3 de 3");
  });

  it("com os três, passa a ser o Relatório — e cada passo dele é dito por nome", () => {
    const base = { ...ZERADO, mapPending: 0, professionalsFound: 4, eligible: 3, selected: 3 };

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
    // Mapa completo, mas a Rede não tem ninguém: não há decisão dele a tomar.
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 0 };
    const decisao = proximaDecisao(buildMesaEtapas(facts), true);
    expect(decisao.blocked).toBe(true);
    expect(decisao.label).toContain("Nenhum profissional publicado");
  });
});

describe("Menos de três elegíveis", () => {
  it("os caminhos aguardam, dizendo quantos há — sem cobrar o Curador", () => {
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 2, eligible: 2 };
    const caminhos = etapaDe(facts, "CAMINHOS");
    expect(caminhos.status).toBe("AGUARDA");
    expect(caminhos.waitingOn).toContain("2 elegíveis");
    expect(caminhos.waitingOn).toContain("exige três");
  });

  it("um elegível não vira 'elegíveis' no plural", () => {
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 1, eligible: 1 };
    expect(etapaDe(facts, "CAMINHOS").waitingOn).toContain("1 elegível");
  });
});

describe("Progresso da investigação", () => {
  it("do zero, nenhuma etapa respondeu", () => {
    expect(mesaProgress(buildMesaEtapas(ZERADO))).toEqual({ done: 0, total: 6 });
  });

  it("completo, as seis responderam", () => {
    expect(mesaProgress(buildMesaEtapas(COMPLETO))).toEqual({ done: 6, total: 6 });
  });

  it("o progresso conta o que está pronto, não o que foi visitado", () => {
    const facts = { ...ZERADO, mapPending: 0, professionalsFound: 4, eligible: 3, criteriaAwaiting: 6 };
    const { done } = mesaProgress(buildMesaEtapas(facts));
    // Perfil, Rede e COMPATIBILIDADE prontos; só a avaliação está pendente.
    //
    // P11 (Onda 1.4): este oráculo esperava 2 porque a Mesa declarava a leitura
    // do Motor pendente enquanto houvesse critério sem avaliação. Essa
    // dependência não existe no domínio — o Motor cruza os dois Mapas, não as
    // `criterion_declarations`. Com ela removida, a leitura está pronta.
    expect(done).toBe(3);
  });
});

/**
 * P11 — ONDA 1.4: A LEITURA DO MOTOR NÃO DEPENDE DAS AVALIAÇÕES.
 *
 * `crossPriorityAndProfessional` recebe `casePriorities`, `professionalStates` e
 * `activeSubcriterionCodes` — nunca `criterion_declarations`, que é o que
 * `criteriaAwaiting` conta. A Mesa declarava uma dependência que o domínio não
 * tem, e o Curador via "faltam avaliações para fechar a leitura" sobre uma
 * leitura que já estava fechada (auditoria §2.9, achado P11).
 */
describe("P11 · COMPATIBILIDADE não depende de AVALIACAO", () => {
  const SEM_AVALIACOES: MesaFacts = {
    ...ZERADO,
    mapPending: 0,
    professionalsFound: 4,
    eligible: 3,
    criteriaAwaiting: 6,
  };

  it("com os dois Mapas prontos, a leitura fica PRONTA mesmo sem nenhuma avaliação", () => {
    const compatibilidade = etapaDe(SEM_AVALIACOES, "COMPATIBILIDADE");
    expect(compatibilidade.status).toBe("PRONTA");
    expect(compatibilidade.pending).toBeNull();
  });

  it("nenhuma etapa culpa as avaliações pela leitura do Motor", () => {
    const compatibilidade = etapaDe(SEM_AVALIACOES, "COMPATIBILIDADE");
    const texto = `${compatibilidade.pending ?? ""} ${compatibilidade.waitingOn ?? ""}`;
    expect(texto).not.toMatch(/avalia/i);
  });

  it("AVALIACAO continua pendente por conta própria — o defeito era só a dependência falsa", () => {
    const avaliacao = etapaDe(SEM_AVALIACOES, "AVALIACAO");
    expect(avaliacao.status).toBe("PENDENTE");
    expect(avaliacao.pending).toContain("6 critérios sem avaliação");
  });

  it("as duas dependências reais da leitura permanecem", () => {
    const semMapa = etapaDe({ ...SEM_AVALIACOES, mapPending: 4 }, "COMPATIBILIDADE");
    expect(semMapa.status).toBe("AGUARDA");
    expect(semMapa.waitingOn).toContain("Mapa de Prioridades");

    const semElegivel = etapaDe({ ...SEM_AVALIACOES, eligible: 0 }, "COMPATIBILIDADE");
    expect(semElegivel.status).toBe("AGUARDA");
    expect(semElegivel.waitingOn).toContain("elegível");
  });

  it("a próxima decisão continua apontando para a avaliação, não para a leitura", () => {
    const etapas = buildMesaEtapas(SEM_AVALIACOES);
    expect(proximaDecisao(etapas, true).etapa).toBe("AVALIACAO");
  });
});
