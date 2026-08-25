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

import { conferirCredenciais, instalarOcultacao } from "./backup-credenciais.mjs";

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

    // O rótulo é escrito ANTES de ligar a ocultação — senão some da tela, que
    // foi o defeito de 25/08: sem o rótulo à vista, não dá para saber que o
    // programa está esperando um valor, e a pessoa cola outra coisa.
    saida.write(pergunta);

    const oculto = instalarOcultacao(rl, (texto) => saida.write(texto));
    oculto.ocultar();

    rl.question("", (resposta) => {
      oculto.revelar();
      const valor = resposta.trim();
      // Sem eco, a pessoa não tem NENHUM sinal de que o valor entrou. O
      // tamanho é o retorno possível sem revelar nada.
      saida.write(`(recebido: ${valor.length} caracteres)\n`);
      rl.close();
      resolvePromise(valor);
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
    "Dois valores, ambos no painel do Supabase.",
    "",
    "A digitação NAO aparece na tela — isso e proposital. Cole e tecle Enter;",
    "o programa confirma quantos caracteres recebeu.",
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
const dbUrl = await perguntarOculto("   >>> COLE A CONNECTION STRING AQUI e tecle Enter: ");

console.log("\n2) Service role key — Project Settings → API → service_role");
console.log("   (é a chave secreta, não a anon/publishable)");
console.log("");
console.log("   Ela serve a UMA coisa: baixar os arquivos do storage.");
console.log("   DÁ PARA PULAR — tecle Enter vazio. O backup sai com o banco inteiro,");
console.log("   sem os anexos, e o manifesto declara que é parcial. Banco sem anexo");
console.log("   protege muito; esperar pelos dois segredos costuma virar backup nenhum.\n");
const serviceKey = await perguntarOculto("   >>> COLE A SERVICE ROLE KEY (ou Enter para pular): ");

const problemas = conferirCredenciais({ dbUrl, serviceKey, ref, chaveOpcional: true });

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
