#!/usr/bin/env node
/**
 * BACKUP DE PRODUÇÃO — REC-01.
 *
 * POR QUE ISTO EXISTE. O `backup-local.mjs` afirma, no próprio cabeçalho, que
 * "o backup de produção é responsabilidade do provedor (PITR gerenciado)".
 * Em 25/08/2026 essa premissa foi verificada e é FALSA: a organização
 * `aliviar-alpha` está no plano **free** do Supabase, que não oferece backup
 * automático nem PITR. O banco de produção tinha, naquele instante, 47 contas,
 * 6 histórias enviadas, 3 profissionais reais publicados e 28 arquivos — e
 * nenhum ponto de recuperação, de nenhum tipo.
 *
 * Enquanto o plano não mudar, ESTE script é o único ponto de recuperação que
 * existe. Isso é dito aqui para que ninguém o confunda com uma conveniência.
 *
 * ---
 *
 * O QUE ELE COBRE (as mesmas quatro peças do backup local, pelas mesmas razões):
 *   1. `curadoria`      — o dado clínico e operacional, com GRANTs;
 *   2. `auth`           — as contas; sem elas o restore devolve dados que
 *                         ninguém acessa;
 *   3. índice do storage — `storage.buckets` + `storage.objects`;
 *   4. os BYTES         — metadado sem byte é índice apontando para o vazio.
 *
 * O QUE ELE NÃO COBRE, e diz em voz alta ao terminar: segredos e variáveis de
 * ambiente (vivem no provedor), e a configuração do projeto (plano, PITR,
 * rede). Os dois precisam de procedimento próprio.
 *
 * ---
 *
 * DUAS DECISÕES DE SEGURANÇA, DELIBERADAS:
 *
 * · **Credencial nunca é argumento nem aparece em log.** Vem de
 *   `.env.backup.local` (ignorado pelo Git). Argumento de linha de comando
 *   vaza para o histórico do shell e para a lista de processos.
 *
 * · **Guarda INVERTIDA.** O `backup-local.mjs` recusa apontar para produção;
 *   este recusa apontar para o LOCAL. Um "backup de produção" que
 *   silenciosamente copiou a máquina de desenvolvimento é o pior falso
 *   sucesso possível: a pasta existe, tem tamanho, tem manifesto — e não
 *   protege nada.
 *
 * PG 17. O servidor hospedado roda PostgreSQL 17.6 e o `pg_dump` da stack
 * local é 15.8 — e `pg_dump` recusa servidor mais novo que ele. Por isso o
 * dump roda numa imagem `postgres:17-alpine` descartável, e não no container
 * local.
 *
 *   node scripts/backup-producao.mjs [destino]
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARQUIVO_DE_CREDENCIAIS = join(projectRoot, ".env.backup.local");
const IMAGEM_PG = process.env.BACKUP_IMAGEM_PG ?? "postgres:17-alpine";

// ---------------------------------------------------------------------------
// Credenciais — lidas de arquivo ignorado, nunca de argumento
// ---------------------------------------------------------------------------

/**
 * O endereço do projeto NÃO é segredo e não precisa ser digitado: sai do
 * `project-ref` que a CLI já gravou ao vincular. Cada campo a menos no
 * formulário é uma chance a menos de erro de digitação num arquivo que
 * ninguém relê.
 */
function urlDoProjeto() {
  const declarado = process.env.SUPABASE_URL_PROD?.trim();
  if (declarado) return declarado;

  const caminho = join(projectRoot, "supabase", ".temp", "project-ref");
  if (!existsSync(caminho)) return null;
  const ref = readFileSync(caminho, "utf8").trim();
  return ref ? `https://${ref}.supabase.co` : null;
}

function lerCredenciais() {
  if (!existsSync(ARQUIVO_DE_CREDENCIAIS)) {
    console.error(
      [
        "",
        "Falta o arquivo .env.backup.local (ignorado pelo Git).",
        "",
        "O jeito curto — um comando, no SEU terminal, com a digitação oculta:",
        "",
        "  npm run backup:producao:configurar",
        "",
        "Ele pede dois valores e escreve o arquivo. O endereço do projeto ele",
        "descobre sozinho.",
        "",
        "O jeito manual, se preferir: crie .env.backup.local na raiz com",
        "",
        "  SUPABASE_DB_URL_PROD=postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres",
        "  SUPABASE_SERVICE_ROLE_KEY_PROD=<a service role key>",
        "",
        "Onde encontrar: a connection string em Project Settings → Database;",
        "a service role key em Project Settings → API.",
        "",
        "NUNCA cole esses valores num chat, num commit ou numa mensagem. Este",
        "arquivo é o lugar deles — e ele é ignorado pelo Git.",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  const env = {};
  for (const linha of readFileSync(ARQUIVO_DE_CREDENCIAIS, "utf8").split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;
    const igual = limpa.indexOf("=");
    if (igual < 0) continue;
    env[limpa.slice(0, igual).trim()] = limpa.slice(igual + 1).trim();
  }

  env.SUPABASE_URL_PROD ??= urlDoProjeto();

  const faltando = ["SUPABASE_DB_URL_PROD", "SUPABASE_URL_PROD", "SUPABASE_SERVICE_ROLE_KEY_PROD"].filter(
    (chave) => !env[chave],
  );
  if (faltando.length > 0) {
    console.error(`.env.backup.local existe mas falta: ${faltando.join(", ")}`);
    process.exit(1);
  }

  return env;
}

const env = lerCredenciais();

// ---------------------------------------------------------------------------
// Guarda invertida — este script SÓ aponta para produção
// ---------------------------------------------------------------------------

function exigirAlvoRemoto(urlBruta) {
  let host;
  try {
    host = new URL(urlBruta).hostname;
  } catch {
    console.error("SUPABASE_DB_URL_PROD não é uma URL válida.");
    process.exit(1);
  }

  const ehLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "host.docker.internal" ||
    host.endsWith(".local") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.");

  if (ehLocal) {
    console.error(
      [
        "",
        `RECUSADO: o alvo (${host}) é local, e este é o backup de PRODUÇÃO.`,
        "",
        "Um backup de produção que copia a máquina de desenvolvimento produz",
        "uma pasta com tamanho e manifesto que não protege nada. Falso sucesso",
        "é pior que falha.",
        "",
        "Para a stack local existe `scripts/backup-local.mjs`.",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  return host;
}

const host = exigirAlvoRemoto(env.SUPABASE_DB_URL_PROD);

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const destino = process.argv[2] ?? join(projectRoot, ".backups", `producao-${carimbo}`);
mkdirSync(destino, { recursive: true });

console.log(`Backup de PRODUÇÃO (${host})`);
console.log(`Destino: ${destino}`);

/**
 * A URL entra no container por VARIÁVEL DE AMBIENTE, nunca por argumento:
 * argumento aparece em `docker ps`, no histórico do shell e em qualquer log
 * de processo. `-e PGCONN` sem valor repassa a do processo atual, e o
 * `sh -c` mantém a URL dentro da variável até o último instante.
 */
function dockerPg(comando, binario = "pg_dump") {
  return execFileSync(
    "docker",
    [
      "run", "--rm", "-e", "PGCONN", IMAGEM_PG,
      "sh", "-c", `${binario} "$PGCONN" ${comando}`,
    ],
    {
      encoding: "buffer",
      maxBuffer: 1024 * 1024 * 1024,
      env: { ...process.env, PGCONN: env.SUPABASE_DB_URL_PROD },
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
}

function registrar(nome, conteudo) {
  const caminho = join(destino, nome);
  writeFileSync(caminho, conteudo);
  const bytes = statSync(caminho).size;
  const tamanho = bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  console.log(`  ${nome} — ${tamanho}`);
  return bytes;
}

// 1. `curadoria` — estrutura, dados e GRANTs. Os GRANTs ficam de propósito:
//    um restore com `--no-privileges` já aprovou contagem e entregou banco
//    inacessível (Bloco I). Presença de dado não é acesso a dado.
registrar("curadoria.sql", dockerPg("--schema=curadoria --no-owner"));

// 2. `auth` — só os DADOS. A estrutura pertence à plataforma e vem pronta
//    numa instância nova.
registrar(
  "auth.sql",
  dockerPg("--data-only --table=auth.users --table=auth.identities --no-owner --no-privileges"),
);

// 3. O índice do storage, em arquivo próprio: só restaurável em instância
//    limpa, porque a plataforma protege `storage.objects` contra deleção.
registrar(
  "storage-index.sql",
  dockerPg("--data-only --table=storage.buckets --table=storage.objects --no-owner --no-privileges"),
);

// 4. Os BYTES. Em produção os arquivos vivem no storage do provedor, não num
//    volume — descem pela API, um a um, com a service role.
const bytesDir = join(destino, "storage");
mkdirSync(bytesDir, { recursive: true });

const objetos = JSON.parse(
  dockerPg(
    `-t -A -c "select coalesce(json_agg(json_build_object('bucket', bucket_id, 'nome', name)), '[]') from storage.objects;"`,
    "psql",
  ).toString().trim() || "[]",
);

let baixados = 0;
const falhas = [];
for (const objeto of objetos) {
  const url = `${env.SUPABASE_URL_PROD.replace(/\/+$/, "")}/storage/v1/object/${objeto.bucket}/${objeto.nome}`;
  try {
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY_PROD}` },
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const destinoArquivo = join(bytesDir, objeto.bucket, objeto.nome);
    mkdirSync(dirname(destinoArquivo), { recursive: true });
    writeFileSync(destinoArquivo, Buffer.from(await resposta.arrayBuffer()));
    baixados++;
  } catch (erro) {
    // O NOME do arquivo pode ser dado pessoal — registra-se a falha, não o
    // caminho completo em log de console.
    falhas.push({ bucket: objeto.bucket, erro: String(erro?.message ?? erro) });
  }
}
console.log(`  storage/ — ${baixados} de ${objetos.length} arquivo(s)`);

// O manifesto: o que este backup contém, medido na captura. É contra ele que
// o restore se verifica — sem manifesto, "restaurou" é afirmação sem prova.
const TABELAS = [
  "auth.users",
  "curadoria.profiles",
  "curadoria.cases",
  "curadoria.patient_stories",
  "curadoria.professional_profiles",
  "curadoria.crm_contacts",
  "storage.objects",
];

const contagens = {};
for (const tabela of TABELAS) {
  try {
    contagens[tabela] = Number.parseInt(
      dockerPg(`-t -A -c "select count(*) from ${tabela};"`, "psql").toString().trim(),
      10,
    );
  } catch {
    contagens[tabela] = null;
  }
}

writeFileSync(
  join(destino, "manifesto.json"),
  JSON.stringify(
    {
      origem: "producao",
      host,
      capturadoEm: new Date().toISOString(),
      contagens,
      storage: { esperados: objetos.length, baixados, falhas },
    },
    null,
    2,
  ),
  "utf8",
);

console.log("\nContagens no instante da captura:");
for (const [tabela, n] of Object.entries(contagens)) {
  console.log(`  ${tabela.padEnd(34)} ${n ?? "não medido"}`);
}

if (falhas.length > 0) {
  console.log(`\nATENÇÃO: ${falhas.length} arquivo(s) não vieram. Este backup está INCOMPLETO.`);
}

console.log(
  [
    "",
    "FORA deste backup, e cada um precisa de procedimento próprio:",
    "  · segredos e variáveis de ambiente — vivem no provedor, nunca em dump;",
    "  · a configuração do projeto Supabase — plano, PITR, rede.",
    "",
    "E o que nenhum script resolve: enquanto a organização estiver no plano",
    "free, não há backup automático nem PITR. Este arquivo é o ÚNICO ponto de",
    "recuperação, e ele só existe nas datas em que alguém rodar este comando.",
    "",
  ].join("\n"),
);
