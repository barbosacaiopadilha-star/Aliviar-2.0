#!/usr/bin/env node
// Verifica QUAL backend está incorporado ao bundle de `.next` (ETAPA 1 da
// Release de Reconstrução). Não confia no ambiente do processo: lê os
// artefatos que serão servidos (.next/server e .next/static) e procura por
// hosts de Supabase embutidos. `.next/cache` fica de fora de propósito — ele
// pode guardar strings de builds anteriores sem que elas sejam servidas; o
// que importa (e o que este script pega) é quando elas vazam para a saída.
//
// Uso: node scripts/with-local-supabase.mjs node scripts/verify-bundle-backend.mjs
//      (ou com o env remoto carregado, para validar um build remoto)
//
// Sai com código 1 quando: não há build; o host esperado não aparece; ou
// aparece QUALQUER host de Supabase diferente do esperado (bundle misto —
// exatamente o acidente de cache que motivou este script).

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = join(projectRoot, ".next");

const urlEsperada = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!urlEsperada) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ausente — rode sob o wrapper ou com o env do alvo carregado.");
  process.exit(1);
}
const hostEsperado = new URL(urlEsperada).host;

if (!existsSync(join(nextDir, "BUILD_ID"))) {
  console.error(`Nenhum build encontrado em ${nextDir}. Rode o build antes de verificar.`);
  process.exit(1);
}

// Hosts de Supabase reconhecíveis: projetos hospedados (<ref>.supabase.co) e
// stacks locais (127.0.0.1:<porta> / localhost:<porta> na URL da API).
const PADRAO_HOSTS = /(?:[a-z0-9]{18,22}\.supabase\.co|(?:127\.0\.0\.1|localhost):54321)/g;

const ALVOS = ["server", "static"].map((d) => join(nextDir, d)).filter(existsSync);

const encontrados = new Map(); // host -> [arquivos]
let arquivosLidos = 0;

function varrer(dir) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    const info = statSync(caminho);
    if (info.isDirectory()) {
      varrer(caminho);
      continue;
    }
    if (!/\.(js|mjs|cjs|json|html|rsc|body|txt)$/.test(nome)) continue;
    arquivosLidos += 1;
    const conteudo = readFileSync(caminho, "utf-8");
    for (const match of conteudo.matchAll(PADRAO_HOSTS)) {
      const host = match[0];
      if (!encontrados.has(host)) encontrados.set(host, []);
      const lista = encontrados.get(host);
      const relativo = caminho.slice(projectRoot.length + 1);
      if (lista.length < 5 && !lista.includes(relativo)) lista.push(relativo);
    }
  }
}

for (const alvo of ALVOS) varrer(alvo);

const hosts = [...encontrados.keys()];
const estranhos = hosts.filter((host) => host !== hostEsperado);

console.log(`Backend esperado: ${hostEsperado}`);
console.log(`Arquivos inspecionados: ${arquivosLidos}`);
for (const [host, arquivos] of encontrados) {
  const marca = host === hostEsperado ? "ok " : "ERRO";
  console.log(`  [${marca}] ${host} — ${arquivos.length}+ arquivo(s), ex.: ${arquivos[0]}`);
}

if (!hosts.includes(hostEsperado)) {
  console.error(
    `\nO host esperado (${hostEsperado}) não aparece no bundle. ` +
      "O build foi feito com outro env — refaça com o procedimento documentado (docs/AMBIENTES.md).",
  );
  process.exit(1);
}

if (estranhos.length > 0) {
  console.error(
    `\nBundle misto: além do esperado, o build carrega ${estranhos.join(", ")}. ` +
      "Causa típica: cache de build envenenado por um build anterior com outro env. " +
      "Correção: apague .next e rebuilde (`npm run build:local` já faz isso).",
  );
  process.exit(1);
}

console.log("\nBundle íntegro: um único backend, e é o esperado.");
