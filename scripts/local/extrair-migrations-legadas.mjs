// R2.1 — recupera, do ledger de produção, o SQL das migrations aplicadas cujo
// arquivo não existe mais no repositório.
//
// A fonte é `supabase_migrations.schema_migrations.statements` — o SQL que de
// fato rodou. É melhor que o histórico do Git: lá existiam versões com outro
// timestamp e conteúdo possivelmente divergente; aqui há identidade.
//
// Este script NÃO inventa conteúdo, NÃO moderniza SQL e NÃO acrescenta
// idempotência. Recupera o artefato histórico como ele é.
//
//   uso: node scripts/local/extrair-migrations-legadas.mjs <dump.sql> <destino>

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DUMP = process.argv[2];
const DEST = process.argv[3];
if (!DUMP || !DEST) throw new Error("uso: <dump.sql> <destino>");

const ALVOS = [
  "20260723010436",
  "20260723010607",
  "20260723035914",
  "20260723035932",
  "20260723040002",
  "20260723040249",
  "20260723040421",
  "20260723040524",
  "20260723040602",
  "20260723040653",
  "20260723040729",
  "20260723040754",
];

const bruto = readFileSync(DUMP, "utf-8");
const inicio = bruto.indexOf('INSERT INTO "supabase_migrations"."schema_migrations"');
if (inicio === -1) throw new Error("bloco INSERT de schema_migrations não encontrado");

const corpo = bruto.slice(bruto.indexOf("VALUES", inicio) + "VALUES".length);

/**
 * Tokeniza uma tupla `(...)` do dump respeitando strings SQL — aspas simples
 * escapadas por duplicação. Parsing por regex quebraria em qualquer SQL que
 * contenha vírgula ou parêntese dentro de string, e essas migrations contêm.
 */
function lerTupla(texto, i) {
  const campos = [];
  let atual = "";
  let emString = false;
  while (i < texto.length) {
    const ch = texto[i];
    if (emString) {
      if (ch === "'") {
        if (texto[i + 1] === "'") {
          atual += "'";
          i += 2;
          continue;
        }
        emString = false;
        i += 1;
        continue;
      }
      atual += ch;
      i += 1;
      continue;
    }
    if (ch === "'") {
      emString = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      campos.push(atual.trim());
      atual = "";
      i += 1;
      continue;
    }
    if (ch === ")") {
      campos.push(atual.trim());
      return { campos, fim: i + 1 };
    }
    atual += ch;
    i += 1;
  }
  throw new Error("tupla não terminada");
}

const registros = new Map();
let i = 0;
while (i < corpo.length) {
  const abre = corpo.indexOf("(", i);
  if (abre === -1) break;
  // Fim do bloco INSERT.
  if (corpo.slice(i, abre).includes(";")) break;
  const { campos, fim } = lerTupla(corpo, abre + 1);
  i = fim;
  const [version, statements, name] = campos;
  if (ALVOS.includes(version)) registros.set(version, { statements, name });
}

/** O campo vem como array literal do Postgres: {"stmt"} — sempre 1 elemento aqui. */
function extrairSql(arrayLiteral) {
  const s = arrayLiteral.trim();
  if (!s.startsWith("{")) return s;
  const interno = s.slice(1, -1).trim();
  if (!interno.startsWith('"')) return interno;
  // Desfaz o escape de array do Postgres: \" e \\
  return interno.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

const CABECALHO = [
  "-- RECUPERADA DO LEDGER DE PRODUÇÃO (R2.1).",
  "--",
  "-- Esta migration foi aplicada em produção e seu arquivo não existia mais no",
  "-- repositório. O SQL abaixo é o conteúdo exato registrado em",
  "-- supabase_migrations.schema_migrations.statements — o que de fato rodou.",
  "--",
  "-- Nada foi modernizado, reescrito ou tornado idempotente: é o artefato",
  "-- histórico, restaurado para que o repositório volte a descrever o banco.",
  "--",
  "-- Opera no schema `public`, da arquitetura anterior à Curadoria. Por isso",
  "-- vive aqui, junto das demais legadas, e NÃO em supabase/migrations/ — onde",
  "-- quebraria o `db reset`, que não recria o schema `public`.",
  "",
].join("\n");

let escritos = 0;
for (const version of ALVOS) {
  const r = registros.get(version);
  if (!r) {
    console.log(`FALTA   ${version}`);
    continue;
  }
  const arquivo = path.join(DEST, `${version}_${r.name}.sql`);
  if (existsSync(arquivo)) {
    console.log(`EXISTE  ${path.basename(arquivo)} — não sobrescrito`);
    continue;
  }
  const sql = extrairSql(r.statements);
  writeFileSync(arquivo, `${CABECALHO}${sql}\n`, "utf-8");
  console.log(`ESCRITA ${path.basename(arquivo)} (${sql.length} chars)`);
  escritos += 1;
}

console.log(`\n${escritos} de ${ALVOS.length} recuperadas em ${DEST}`);
