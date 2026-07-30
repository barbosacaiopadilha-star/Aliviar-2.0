#!/usr/bin/env node
/**
 * `supabase db reset`, com a porta trancada.
 *
 * `db reset` apaga e recria o banco inteiro. Contra a stack local é rotina;
 * contra um projeto hospedado seria irreversível — e a CLI aceita `--linked`
 * e `--db-url` justamente para apontar para fora.
 *
 * Esta guarda recusa qualquer forma de sair do local, antes de a CLI rodar.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { ehSupabaseLocal, PROJETOS_PROIBIDOS, refDoProjeto } from "./env-guard.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);

const PROIBIDAS = ["--linked", "--project-ref"];

for (const flag of PROIBIDAS) {
  if (argv.some((arg) => arg === flag || arg.startsWith(`${flag}=`))) {
    console.error(
      `Reset bloqueado: \`${flag}\` aponta a CLI para um projeto hospedado. ` +
        "`db reset` apaga o banco inteiro e só roda contra a stack local.",
    );
    process.exit(1);
  }
}

const indiceDbUrl = argv.findIndex((arg) => arg === "--db-url" || arg.startsWith("--db-url="));
if (indiceDbUrl >= 0) {
  const bruto = argv[indiceDbUrl];
  const valor = bruto.includes("=") ? bruto.split("=").slice(1).join("=") : argv[indiceDbUrl + 1];
  let host = "";
  try {
    host = new URL(valor).hostname;
  } catch {
    host = "(inválida)";
  }
  if (!ehSupabaseLocal(`http://${host}`)) {
    console.error(
      `Reset bloqueado: --db-url aponta para ${host}. ` +
        "`db reset` apaga o banco inteiro e só roda contra a stack local.",
    );
    process.exit(1);
  }
}

// A CLI também aceita o alvo por ambiente.
for (const nome of ["SUPABASE_DB_URL", "SUPABASE_PROJECT_REF", "SUPABASE_URL"]) {
  const valor = process.env[nome];
  if (!valor) continue;
  const ref = refDoProjeto(valor) ?? (PROJETOS_PROIBIDOS[valor] ? valor : null);
  if (ref && PROJETOS_PROIBIDOS[ref]) {
    console.error(
      `Reset bloqueado: ${nome} aponta para o projeto ${ref} (${PROJETOS_PROIBIDOS[ref]}).`,
    );
    process.exit(1);
  }
}

const filho = spawn("npx", ["supabase", "db", "reset", ...argv], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

filho.on("exit", (codigo) => process.exit(codigo ?? 0));
