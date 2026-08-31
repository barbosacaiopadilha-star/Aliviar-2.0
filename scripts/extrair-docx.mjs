#!/usr/bin/env node
/**
 * Extrai o texto de um `.docx` para Markdown legível.
 *
 * Existe porque os cinco documentos do advogado chegaram em `.docx` e precisam
 * viver no repositório: **documento jurídico que só existe no e-mail some com o
 * e-mail.** O `.docx` fica guardado como está (é o original assinado pelo
 * escritório); este script produz a versão que se lê, se compara e se publica.
 *
 * Um `.docx` é um zip com `word/document.xml`. Não há dependência nova: usa o
 * `unzip` do sistema e trata o XML pelo que ele é — parágrafos (`w:p`), quebras
 * (`w:br`) e trechos de texto (`w:t`). Negrito e itálico são descartados de
 * propósito: o que importa aqui é o TEXTO, e ênfase mal convertida em documento
 * jurídico é pior que ênfase nenhuma.
 *
 *   node scripts/extrair-docx.mjs "arquivo.docx" [saida.md]
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node scripts/extrair-docx.mjs "arquivo.docx" [saida.md]');
  process.exit(1);
}
const saida = process.argv[3] ?? entrada.replace(/\.docx$/i, ".md");

const xml = execFileSync("unzip", ["-p", entrada, "word/document.xml"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

const desescapar = (t) =>
  t
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Um parágrafo do Word vira uma linha; `w:br` vira quebra dentro dele. */
const paragrafos = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m) => {
  const bloco = m[0].replace(/<w:br\s*\/?>/g, "\n");
  const texto = [...bloco.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
    .map((t) => desescapar(t[1]))
    .join("");
  return texto.replace(/[ \t]+/g, " ").trim();
});

// Parágrafos vazios consecutivos viram uma linha em branco só.
const linhas = [];
for (const p of paragrafos) {
  if (!p && !linhas.length) continue;
  if (!p && !linhas[linhas.length - 1]) continue;
  linhas.push(p);
}
while (linhas.length && !linhas[linhas.length - 1]) linhas.pop();

const md = linhas.join("\n\n") + "\n";
mkdirSync(dirname(resolve(saida)), { recursive: true });
writeFileSync(saida, md);
console.log(`  ✓ ${basename(saida)} — ${linhas.filter(Boolean).length} parágrafos, ${md.length} caracteres`);
