import { describe, expect, it } from "vitest";

import {
  fraseDaCadeia,
  montarCadeiaDeProveniencia,
  type EntradaDaPessoa,
  type EntradaDoProfissional,
} from "@/modules/curadoria/cadeia-de-proveniencia";

/**
 * ITEM 1.9 — CADEIA DE PROVENIÊNCIA (Arquitetura §11.4).
 *
 * O que se prova aqui é sobretudo o que a cadeia **não** faz: não inventa elo,
 * não converte ausência em presença, não atribui autor a registro que não tem.
 * A auditoria descreveu o defeito como "dois dos quatro ramos terminam em 'o
 * Curador digitou'" — a cadeia passa a dizer exatamente isso, em vez de calar.
 */

const PESSOA_COMPLETA: EntradaDaPessoa = {
  declaracao: {
    degree: "ESSENCIAL",
    options: ["telemedicina"],
    declaredBy: "perfil-paciente",
    declaredAt: "2026-08-01T10:00:00Z",
  },
  importancia: { importance: "MUITO_IMPORTANTE", declaredBy: "perfil-curador" },
};

const PROFISSIONAL_COMPLETO: EntradaDoProfissional = {
  evidencia: {
    version: 2,
    source: "entrevista",
    verifiedBy: "perfil-operacao",
    verifiedAt: "2026-07-30T12:00:00Z",
  },
  estado: { status: "CONFIRMADO", declaredBy: "perfil-admin" },
};

const VAZIO_PESSOA: EntradaDaPessoa = { declaracao: null, importancia: null };
const VAZIO_PROFISSIONAL: EntradaDoProfissional = { evidencia: null, estado: null };

function cadeia(pessoa: EntradaDaPessoa, profissional: EntradaDoProfissional) {
  return montarCadeiaDeProveniencia({
    subcriterionCode: "ACESSO_MODALIDADE",
    pessoa,
    profissional,
  });
}

describe("Autoria — quem declarou chega à cadeia", () => {
  it("o autor da declaração dela e o da importância são lidos, cada um no seu elo", () => {
    const resultado = cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO);
    const ramo = resultado.ramos.find((r) => r.lado === "PESSOA")!;

    expect(ramo.elos.find((e) => e.id === "DECLARACAO_ORIGINAL")?.autor).toBe("perfil-paciente");
    expect(ramo.elos.find((e) => e.id === "DECLARACAO_ORIGINAL")?.em).toBe("2026-08-01T10:00:00Z");
    expect(ramo.elos.find((e) => e.id === "CONFIRMACAO")?.autor).toBe("perfil-curador");
  });

  it("do lado do profissional, quem verificou a evidência e quem declarou o estado", () => {
    const ramo = cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO).ramos.find(
      (r) => r.lado === "PROFISSIONAL",
    )!;

    expect(ramo.elos.find((e) => e.id === "DECLARACAO_ORIGINAL")?.autor).toBe("perfil-operacao");
    expect(ramo.elos.find((e) => e.id === "CONFIRMACAO")?.autor).toBe("perfil-admin");
  });
});

describe("Registros antigos — sem autor, e dito assim", () => {
  it("importância sem `declared_by` continua presente, com autor nulo", () => {
    const resultado = cadeia(
      { ...PESSOA_COMPLETA, importancia: { importance: "IMPORTANTE", declaredBy: null } },
      PROFISSIONAL_COMPLETO,
    );
    const confirmacao = resultado.ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    // O elo EXISTE — o valor foi declarado. O que falta é o autor, e o autor
    // ausente nunca é inventado nem transformado em ausência do elo (I-8).
    expect(confirmacao.presente).toBe(true);
    expect(confirmacao.autor).toBeNull();
  });

  it("ausência de backfill: nenhum autor aparece onde o registro não tem", () => {
    const resultado = cadeia(VAZIO_PESSOA, VAZIO_PROFISSIONAL);
    for (const ramo of resultado.ramos) {
      for (const entrada of ramo.elos) {
        expect(entrada.autor, `${ramo.lado}/${entrada.id}`).toBeNull();
      }
    }
  });
});

describe("Nenhum elo é inventado", () => {
  it("o elo da PROPOSTA é sempre ausente — a Camada de Derivação é da Onda 2", () => {
    const resultado = cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO);
    for (const ramo of resultado.ramos) {
      const proposta = ramo.elos.find((e) => e.id === "PROPOSTA")!;
      expect(proposta.presente, `${ramo.lado}: proposta não pode existir na Onda 1`).toBe(false);
      expect(proposta.lacuna).toContain("Camada de Derivação");
      expect(proposta.lacuna).toContain("ADR-066");
    }
  });

  it("toda lacuna é nomeada — nunca ausência silenciosa", () => {
    const resultado = cadeia(VAZIO_PESSOA, VAZIO_PROFISSIONAL);
    expect(resultado.lacunas.length).toBeGreaterThan(0);
    for (const lacuna of resultado.lacunas) {
      expect(lacuna.porque.trim().length, `${lacuna.lado}/${lacuna.elo}`).toBeGreaterThan(10);
    }
  });

  it("a cadeia nunca se declara completa enquanto a proposta não existir", () => {
    expect(cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO).completa).toBe(false);
  });
});

describe("Registros novos — o que já é reconstituível", () => {
  it("com declaração, importância, evidência e estado, só a proposta falta", () => {
    const resultado = cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO);
    const faltantes = resultado.lacunas.map((l) => l.elo);
    expect(new Set(faltantes)).toEqual(new Set(["PROPOSTA"]));
    expect(resultado.lacunas).toHaveLength(2); // um por ramo
  });

  it("sem importância ou sem estado, a leitura do Motor não existe — e a cadeia diz por quê", () => {
    const semEstado = cadeia(PESSOA_COMPLETA, { ...PROFISSIONAL_COMPLETO, estado: null });
    for (const ramo of semEstado.ramos) {
      const leitura = ramo.elos.find((e) => e.id === "LEITURA")!;
      expect(leitura.presente).toBe(false);
      expect(leitura.lacuna).toContain("não há célula");
    }
  });
});

describe("A frase da cadeia descreve rastreabilidade, nunca qualidade", () => {
  it("conta elos e nomeia o que falta", () => {
    const frase = fraseDaCadeia(cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO));
    expect(frase).toMatch(/6 de 8 elos registrados/);
    expect(frase).toMatch(/em vez de supor/);
  });

  it("nenhuma frase julga quem declarou", () => {
    for (const entrada of [
      cadeia(PESSOA_COMPLETA, PROFISSIONAL_COMPLETO),
      cadeia(VAZIO_PESSOA, VAZIO_PROFISSIONAL),
    ]) {
      const texto = [fraseDaCadeia(entrada), ...entrada.lacunas.map((l) => l.porque)].join(" ");
      expect(texto.toLowerCase()).not.toMatch(/melhor|pior|falhou|negligen|incompetent|score|nota/);
    }
  });
});
