import { describe, expect, it } from "vitest";

import { CATALOGO_GERADO, type CatalogoConceito } from "@/modules/curadoria/catalogo-gerado";

/**
 * COBERTURA DAS REGRAS DE CORRESPONDÊNCIA — guarda da ADR-110 §2.
 *
 * **Por que existe.** A ADR-110 escolheu **enumeração** em vez de ordinal
 * declarado para as faixas: `ATE_15_DIAS` será satisfeito listando
 * `ATE_7_DIAS` e `DE_8_A_15_DIAS`. É a escolha barata, e ela tem um custo
 * conhecido — **a enumeração é uma ordem escrita dentro de uma lista.** No dia
 * em que alguém inserir `DE_61_A_90_DIAS` no Catálogo, toda regra que deveria
 * incluí-la continua válida, silenciosa e errada.
 *
 * Este teste é o que a ADR comprou junto com a escolha: **opção nova que
 * ninguém citou em regra nenhuma reprova a suíte, com o nome da opção.**
 *
 * **O que ele NÃO afirma.** Não diz que as regras estão certas — juízo de
 * Método não cabe em teste. Diz apenas que **nada entrou ou saiu do Catálogo
 * sem alguém olhar**: é teste de caracterização, e a linha de base abaixo é a
 * fotografia de 31/08, cada ausência com o motivo pelo qual é deliberada.
 *
 * **Como reagir quando ele reprovar** (e ele vai, no dia certo):
 *   1. escreva a regra que faltou — é o caso comum; ou
 *   2. acrescente a opção à linha de base **com o motivo**, se ela realmente
 *      não corresponde a nada. Motivo em branco é o mesmo que não olhar.
 */

/** Opções da pessoa que deliberadamente não têm `satisfied_by`. */
const SEM_REGRA_DELIBERADO: Readonly<Record<string, string>> = {
  "MODELO_PARTICIPACAO_FAMILIAR.NAO_TENHO_PREFERENCIA":
    "Não é pedido, é ausência de pedido. Dar-lhe regra reporia o SIM-74 por " +
    "outra porta: `*` produziria CONFIRMADO, logo ALTA. Sem regra, o motor " +
    "devolve NAO_RELEVANTE — que é a verdade.",
};

/** Condutas do profissional que nenhuma regra cita, e o porquê. */
const CONDUTA_ORFA_DELIBERADA: Readonly<Record<string, string>> = {
  "MODELO_PARTICIPACAO_FAMILIAR.ATENDIMENTO_APENAS_INDIVIDUAL":
    "Alcançada pelo curinga `*` de PREFIRO_SOZINHA — quem prefere estar só é " +
    "satisfeita por qualquer conduta, inclusive esta. Órfã na lista, coberta " +
    "na prática.",
  "MODELO_PARTICIPACAO_FAMILIAR.CONTATO_COM_FAMILIA_ENTRE_CONSULTAS_SE_AUTORIZADO":
    "Ela não tem opção correspondente: o Catálogo não lhe pergunta se quer " +
    "que a família seja contatada entre consultas. Candidata a pedido novo " +
    "do lado dela — pauta de Método, não defeito de regra.",
  "MODELO_ALTERNATIVAS.LIMITES_DO_QUE_SE_SABE_HOJE":
    "É o SIM-69 em forma concreta e nomeada: o profissional pode declarar que " +
    "apresenta os limites do que se sabe hoje, e **ela não tem como pedir " +
    "isso**. Boa candidata a opção nova do lado dela.",
};

const ATIVOS = CATALOGO_GERADO.filter((c) => c.active);
const opcoes = (c: CatalogoConceito, lado: "paciente" | "profissional") =>
  (c[lado] ?? []).flatMap((campo) => (campo.options ?? []).filter((o) => o.active));

/** Os conceitos que já têm correspondência declarada — hoje três. */
const COM_REGRA = ATIVOS.filter((c) => opcoes(c, "paciente").some((o) => o.satisfiedBy));

describe("Cobertura das regras de correspondência — ADR-110 §2", () => {
  it("há conceitos com regra — senão este teste passa por vazio", () => {
    expect(COM_REGRA.length).toBeGreaterThan(0);
  });

  it("toda opção da pessoa tem regra, ou consta da linha de base com motivo", () => {
    const novas: string[] = [];
    for (const conceito of COM_REGRA) {
      for (const opcao of opcoes(conceito, "paciente")) {
        if (opcao.satisfiedBy) continue;
        const chave = `${conceito.code}.${opcao.value}`;
        if (SEM_REGRA_DELIBERADO[chave]) continue;
        novas.push(
          `${chave} — a pessoa pode marcar "${opcao.label}" e nenhuma conduta a satisfaz. ` +
            "Escreva a regra, ou declare o motivo em SEM_REGRA_DELIBERADO.",
        );
      }
    }
    expect(novas, `\n${novas.join("\n")}\n`).toEqual([]);
  });

  it("toda conduta do profissional é citada por alguma regra, ou consta com motivo", () => {
    const orfas: string[] = [];
    for (const conceito of COM_REGRA) {
      const citadas = new Set(
        opcoes(conceito, "paciente")
          .flatMap((o) => o.satisfiedBy ?? [])
          .filter((valor) => valor !== "*"),
      );
      for (const conduta of opcoes(conceito, "profissional")) {
        if (citadas.has(conduta.value)) continue;
        const chave = `${conceito.code}.${conduta.value}`;
        if (CONDUTA_ORFA_DELIBERADA[chave]) continue;
        orfas.push(
          `${chave} — o profissional pode declarar "${conduta.label}" e isso não satisfaz pedido nenhum. ` +
            "Cite-a numa regra, ou declare o motivo em CONDUTA_ORFA_DELIBERADA.",
        );
      }
    }
    expect(orfas, `\n${orfas.join("\n")}\n`).toEqual([]);
  });

  /**
   * A linha de base também envelhece: entrada que sobrou depois de a opção
   * sumir ou ganhar regra vira ruído, e ruído em guarda é como comentário
   * mentiroso — pior que não existir.
   */
  it("a linha de base não guarda entrada morta", () => {
    const vivas = new Set<string>();
    for (const conceito of COM_REGRA) {
      for (const o of opcoes(conceito, "paciente")) {
        if (!o.satisfiedBy) vivas.add(`${conceito.code}.${o.value}`);
      }
      const citadas = new Set(
        opcoes(conceito, "paciente").flatMap((o) => o.satisfiedBy ?? []).filter((v) => v !== "*"),
      );
      for (const c of opcoes(conceito, "profissional")) {
        if (!citadas.has(c.value)) vivas.add(`${conceito.code}.${c.value}`);
      }
    }
    const mortas = [...Object.keys(SEM_REGRA_DELIBERADO), ...Object.keys(CONDUTA_ORFA_DELIBERADA)].filter(
      (chave) => !vivas.has(chave),
    );
    expect(mortas, `\nentradas obsoletas na linha de base:\n  ${mortas.join("\n  ")}\n`).toEqual([]);
  });

  it("todo motivo declarado é uma frase de verdade, não um espaço em branco", () => {
    for (const [chave, motivo] of [
      ...Object.entries(SEM_REGRA_DELIBERADO),
      ...Object.entries(CONDUTA_ORFA_DELIBERADA),
    ]) {
      expect(motivo.trim().length, `motivo vazio ou curto demais em ${chave}`).toBeGreaterThan(40);
    }
  });
});
