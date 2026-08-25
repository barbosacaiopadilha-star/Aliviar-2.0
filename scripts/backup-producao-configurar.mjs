#!/usr/bin/env node
/**
 * CONFIGURA O BACKUP DE PRODUÇÃO — dois valores, digitados uma vez.
 *
 * Por que este script existe: a única coisa que separa a produção de ter um
 * ponto de recuperação são duas credenciais que precisam sair do painel do
 * Supabase e chegar a esta máquina. Elas não podem passar por um chat, por um
 * commit ou por uma mensagem — e pedir que alguém monte um arquivo de
 * configuração à mão, com nomes de variável exatos, é um convite a errar em
 * silêncio e descobrir só no dia do desastre.
 *
 * Aqui a digitação é OCULTA (não ecoa, não fica no histórico do shell), o
 * arquivo é escrito com as chaves certas, e o que dá para conferir sem
 * conectar é conferido na hora.
 *
 *   npm run backup:producao:configurar
 */

import { createInterface } from "node:readline";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { conferirCredenciais } from "./backup-credenciais.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(projectRoot, ".env.backup.local");

function refDoProjeto() {
  const caminho = join(projectRoot, "supabase", ".temp", "project-ref");
  return existsSync(caminho) ? readFileSync(caminho, "utf8").trim() : null;
}


/**
 * Leitura sem eco. O `readline` normal ecoaria a senha na tela, e tela é
 * onde screenshots acontecem.
 */
function perguntarOculto(pergunta) {
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const saida = process.stdout;
    let escrevendo = true;

    // Enquanto o valor é digitado, o `_writeToOutput` engole os caracteres.
    rl._writeToOutput = function (texto) {
      if (escrevendo && texto.includes(pergunta)) saida.write(texto);
      else if (!escrevendo) saida.write(texto);
    };

    saida.write(pergunta);
    escrevendo = false;

    rl.question("", (resposta) => {
      escrevendo = true;
      saida.write("\n");
      rl.close();
      resolvePromise(resposta.trim());
    });
  });
}

// Fora de terminal a digitação não tem como ser ocultada — e aceitar entrada
// por pipe convidaria `echo "$SENHA" | npm run …`, que joga o segredo no
// histórico do shell. É justamente o que este script existe para evitar.
if (!process.stdin.isTTY) {
  console.error(
    [
      "",
      "Este comando precisa de um terminal de verdade: a digitação é ocultada,",
      "e isso não funciona com entrada redirecionada.",
      "",
      "Abra um terminal e rode:  npm run backup:producao:configurar",
      "",
      "Não passe as credenciais por pipe nem por variável na mesma linha — elas",
      "ficariam no histórico do shell.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const ref = refDoProjeto();

console.log(
  [
    "",
    "CONFIGURAÇÃO DO BACKUP DE PRODUÇÃO",
    "",
    ref ? `Projeto vinculado: ${ref}` : "Projeto não vinculado — informe a URL manualmente depois.",
    "",
    "Dois valores, ambos no painel do Supabase. A digitação NÃO aparece na tela.",
    "",
  ].join("\n"),
);

if (existsSync(DESTINO)) {
  const confirma = await perguntarOculto(
    ".env.backup.local já existe. Sobrescrever? (digite: sim) ",
  );
  if (confirma.toLowerCase() !== "sim") {
    console.log("Cancelado. Nada foi alterado.");
    process.exit(0);
  }
}

console.log("1) Connection string do banco — Project Settings → Database → Connection string → URI");
console.log("   Formato: postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres\n");
const dbUrl = await perguntarOculto("   Cole aqui: ");

console.log("\n2) Service role key — Project Settings → API → service_role");
console.log("   (é a chave secreta, não a anon/publishable)\n");
const serviceKey = await perguntarOculto("   Cole aqui: ");

const problemas = conferirCredenciais({ dbUrl, serviceKey, ref });

if (problemas.length > 0) {
  console.error("\nNão escrevi o arquivo. Encontrei:");
  for (const p of problemas) console.error(`  · ${p}`);
  console.error("\nRode de novo quando tiver os valores corretos.\n");
  process.exit(1);
}

writeFileSync(
  DESTINO,
  [
    "# Credenciais do backup de produção. Ignorado pelo Git (.gitignore: .env.*).",
    "# Gerado por `npm run backup:producao:configurar`.",
    "#",
    "# Se a senha do banco for rotacionada, rode o configurador de novo.",
    `SUPABASE_DB_URL_PROD=${dbUrl}`,
    `SUPABASE_SERVICE_ROLE_KEY_PROD=${serviceKey}`,
    "",
  ].join("\n"),
  { encoding: "utf8", mode: 0o600 },
);

console.log(
  [
    "",
    "Arquivo escrito: .env.backup.local (permissão 600, fora do Git).",
    "",
    "Agora:",
    "",
    "  npm run backup:producao",
    "",
    "Ele vai dizer, ao terminar, o que capturou e o que continua fora do backup.",
    "",
  ].join("\n"),
);
