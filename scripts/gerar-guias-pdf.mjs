#!/usr/bin/env node
/**
 * Gera os guias operacionais em PDF a partir dos fontes em `docs/guias/*.html`.
 *
 * Usa o Chromium que o Playwright já traz para o E2E — nenhuma dependência
 * nova entra no projeto por causa de um PDF.
 *
 * O FONTE É O HTML, versionado. O PDF é produto: regenerável, e por isso não
 * versionado. Quem quiser corrigir uma frase corrige o HTML e roda de novo.
 *
 *   node scripts/gerar-guias-pdf.mjs
 */
import { readdirSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const FONTES = resolve("docs/guias");
const SAIDA = resolve("docs/guias/pdf");
mkdirSync(SAIDA, { recursive: true });

const arquivos = readdirSync(FONTES).filter((n) => n.endsWith(".html")).sort();
if (arquivos.length === 0) {
  console.error("Nenhum fonte .html em docs/guias/");
  process.exit(1);
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

for (const nome of arquivos) {
  const origem = pathToFileURL(resolve(FONTES, nome)).href;
  const destino = resolve(SAIDA, nome.replace(/\.html$/, ".pdf"));
  await pagina.goto(origem, { waitUntil: "networkidle" });
  // A folha entra INJETADA, não só pelo <link>: assim o PDF sai estilizado
  // mesmo se o arquivo for aberto por um caminho que não resolva o relativo.
  await pagina.addStyleTag({ content: readFileSync(resolve(FONTES, "_estilo.css"), "utf8") });
  await pagina.pdf({
    path: destino,
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      '<div style="width:100%;font-size:8px;color:#8d8779;padding:0 16mm;display:flex;justify-content:space-between;font-family:Georgia,serif">' +
      "<span>Aliviar Curadoria Médica — guia operacional</span>" +
      '<span class="pageNumber"></span></div>',
  });
  console.log("  ✓ " + nome.replace(/\.html$/, ".pdf"));
}

await navegador.close();
console.log(`\n${arquivos.length} guia(s) em docs/guias/pdf/`);
