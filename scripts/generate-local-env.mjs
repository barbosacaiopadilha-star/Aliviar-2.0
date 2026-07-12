#!/usr/bin/env node
// Gera .env.local a partir da stack Supabase local (CLI + Docker).
// Não imprime valores de credencial no terminal — só confirma sucesso/erro.

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const result = spawnSync("npx", ["supabase", "status", "-o", "env"], {
  cwd: projectRoot,
  encoding: "utf-8",
  shell: true,
});

if (result.status !== 0) {
  console.error(
    "Não foi possível ler o status da stack Supabase local. Ela está rodando? (npm run supabase:start)",
  );
  console.error(result.stderr?.trim() || "(sem detalhes adicionais)");
  process.exit(result.status ?? 1);
}

const values = {};
for (const line of result.stdout.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) {
    values[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
}

const apiUrl = values.API_URL;
const anonKey = values.ANON_KEY;

if (!apiUrl || !anonKey) {
  console.error(
    "Variáveis API_URL/ANON_KEY não encontradas na saída de `supabase status -o env`. Verifique a versão da CLI instalada.",
  );
  process.exit(1);
}

const envContent = `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n`;

writeFileSync(resolve(projectRoot, ".env.local"), envContent, "utf-8");

console.log(".env.local gerado a partir da stack Supabase local (valores não exibidos aqui).");
