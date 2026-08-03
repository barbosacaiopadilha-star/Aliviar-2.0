#!/usr/bin/env node
/**
 * RESTORE VERIFICADO DA STACK LOCAL — Bloco I (REC-01).
 *
 * O achado: o restore NUNCA fora testado. Este script existe para que a
 * frase "temos backup" possa ser substituída por "restauramos, e medimos".
 *
 * Ele faz três coisas que um `psql < dump.sql` não faz:
 *
 *   1. RESTAURA o banco (curadoria + auth + storage) e os BYTES dos
 *      arquivos — restaurar metadado sem arquivo devolveria um índice
 *      apontando para o vazio;
 *   2. VERIFICA contra o `manifesto.json` capturado no backup: cada tabela
 *      precisa voltar com a contagem que tinha. Restauração sem contraprova
 *      é a mesma classe de mentira do falso sucesso;
 *   3. MEDE o tempo — é o RTO observado, não estimado.
 *
 * Uso:
 *   node scripts/restore-local.mjs <pasta-do-backup>
 *
 * NUNCA roda contra produção: o alvo passa pelo `env-guard`. O restore de
 * produção é feito pelo painel do provedor (PITR); o que se exercita aqui é
 * o PROCEDIMENTO e a verificação que ele exige.
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { AmbienteBloqueadoError, resolverAlvoLocal } from "./env-guard.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTAINER = "supabase_db_aliviar-conexao";

// Git Bash no Windows reescreve `/mnt` como `C:/Program Files/Git/mnt` antes
// de o argumento chegar ao container — e o `tar` falha procurando um caminho
// que não existe. Caminho de container é caminho de container.
const SEM_CONVERSAO_DE_CAMINHO = { ...process.env, MSYS_NO_PATHCONV: "1" };

try {
  resolverAlvoLocal("Restore da stack local", { cwd: projectRoot });
} catch (erro) {
  if (erro instanceof AmbienteBloqueadoError) {
    console.error(erro.message);
    process.exit(1);
  }
  throw erro;
}

const origem = process.argv[2];
if (!origem) {
  console.error("Uso: node scripts/restore-local.mjs <pasta-do-backup>");
  process.exit(1);
}

const caminhoApp = join(origem, "curadoria.sql");
const caminhoAuth = join(origem, "auth.sql");
const caminhoStorageIndex = join(origem, "storage-index.sql");
const caminhoManifesto = join(origem, "manifesto.json");
const caminhoTar = join(origem, "storage.tar");

if (!existsSync(caminhoApp) || !existsSync(caminhoManifesto)) {
  console.error(`Backup incompleto em ${origem}: faltam curadoria.sql e/ou manifesto.json`);
  process.exit(1);
}

const manifesto = JSON.parse(readFileSync(caminhoManifesto, "utf-8"));
console.log(`Restaurando backup de ${manifesto.gerado_em}`);

const inicio = Date.now();

function psql(sql) {
  return execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-t", "-A", "-c", sql],
    { encoding: "utf-8", env: SEM_CONVERSAO_DE_CAMINHO },
  ).trim();
}

// 1. Terreno limpo — SÓ o nosso schema. `auth` e `storage` pertencem à
//    plataforma (`supabase_auth_admin`/`supabase_storage_admin`): derrubá-los
//    falha com "must be owner", e recriá-los à mão divergiria do que o
//    provedor espera. Deles, restauram-se os DADOS.
console.log("  derrubando o schema da aplicação...");
psql("drop schema if exists curadoria cascade;");

// 3a. As CONTAS. Sem elas, o banco restaurado devolve dados que ninguém
//     consegue acessar. Limpar antes torna o restore idempotente.
if (existsSync(caminhoAuth)) {
  console.log("  restaurando contas...");
  psql("delete from auth.identities;"); // referencia users: sai primeiro
  psql("delete from auth.users;");
  execSync(`docker exec -i ${CONTAINER} psql -U postgres -d postgres -q < "${caminhoAuth}"`, {
    stdio: ["pipe", "ignore", "pipe"],
    shell: true,
    maxBuffer: 1024 * 1024 * 512,
  });
}

// 2. A aplicação de volta: estrutura + dados, numa peça só.
console.log("  restaurando curadoria...");
execSync(`docker exec -i ${CONTAINER} psql -U postgres -d postgres -q < "${caminhoApp}"`, {
  stdio: ["pipe", "ignore", "pipe"],
  shell: true,
  maxBuffer: 1024 * 1024 * 512,
});

// 3b. O ÍNDICE dos objetos, e só quando a instância está limpa.
//
//     A plataforma protege `storage.objects` contra deleção direta (trigger
//     `protect_objects_delete`, para não deixar bytes órfãos), e nem o
//     `postgres` do Supabase consegue desarmá-la ou assumir o papel dono.
//     Isso é desenho do provedor, não obstáculo a contornar.
//
//     No desastre REAL a instância é nova e a tabela está vazia — que é
//     exatamente quando este passo funciona. Sobre instância suja, o script
//     DIZ que não restaurou, em vez de fingir que restaurou.
if (existsSync(caminhoStorageIndex)) {
  const objetos = Number.parseInt(psql("select count(*) from storage.objects;"), 10);
  if (objetos === 0) {
    console.log("  restaurando índice de objetos...");
    execSync(
      `docker exec -i ${CONTAINER} psql -U postgres -d postgres -q < "${caminhoStorageIndex}"`,
      { stdio: ["pipe", "ignore", "pipe"], shell: true, maxBuffer: 1024 * 1024 * 512 },
    );
  } else {
    console.log(
      `  índice de objetos: NÃO restaurado — a instância já tem ${objetos} objetos.\n` +
        "    A plataforma impede sobrescrever o índice; restaure numa instância limpa.",
    );
  }
}

// 3. Os arquivos de volta.
if (existsSync(caminhoTar)) {
  console.log("  restaurando arquivos...");
  const raiz = execSync(
    `docker exec supabase_storage_aliviar-conexao printenv FILE_STORAGE_BACKEND_PATH`,
    { encoding: "utf-8", env: SEM_CONVERSAO_DE_CAMINHO },
  ).trim();
  execSync(
    `docker exec -i supabase_storage_aliviar-conexao tar -xf - -C ${raiz} < "${caminhoTar}"`,
    { stdio: ["pipe", "ignore", "pipe"], shell: true, maxBuffer: 1024 * 1024 * 1024, env: SEM_CONVERSAO_DE_CAMINHO },
  );
} else {
  console.log("  arquivos: storage.tar ausente no backup — NADA restaurado");
}

const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

// 4. A contraprova. Sem ela, "restaurou" é afirmação sem evidência.
console.log(`\nVerificando contra o manifesto (RTO observado: ${segundos}s)\n`);

let divergencias = 0;
for (const [tabela, esperado] of Object.entries(manifesto.contagens)) {
  if (esperado === null) continue;
  let atual = null;
  try {
    atual = Number.parseInt(psql(`select count(*) from ${tabela};`), 10);
  } catch {
    atual = null;
  }
  const ok = atual === esperado;
  if (!ok) divergencias += 1;
  console.log(
    `  ${ok ? "ok  " : "FALHA"} ${tabela.padEnd(38)} esperado ${esperado}, encontrado ${atual ?? "—"}`,
  );
}

if (divergencias > 0) {
  console.error(`\nRESTORE REPROVADO: ${divergencias} tabela(s) divergem do manifesto.`);
  process.exit(1);
}

// 5. A verificação que contagem NENHUMA pega — e que este script só aprendeu
//    depois de aprovar um restore que entregou um banco inacessível.
//
//    `pg_dump --no-privileges` descarta os GRANTs: as linhas voltam todas,
//    o manifesto confere, e a aplicação morre com "permission denied for
//    schema curadoria". Presença de dado não é acesso a dado. Restaurar sem
//    conferir ACESSO é a mesma mentira do falso sucesso, com outra roupa.
console.log("\nVerificando ACESSO (o que a contagem não vê):");

// Cada papel é sondado contra o que ELE deve poder ler — não contra uma
// tabela qualquer. `anon` nunca teve acesso a `roles` (e não deve ter): usar
// uma sonda errada transformaria a verificação em alarme falso, e alarme
// falso treina gente a ignorar alarme.
const SONDAS = [
  { papel: "anon", tabela: "curadoria.legal_documents", porque: "portal legal público" },
  { papel: "authenticated", tabela: "curadoria.roles", porque: "catálogo de papéis" },
  { papel: "service_role", tabela: "curadoria.cases", porque: "operação de servidor" },
];

let semAcesso = 0;
for (const { papel, tabela, porque } of SONDAS) {
  try {
    psql(`set role ${papel}; select 1 from ${tabela} limit 1;`);
    console.log(`  ok    ${papel.padEnd(14)} lê ${tabela} (${porque})`);
  } catch {
    console.log(`  FALHA ${papel.padEnd(14)} NÃO lê ${tabela} (${porque})`);
    semAcesso += 1;
  }
}

if (semAcesso > 0) {
  console.error(
    `\nRESTORE REPROVADO: ${semAcesso} papel(is) sem acesso. Os dados voltaram,\n` +
      "a aplicação continuaria fora do ar. Confira se o dump preservou os GRANTs.",
  );
  process.exit(1);
}

console.log(`\nRESTORE APROVADO — todas as contagens conferem. RTO observado: ${segundos}s`);
console.log(
  "\nAtenção: segredos e configuração do projeto NÃO vêm no backup — conferir\n" +
    "variáveis de ambiente e PITR do provedor antes de considerar o ambiente pronto.",
);
