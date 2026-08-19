import { describe, expect, it } from "vitest";

import {
  FORMACAO_KIND_LABELS,
  FORMACAO_KINDS,
  SELO_FORMACAO_VERIFICADA,
  formatarLocal,
  formatarPeriodo,
  linhasPublicas,
  ordenarParaApresentacao,
  temSeloDeVerificacao,
  type FormacaoPublica,
} from "@/modules/profiles/formacao-academica";

/**
 * FORMAÇÃO ACADÊMICA · o domínio que o paciente lê.
 *
 * As decisões vinculantes desta seção não podem depender da disciplina de cada
 * tela: ausência é omissão (nunca "não informado"), rótulo não outorga título
 * de especialista, e o selo é um só.
 */

const base: FormacaoPublica = {
  kind: "residencia",
  title: "Residência em Clínica Médica",
  institution: "Hospital das Clínicas",
  city: "São Paulo",
  country: "Brasil",
  periodStart: 2010,
  periodEnd: 2013,
  mecConceito: null,
  mecConceitoAno: null,
};

describe("formatarPeriodo — anos sem enfeite", () => {
  it("intervalo, ano único e ausência", () => {
    expect(formatarPeriodo(2010, 2013)).toBe("2010–2013");
    expect(formatarPeriodo(2016, 2016)).toBe("2016");
    expect(formatarPeriodo(2016, null)).toBe("2016");
    expect(formatarPeriodo(null, 2016)).toBe("2016");
    expect(formatarPeriodo(null, null)).toBeNull();
  });
});

describe("formatarLocal — a vírgula só existe com as duas partes", () => {
  it("cidade+país, só um deles, nenhum", () => {
    expect(formatarLocal("São Paulo", "Brasil")).toBe("São Paulo, Brasil");
    expect(formatarLocal("São Paulo", null)).toBe("São Paulo");
    expect(formatarLocal(null, "Brasil")).toBe("Brasil");
    expect(formatarLocal(null, null)).toBeNull();
    expect(formatarLocal("  ", "")).toBeNull();
  });
});

describe("linhasPublicas — campo ausente é OMITIDO", () => {
  it("com tudo presente: instituição, local e período — nesta ordem", () => {
    expect(linhasPublicas(base)).toEqual([
      "Hospital das Clínicas",
      "São Paulo, Brasil",
      "2010–2013",
    ]);
  });

  it("ausência parcial não vira linha vazia nem placeholder", () => {
    const soInstituicao = linhasPublicas({ ...base, city: null, country: null, periodStart: null, periodEnd: null });
    expect(soInstituicao).toEqual(["Hospital das Clínicas"]);

    const nada = linhasPublicas({ ...base, institution: null, city: null, country: null, periodStart: null, periodEnd: null });
    expect(nada).toEqual([]);

    for (const linhas of [soInstituicao, nada]) {
      for (const linha of linhas) {
        expect(linha.trim()).not.toBe("");
        expect(linha.toLowerCase()).not.toContain("não informado");
      }
    }
  });
});

describe("conceito do MEC — dentro da linha da instituição, nunca solto", () => {
  const graduacao: FormacaoPublica = {
    ...base,
    kind: "graduacao",
    title: "Graduação em Medicina",
    institution: "Universidade Federal de Pernambuco",
  };

  it("com conceito e ano: uma frase só, na linha da escola", () => {
    const linhas = linhasPublicas({ ...graduacao, mecConceito: 4, mecConceitoAno: 2023 });
    expect(linhas[0]).toBe(
      "Universidade Federal de Pernambuco — curso com conceito 4 no MEC (2023)",
    );
    // A prova do que a decisão protege: o número NÃO é uma linha própria. Solto
    // entre as três cartas ele viraria a única coisa comparável da página, e a
    // paciente leria um ranking de notas em vez de três caminhos diferentes.
    expect(linhas).toHaveLength(3);
    expect(linhas).not.toContain("4");
    expect(linhas).not.toContain("conceito 4 no MEC");
  });

  it("sem ano: a frase existe igual, sem parênteses vazio", () => {
    const linhas = linhasPublicas({ ...graduacao, mecConceito: 5, mecConceitoAno: null });
    expect(linhas[0]).toBe("Universidade Federal de Pernambuco — curso com conceito 5 no MEC");
    expect(linhas[0]).not.toContain("()");
  });

  it("sem conceito: a linha é a instituição e nada mais — ausência é omissão", () => {
    expect(linhasPublicas({ ...graduacao, mecConceito: null, mecConceitoAno: null })[0]).toBe(
      "Universidade Federal de Pernambuco",
    );
  });

  it("sem instituição não há onde imprimir o conceito — e ele não vira linha órfã", () => {
    const linhas = linhasPublicas({
      ...graduacao,
      institution: null,
      mecConceito: 4,
      mecConceitoAno: 2023,
    });
    for (const linha of linhas) expect(linha).not.toContain("MEC");
  });
});

describe("rótulos — decisão 11: nenhum tipo outorga título de especialista", () => {
  it("todo tipo tem rótulo, e nenhum rótulo contém 'especialista'", () => {
    for (const kind of FORMACAO_KINDS) {
      const rotulo = FORMACAO_KIND_LABELS[kind];
      expect(rotulo.length).toBeGreaterThan(2);
      expect(rotulo.toLowerCase()).not.toContain("especialista");
    }
  });
});

describe("selo — um só, binário", () => {
  it("existe com uma confirmada, não existe com zero — e o texto é o vinculante", () => {
    expect(SELO_FORMACAO_VERIFICADA).toBe("Formação verificada pela equipe");
    expect(temSeloDeVerificacao([base])).toBe(true);
    expect(temSeloDeVerificacao([])).toBe(false);
  });
});

describe("ordem de apresentação — trajetória, nunca mérito", () => {
  it("graduação antes de residência antes de fellowship; empate por ano", () => {
    const fora: FormacaoPublica[] = [
      { ...base, kind: "fellowship", periodStart: 2018 },
      { ...base, kind: "graduacao", periodStart: 2004 },
      { ...base, kind: "residencia", periodStart: 2010 },
      { ...base, kind: "residencia", periodStart: 2008 },
    ];
    expect(ordenarParaApresentacao(fora).map((e) => `${e.kind}:${e.periodStart}`)).toEqual([
      "graduacao:2004",
      "residencia:2008",
      "residencia:2010",
      "fellowship:2018",
    ]);
  });
});
