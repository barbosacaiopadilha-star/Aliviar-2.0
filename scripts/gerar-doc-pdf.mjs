#!/usr/bin/env node
/**
 * Converte um documento Markdown de `docs/` em PDF apresentável — para enviar
 * a quem está fora do repositório (advogado, contador, parceiro).
 *
 * Por que existe: os guias já têm gerador porque nasceram em HTML. Os
 * documentos de `docs/*.md` não tinham nenhum, e a `MENSAGEM_PARA_ADVOGADO`
 * pede, por escrito, "a versão dele em PDF" — que ninguém tinha como produzir.
 *
 * **Não é um conversor de Markdown completo, e não deve virar um.** Cobre o
 * subconjunto que os documentos desta casa usam: títulos, ênfase, código,
 * listas, tabelas, citações e regras. Se um documento novo usar algo fora
 * disso, o certo é simplificar o documento — não engordar este script.
 *
 *   node scripts/gerar-doc-pdf.mjs docs/ARQUIVO.md [saida.pdf]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { chromium } from "playwright";

const entrada = process.argv[2];
if (!entrada) {
  console.error("uso: node scripts/gerar-doc-pdf.mjs docs/ARQUIVO.md [saida.pdf]");
  process.exit(1);
}
const saida = process.argv[3] ?? resolve("docs/pdf", basename(entrada).replace(/\.md$/, ".pdf"));

const escapar = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Ênfase, código e links — aplicados DEPOIS do escape, na ordem que não colide. */
function inline(t) {
  return escapar(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

function converter(md) {
  const linhas = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let lista = null; // "ul" | "ol"
  let tabela = null; // array de linhas cruas
  const fecharLista = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
  const fecharTabela = () => {
    if (!tabela) return;
    const celulas = (l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const cab = celulas(tabela[0]);
    const corpo = tabela.slice(2);
    out.push("<table><thead><tr>" + cab.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>");
    for (const l of corpo) {
      out.push("<tr>" + celulas(l).map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
    }
    out.push("</tbody></table>");
    tabela = null;
  };

  for (const linha of linhas) {
    if (/^\s*\|.*\|\s*$/.test(linha)) { fecharLista(); (tabela ??= []).push(linha.trim()); continue; }
    fecharTabela();

    if (!linha.trim()) { fecharLista(); continue; }
    if (/^---+$/.test(linha.trim())) { fecharLista(); out.push("<hr>"); continue; }

    const titulo = linha.match(/^(#{1,4})\s+(.*)$/);
    if (titulo) {
      fecharLista();
      const n = titulo[1].length;
      out.push(`<h${n}>${inline(titulo[2])}</h${n}>`);
      continue;
    }

    const citacao = linha.match(/^>\s?(.*)$/);
    if (citacao) { fecharLista(); out.push(`<blockquote>${inline(citacao[1])}</blockquote>`); continue; }

    const item = linha.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      if (lista !== "ul") { fecharLista(); out.push("<ul>"); lista = "ul"; }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    const numerado = linha.match(/^\s*\d+\.\s+(.*)$/);
    if (numerado) {
      if (lista !== "ol") { fecharLista(); out.push("<ol>"); lista = "ol"; }
      out.push(`<li>${inline(numerado[1])}</li>`);
      continue;
    }

    fecharLista();
    out.push(`<p>${inline(linha)}</p>`);
  }
  fecharLista();
  fecharTabela();
  return out.join("\n");
}

const ESTILO = `
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1E2A32; font-size: 10.5pt; line-height: 1.55; margin: 0; }
  h1 { font-size: 17pt; color: #24466B; margin: 0 0 4pt; page-break-after: avoid; }
  h2 { font-size: 13pt; color: #24466B; border-bottom: 1pt solid #D8CFC0; padding-bottom: 3pt; margin: 18pt 0 8pt; page-break-after: avoid; }
  h3 { font-size: 11.5pt; color: #A8813F; margin: 13pt 0 5pt; page-break-after: avoid; }
  h4 { font-size: 10.5pt; margin: 10pt 0 4pt; page-break-after: avoid; }
  p { margin: 0 0 7pt; }
  ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
  li { margin: 0 0 3pt; }
  hr { border: none; border-top: .75pt solid #D8CFC0; margin: 14pt 0; }
  blockquote { border-left: 2.5pt solid #A8813F; background: #F6F1E7; margin: 8pt 0; padding: 6pt 10pt; }
  blockquote p { margin: 0; }
  code { font-family: Consolas, "Courier New", monospace; font-size: 9.3pt; background: #F2EFE9; padding: 0 3pt; border-radius: 2pt; }
  table { border-collapse: collapse; width: 100%; font-size: 9.3pt; margin: 8pt 0; page-break-inside: avoid; }
  th, td { border: .7pt solid #B9AE9B; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #F6F1E7; }
  .capa { border-bottom: 2.5pt solid #A8813F; padding-bottom: 8pt; margin-bottom: 14pt; }
  .marca { font-size: 14pt; font-weight: bold; color: #24466B; }
  .marca small { color: #A8813F; font-weight: normal; font-style: italic; }
`;

const md = readFileSync(entrada, "utf8");
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapar(basename(entrada))}</title><style>${ESTILO}</style></head><body>
<div class="capa"><div class="marca">Aliviar <small>· Curadoria Médica Independente</small></div></div>
${converter(md)}
</body></html>`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(html, { waitUntil: "networkidle" });
mkdirSync(dirname(saida), { recursive: true });
const bruto = await pagina.pdf({
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<div></div>",
  footerTemplate:
    '<div style="width:100%;font-size:8px;color:#8d8779;padding:0 16mm;display:flex;justify-content:space-between;font-family:Georgia,serif">' +
    "<span>Aliviar Curadoria Médica</span><span class=\"pageNumber\"></span></div>",
});
await navegador.close();
// Carimbo fixo, como nos outros geradores: saída determinística.
writeFileSync(saida, Buffer.from(bruto.toString("latin1").replace(/D:\d{14}\+00'00'/g, "D:20260827000000+00'00'"), "latin1"));
const paginas = (readFileSync(saida).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`  ✓ ${saida} — ${paginas} página(s)`);
