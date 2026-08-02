#!/usr/bin/env node
// Apaga .next por inteiro — inclusive o cache do webpack. O cache é a razão de
// este script existir: um build incremental reaproveitou módulos compilados
// com o backend REMOTO embutido dentro de um build "local", e o login passou a
// falhar sem aviso. Build local determinístico começa do zero, sempre.
import { rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextDir = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), ".next");
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log(".next removido (build determinístico, sem cache de env anterior).");
} else {
  console.log(".next não existia — nada a limpar.");
}
