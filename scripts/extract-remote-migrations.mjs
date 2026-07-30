#!/usr/bin/env node
// Extração ÚNICA e descartável para a consolidação estrutural.
//
// Puxa o SQL exato das migrations do schema `curadoria` direto do banco
// remoto (a única fonte de verdade) e grava cada uma como arquivo em
// supabase/migrations/. O SQL vai do banco → este processo → arquivo, sem
// passar por transcrição humana. A fidelidade é verificada depois por md5.
//
// Lê a service role key do ambiente em tempo de execução; nunca a persiste.
// Não é parte do build nem do runtime da app — é ferramenta de manutenção.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const migrationsDir = resolve(projectRoot, "supabase", "migrations");

// .env.local, parse mínimo — sem depender de dotenv.
const env = {};
for (const line of readFileSync(resolve(projectRoot, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}
if (!/awdlmeykminwyifnygkm/.test(url)) {
  console.error(`URL inesperada (${url}). Esperado o projeto aliviar-2-prod.`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase.schema("curadoria").rpc("_export_migrations");
if (error) {
  console.error("Falha ao ler as migrations:", error.message);
  process.exit(1);
}

let escritos = 0;
for (const row of data) {
  const file = resolve(migrationsDir, `${row.version}_${row.name}.sql`);
  // Grava exatamente o statement, sem newline extra: o md5 do arquivo tem
  // que bater com md5(statements[1]) do banco.
  writeFileSync(file, row.sql, "utf8");
  console.log(`${row.version}_${row.name}.sql  (${row.sql.length} bytes)`);
  escritos += 1;
}

console.log(`\n${escritos} migrations extraídas para supabase/migrations/`);
