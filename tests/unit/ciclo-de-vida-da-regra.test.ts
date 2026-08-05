// ITEM 2.2B — O CICLO DE VIDA, EM FUNÇÃO PURA.
//
// O grafo e as autoridades da ADR-069, testáveis sem banco. Estas provas não
// substituem as do banco — o banco é a autoridade, e o arquivo de integração é
// quem prova que ele recusa. Aqui se prova que o domínio LÊ a mesma coisa.
//
// ANTI-VACUIDADE em módulo puro: cada recusa nomeia o par recusado e a razão da
// ADR, e cada permissão confirma o conjunto EXATO de autoridades — nunca só
// "não vazio".

import { describe, expect, it } from "vitest";

import { ESTADOS_DA_REGRA, type EstadoDaRegra } from "@/modules/curadoria/regra-de-derivacao-contrato";
import {
  AUTORIDADES_DA_TRANSICAO,
  autoridadesQuePodem,
  destinosPermitidos,
  estadoCorrente,
  estadoInicial,
  estadoTerminal,
  exigeAdr,
  exigeJustificativaDeEmergencia,
  isAutoridadeDaTransicao,
  isEstadoDaRegra,
  podeTransicionar,
  transicaoPermitida,
  versaoVigente,
  type OrigemDaTransicao,
  type TransicaoDaRegra,
} from "@/modules/curadoria/ciclo-de-vida-da-regra";

const t = (
  ordem: number,
  origem: OrigemDaTransicao,
  destino: EstadoDaRegra,
  versao = 1,
): TransicaoDaRegra => ({
  identificador: "regra-x",
  versao,
  ordem,
  origem,
  destino,
  autorId: "00000000-0000-4000-8000-000000000001",
  autoridade: origem === null ? "PAPEL_INTERNO" : "AUTORIDADE_DE_METODO",
  motivo: "motivo",
  adrDeAprovacao: exigeAdr(destino) ? "ADR-999" : null,
  justificativaDeEmergencia: null,
  ocorridaEm: "2026-08-06T00:00:00.000Z",
});

describe("O grafo da ADR-069 §7 — onze pares, seis permitidos", () => {
  it("o nascimento é o único par sem origem, e leva sempre a PROPOSTA", () => {
    expect(destinosPermitidos(null)).toEqual(["PROPOSTA"]);
  });

  it.each([
    ["PROPOSTA", "VIGENTE"],
    ["PROPOSTA", "SUSPENSA"],
    ["VIGENTE", "SUSPENSA"],
    ["VIGENTE", "REVOGADA"],
    ["SUSPENSA", "VIGENTE"],
    ["SUSPENSA", "REVOGADA"],
  ] as const)("%s → %s é permitida", (origem, destino) => {
    expect(transicaoPermitida(origem, destino)).toBe(true);
  });

  it("PROPOSTA → REVOGADA não existe: não se revoga o que nunca valeu (§6.2)", () => {
    expect(transicaoPermitida("PROPOSTA", "REVOGADA")).toBe(false);
    expect(destinosPermitidos("PROPOSTA")).not.toContain("REVOGADA");
  });

  it("REVOGADA é terminal, absolutamente — nenhuma transição parte dela", () => {
    expect(destinosPermitidos("REVOGADA")).toEqual([]);
    expect(estadoTerminal("REVOGADA")).toBe(true);
    for (const destino of ESTADOS_DA_REGRA) {
      expect(transicaoPermitida("REVOGADA", destino), `REVOGADA → ${destino} nasceu`).toBe(false);
    }
  });

  it("ninguém volta a PROPOSTA: nascimento não se repete", () => {
    for (const origem of ESTADOS_DA_REGRA) {
      expect(transicaoPermitida(origem, "PROPOSTA"), `${origem} → PROPOSTA nasceu`).toBe(false);
    }
  });

  it("X → X não é ato: transição sem mudança não existe", () => {
    for (const estado of ESTADOS_DA_REGRA) {
      expect(transicaoPermitida(estado, estado), `${estado} → ${estado} nasceu`).toBe(false);
    }
  });

  it("nenhum estado além dos quatro é terminal por acidente", () => {
    expect(ESTADOS_DA_REGRA.filter(estadoTerminal)).toEqual(["REVOGADA"]);
  });

  it("o grafo tem exatamente seis pares permitidos, contados sobre todos os possíveis", () => {
    const origens: OrigemDaTransicao[] = [null, ...ESTADOS_DA_REGRA];
    const permitidos = origens.flatMap((origem) =>
      ESTADOS_DA_REGRA.filter((destino) => transicaoPermitida(origem, destino)).map(
        (destino) => `${origem ?? "—"}→${destino}`,
      ),
    );
    expect(permitidos.sort()).toEqual(
      [
        "—→PROPOSTA",
        "PROPOSTA→VIGENTE",
        "PROPOSTA→SUSPENSA",
        "VIGENTE→SUSPENSA",
        "VIGENTE→REVOGADA",
        "SUSPENSA→VIGENTE",
        "SUSPENSA→REVOGADA",
      ].sort(),
    );
  });
});

describe("Autoridade por transição — ADR-069 §12", () => {
  it("propor é de qualquer papel interno, e também da Autoridade", () => {
    expect(autoridadesQuePodem(null, "PROPOSTA")).toEqual([
      "PAPEL_INTERNO",
      "AUTORIDADE_DE_METODO",
    ]);
  });

  it("o papel interno APENAS propõe — nenhuma outra transição é dele", () => {
    const origens: OrigemDaTransicao[] = [...ESTADOS_DA_REGRA];
    for (const origem of origens) {
      for (const destino of ESTADOS_DA_REGRA) {
        expect(
          podeTransicionar("PAPEL_INTERNO", origem, destino),
          `papel interno praticou ${origem} → ${destino}`,
        ).toBe(false);
      }
    }
  });

  it("o freio do Curador existe em UM par só: VIGENTE → SUSPENSA", () => {
    expect(autoridadesQuePodem("VIGENTE", "SUSPENSA")).toContain("CURADOR_DO_CASE");

    const origens: OrigemDaTransicao[] = [null, ...ESTADOS_DA_REGRA];
    const doCurador = origens.flatMap((origem) =>
      ESTADOS_DA_REGRA.filter((destino) =>
        podeTransicionar("CURADOR_DO_CASE", origem, destino),
      ).map((destino) => `${origem ?? "—"}→${destino}`),
    );
    expect(doCurador).toEqual(["VIGENTE→SUSPENSA"]);
  });

  it("o Curador NÃO pode reativar: freio é freio, não volante (§6.3)", () => {
    expect(podeTransicionar("CURADOR_DO_CASE", "SUSPENSA", "VIGENTE")).toBe(false);
    expect(autoridadesQuePodem("SUSPENSA", "VIGENTE")).toEqual(["AUTORIDADE_DE_METODO"]);
  });

  it("o Curador não revoga, nem por VIGENTE nem por SUSPENSA", () => {
    expect(podeTransicionar("CURADOR_DO_CASE", "VIGENTE", "REVOGADA")).toBe(false);
    expect(podeTransicionar("CURADOR_DO_CASE", "SUSPENSA", "REVOGADA")).toBe(false);
  });

  it("transição inexistente não tem autoridade nenhuma — nem a Autoridade", () => {
    expect(autoridadesQuePodem("PROPOSTA", "REVOGADA")).toEqual([]);
    for (const quem of AUTORIDADES_DA_TRANSICAO) {
      expect(podeTransicionar(quem, "PROPOSTA", "REVOGADA")).toBe(false);
    }
  });
});

describe("ADR e justificativa de emergência — ADR-069 §12", () => {
  it("entrada em VIGENTE e qualquer entrada em REVOGADA exigem ADR", () => {
    expect(exigeAdr("VIGENTE")).toBe(true);
    expect(exigeAdr("REVOGADA")).toBe(true);
  });

  it("PROPOSTA e SUSPENSA não exigem ADR", () => {
    expect(exigeAdr("PROPOSTA")).toBe(false);
    expect(exigeAdr("SUSPENSA")).toBe(false);
  });

  it("a justificativa de emergência é exclusiva do freio do Curador", () => {
    expect(exigeJustificativaDeEmergencia("CURADOR_DO_CASE", "VIGENTE", "SUSPENSA")).toBe(true);
    expect(exigeJustificativaDeEmergencia("AUTORIDADE_DE_METODO", "VIGENTE", "SUSPENSA")).toBe(
      false,
    );
    expect(exigeJustificativaDeEmergencia("CURADOR_DO_CASE", "SUSPENSA", "VIGENTE")).toBe(false);
  });
});

describe("A leitura derivada — ADR-069 §8.2", () => {
  it("o estado corrente é o destino da última transição pela ORDEM, não pela data", () => {
    // Entrada deliberadamente fora de ordem: se a leitura usasse posição no
    // array ou data, ela responderia SUSPENSA.
    const transicoes = [t(3, "SUSPENSA", "VIGENTE"), t(1, null, "PROPOSTA"), t(2, "PROPOSTA", "SUSPENSA")];
    expect(estadoCorrente(transicoes)).toBe("VIGENTE");
  });

  it("o estado inicial é sempre PROPOSTA, e é fato diferente do corrente", () => {
    const transicoes = [t(1, null, "PROPOSTA"), t(2, "PROPOSTA", "VIGENTE")];
    expect(estadoInicial(transicoes)).toBe("PROPOSTA");
    expect(estadoCorrente(transicoes)).toBe("VIGENTE");
    expect(estadoInicial(transicoes)).not.toBe(estadoCorrente(transicoes));
  });

  it("sem transição não há estado — e isso não é um estado implícito", () => {
    expect(estadoCorrente([])).toBeNull();
    expect(estadoInicial([])).toBeNull();
  });

  it("a versão vigente de uma regra é a única cujo estado corrente é VIGENTE", () => {
    const porVersao = new Map<number, readonly TransicaoDaRegra[]>([
      [1, [t(1, null, "PROPOSTA", 1), t(2, "PROPOSTA", "VIGENTE", 1), t(3, "VIGENTE", "REVOGADA", 1)]],
      [2, [t(1, null, "PROPOSTA", 2), t(2, "PROPOSTA", "VIGENTE", 2)]],
    ]);
    expect(versaoVigente(porVersao)).toBe(2);
  });

  it("regra sem versão vigente devolve null — nunca a maior versão por conveniência", () => {
    const porVersao = new Map<number, readonly TransicaoDaRegra[]>([
      [1, [t(1, null, "PROPOSTA", 1), t(2, "PROPOSTA", "VIGENTE", 1), t(3, "VIGENTE", "SUSPENSA", 1)]],
      [2, [t(1, null, "PROPOSTA", 2)]],
    ]);
    expect(versaoVigente(porVersao)).toBeNull();
  });

  it("ciclos VIGENTE ↔ SUSPENSA sem limite: o corrente segue o último (§6.1)", () => {
    const transicoes = [
      t(1, null, "PROPOSTA"),
      t(2, "PROPOSTA", "VIGENTE"),
      t(3, "VIGENTE", "SUSPENSA"),
      t(4, "SUSPENSA", "VIGENTE"),
      t(5, "VIGENTE", "SUSPENSA"),
      t(6, "SUSPENSA", "VIGENTE"),
    ];
    expect(estadoCorrente(transicoes)).toBe("VIGENTE");
    expect(estadoInicial(transicoes)).toBe("PROPOSTA");
  });
});

describe("Guardas de leitura", () => {
  it("reconhecem exatamente as listas fechadas, e recusam o resto", () => {
    for (const estado of ESTADOS_DA_REGRA) expect(isEstadoDaRegra(estado)).toBe(true);
    for (const quem of AUTORIDADES_DA_TRANSICAO) expect(isAutoridadeDaTransicao(quem)).toBe(true);
    expect(isEstadoDaRegra("ARQUIVADA")).toBe(false);
    expect(isAutoridadeDaTransicao("ADMINISTRADOR")).toBe(false);
  });
});
