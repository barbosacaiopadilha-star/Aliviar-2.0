#!/usr/bin/env node
/**
 * Fixa a identidade desta construção, ANTES do build começar.
 *
 * O `next build` avalia `next.config.ts` mais de uma vez — processo principal
 * e worker de compilação. Um id derivado do relógio dentro do config produziria
 * valores diferentes na mesma construção, e o contrato de `/api/build-info`
 * acusaria "ambiente contaminado" onde não havia contaminação alguma.
 *
 * Quem decide o id é o runner, uma vez só. O config apenas lê.
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function commitCurto() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim().slice(0, 7);
  } catch {
    return "semgit";
  }
}

const id = `${commitCurto()}-${Date.now().toString(36)}`;
writeFileSync(join(projectRoot, ".build-id"), id);
console.log(`Identidade desta construção: ${id}`);
