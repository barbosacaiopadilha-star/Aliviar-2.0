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
