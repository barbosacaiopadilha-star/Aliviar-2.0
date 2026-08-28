#!/usr/bin/env node
/**
 * Gera as peças de papel da Curadoria em PDF a partir dos fontes em
 * `docs/rede/**.html`, e publica em `public/rede/` as que o Kit da Curadoria
 * oferece para download (ADR-075).
 *
 * Por que este script existe: as peças de `docs/rede/` nasceram sem gerador —
 * o PDF era produzido à mão e versionado ao lado do fonte. Foi assim que o
 * rótulo "Ficha do Assistido" (ADR-097) pôde divergir do arquivo por dias sem
 * que nada acusasse. Com o gerador, fonte e ativo voltam a ser a mesma coisa.
 *
 * O FONTE É O HTML. Aqui o PDF É versionado, ao contrário dos guias:
 * `public/rede/` é servido em produção, e a Vercel publica o que está no
 * repositório.
 *
 * **A saída é determinística de propósito.** O Chromium carimba a hora da
 * geração dentro do PDF; sem normalizar isso, cada corrida sujaria o Git com
 * cinco binários "modificados" sem que uma letra tivesse mudado. Com o carimbo
 * fixo, `git status` limpo depois de rodar significa: os PDFs conferem com os
 * fontes. É a própria conferência.
 *
 * As opções de impressão reproduzem byte a byte os PDFs que já estavam no
 * repositório (mesmo tamanho, mesma paginação) — não mexa nelas sem regerar
 * as peças e conferir a paginação.
 *
 *   node scripts/gerar-rede-pdf.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const FONTES = resolve("docs/rede");
const PUBLICO = resolve("public/rede");

/** O carimbo fixo que substitui a hora da geração. Ver o cabeçalho. */
const CARIMBO = "D:20260827000000+00'00'";

/**
 * fonte .html → nome do PDF, e se ele é publicado em `public/rede/`.
 *
 * A Folha da Mesa fica FORA do público por decisão do Fundador (22/08): é
 * instrumento de trabalho do Curador, impresso do repositório, nunca item de
 * download do cartão. O teste `tests/unit/kit-da-curadoria.test.ts` guarda
 * essa decisão do outro lado. O Ensaio Geral é preparação interna da equipe.
 */
const PECAS = [
  { fonte: "ficha-do-assistido.html", pdf: "Ficha-do-Assistido-Curadoria-Aliviar.pdf", publica: true },
  { fonte: "folha-da-mesa.html", pdf: "Folha-da-Mesa-Curadoria-Aliviar.pdf", publica: false },
  { fonte: "formulario-do-profissional.html", pdf: "Formulario-do-Profissional-Rede-Aliviar.pdf", publica: true },
  { fonte: "guia-da-primeira-rodada.html", pdf: "Guia-da-Primeira-Rodada-Curadoria-Aliviar.pdf", publica: true },
  { fonte: "roteiro-de-atendimento.html", pdf: "Roteiro-de-Atendimento-Aliviar.pdf", publica: true },
  {
    fonte: "ensaio/ensaio-geral.html",
    pdf: "ensaio/Ensaio-Geral-Curadoria-Aliviar.pdf",
    publica: false,
    // O Ensaio foi impresso com margem, ao contrário das outras cinco peças.
    // Sem isto ele reflui de 11 páginas para 9 — conferido em 28/08.
    margem: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  },
];

/** Troca a hora da geração pelo carimbo fixo e conta as páginas. */
function normalizar(bytes) {
  const texto = bytes.toString("latin1").replace(/D:\d{14}\+00'00'/g, CARIMBO);
  const paginas = (texto.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  return { conteudo: Buffer.from(texto, "latin1"), paginas };
}

/** Só escreve se o conteúdo mudou — binário igual não vira ruído no Git. */
function gravarSeMudou(caminho, conteudo) {
  if (existsSync(caminho) && readFileSync(caminho).equals(conteudo)) return false;
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
  return true;
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
let mudaram = 0;

for (const peca of PECAS) {
  await pagina.goto(pathToFileURL(resolve(FONTES, peca.fonte)).href, { waitUntil: "networkidle" });
  const { conteudo, paginas } = normalizar(
    await pagina.pdf({
      format: "A4",
      printBackground: true,
      ...(peca.margem ? { margin: peca.margem } : {}),
    }),
  );
  const mudou = gravarSeMudou(resolve(FONTES, peca.pdf), conteudo);
  if (peca.publica) gravarSeMudou(resolve(PUBLICO, peca.pdf), conteudo);
  if (mudou) mudaram += 1;
  console.log(
    `  ${mudou ? "✓" : "·"} ${peca.pdf} — ${paginas} página(s)` +
      `${peca.publica ? " · publicado" : " · só no repositório"}${mudou ? "" : " · sem mudança"}`,
  );
}

await navegador.close();
console.log(`\n${PECAS.length} peça(s) conferidas · ${mudaram} regravada(s).`);
