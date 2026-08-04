import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { prontidaoParaEmissao } from "@/modules/curadoria/prontidao-para-emissao";
import {
  composicaoPendenteDoCurador,
  pendenciasDeJuizoRelacional,
  FRASE_COMPOSICAO_RASCUNHO,
} from "@/modules/curadoria/relatorio-inteligente";
import type { ReportLifecycle } from "@/modules/curadoria/relatorio-assistido";

/**
 * ITEM 1.6 — PAINEL DE PRONTIDÃO PARA EMISSÃO (G6 · Arquitetura §17.3 O3).
 *
 * O painel não pode ter opinião própria: ele consulta as MESMAS guardas da
 * emissão. O que estes testes provam é a ausência de uma segunda interpretação
 * — comportamento igual ao das guardas, e nenhuma regra reescrita.
 */

const LIFECYCLE: ReportLifecycle = {
  id: "rep-1",
  assistedGeneratedAt: null,
  generatorVersion: null,
  reviewedAt: null,
  approvedAt: null,
  approvedBy: null,
  emittedAt: null,
  deliveredAt: null,
};

const SENTINELA = "Sobre decisão compartilhada: esta leitura aguarda a conversa com o Curador.";
const ABERTURA_DO_CURADOR = "Escolhi estas três porque cada uma responde a um receio dela.";

function prontidao(
  overrides: Partial<Parameters<typeof prontidaoParaEmissao>[0]> = {},
) {
  return prontidaoParaEmissao({
    lifecycle: LIFECYCLE,
    compositionRationale: ABERTURA_DO_CURADOR,
    options: [],
    ...overrides,
  });
}

describe("O painel deriva das guardas — mesma resposta, mesma ordem", () => {
  it("sem Relatório, o primeiro bloqueio é o mesmo da emissão", () => {
    const resultado = prontidao({ lifecycle: null });
    expect(resultado.pronto).toBe(false);
    expect(resultado.bloqueios.map((b) => b.id)).toEqual(["RELATORIO_INEXISTENTE"]);
  });

  it("abertura ausente: o painel bloqueia exatamente quando a guarda diz AUSENTE", () => {
    for (const texto of [null, "", "   "]) {
      expect(composicaoPendenteDoCurador(texto)).toBe("AUSENTE");
      expect(prontidao({ compositionRationale: texto }).bloqueios.map((b) => b.id)).toEqual([
        "COMPOSICAO_AUSENTE",
      ]);
    }
  });

  it("abertura do rascunho: bloqueia exatamente quando a guarda diz DO_SISTEMA", () => {
    expect(composicaoPendenteDoCurador(FRASE_COMPOSICAO_RASCUNHO)).toBe("DO_SISTEMA");
    expect(
      prontidao({ compositionRationale: FRASE_COMPOSICAO_RASCUNHO }).bloqueios.map((b) => b.id),
    ).toEqual(["COMPOSICAO_DO_SISTEMA"]);
  });

  it("abertura do Curador: a guarda libera, e o painel também", () => {
    expect(composicaoPendenteDoCurador(ABERTURA_DO_CURADOR)).toBeNull();
    expect(prontidao().pronto).toBe(true);
    expect(prontidao().bloqueios).toEqual([]);
  });

  it("juízo relacional pendente: o painel nomeia os mesmos conceitos da guarda", () => {
    const options = [{ professionalProfileId: "prof-1", relationalReading: SENTINELA }];
    const daGuarda = pendenciasDeJuizoRelacional(options);
    expect(daGuarda).toHaveLength(1);

    const bloqueio = prontidao({ options }).bloqueios.find(
      (b) => b.id === "JUIZO_RELACIONAL_PENDENTE",
    );
    expect(bloqueio).toBeDefined();
    expect(bloqueio!.oQueFalta).toContain(daGuarda[0]!.conceito);
  });

  it("leitura relacional escrita pelo Curador não bloqueia — a guarda não a acusa", () => {
    const options = [
      {
        professionalProfileId: "prof-1",
        relationalReading: "Ela quer decidir junto, e ele conduz assim.",
      },
    ];
    expect(pendenciasDeJuizoRelacional(options)).toEqual([]);
    expect(prontidao({ options }).pronto).toBe(true);
  });

  it("os dois bloqueios coexistem, na ordem em que a emissão os encontraria", () => {
    const resultado = prontidao({
      compositionRationale: FRASE_COMPOSICAO_RASCUNHO,
      options: [{ professionalProfileId: "prof-1", relationalReading: SENTINELA }],
    });
    expect(resultado.bloqueios.map((b) => b.id)).toEqual([
      "COMPOSICAO_DO_SISTEMA",
      "JUIZO_RELACIONAL_PENDENTE",
    ]);
  });

  it("Relatório já emitido é estado, não bloqueio", () => {
    const resultado = prontidao({
      lifecycle: { ...LIFECYCLE, emittedAt: "2026-08-01T10:00:00Z" },
    });
    expect(resultado.jaEmitido).toBe(true);
    expect(resultado.pronto).toBe(true);
  });
});

describe("Sincronia painel × emissão — sem divergência possível", () => {
  /**
   * A emissão bloqueia se, e somente se, `composicaoPendenteDoCurador` devolve
   * algo OU `pendenciasDeJuizoRelacional` devolve alguma linha (havendo
   * Relatório). Este teste percorre a matriz completa e exige que o painel
   * concorde em todos os casos.
   */
  const composicoes = [null, "", "   ", FRASE_COMPOSICAO_RASCUNHO, ABERTURA_DO_CURADOR];
  const leituras = [null, "Leitura escrita pelo Curador.", SENTINELA];

  for (const compositionRationale of composicoes) {
    for (const relationalReading of leituras) {
      it(`composição=${JSON.stringify(compositionRationale)?.slice(0, 24)} · leitura=${
        relationalReading === SENTINELA ? "sentinela" : JSON.stringify(relationalReading)?.slice(0, 20)
      }`, () => {
        const options = [{ professionalProfileId: "prof-1", relationalReading }];

        // O que a emissão decidiria, consultando as mesmas guardas.
        const emissaoBloqueia =
          composicaoPendenteDoCurador(compositionRationale) !== null ||
          pendenciasDeJuizoRelacional(options).length > 0;

        expect(prontidao({ compositionRationale, options }).pronto).toBe(!emissaoBloqueia);
      });
    }
  }
});

describe("Nenhuma guarda foi duplicada", () => {
  const RAIZ = process.cwd();
  const fonteDoPainel = readFileSync(
    path.join(RAIZ, "src/modules/curadoria/prontidao-para-emissao.ts"),
    "utf8",
  );
  const fonteDaTela = readFileSync(
    path.join(RAIZ, "src/components/curadoria/report-status.tsx"),
    "utf8",
  );

  it("o painel consulta as duas guardas nominalmente", () => {
    expect(fonteDoPainel).toContain("composicaoPendenteDoCurador(");
    expect(fonteDoPainel).toContain("pendenciasDeJuizoRelacional(");
  });

  it("o painel não reimplementa nenhuma das duas regras", () => {
    // A frase-sentinela e a frase de rascunho pertencem ao módulo das guardas.
    // Se aparecerem aqui, a regra foi copiada.
    expect(fonteDoPainel).not.toContain("aguarda a conversa com o Curador");
    expect(fonteDoPainel).not.toContain("FRASE_COMPOSICAO_RASCUNHO");
    expect(fonteDoPainel).not.toMatch(/compositionRationale[^)]*\.trim\(\)/);
    expect(fonteDoPainel).not.toMatch(/\.split\("\\n"\)/);
  });

  it("a tela não decide prontidão — só lê o que recebe", () => {
    // Era exatamente esta linha que divergia da emissão.
    expect(fonteDaTela).not.toMatch(/compositionRationale\?\.trim\(\)/);
    expect(fonteDaTela).not.toContain("composicaoPendenteDoCurador");
    expect(fonteDaTela).not.toContain("pendenciasDeJuizoRelacional");
  });
});
