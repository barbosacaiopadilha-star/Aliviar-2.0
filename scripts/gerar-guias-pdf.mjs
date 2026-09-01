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
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const FONTES = resolve("docs/guias");
const SAIDA = resolve("docs/guias/pdf");
const PUBLICO = resolve("public/guias");
mkdirSync(SAIDA, { recursive: true });
mkdirSync(PUBLICO, { recursive: true });

/**
 * 28/08 · OS GUIAS PASSAM A SER BAIXÁVEIS, a pedido do Fundador. Até aqui o PDF
 * era só produto local — `docs/guias/pdf/` é ignorado pelo Git — e os dez guias
 * não existiam em lugar nenhum além do disco de quem os gerava.
 *
 * Em `public/guias/` eles ganham nome de gente: o fonte se chama
 * `2-supervisor.html` porque o número é a ORDEM DE LEITURA, mas quem baixa quer
 * `Guia-do-Supervisor-Aliviar.pdf` no computador. A ordem vive no cartão do
 * Kit, não no nome do arquivo.
 *
 * Guia que não estiver neste mapa não é publicado, e a ausência é a decisão.
 */
const PUBLICADOS = {
  "1-administrador.html": "Guia-do-Administrador-Aliviar.pdf",
  "2-supervisor.html": "Guia-do-Supervisor-Aliviar.pdf",
  "3-curador.html": "Guia-do-Curador-Aliviar.pdf",
  "4-acompanhamento.html": "Guia-do-Acompanhamento-Aliviar.pdf",
  "5-assistido.html": "Guia-do-Assistido-Aliviar.pdf",
  "6-roteiro-do-supervisor.html": "Roteiro-do-Supervisor-Conversa-Aliviar.pdf",
  "7-roteiro-do-curador.html": "Roteiro-do-Curador-Aliviar.pdf",
  "8-roteiro-do-acompanhamento.html": "Roteiro-do-Acompanhamento-Aliviar.pdf",
  "9-para-voce-que-comecou.html": "Para-Voce-Que-Comecou-Aliviar.pdf",
  "10-o-que-e-a-aliviar.html": "O-Que-E-a-Aliviar.pdf",
  "11-como-ler-o-curriculo.html": "Como-Ler-o-Curriculo-de-um-Medico-Aliviar.pdf",
};

/** Carimbo fixo — mesma razão do gerador de rede: saída determinística. */
const CARIMBO = "D:20260827000000+00'00'";

/** Só escreve se mudou; binário igual não vira ruído no Git. */
function gravarSeMudou(caminho, conteudo) {
  if (existsSync(caminho) && readFileSync(caminho).equals(conteudo)) return false;
  writeFileSync(caminho, conteudo);
  return true;
}

const arquivos = readdirSync(FONTES).filter((n) => n.endsWith(".html")).sort();
if (arquivos.length === 0) {
  console.error("Nenhum fonte .html em docs/guias/");
  process.exit(1);
}

/**
 * Quantos foram REGRAVADOS — não quantos foram conferidos.
 *
 * Até 01/09 este gerador imprimia `✓` para os onze, tivessem mudado ou não.
 * Ele já gravava só o que mudou; o que faltava era **dizer**. O efeito prático
 * apareceu numa pergunta do Fundador — *"todos os guias e seus PDFs foram
 * atualizados?"* —: o `✓` não servia de resposta, e a prova teve de vir do
 * `git status`. **Ferramenta que não distingue "fiz" de "conferi" convida a
 * acreditar em trabalho que não aconteceu** (lição 16). O gerador de rede já
 * reportava assim; este passa a reportar igual.
 */
let mudaram = 0;

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

for (const nome of arquivos) {
  const origem = pathToFileURL(resolve(FONTES, nome)).href;
  const destino = resolve(SAIDA, nome.replace(/\.html$/, ".pdf"));
  await pagina.goto(origem, { waitUntil: "networkidle" });
  // A folha entra INJETADA, não só pelo <link>: assim o PDF sai estilizado
  // mesmo se o arquivo for aberto por um caminho que não resolva o relativo.
  await pagina.addStyleTag({ content: readFileSync(resolve(FONTES, "_estilo.css"), "utf8") });
  const bruto = await pagina.pdf({
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
  const conteudo = Buffer.from(
    bruto.toString("latin1").replace(/D:\d{14}\+00'00'/g, CARIMBO),
    "latin1",
  );
  // O destino local e a cópia publicada são dois arquivos: qualquer um dos
  // dois fora de dia já conta como regravação — senão o relatório diria
  // "sem mudança" com a cópia de `public/` atrasada.
  const mudouLocal = gravarSeMudou(destino, conteudo);
  const publicado = PUBLICADOS[nome];
  const mudouPublicado = publicado ? gravarSeMudou(resolve(PUBLICO, publicado), conteudo) : false;
  const mudou = mudouLocal || mudouPublicado;
  if (mudou) mudaram += 1;

  const paginas = (conteudo.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(
    `  ${mudou ? "✓" : "·"} ${nome.replace(/\.html$/, ".pdf")} — ${paginas} página(s)` +
      (publicado ? ` · publicado como ${publicado}` : " · só local") +
      (mudou ? "" : " · sem mudança"),
  );
}

await navegador.close();
console.log(`\n${arquivos.length} guia(s) conferido(s) · ${mudaram} regravado(s) · saída em ${SAIDA}`);
