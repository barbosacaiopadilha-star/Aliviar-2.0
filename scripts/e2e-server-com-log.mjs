#!/usr/bin/env node
/**
 * SERVIDOR DO E2E COM ESPELHO DE LOG — Release Gate 4, Parte 3.
 *
 * Por que existe: o `playwright.config.ts` já encaminha o stdout do servidor
 * (`stdout: "pipe"`) para o terminal — mas nenhum teste consegue LER esse
 * fluxo, e foi por isso que um erro estruturado emitido em TODA visita ao
 * /admin atravessou a suíte inteira sem falhar nada. Este wrapper não muda o
 * servidor em nada: sobe o mesmo `next start`, repassa stdout/stderr intactos
 * ao Playwright, e espelha cada pedaço em um arquivo que o globalTeardown
 * analisa ao final da execução (o gate de erros estruturados).
 *
 * O arquivo é truncado a cada subida: um servidor por execução (o
 * reuseExistingServer é false), um log por execução — nada de resíduo de
 * rodadas anteriores acusando erro de hoje.
 */

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ARQUIVO_DE_LOG = resolve(projectRoot, ".e2e-server.log");

const espelho = createWriteStream(ARQUIVO_DE_LOG, { flags: "w" });

const filho = spawn("npx", ["next", "start", "-p", "3001"], {
  cwd: projectRoot,
  shell: true,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

filho.stdout.on("data", (pedaço) => {
  process.stdout.write(pedaço);
  espelho.write(pedaço);
});
filho.stderr.on("data", (pedaço) => {
  process.stderr.write(pedaço);
  espelho.write(pedaço);
});

// O Playwright encerra o wrapper para derrubar o servidor — o repasse do
// sinal garante que o `next start` morre junto, sem processo órfão na 3001.
for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, () => {
    filho.kill(sinal);
  });
}

filho.on("exit", (codigo, sinal) => {
  espelho.end();
  if (sinal) {
    process.kill(process.pid, sinal);
    return;
  }
  process.exit(codigo ?? 0);
});
