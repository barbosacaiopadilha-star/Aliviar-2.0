#!/usr/bin/env node
/**
 * OS BYTES DOS ANEXOS — a metade que faltava ao backup de produção.
 *
 * O `storage-index.sql` guarda o REGISTRO dos arquivos; os bytes vivem num
 * serviço à parte, que `pg_dump` não alcança. Restaurar só o índice devolve um
 * banco que sabe que os laudos existem e não tem nenhum deles — o pior tipo de
 * backup, porque parece completo e só falha quando alguém abre o anexo.
 *
 * A lista vem do índice JÁ CAPTURADO, nunca de uma consulta nova: assim os
 * bytes correspondem ao mesmo instante do dump, e não a um estado posterior
 * que ninguém registrou.
 *
 * A chave nunca é impressa, nem dentro de mensagem de erro — por isso o que se
 * mostra de uma falha é o status HTTP, e não o corpo da resposta, que pode
 * ecoar o cabeçalho enviado.
 *
 *   node scripts/backup-anexos.mjs [destino]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REF = "awdlmeykminwyifnygkm";
const destino = process.argv[2] ?? join(projectRoot, ".backups");
const indice = join(destino, "storage-index.sql");

if (!existsSync(indice)) {
  console.error(`Não achei ${indice}. Capture o índice do storage antes.`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(join(projectRoot, ".env.backup.local"), "utf8")
    .split(/\r?\n/)
    .filter((linha) => linha.includes("=") && !linha.startsWith("#"))
    .map((linha) => [linha.slice(0, linha.indexOf("=")), linha.slice(linha.indexOf("=") + 1)]),
);

const chave = env.SUPABASE_SERVICE_ROLE_KEY_PROD;
if (!chave || chave.includes("<")) {
  console.error("SUPABASE_SERVICE_ROLE_KEY_PROD ausente ou ainda com o marcador.");
  process.exit(1);
}

/** Lê o bloco COPY do índice. Puro: não toca em rede nem em disco. */
function objetosDoIndice(sql) {
  const linhas = sql.split(/\r?\n/);
  const cabecalho = linhas.findIndex((l) => l.startsWith("COPY storage.objects ("));
  if (cabecalho < 0) return [];

  const colunas = linhas[cabecalho]
    .slice(linhas[cabecalho].indexOf("(") + 1, linhas[cabecalho].lastIndexOf(")"))
    .split(",")
    .map((c) => c.trim());
  const iBucket = colunas.indexOf("bucket_id");
  const iNome = colunas.indexOf("name");
  if (iBucket < 0 || iNome < 0) return [];

  const objetos = [];
  for (let k = cabecalho + 1; k < linhas.length && linhas[k] !== "\\."; k += 1) {
    const campos = linhas[k].split("\t");
    if (campos.length <= Math.max(iBucket, iNome)) continue;
    objetos.push({ bucket: campos[iBucket], nome: campos[iNome] });
  }
  return objetos;
}

const objetos = objetosDoIndice(readFileSync(indice, "utf8"));
console.log(`${objetos.length} objeto(s) no índice.\n`);

const pasta = join(destino, "storage");
mkdirSync(pasta, { recursive: true });

let baixados = 0;
let bytes = 0;
const falhas = [];

for (const { bucket, nome } of objetos) {
  const caminhoUrl = nome.split("/").map(encodeURIComponent).join("/");
  const url = `https://${REF}.supabase.co/storage/v1/object/${bucket}/${caminhoUrl}`;
  try {
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${chave}`, apikey: chave },
    });
    if (!resposta.ok) {
      falhas.push(`${bucket}/${nome} — HTTP ${resposta.status}`);
      continue;
    }
    const conteudo = Buffer.from(await resposta.arrayBuffer());
    const caminho = join(pasta, bucket, nome);
    mkdirSync(dirname(caminho), { recursive: true });
    writeFileSync(caminho, conteudo);
    baixados += 1;
    bytes += conteudo.length;
    console.log(`  ${bucket}/${nome} — ${(conteudo.length / 1024).toFixed(0)} KB`);
  } catch (erro) {
    falhas.push(`${bucket}/${nome} — ${erro.name}`);
  }
}

console.log(`\n${baixados} de ${objetos.length} baixados — ${(bytes / 1024 / 1024).toFixed(1)} MB`);

if (falhas.length > 0) {
  console.log("\nNÃO baixados — o backup segue PARCIAL e o manifesto precisa dizer isso:");
  for (const falha of falhas) console.log(`  · ${falha}`);
}

process.exit(falhas.length > 0 ? 1 : 0);
