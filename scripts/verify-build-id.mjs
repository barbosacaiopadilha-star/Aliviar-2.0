#!/usr/bin/env node
/**
 * O contrato do identificador de build, conferido logo após o build.
 *
 * Três valores precisam ser o MESMO:
 *   1. o que o runner fixou (.build-id, escrito por new-build-id.mjs);
 *   2. o que o Next gravou em disco (.next/BUILD_ID, via generateBuildId);
 *   3. o que foi embutido no bundle (NEXT_PUBLIC_BUILD_ID → /api/build-info).
 *
 * Este script confere 1 × 2 imediatamente — sem servidor. O terceiro é
 * conferido pelo porteiro de ambiente no início do E2E, contra o servidor
 * de verdade. A falha que motivou tudo isso: `Date.now()` avaliado duas
 * vezes pelo `next build` gerou DOIS ids na mesma construção, e o contrato
 * acusava contaminação de si mesmo.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function ler(caminho, nome) {
  try {
    return readFileSync(join(projectRoot, caminho), "utf-8").trim();
  } catch {
    console.error(`${nome} ausente (${caminho}) — o build não seguiu o procedimento oficial.`);
    process.exit(1);
  }
}

const doRunner = ler(".build-id", "Identidade do runner");
const emDisco = ler(".next/BUILD_ID", "BUILD_ID do Next");

if (doRunner !== emDisco) {
  console.error(
    `Identidade de build inconsistente:\n` +
      `  runner:  ${doRunner}\n` +
      `  .next:   ${emDisco}\n` +
      "O generateBuildId não leu o valor fixado — a construção avaliou fontes distintas.",
  );
  process.exit(1);
}

console.log(`Identidade de build íntegra: ${doRunner} (runner = .next/BUILD_ID).`);
