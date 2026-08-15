import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CONTAINER_PADRAO, argumentosPsql, containerDoBanco } from "../apoio/stack-local";

/**
 * OPS-G5 · CORTE 7 (remediação) — o nome do contêiner mora num lugar só.
 *
 * Esta guarda é permanente. Ela não protege um comportamento do produto: protege
 * a capacidade de MEDIR o produto. Enquanto o nome estava escrito à mão em 24
 * pontos, apontar a suíte para outra stack produzia um resultado misto — leitura
 * num banco, escrita noutro — e nenhuma mensagem de erro dizia isso.
 */

const RAIZ = path.resolve(__dirname, "..", "..");

/** Onde o literal é legítimo: a própria definição e os dois scripts de disco. */
const PERMITIDOS = new Set([
  "tests/apoio/stack-local.ts",
  "scripts/backup-local.mjs",
  "scripts/restore-local.mjs",
  "tests/unit/c7r-container-em-um-lugar-so.test.ts",
]);

function arquivosComOLiteral(): string[] {
  let saida = "";
  try {
    saida = execFileSync(
      "git",
      ["grep", "-l", "supabase_db_aliviar" + "-conexao", "--", "tests", "scripts", "src"],
      { cwd: RAIZ, encoding: "utf8" },
    );
  } catch (erro) {
    // `git grep` sai com 1 quando não encontra nada — que é o caso feliz.
    const codigo = (erro as { status?: number }).status;
    if (codigo === 1) return [];
    throw erro;
  }
  return saida.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

describe("C7R · o contêiner do banco vem de um lugar só", () => {
  it("nenhum arquivo novo escreve o nome à mão", () => {
    const infratores = arquivosComOLiteral().filter((arquivo) => !PERMITIDOS.has(arquivo));
    expect(
      infratores,
      `estes arquivos voltaram a fixar o contêiner; use containerDoBanco():\n${infratores.join("\n")}`,
    ).toEqual([]);
  });

  it("sem variável, o padrão é a stack de sempre — nada muda para quem não a define", () => {
    const antes = process.env.SUPABASE_DB_CONTAINER;
    delete process.env.SUPABASE_DB_CONTAINER;
    try {
      expect(containerDoBanco()).toBe(CONTAINER_PADRAO);
    } finally {
      if (antes !== undefined) process.env.SUPABASE_DB_CONTAINER = antes;
    }
  });

  it("com a variável, é ela que manda — e é assim que a stack isolada é medida", () => {
    const antes = process.env.SUPABASE_DB_CONTAINER;
    process.env.SUPABASE_DB_CONTAINER = "supabase_db_outra_stack";
    try {
      expect(containerDoBanco()).toBe("supabase_db_outra_stack");
      expect(argumentosPsql("select 1")).toEqual([
        "exec",
        "supabase_db_outra_stack",
        "psql",
        "-U",
        "postgres",
        "-t",
        "-A",
        "-c",
        "select 1",
      ]);
    } finally {
      if (antes === undefined) delete process.env.SUPABASE_DB_CONTAINER;
      else process.env.SUPABASE_DB_CONTAINER = antes;
    }
  });

  it("o literal :54321 também mora num lugar só — o porteiro do E2E compara backendEsperado()", () => {
    // Exceções nominais: o helper (é a definição), o teste do env-guard (testa
    // o guard, não é porteiro) e verify-bundle-backend.mjs (protege o bundle de
    // produção CONTRA backend local — flexibilizá-lo abriria a porta que ele
    // fecha). Este próprio arquivo cita o literal para explicá-lo.
    const PERMITIDOS_54321 = new Set([
      "tests/apoio/stack-local.ts",
      "tests/unit/env-guard.test.ts",
      "tests/unit/c7r-container-em-um-lugar-so.test.ts",
      "scripts/verify-bundle-backend.mjs",
      "scripts/env-guard.mjs",
      "scripts/with-local-supabase.mjs",
    ]);
    let saida = "";
    try {
      saida = execFileSync("git", ["grep", "-l", ":543" + "21", "--", "tests", "scripts"], {
        cwd: RAIZ,
        encoding: "utf8",
      });
    } catch (erro) {
      const codigo = (erro as { status?: number }).status;
      if (codigo !== 1) throw erro;
    }
    const infratores = saida
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((arquivo) => !PERMITIDOS_54321.has(arquivo));
    expect(
      infratores,
      `estes arquivos fixam o backend :54321; use backendEsperado():\n${infratores.join("\n")}`,
    ).toEqual([]);
  });

  it("variável vazia ou só espaços não derruba a suíte para um contêiner inexistente", () => {
    const antes = process.env.SUPABASE_DB_CONTAINER;
    process.env.SUPABASE_DB_CONTAINER = "   ";
    try {
      expect(containerDoBanco()).toBe(CONTAINER_PADRAO);
    } finally {
      if (antes === undefined) delete process.env.SUPABASE_DB_CONTAINER;
      else process.env.SUPABASE_DB_CONTAINER = antes;
    }
  });
});
