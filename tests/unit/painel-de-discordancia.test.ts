import { describe, expect, it } from "vitest";

import { CATALOGO_GERADO } from "@/modules/curadoria/catalogo-gerado";
import {
  DESFECHOS_DA_PROPOSTA,
  montarPainelDeDiscordancia,
  SEM_OBSERVACOES_SUFICIENTES,
  type ContagemAgregada,
} from "@/modules/curadoria/painel-de-discordancia";

/**
 * ITEM 1.11 — o MODELO PURO do Painel de Discordância.
 *
 * O que se prova: a taxa do §5 usa só os dois desfechos DECIDIDOS; denominador
 * zero vira declaração, nunca número; v1 e v2 jamais somam; a ordem é a neutra
 * do Catálogo; e nenhuma dimensão pessoal existe para vazar.
 */

const linha = (over: Partial<ContagemAgregada>): ContagemAgregada => ({
  subcriterionCode: "ACESSO_MODALIDADE",
  ruleId: "REGRA-X",
  ruleVersion: 1,
  state: "CONFIRMADA",
  contagem: 1,
  ...over,
});

describe("§5 · a taxa usa só os atos humanos decididos", () => {
  it("a prova numérica lavrada: 3C+1R+4P+2S+1T → 25%, nunca 1/11", () => {
    const painel = montarPainelDeDiscordancia([
      linha({ state: "CONFIRMADA", contagem: 3 }),
      linha({ state: "RECUSADA", contagem: 1 }),
      linha({ state: "PROPOSTA", contagem: 4 }),
      linha({ state: "SUPERADA", contagem: 2 }),
      linha({ state: "RETIRADA", contagem: 1 }),
    ]);

    expect(painel.series).toHaveLength(1);
    const [serie] = painel.series;
    expect(serie!.contagens).toEqual({
      PROPOSTA: 4,
      CONFIRMADA: 3,
      RECUSADA: 1,
      SUPERADA: 2,
      RETIRADA: 1,
    });
    expect(serie!.discordancia).toEqual({ ha: true, taxa: 0.25, decididas: 4 });
  });

  it("pendente, superada e retirada NUNCA entram no denominador", () => {
    const soIndecididas = montarPainelDeDiscordancia([
      linha({ state: "PROPOSTA", contagem: 7 }),
      linha({ state: "SUPERADA", contagem: 3 }),
      linha({ state: "RETIRADA", contagem: 2 }),
    ]);
    const [serie] = soIndecididas.series;
    expect(serie!.discordancia.ha).toBe(false);
    if (!serie!.discordancia.ha) {
      expect(serie!.discordancia.declaracao).toBe(SEM_OBSERVACOES_SUFICIENTES);
    }
  });

  it("§8 · denominador zero não vira 0%, NaN nem null — vira declaração", () => {
    const vazio = montarPainelDeDiscordancia([linha({ state: "PROPOSTA", contagem: 5 })]);
    const texto = JSON.stringify(vazio.series[0]!.discordancia);
    expect(texto).not.toMatch(/"taxa"/);
    expect(texto).not.toMatch(/NaN|null/);
    expect(texto).toContain(SEM_OBSERVACOES_SUFICIENTES);
  });

  it("banco vazio → painel vazio honesto", () => {
    const painel = montarPainelDeDiscordancia([]);
    expect(painel.vazio).toBe(true);
    expect(painel.series).toEqual([]);
  });
});

describe("§5 · versões e conceitos nunca se misturam", () => {
  it("v1 e v2 da MESMA regra produzem séries independentes — proibida a média", () => {
    const painel = montarPainelDeDiscordancia([
      linha({ ruleVersion: 1, state: "CONFIRMADA", contagem: 3 }),
      linha({ ruleVersion: 1, state: "RECUSADA", contagem: 1 }),
      linha({ ruleVersion: 2, state: "CONFIRMADA", contagem: 1 }),
      linha({ ruleVersion: 2, state: "RECUSADA", contagem: 1 }),
    ]);
    expect(painel.series).toHaveLength(2);
    const v1 = painel.series.find((s) => s.ruleVersion === 1)!;
    const v2 = painel.series.find((s) => s.ruleVersion === 2)!;
    expect(v1.discordancia).toEqual({ ha: true, taxa: 0.25, decididas: 4 });
    expect(v2.discordancia).toEqual({ ha: true, taxa: 0.5, decididas: 2 });
  });

  it("conceitos distintos não somam", () => {
    const painel = montarPainelDeDiscordancia([
      linha({ subcriterionCode: "ACESSO_MODALIDADE", state: "RECUSADA", contagem: 2 }),
      linha({ subcriterionCode: "MODELO_COMUNICACAO", state: "CONFIRMADA", contagem: 2 }),
    ]);
    expect(painel.series).toHaveLength(2);
  });
});

describe("§18 · zero de linha ausente ≠ observação factual de zero", () => {
  it("`desfechosObservados` distingue o que veio do banco do que é preenchimento", () => {
    const painel = montarPainelDeDiscordancia([
      linha({ state: "CONFIRMADA", contagem: 3 }),
      linha({ state: "RECUSADA", contagem: 1 }),
    ]);
    const [serie] = painel.series;
    expect(serie!.desfechosObservados).toEqual(["CONFIRMADA", "RECUSADA"]);
    // PROPOSTA=0 nas contagens é AUSÊNCIA de linha agregada, não medição.
    expect(serie!.contagens.PROPOSTA).toBe(0);
    expect(serie!.desfechosObservados).not.toContain("PROPOSTA");
  });
});

describe("§5/§7 · ordem neutra do Catálogo — nunca por taxa", () => {
  it("séries saem na posição do Catálogo, mesmo com taxas invertidas", () => {
    const posicao = new Map(CATALOGO_GERADO.map((c, i) => [c.code, i]));
    // Dois conceitos reais em ordem de Catálogo conhecida:
    const [primeiro, segundo] = [...CATALOGO_GERADO]
      .filter((c) => c.active)
      .slice(0, 2)
      .map((c) => c.code);

    // O SEGUNDO do catálogo recebe taxa altíssima; o PRIMEIRO, baixa. Se a
    // ordenação olhasse taxa, o segundo subiria — e vira fila de piores.
    const painel = montarPainelDeDiscordancia([
      linha({ subcriterionCode: segundo!, state: "RECUSADA", contagem: 9 }),
      linha({ subcriterionCode: segundo!, state: "CONFIRMADA", contagem: 1 }),
      linha({ subcriterionCode: primeiro!, state: "RECUSADA", contagem: 1 }),
      linha({ subcriterionCode: primeiro!, state: "CONFIRMADA", contagem: 9 }),
    ]);
    expect(painel.series.map((s) => s.subcriterionCode)).toEqual([primeiro, segundo]);
    expect(posicao.get(painel.series[0]!.subcriterionCode)!).toBeLessThan(
      posicao.get(painel.series[1]!.subcriterionCode)!,
    );
  });

  it("desempate estável por identidade (ruleId, versão) — nunca por mérito", () => {
    const painel = montarPainelDeDiscordancia([
      linha({ ruleId: "REGRA-B", state: "RECUSADA", contagem: 5 }),
      linha({ ruleId: "REGRA-A", state: "CONFIRMADA", contagem: 1 }),
      linha({ ruleId: "REGRA-A", ruleVersion: 2, state: "CONFIRMADA", contagem: 1 }),
    ]);
    expect(painel.series.map((s) => `${s.ruleId}v${s.ruleVersion}`)).toEqual([
      "REGRA-Av1",
      "REGRA-Av2",
      "REGRA-Bv1",
    ]);
  });
});

describe("§2/§7 · nenhuma dimensão pessoal existe no modelo", () => {
  it("nem entrada nem saída conhecem pessoa, Case ou proposta individual", () => {
    const painel = montarPainelDeDiscordancia([
      linha({ state: "CONFIRMADA", contagem: 2 }),
      linha({ state: "RECUSADA", contagem: 1 }),
    ]);
    const texto = JSON.stringify(painel);
    for (const pessoal of ["professional", "patient", "caseId", "case_id", "proposalId", "propostaId", "origin"]) {
      expect(texto, `vazou dimensão pessoal: ${pessoal}`).not.toContain(pessoal);
    }
  });

  it("os cinco desfechos são exatamente os do schema — nenhum inventado", () => {
    expect(DESFECHOS_DA_PROPOSTA).toEqual([
      "PROPOSTA",
      "CONFIRMADA",
      "RECUSADA",
      "SUPERADA",
      "RETIRADA",
    ]);
  });

  it("é determinístico: mesma entrada, mesma saída", () => {
    const entrada = [
      linha({ state: "CONFIRMADA", contagem: 2 }),
      linha({ state: "RECUSADA", contagem: 1 }),
    ];
    expect(JSON.stringify(montarPainelDeDiscordancia(entrada))).toBe(
      JSON.stringify(montarPainelDeDiscordancia(entrada)),
    );
  });
});
