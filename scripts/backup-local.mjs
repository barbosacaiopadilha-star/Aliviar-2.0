#!/usr/bin/env node
/**
 * BACKUP VERIFICÁVEL DA STACK LOCAL — Bloco I (REC-01).
 *
 * O achado que originou este script: a documentação se contradizia sobre a
 * existência de backup, o único ponto conhecido era um dump parcial numa
 * pasta local, `auth` e `storage` estavam fora, e o restore nunca fora
 * testado. Um backup que ninguém restaurou não é backup — é esperança.
 *
 * O que este script cobre, e é deliberadamente MAIS do que um `pg_dump` da
 * aplicação:
 *   1. `curadoria`  — o dado clínico e operacional;
 *   2. `auth`       — as contas. Sem elas, restaurar o banco devolve dados
 *                     que ninguém consegue acessar;
 *   3. `storage`    — os METADADOS dos objetos (a tabela `storage.objects`);
 *   4. os BYTES dos arquivos — o laudo que a paciente enviou. Metadado sem
 *                     byte é um índice apontando para o vazio.
 *
 * O que ele NÃO cobre, e diz isso em voz alta ao final: segredos e variáveis
 * de ambiente (vivem no provedor, nunca em dump) e a configuração do próprio
 * projeto Supabase (plano, PITR, políticas de rede).
 *
 * Contra PRODUÇÃO este script não roda: o alvo é resolvido pelo `env-guard`,
 * que recusa qualquer host que não seja o local. O que ele entrega é o
 * PROCEDIMENTO de restauração, exercitável e medido.
 *
 * CORREÇÃO DE 2026-08-25. Este cabeçalho dizia que "o backup de produção é
 * responsabilidade do provedor (PITR gerenciado)". A frase foi verificada e é
 * FALSA: a organização está no plano free do Supabase, que não oferece backup
 * automático nem PITR. Ela sobreviveu três semanas porque ninguém a conferiu —
 * e enquanto durou, dava a sensação de proteção sem a proteção, que é
 * exatamente o defeito que este script foi escrito para combater.
 *
 * O backup de produção agora tem script próprio: `scripts/backup-producao.mjs`
 * (`npm run backup:producao`). Ver `docs/OPERACAO_BACKUP_RESTORE.md` §3-bis.
 */

import { execFileSync, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { AmbienteBloqueadoError, resolverAlvoLocal } from "./env-guard.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTAINER = (process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_aliviar-conexao");

// Git Bash no Windows reescreve `/mnt` como `C:/Program Files/Git/mnt` antes
// de o argumento chegar ao container — e o `tar` falha procurando um caminho
// que não existe. Caminho de container é caminho de container.
const SEM_CONVERSAO_DE_CAMINHO = { ...process.env, MSYS_NO_PATHCONV: "1" };

try {
  resolverAlvoLocal("Backup da stack local", { cwd: projectRoot });
} catch (erro) {
  if (erro instanceof AmbienteBloqueadoError) {
    console.error(erro.message);
    process.exit(1);
  }
  throw erro;
}

const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
const destino = process.argv[2] ?? join(projectRoot, ".backups", carimbo);
mkdirSync(destino, { recursive: true });

function docker(args, opcoes = {}) {
  return execFileSync("docker", args, { encoding: "buffer", maxBuffer: 1024 * 1024 * 512, ...opcoes });
}

console.log(`Backup em ${destino}`);

// 1. `curadoria` é NOSSO schema: estrutura + dados. Ele pode ser derrubado e
//    recriado inteiro, porque as migrations do repositório o descrevem.
const dumpApp = docker([
  "exec", CONTAINER,
  "pg_dump", "-U", "postgres", "-d", "postgres",
  "--schema=curadoria", "--no-owner",
]);
const caminhoApp = join(destino, "curadoria.sql");
writeFileSync(caminhoApp, dumpApp);
console.log(`  curadoria.sql — ${(statSync(caminhoApp).size / 1024 / 1024).toFixed(1)} MB`);

// 2-3. `auth` e `storage` são schemas DA PLATAFORMA: a estrutura pertence ao
//      Supabase (e a `supabase_auth_admin`/`supabase_storage_admin`, não a
//      `postgres` — tentar derrubá-los falha com "must be owner"). O que é
//      nosso ali dentro são os DADOS: as contas e o índice dos objetos.
//      Guardar só os dados também é o que torna o backup restaurável numa
//      instância nova, cuja estrutura de plataforma já vem pronta.
const dumpAuth = docker([
  "exec", CONTAINER,
  "pg_dump", "-U", "postgres", "-d", "postgres", "--data-only",
  "--table=auth.users", "--table=auth.identities",
  "--no-owner", "--no-privileges",
]);
writeFileSync(join(destino, "auth.sql"), dumpAuth);
console.log(`  auth.sql — ${(statSync(join(destino, "auth.sql")).size / 1024).toFixed(0)} KB (contas)`);

// O ÍNDICE dos objetos vai em arquivo próprio porque só pode ser restaurado
// numa instância limpa: a plataforma protege `storage.objects` contra
// deleção direta (trigger `protect_objects_delete`) e nem o `postgres` do
// Supabase pode desarmá-la. No desastre real a instância é nova — restaurar
// por cima de uma suja não é cenário, é acidente.
const dumpStorage = docker([
  "exec", CONTAINER,
  "pg_dump", "-U", "postgres", "-d", "postgres", "--data-only",
  "--table=storage.buckets", "--table=storage.objects",
  "--no-owner", "--no-privileges",
]);
writeFileSync(join(destino, "storage-index.sql"), dumpStorage);
console.log(`  storage-index.sql — ${(statSync(join(destino, "storage-index.sql")).size / 1024).toFixed(0)} KB (índice de objetos)`);

// 4. Os BYTES dos arquivos. No Supabase local eles vivem num volume do
//    container de storage; em produção, num bucket S3 do provedor.
let arquivosOk = false;
try {
  // O caminho vem do PRÓPRIO container (`FILE_STORAGE_BACKEND_PATH`), nunca
  // de um palpite: uma versão nova do Supabase pode mudá-lo, e um backup que
  // silenciosamente não captura arquivo é pior que backup nenhum — dá a
  // sensação de proteção sem a proteção.
  const raiz = execSync(
    `docker exec supabase_storage_aliviar-conexao printenv FILE_STORAGE_BACKEND_PATH`,
    { encoding: "utf-8", env: SEM_CONVERSAO_DE_CAMINHO },
  ).trim();
  if (!raiz) throw new Error("FILE_STORAGE_BACKEND_PATH ausente no container de storage");

  const tar = execSync(
    `docker exec supabase_storage_aliviar-conexao tar -cf - -C ${raiz} .`,
    { encoding: "buffer", maxBuffer: 1024 * 1024 * 1024, env: SEM_CONVERSAO_DE_CAMINHO },
  );
  writeFileSync(join(destino, "storage.tar"), tar);
  console.log(`  storage.tar — ${(statSync(join(destino, "storage.tar")).size / 1024).toFixed(0)} KB`);
  arquivosOk = true;
} catch {
  console.log("  storage.tar — NÃO capturado (container de storage indisponível)");
}

// O manifesto: o que este backup contém, medido no momento da captura. É
// contra ele que o restore se verifica — sem manifesto, "restaurou" é uma
// afirmação sem contraprova.
function contar(tabela) {
  try {
    const saida = docker([
      "exec", CONTAINER, "psql", "-U", "postgres", "-t", "-A",
      "-c", `select count(*) from ${tabela};`,
    ]).toString().trim();
    return Number.parseInt(saida, 10);
  } catch {
    return null;
  }
}

const manifesto = {
  gerado_em: new Date().toISOString(),
  cobertura: {
    banco: ["curadoria", "auth", "storage (metadados)"],
    arquivos: arquivosOk ? "storage.tar" : "NÃO CAPTURADO",
    fora_do_backup: [
      "segredos e variáveis de ambiente (vivem no provedor)",
      "configuração do projeto Supabase (plano, PITR, rede)",
    ],
  },
  contagens: {
    "auth.users": contar("auth.users"),
    "curadoria.profiles": contar("curadoria.profiles"),
    "curadoria.cases": contar("curadoria.cases"),
    "curadoria.patient_stories": contar("curadoria.patient_stories"),
    "curadoria.patient_documents": contar("curadoria.patient_documents"),
    "curadoria.professional_profiles": contar("curadoria.professional_profiles"),
    "curadoria.curadoria_reports": contar("curadoria.curadoria_reports"),
    "curadoria.legal_acceptances": contar("curadoria.legal_acceptances"),
    "curadoria.audit_logs": contar("curadoria.audit_logs"),
    "storage.objects": contar("storage.objects"),
  },
};

writeFileSync(join(destino, "manifesto.json"), JSON.stringify(manifesto, null, 2));
console.log("  manifesto.json");
console.log("\nContagens capturadas:");
for (const [tabela, total] of Object.entries(manifesto.contagens)) {
  console.log(`  ${tabela.padEnd(38)} ${total ?? "—"}`);
}
console.log(`\nFORA deste backup (precisa de procedimento próprio):`);
for (const item of manifesto.cobertura.fora_do_backup) console.log(`  - ${item}`);
console.log(`\nBackup concluído: ${destino}`);
