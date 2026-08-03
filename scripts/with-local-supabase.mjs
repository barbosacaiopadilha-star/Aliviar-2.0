#!/usr/bin/env node
/**
 * RUNNER LOCAL — roda um comando com o alvo da stack local injetado.
 *
 * Por que existe: `.env.local` aponta para um projeto hospedado, e vários
 * consumidores (Next em produção, setup da suíte de integração, seeds) o liam
 * como fonte. Injetar o alvo local no processo filho resolve na raiz: variável
 * de ambiente vence arquivo `.env` em todos eles, e nenhum arquivo do
 * repositório precisa ser editado.
 *
 * A validação acontece antes de qualquer processo filho existir.
 *
 * Uso:
 *   node scripts/with-local-supabase.mjs [--env CHAVE=VALOR ...] <comando> [args...]
 *
 * `--env` existe porque `CHAVE=valor comando` não funciona no PowerShell, e
 * este repositório roda em Windows.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { AmbienteBloqueadoError, resolverAlvoLocal } from "./env-guard.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);

// --env CHAVE=VALOR, repetível, sempre antes do comando.
const extras = {};
while (argv[0] === "--env") {
  const par = argv[1] ?? "";
  const separador = par.indexOf("=");
  if (separador <= 0) {
    console.error(`--env espera CHAVE=VALOR, recebeu "${par}".`);
    process.exit(1);
  }
  extras[par.slice(0, separador)] = par.slice(separador + 1);
  argv.splice(0, 2);
}

if (argv.length === 0) {
  console.error("Uso: node scripts/with-local-supabase.mjs <comando> [args...]");
  process.exit(1);
}

let alvo;
try {
  alvo = resolverAlvoLocal(`Comando local \`${argv.join(" ")}\``, { cwd: projectRoot });
} catch (erro) {
  if (erro instanceof AmbienteBloqueadoError) {
    console.error(erro.message);
    process.exit(1);
  }
  throw erro;
}

// FUN-01/SEG-05 (FRENTE D2): o endpoint de leads exige CRM_SITE_LEAD_SECRET
// em TODO ambiente — sem segredo ele responde 503, inclusive localmente. O
// caminho local ganha aqui um valor de teste fixo (não é credencial de nada
// real: só vale contra a stack local que este runner injeta), sem tocar
// `.env.local`. Quem já injetou um valor próprio no processo mantém o dele.
const CRM_SITE_LEAD_SECRET_LOCAL = "segredo-local-de-teste-crm-leads";

const filho = spawn(argv[0], argv.slice(1), {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    CRM_SITE_LEAD_SECRET: process.env.CRM_SITE_LEAD_SECRET ?? CRM_SITE_LEAD_SECRET_LOCAL,
    ...alvo,
    ...extras,
    ALIVIAR_AMBIENTE: "local",
  },
});

filho.on("exit", (codigo, sinal) => {
  if (sinal) {
    process.kill(process.pid, sinal);
    return;
  }
  process.exit(codigo ?? 0);
});
