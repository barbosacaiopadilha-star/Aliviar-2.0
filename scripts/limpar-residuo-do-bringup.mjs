#!/usr/bin/env node
/**
 * LIMPA O RESÍDUO DO BRING-UP DE PRODUÇÃO — SIM-35.
 *
 * Entre 22 e 24/07/2026, nas primeiras 36 horas de vida do projeto de
 * produção, `scripts/local/validate-e2e-real.mjs` rodou apontado para lá e
 * deixou contas e anexos sintéticos. A causa está sanada desde 27/07 por duas
 * guardas independentes (`assertLocalSupabase` no Playwright e a allowlist de
 * `validation-guard.mjs`, que marca produção como `autorizavel: false`).
 *
 * O que sobrou é sujeira que inflaciona todo número que alguém cite sobre
 * produção: parece que há 47 contas e 28 documentos; há 7 e 9.
 *
 * POR QUE ESTE SCRIPT É PARANOICO
 *
 * Ele apaga dado de PRODUÇÃO. Um erro aqui não tem desfazer pela interface —
 * tem só o backup de 25/08, e restaurar um backup inteiro para desfazer uma
 * linha errada é um remédio pior que a doença.
 *
 * Por isso ele nunca decide sozinho o que é resíduo. Cada candidato passa por
 * duas provas independentes, e QUALQUER falha aborta a execução inteira, não
 * só aquele item:
 *
 *   1. a conta tem o padrão sintético `@validation.aliviar.local`; e
 *   2. a conta NÃO tem `profile` — ou seja, nada do Método pende dela.
 *
 * A segunda prova é a que importa. O padrão de e-mail é convenção e convenção
 * se quebra; a ausência de `profile` é fato do banco. Se um dia alguém real
 * for cadastrado com um e-mail parecido, é a prova 2 que segura.
 *
 * Anexos: só some o objeto cuja pasta-raiz não corresponde a nenhum `profile`.
 * Um arquivo sob profile real jamais é tocado, tenha o nome que tiver.
 *
 * Roda em ensaio por padrão. Para valer, exige `--executar`.
 *
 *   node scripts/limpar-residuo-do-bringup.mjs            (ensaio)
 *   node scripts/limpar-residuo-do-bringup.mjs --executar (para valer)
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REF = "awdlmeykminwyifnygkm";
const BASE = `https://${REF}.supabase.co`;
const PADRAO_SINTETICO = /@validation\.aliviar\.local$/;

const executar = process.argv.includes("--executar");

const arquivoEnv = join(projectRoot, ".env.backup.local");
if (!existsSync(arquivoEnv)) {
  console.error("Não achei .env.backup.local. Rode o configurador do backup antes.");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(arquivoEnv, "utf8")
    .split(/\r?\n/)
    .filter((linha) => linha.includes("=") && !linha.startsWith("#"))
    .map((linha) => [linha.slice(0, linha.indexOf("=")), linha.slice(linha.indexOf("=") + 1)]),
);

const chave = env.SUPABASE_SERVICE_ROLE_KEY_PROD;
if (!chave || chave.includes("<")) {
  console.error("SUPABASE_SERVICE_ROLE_KEY_PROD ausente ou ainda com o marcador.");
  process.exit(1);
}

const cabecalhos = { Authorization: `Bearer ${chave}`, apikey: chave };

/** Um backup recente é pré-condição, não recomendação. */
const backup = join(projectRoot, ".backups", "curadoria.sql");
if (!existsSync(backup)) {
  console.error(
    "ABORTADO: não existe .backups/curadoria.sql.\n" +
      "Este script apaga dado de produção e não roda sem uma cópia para voltar.",
  );
  process.exit(1);
}

async function api(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE}${caminho}`, {
    ...opcoes,
    headers: { ...cabecalhos, ...(opcoes.headers ?? {}) },
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${caminho}`);
  return resposta.status === 204 ? null : resposta.json();
}

console.log(executar ? "\nMODO: EXECUÇÃO REAL\n" : "\nMODO: ENSAIO — nada será apagado\n");

// --- quem é real, segundo o banco e não segundo o nome -----------------------
// `Accept-Profile` porque `profiles` mora no schema `curadoria`, e o PostgREST
// só serve `public` sem ele — um 404 aqui não é "não existe", é "outro schema".
const profiles = await api("/rest/v1/profiles?select=id", {
  headers: { "Accept-Profile": "curadoria" },
});
const idsReais = new Set(profiles.map((p) => p.id));

/**
 * DUAS RAÍZES, NÃO UMA — e isto quase custou seis documentos.
 *
 * `patient-documents` guarda pastas por `profiles.id`; `professional-documents`
 * guarda por `professional_profiles.id`, que é OUTRA tabela e outro id. A
 * primeira versão deste script conhecia só a primeira raiz e classificou os
 * seis documentos profissionais reais — CRMs, diplomas, certificados de
 * especialidade — como órfãos. O ensaio mostrou 25 candidatos onde deviam ser
 * 19, e foi essa diferença de seis que denunciou.
 *
 * É a razão de o ensaio ser o padrão e a execução exigir uma flag.
 */
const profissionais = await api("/rest/v1/professional_profiles?select=id", {
  headers: { "Accept-Profile": "curadoria" },
});
const idsProtegidos = new Set([...idsReais, ...profissionais.map((p) => p.id)]);

console.log(
  `${idsReais.size} profile(s) e ${profissionais.length} perfil(is) profissional(is) — todos intocáveis.`,
);

// --- contas -----------------------------------------------------------------
const { users } = await api("/auth/v1/admin/users?per_page=1000");
const candidatas = users.filter(
  (u) => PADRAO_SINTETICO.test(u.email ?? "") && !idsReais.has(u.id),
);
const suspeitas = users.filter(
  (u) => PADRAO_SINTETICO.test(u.email ?? "") && idsReais.has(u.id),
);

if (suspeitas.length > 0) {
  console.error(
    `\nABORTADO: ${suspeitas.length} conta(s) com padrão sintético TÊM profile.\n` +
      "As duas provas discordam, e quando isso acontece a resposta é parar — não escolher uma.",
  );
  process.exit(1);
}

console.log(`${candidatas.length} conta(s) sintética(s) sem profile.`);

// --- anexos -----------------------------------------------------------------
//
// O BUCKET NÃO TEM DOIS NÍVEIS — e foi isso que abortou a execução de 25/08.
//
// A versão anterior listava a raiz, listava uma vez dentro de cada pasta, e
// tratava TUDO o que voltasse como objeto. Mas o app grava mais fundo:
// `patient-document-repository.ts` escreve tanto `<profile>/<arquivo>` quanto
// `<profile>/received/<caseId>/<arquivo>`. Ao encontrar uma PASTA no segundo
// nível, o script montava o caminho dela e mandava DELETE — e a API devolveu
// `HTTP 400`, porque pasta não é objeto.
//
// O efeito foi o desenho paranoico funcionando: abortou na primeira falha,
// antes de apagar coisa alguma. Produção ficou intacta, e o ensaio seguinte
// confirmou os mesmos 39 e 19.
//
// Agora a descida é RECURSIVA e não presume profundidade nenhuma.
//
// A distinção pasta/objeto é feita pelo FATO, não pela convenção: uma entrada
// que, usada como prefixo, devolve filhos, é pasta; uma que não devolve nada é
// objeto. O Storage também marca pseudo-pasta com `id` nulo, e teria sido mais
// barato ler esse campo — mas convenção de API é coisa que muda de versão sem
// avisar, e aqui o preço de ler errado é apagar produção. Uma chamada a mais
// por objeto, num script que roda uma vez, é troco.
async function objetosSob(bucket, prefixo) {
  const entradas = await api(`/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: prefixo, limit: 1000 }),
  });

  const encontrados = [];
  for (const entrada of entradas) {
    const caminho = prefixo ? `${prefixo}/${entrada.name}` : entrada.name;
    const filhos = await objetosSob(bucket, caminho);
    if (filhos.length > 0) encontrados.push(...filhos);
    else encontrados.push(caminho);
  }
  return encontrados;
}

const orfaos = [];
for (const bucket of ["patient-documents", "professional-documents"]) {
  const raiz = await api(`/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "", limit: 1000 }),
  });
  for (const pasta of raiz) {
    if (idsProtegidos.has(pasta.name)) continue; // pasta de gente real: nem olha dentro
    for (const caminho of await objetosSob(bucket, pasta.name)) {
      orfaos.push({ bucket, caminho });
    }
  }
}
console.log(`${orfaos.length} objeto(s) em pasta que não é de nenhum profile.`);

if (!executar) {
  // O ENSAIO DIZ O QUE VAI APAGAR, e não só quantos.
  //
  // Na tentativa de 25/08 o ensaio disse "19 objetos" e a execução abortou no
  // primeiro DELETE: o script tinha montado caminho de PASTA e ninguém tinha
  // como saber, porque o número estava certo e o caminho não aparecia. Contar
  // não é conferir — quem autoriza apagar produção precisa ver o que assina.
  console.log("\nOs objetos, um por linha:");
  for (const { bucket, caminho } of orfaos) console.log(`  ${bucket}/${caminho}`);

  console.log("\nAs contas, uma por linha:");
  for (const conta of candidatas) console.log(`  ${conta.email}`);

  console.log("\nEnsaio terminado. Nada foi apagado.");
  console.log("Para valer:  node scripts/limpar-residuo-do-bringup.mjs --executar\n");
  process.exit(0);
}

// --- execução ---------------------------------------------------------------
let apagados = 0;
for (const { bucket, caminho } of orfaos) {
  await api(`/storage/v1/object/${bucket}/${caminho.split("/").map(encodeURIComponent).join("/")}`, {
    method: "DELETE",
  });
  apagados += 1;
}
console.log(`${apagados} anexo(s) apagado(s).`);

let contas = 0;
for (const conta of candidatas) {
  await api(`/auth/v1/admin/users/${conta.id}`, { method: "DELETE" });
  contas += 1;
}
console.log(`${contas} conta(s) apagada(s).`);

console.log("\nPronto. Confira os números novos antes de citar qualquer um deles.\n");
