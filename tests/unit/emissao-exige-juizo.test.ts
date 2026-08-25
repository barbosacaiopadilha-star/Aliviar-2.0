import { describe, expect, it } from "vitest";

import {
  rotuloDoConceito,
  veredictoDaEmissao,
  type SelecionadoComLacunas,
} from "@/modules/curadoria/emissao-exige-juizo";
import type { LacunaDeJuizo } from "@/modules/curadoria/julgamentos";

/**
 * O JUÍZO HUMANO É CONDIÇÃO DE EMISSÃO — ADR-094, saída A.
 *
 * @metodo ADR-094 — decidida pelo Fundador em 25/08
 * @metodo ADR-067 §5 — H8–H10 sempre exigidos
 *
 * O `SIM-51` encontrou uma Curadoria emitida e ENTREGUE com zero juízos, onde
 * o Método exigia nove. Não foi regressão: a regra vivia no Método e nada no
 * software a lia. Esta guarda é a regra passando a ser lida.
 */

const lacuna = (subcriterionCode: string): LacunaDeJuizo => ({
  subcriterionCode,
  natureza: "TECNICO",
  motivo: "SEM_JUIZO",
});

function selecionado(
  nome: string,
  faltando: readonly string[] = [],
): SelecionadoComLacunas {
  return {
    professionalProfileId: nome.toLowerCase(),
    nome,
    lacunas: faltando.map(lacuna),
  };
}

const OS_TRES = ["Dra. Helena", "Dra. Cecília", "Dr. Otávio"];

describe("Sem juízo não se emite", () => {
  it("com os três julgados, emite", () => {
    const veredicto = veredictoDaEmissao(OS_TRES.map((n) => selecionado(n)));

    expect(veredicto.pode).toBe(true);
  });

  it("faltando um juízo de um só, não emite", () => {
    const veredicto = veredictoDaEmissao([
      selecionado("Dra. Helena", ["HISTORICO"]),
      selecionado("Dra. Cecília"),
      selecionado("Dr. Otávio"),
    ]);

    expect(veredicto.pode).toBe(false);
  });

  // "Faltam requisitos" faria o Curador caçar — e recusa que obriga a caçar é
  // a recusa ensinando a contornar.
  it("a frase nomeia QUEM e O QUÊ, com o nome humano do conceito", () => {
    const veredicto = veredictoDaEmissao([
      selecionado("Dra. Helena", ["FORMACAO", "HISTORICO"]),
      selecionado("Dra. Cecília"),
      selecionado("Dr. Otávio", ["EXPERIENCIA"]),
    ]);

    if (veredicto.pode) throw new Error("devia recusar");

    expect(veredicto.motivo).toContain("Dra. Helena");
    expect(veredicto.motivo).toContain("Dr. Otávio");
    expect(veredicto.motivo).toContain("Formação Profissional");
    expect(veredicto.motivo).toContain("Histórico Profissional");
    expect(veredicto.motivo).toContain("Experiência Profissional");
    // Quem está em dia não é citado: a recusa fala do que falta, não de todos.
    expect(veredicto.motivo).not.toContain("Cecília");
    // E o código cru nunca aparece — SIM-45.
    expect(veredicto.motivo).not.toMatch(/[A-Z]{4,}_[A-Z]/);
  });

  // A ADR-094 recusa criar um `NAO_INFORMADO` de juízo. O caminho honesto já
  // existe na tela: um dos sete começos é "o que sei até aqui não me permite
  // concluir mais do que…". A frase da recusa precisa dizer isso, senão ensina
  // o Curador a inventar certeza para passar do portão.
  it("a recusa lembra que juízo reservado também é juízo", () => {
    const veredicto = veredictoDaEmissao([selecionado("Dra. Helena", ["FORMACAO"])]);

    if (veredicto.pode) throw new Error("devia recusar");
    expect(veredicto.motivo).toContain("não permite concluir");
  });

  /**
   * Guarda que aprova o vazio é guarda que não guarda. Emitir sem os três é
   * outra falha, com outro dono (`validateSelection`) — mas devolver `pode:
   * true` aqui seria esta guarda afirmando que está tudo certo sobre um
   * conjunto que ela não examinou.
   */
  it("lista vazia NÃO é aprovação", () => {
    const veredicto = veredictoDaEmissao([]);

    expect(veredicto.pode).toBe(false);
  });

  it("devolve as lacunas estruturadas, e não só a frase", () => {
    const veredicto = veredictoDaEmissao([
      selecionado("Dra. Helena", ["FORMACAO"]),
      selecionado("Dr. Otávio"),
    ]);

    if (veredicto.pode) throw new Error("devia recusar");
    expect(veredicto.faltando).toEqual([
      { nome: "Dra. Helena", conceitos: ["Formação Profissional"] },
    ]);
  });
});

describe("O rótulo do conceito sai do Catálogo, nunca de uma lista nova", () => {
  it("os três eixos técnicos têm nome humano", () => {
    expect(rotuloDoConceito("FORMACAO")).toBe("Formação Profissional");
    expect(rotuloDoConceito("EXPERIENCIA")).toBe("Experiência Profissional");
    expect(rotuloDoConceito("HISTORICO")).toBe("Histórico Profissional");
  });

  it("os relacionais também, e vêm do Catálogo do Método", () => {
    for (const code of [
      "MODELO_DECISAO_COMPARTILHADA",
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
    ]) {
      const rotulo = rotuloDoConceito(code);
      expect(rotulo, code).not.toBe(code);
      expect(rotulo.length, code).toBeGreaterThan(0);
    }
  });

  // Conceito desconhecido devolve o código — que PARECE código, porque é.
  // Inventar prosa para ele esconderia um conceito novo que ninguém mapeou.
  it("conceito desconhecido devolve o próprio código, sem fantasia", () => {
    expect(rotuloDoConceito("CONCEITO_QUE_NAO_EXISTE")).toBe("CONCEITO_QUE_NAO_EXISTE");
  });
});

// ---------------------------------------------------------------------------

// IMPORTAR NÃO É CHAMAR — a lição do GAP-D-1, aplicada a uma guarda.
//
// Os testes acima provam a REGRA. Não provam que o portão a consulta, e é no
// portão que ela vale: uma guarda escrita e não chamada é exatamente o estado
// anterior ao `SIM-51` — `lacunasDeJuizo` existia, estava certa, e ninguém a
// lia antes de emitir.
describe("A guarda está NO PORTÃO, não só no módulo", () => {
  it("emitReportAction consulta o veredicto e recusa por ele", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");

    const fonte = readFileSync(
      join(process.cwd(), "src/modules/curadoria/actions.ts"),
      "utf8",
    );

    const inicio = fonte.indexOf("export async function emitReportAction");
    const fim = fonte.indexOf("export async function", inicio + 1);
    expect(inicio, "emitReportAction sumiu").toBeGreaterThan(-1);

    const acao = fonte.slice(inicio, fim);

    expect(acao, "a emissão deixou de conferir os juízos — ver SIM-51 e ADR-094").toContain(
      "veredictoDaEmissaoDoCase",
    );
    expect(acao, "o veredicto é consultado e o resultado ignorado").toContain("veredicto.pode");
    expect(acao).toContain("veredicto.motivo");
  });

  // A ordem importa: conferir DEPOIS de aprovar/emitir seria conferir tarde.
  it("a conferência vem ANTES de aprovar e emitir", () => {
    const { readFileSync } = require("node:fs") as typeof import("node:fs");
    const { join } = require("node:path") as typeof import("node:path");

    const fonte = readFileSync(join(process.cwd(), "src/modules/curadoria/actions.ts"), "utf8");
    const inicio = fonte.indexOf("export async function emitReportAction");
    const acao = fonte.slice(inicio, fonte.indexOf("export async function", inicio + 1));

    const conferencia = acao.indexOf("veredictoDaEmissaoDoCase");
    const aprovacao = acao.indexOf("approveReport");
    const emissao = acao.indexOf("emitReport(");

    expect(conferencia).toBeGreaterThan(-1);
    expect(conferencia, "confere depois de aprovar — tarde demais").toBeLessThan(aprovacao);
    expect(conferencia, "confere depois de emitir — tarde demais").toBeLessThan(emissao);
  });
});
