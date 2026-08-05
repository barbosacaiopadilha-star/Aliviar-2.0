import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PERSON_PROTOCOL } from "@/modules/curadoria/protocolos";

/**
 * DP-3 — A ÚLTIMA FONTE DUPLA CONHECIDA DEIXOU DE EXISTIR.
 *
 * Cinco listas do lado da pessoa viviam em `protocolos.ts`. O gate de paridade
 * comparava código e banco apenas onde o banco materializava — e passava verde
 * justamente onde havia duas fontes.
 *
 * A prova de que a materialização preservou tudo (códigos, rótulos, ordem,
 * multiplicidade) está em `tests/remediacao/paridade-catalogo.integration.test.ts`,
 * contra o banco real. Aqui ficam as duas provas que não precisam de banco: que
 * a migration não tocou dado de ninguém, e que a constante morreu.
 */

const RAIZ = process.cwd();
const MIGRATION =
  "supabase/migrations/20260805140000_dp3_listas_p3_a_p7_no_catalogo.sql";
const sqlBruto = readFileSync(join(RAIZ, MIGRATION), "utf8");

/**
 * O que se audita é o SQL EXECUTÁVEL. A migration explica, em comentário, por
 * que não toca `case_needs` e por que `satisfied_by` fica nulo — e uma guarda
 * que varresse o texto inteiro acusaria justamente a explicação.
 */
const sql = sqlBruto
  .split("\n")
  .filter((linha) => !linha.trimStart().startsWith("--"))
  .join("\n");

/** Montada em tempo de execucao: o literal nao pode existir neste arquivo. */
const AGULHA = ["OPCOES", "PROVISORIAS", ""].join("_");

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.(tsx?|mjs)$/.test(entrada.name) ? [caminho] : [];
  });
}

describe("D8 · a constante morreu — nenhuma lista paralela sobreviveu", () => {
  it("nenhum arquivo de produção ou de teste cita a constante aposentada", () => {
    const arquivos = [...varrer("src"), ...varrer("tests"), ...varrer("scripts")];
    expect(arquivos.length).toBeGreaterThan(200);

    const citam = arquivos.filter((arquivo) =>
      readFileSync(join(RAIZ, arquivo), "utf8").includes(AGULHA),
    );
    expect(citam, "uma lista paralela voltou").toEqual([]);
  });

  it("as cinco perguntas leem do Catálogo, como todas as outras", () => {
    const fonte = readFileSync(join(RAIZ, "src/modules/curadoria/protocolos.ts"), "utf8");

    for (const code of [
      "ACESSO_DISPONIBILIDADE",
      "ACESSO_PRAZO_PARA_CONSULTA",
      "CONTINUIDADE_RETORNOS",
      "CONTINUIDADE_CANAIS",
      "CONTINUIDADE_COORDENACAO",
    ]) {
      expect(fonte, `${code} não lê do Catálogo`).toContain(`options: opcoesDaPessoa("${code}")`);
    }

    // Nenhuma pergunta escreve opções à mão: toda `options:` do protocolo da
    // pessoa passa por `opcoesDaPessoa`. Um objeto literal aqui seria a fonte
    // dupla renascendo com outro nome.
    const bloco = fonte.slice(
      fonte.indexOf("export const PERSON_PROTOCOL"),
      fonte.indexOf("PERSON_QUESTIONS_BY_CODE"),
    );
    expect(bloco.length).toBeGreaterThan(500);
    const literais = [...bloco.matchAll(/options:\s*\{[^}]/g)];
    expect(literais.map((m) => m[0]), "uma lista literal voltou ao protocolo").toEqual([]);
  });

  it("as cinco continuam com opções — materializar não esvaziou nenhuma", () => {
    for (const code of [
      "ACESSO_DISPONIBILIDADE",
      "ACESSO_PRAZO_PARA_CONSULTA",
      "CONTINUIDADE_RETORNOS",
      "CONTINUIDADE_CANAIS",
      "CONTINUIDADE_COORDENACAO",
    ]) {
      const pergunta = PERSON_PROTOCOL.find((p) => p.subcriterionCode === code)!;
      expect(Object.keys(pergunta.options).length, code).toBeGreaterThan(0);
    }
  });
});

describe("D6/A5 · a migration não tocou dado de ninguém", () => {
  it("nenhum UPDATE, DELETE ou backfill em `case_needs`", () => {
    for (const proibido of [/update\s+curadoria\.case_needs/i, /delete\s+from\s+curadoria\.case_needs/i, /insert\s+into\s+curadoria\.case_needs/i]) {
      expect(proibido.test(sql), `a migration toca case_needs: ${proibido}`).toBe(false);
    }
    expect(sql.toLowerCase().includes("case_needs")).toBe(false);
  });

  it("nenhum DDL — é migration aditiva de conteúdo, não de estrutura (A1)", () => {
    for (const ddl of ["create table", "alter table", "drop table", "add column", "create policy"]) {
      expect(sql.toLowerCase().includes(ddl), `a migration faz DDL: ${ddl}`).toBe(false);
    }
  });

  it("A4 · nenhum comportamento novo: `satisfied_by` não é preenchido", () => {
    expect(sql.toLowerCase().includes("satisfied_by"), "correspondência é comportamento, não catalogação").toBe(
      false,
    );
  });

  it("A7 · versiona pelo Catálogo vigente, sem lógica nova", () => {
    expect(sql).toContain("'1.1.0'");
    // Uma versão diferente por linha seria vocabulário nascendo desalinhado.
    const versoes = new Set([...sql.matchAll(/'(\d+\.\d+\.\d+)'/g)].map((m) => m[1]));
    expect([...versoes]).toEqual(["1.1.0"]);
  });

  it("é idempotente: reaplicar não duplica nem sobrescreve", () => {
    expect(sql.toLowerCase()).toContain("on conflict do nothing");
  });

  it("o Catálogo é norma: a mudança traz justificativa registrada", () => {
    // `catalog_guard()` recusa qualquer escrita sem isto na mesma transação.
    expect(sqlBruto).toContain("curadoria.catalog_change_rationale");
    expect(sqlBruto).toContain("DP-3");
  });
});
