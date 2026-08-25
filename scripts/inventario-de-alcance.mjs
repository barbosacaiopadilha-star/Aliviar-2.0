#!/usr/bin/env node
/**
 * O QUE O BANCO TEM E A TELA NÃO ALCANÇA — inventário de leitura pura.
 *
 * Por que existe: quatro vezes em 25/08 encontrei coluna viva que nenhuma
 * tela escreve, sempre por acidente. O `professional_care_model` que o filtro
 * da Mesa lia e ninguém preenchia; a agenda do Concierge; as UFs de
 * atendimento; os carimbos que viraram a medição. Descobrir isso por acidente
 * é caro — o achado só aparece quando alguém trava.
 *
 * Este script responde de uma vez: **o que o app lê e nunca escreve, o que
 * escreve e ninguém lê, e o que existe no banco sem ser mencionado em lugar
 * nenhum.**
 *
 * ---
 *
 * A LIÇÃO QUE ESTÁ DENTRO DELE, e sem a qual ele mentiria.
 *
 * Uma varredura minha de 24/08 produziu 19 falsos positivos em 20 candidatos.
 * A causa: ela olhou só o código do app. Mas neste produto **o banco escreve
 * muito** — triggers de auditoria, funções `SECURITY DEFINER`, RPCs que fazem
 * o trabalho composto. Uma tabela sem escritor no app pode ter três no banco.
 *
 * Por isso aqui cada tabela é conferida nos DOIS lados antes de virar achado:
 * o app (TypeScript) e o banco (`pg_proc` + `pg_trigger`). O que sai daqui é
 * candidato conferido — e mesmo assim o relatório diz, em cada linha, onde
 * olhou. Varredura que não mostra onde olhou é chute com aparência de dado.
 *
 *   node scripts/with-local-supabase.mjs node scripts/inventario-de-alcance.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTAINER = process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_aliviar-conexao";

function psql(sql) {
  return execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-t", "-A", "-F", ""],
    { input: sql, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 },
  )
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(""));
}

// ---------------------------------------------------------------------------
// Lado 1 — o que o APP faz
// ---------------------------------------------------------------------------

function arquivosDoApp(dir, encontrados = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      arquivosDoApp(caminho, encontrados);
    } else if ([".ts", ".tsx"].includes(extname(nome))) {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

/**
 * `.from("tabela")` seguido, em algum ponto próximo, do verbo. A janela de
 * 400 caracteres cobre encadeamento em várias linhas sem atravessar para a
 * consulta seguinte.
 */
function usoNoApp() {
  const leituras = new Map();
  const escritas = new Map();
  const rpcs = new Map();

  const registrar = (mapa, chave, arquivo) => {
    if (!mapa.has(chave)) mapa.set(chave, new Set());
    mapa.get(chave).add(arquivo.replace(projectRoot + "\\", "").replace(projectRoot + "/", ""));
  };

  for (const arquivo of arquivosDoApp(join(projectRoot, "src"))) {
    const fonte = readFileSync(arquivo, "utf8");

    for (const m of fonte.matchAll(/\.from\(\s*["'`]([a-z_][a-z0-9_]*)["'`]\s*\)/g)) {
      const tabela = m[1];
      const janela = fonte.slice(m.index, m.index + 400);
      if (/\.select\s*\(/.test(janela)) registrar(leituras, tabela, arquivo);
      if (/\.(insert|update|upsert|delete)\s*\(/.test(janela)) registrar(escritas, tabela, arquivo);
    }

    for (const m of fonte.matchAll(/\.rpc\(\s*["'`]([a-z_][a-z0-9_]*)["'`]/g)) {
      registrar(rpcs, m[1], arquivo);
    }
  }

  return { leituras, escritas, rpcs };
}

// ---------------------------------------------------------------------------
// Lado 2 — o que o BANCO faz por conta própria
// ---------------------------------------------------------------------------

function escritoresDoBanco() {
  // Funções e triggers cujo CORPO menciona a tabela. Deliberadamente amplo:
  // aqui um falso positivo custa uma linha de relatório, e um falso NEGATIVO
  // custa um achado inventado.
  const linhas = psql(`
    select t.tablename,
           coalesce(string_agg(distinct p.proname, ', '), '')
      from pg_tables t
      left join pg_proc p
        on p.pronamespace = 'curadoria'::regnamespace
       and p.prosrc like '%' || t.tablename || '%'
     where t.schemaname = 'curadoria'
     group by t.tablename
     order by t.tablename;
  `);

  const mapa = new Map();
  for (const [tabela, funcoes] of linhas) {
    mapa.set(tabela, funcoes ? funcoes.split(", ").filter(Boolean) : []);
  }
  return mapa;
}

function tabelasComTrigger() {
  const linhas = psql(`
    select distinct c.relname
      from pg_trigger g
      join pg_class c on c.oid = g.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'curadoria' and not g.tgisinternal;
  `);
  return new Set(linhas.map(([t]) => t));
}

function contagens() {
  const tabelas = psql(
    `select tablename from pg_tables where schemaname='curadoria' order by tablename;`,
  ).map(([t]) => t);

  const mapa = new Map();
  for (const t of tabelas) {
    try {
      const [[n]] = psql(`select count(*) from curadoria."${t}";`);
      mapa.set(t, Number.parseInt(n, 10));
    } catch {
      mapa.set(t, null);
    }
  }
  return mapa;
}

// ---------------------------------------------------------------------------
// O relatório
// ---------------------------------------------------------------------------

const { leituras, escritas, rpcs } = usoNoApp();
const funcoesPorTabela = escritoresDoBanco();
const comTrigger = tabelasComTrigger();
const linhasPorTabela = contagens();
const tabelas = [...linhasPorTabela.keys()];

const naoAlcancadas = [];
const soLidas = [];
const soEscritas = [];

for (const t of tabelas) {
  const le = leituras.has(t);
  const escreve = escritas.has(t);
  const funcoes = funcoesPorTabela.get(t) ?? [];
  const trigger = comTrigger.has(t);
  const linhas = linhasPorTabela.get(t);

  if (!le && !escreve && funcoes.length === 0 && !trigger) {
    naoAlcancadas.push({ t, linhas });
  } else if (le && !escreve) {
    soLidas.push({ t, linhas, funcoes, trigger, onde: [...leituras.get(t)].slice(0, 2) });
  } else if (escreve && !le) {
    soEscritas.push({ t, linhas, onde: [...escritas.get(t)].slice(0, 2) });
  }
}

const dizer = (n) => (n === null ? "?" : String(n));

console.log(`\nINVENTÁRIO DE ALCANCE — ${tabelas.length} tabelas no schema curadoria\n`);

console.log(`1) LIDAS PELO APP, MAS NUNCA ESCRITAS POR ELE — ${soLidas.length}`);
console.log(`   O caso do "onde atende": a Mesa lia, nenhuma tela preenchia.`);
console.log(`   ATENÇÃO: função ou trigger na coluna direita = o BANCO escreve. Não é achado.\n`);
for (const { t, linhas, funcoes, trigger, onde } of soLidas) {
  const escritorDoBanco =
    funcoes.length > 0 || trigger
      ? `banco escreve (${[trigger ? "trigger" : null, ...funcoes.slice(0, 2)].filter(Boolean).join(", ")})`
      : "SEM ESCRITOR CONHECIDO";
  console.log(`   ${t.padEnd(38)} ${dizer(linhas).padStart(5)} linhas  ${escritorDoBanco}`);
  if (escritorDoBanco === "SEM ESCRITOR CONHECIDO") console.log(`      lido em: ${onde.join(", ")}`);
}

console.log(`\n2) ESCRITAS PELO APP, MAS NUNCA LIDAS POR ELE — ${soEscritas.length}`);
console.log(`   Dado que se coleta e ninguém usa: custo de operação sem retorno.\n`);
for (const { t, linhas, onde } of soEscritas) {
  console.log(`   ${t.padEnd(38)} ${dizer(linhas).padStart(5)} linhas   escrito em: ${onde.join(", ")}`);
}

console.log(`\n3) NÃO MENCIONADAS EM LUGAR NENHUM — ${naoAlcancadas.length}`);
console.log(`   Nem app, nem função, nem trigger. Candidatas a tabela morta.\n`);
for (const { t, linhas } of naoAlcancadas) {
  console.log(`   ${t.padEnd(38)} ${dizer(linhas).padStart(5)} linhas`);
}

// ---------------------------------------------------------------------------
// Lado 3 — COLUNA a coluna, que é onde o "onde atende" de fato morava
// ---------------------------------------------------------------------------
//
// A tabela `professional_care_model` era LIDA pela Mesa. O que ninguém
// escrevia eram duas colunas dentro dela: `states` e `cities`. Inventário no
// nível da tabela não pega esse caso — e é justamente o caso que travou uma
// Curadoria inteira em 25/08.

const NOMES_AMBIGUOS = new Set([
  "id", "name", "status", "value", "type", "kind", "label", "code", "note", "data",
  "created_at", "updated_at", "created_by", "updated_by", "version", "state", "source",
]);

const colunas = psql(`
  select table_name, column_name
    from information_schema.columns
   where table_schema = 'curadoria'
   order by table_name, ordinal_position;
`);

const fontes = arquivosDoApp(join(projectRoot, "src")).map((a) => readFileSync(a, "utf8")).join("\n");

const colunasOrfas = [];
for (const [tabela, coluna] of colunas) {
  // Só interessa em tabela que o app ALCANÇA: numa tabela que ele nem toca,
  // toda coluna seria órfã e o relatório viraria ruído.
  if (!leituras.has(tabela) && !escritas.has(tabela)) continue;
  if (NOMES_AMBIGUOS.has(coluna)) continue;
  if (fontes.includes(coluna)) continue;
  colunasOrfas.push({ tabela, coluna });
}

console.log(`\n4) COLUNAS QUE O APP NUNCA MENCIONA, em tabelas que ele usa — ${colunasOrfas.length}`);
console.log(`   É AQUI que o "onde atende" morava: tabela lida, coluna nunca escrita.`);
console.log(`   Nomes genéricos (id, status, name…) ficam de fora: dariam falso negativo.\n`);
for (const { tabela, coluna } of colunasOrfas) {
  console.log(`   ${tabela.padEnd(38)} ${coluna}`);
}

console.log(`\nRPCs chamadas pelo app: ${rpcs.size}`);
console.log(
  "\nEste relatório diz ONDE OLHOU em cada linha, de propósito: varredura que\n" +
    "não mostra onde olhou é chute com aparência de dado. Cada item da lista 1\n" +
    "sem escritor conhecido é CANDIDATO — confira antes de tratar como achado.\n",
);
