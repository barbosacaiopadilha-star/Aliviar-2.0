#!/usr/bin/env node
/**
 * Confere um PDF gerado por `gerar-doc-pdf.mjs` extraindo o texto de volta.
 *
 * Existe porque conversor caseiro merece desconfiança: em 31/08 o primeiro PDF
 * enviado ao advogado saiu com asteriscos de negrito crus, e o defeito só
 * apareceu porque o texto foi lido de volta. Contar páginas não é conferir.
 *
 *   node scripts/conferir-pdf.mjs "docs/pdf/ARQUIVO.pdf" [termo esperado...]
 */
import { readFileSync } from "node:fs";
import { extractText, getDocumentProxy } from "unpdf";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error('uso: node scripts/conferir-pdf.mjs "docs/pdf/ARQUIVO.pdf" [termo...]');
  process.exit(1);
}
const BARRA = String.fromCharCode(92);
const { text, totalPages } = await extractText(
  await getDocumentProxy(new Uint8Array(readFileSync(arquivo))),
  { mergePages: true },
);

const barras = text.split(BARRA).length - 1;
// Negrito quebrado é `**` colado a letra. Marcador de nota de rodapé — `Não**`,
// `Não***` — nunca é seguido de letra, e por isso não entra na conta.
const negritoQuebrado = (text.match(/\*\*[A-Za-zÀ-ú]/g) ?? []).length;

let falhas = 0;
const linha = (ok, rot) => { if (!ok) falhas += 1; console.log(`  ${ok ? "OK   " : "FALHA"} · ${rot}`); };

console.log(`${arquivo} — ${totalPages} página(s), ${text.length} caracteres`);
linha(barras === 0, `nenhuma barra invertida crua (achadas: ${barras})`);
linha(negritoQuebrado === 0, `nenhum negrito quebrado (achados: ${negritoQuebrado})`);
for (const termo of process.argv.slice(3)) linha(text.includes(termo), `contém "${termo}"`);

process.exit(falhas ? 1 : 0);
