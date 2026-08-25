#!/usr/bin/env node
/**
 * CONFIGURA O BACKUP DE PRODUÇÃO — o endereço à vista, o segredo escondido.
 *
 * Por que este script existe: a única coisa que separa a produção de ter um
 * ponto de recuperação são duas credenciais que precisam sair do painel do
 * Supabase e chegar a esta máquina. Elas não podem passar por um chat, por um
 * commit ou por uma mensagem — e pedir que alguém monte um arquivo de
 * configuração à mão, com nomes de variável exatos, é um convite a errar em
 * silêncio e descobrir só no dia do desastre.
 *
 * O que é segredo — a senha do banco, a service role key — é digitado sem eco
 * e não passa pelo histórico do shell. O que NÃO é segredo — a URI que o
 * painel entrega com `[YOUR-PASSWORD]` no lugar da senha — aparece na tela de
 * propósito, para quem cola poder ver o que colou.
 *
 * Essa distinção nasceu de um travamento (25/08): com tudo oculto, uma colagem
 * errada de 32 caracteres passou por connection string e o único retorno foi
 * "não é uma URL válida". Esconder o que não é segredo não deixou nada mais
 * seguro — deixou só mais cego, e a produção passou mais um dia sem backup.
 *
 * O arquivo é escrito com as chaves certas, e o que dá para conferir sem
 * conectar é conferido na hora.
 *
 *   npm run backup:producao:configurar
 */

import { createInterface } from "node:readline";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  conferirCredenciais,
  instalarOcultacao,
  MARCADOR_DE_SENHA,
  montarConnectionString,
} from "./backup-credenciais.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(projectRoot, ".env.backup.local");

function refDoProjeto() {
  const caminho = join(projectRoot, "supabase", ".temp", "project-ref");
  return existsSync(caminho) ? readFileSync(caminho, "utf8").trim() : null;
}


/**
 * Leitura COM eco — para o que não é segredo, e por que isso importa.
 *
 * A URI que o painel oferece traz o marcador `[YOUR-PASSWORD]` no lugar da
 * senha: ela não é segredo, é endereço. Esconder a digitação dela foi o que
 * travou o Fundador em 25/08 — ele colou algo errado, não teve como ver, e o
 * programa só soube dizer "não é uma URL válida".
 *
 * O que é segredo se esconde; o que não é, se mostra. Esconder tudo não é mais
 * seguro: é só mais cego.
 */
function perguntarVisivel(pergunta) {
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question(pergunta, (resposta) => {
      rl.close();
      resolvePromise(resposta.trim());
    });
  });
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
    "Tudo vem do painel do Supabase, em três passos.",
    "",
    "O endereço aparece na tela; a senha e a chave, não. O que é segredo se",
    "esconde, o que não é se mostra — para você poder ver o que colou.",
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

// PASSO 1 — o endereço, à vista.
//
// A URI do painel vem com o marcador `[YOUR-PASSWORD]` no lugar da senha.
// Pedir que a pessoa substitua o marcador À MÃO antes de colar era o passo
// que dava errado: é edição de texto num campo escuro, sem conferência.
// Aqui ela cola a URI exatamente como o painel deu, vendo o que colou, e
// quem substitui é o programa.
console.log("1) Connection string — no painel do projeto, botão Connect → URI.");
console.log("   Cole EXATAMENTE como o painel deu, com o [YOUR-PASSWORD] no meio.");
console.log("   Este valor aparece na tela: ele é endereço, não segredo.");
console.log("");
const uriCrua = await perguntarVisivel("   >>> COLE A URI AQUI e tecle Enter: ");

let dbUrl = uriCrua;

if (uriCrua.includes(MARCADOR_DE_SENHA)) {
  // PASSO 2 — a senha, oculta, e só ela.
  //
  // Um campo curto: se a colagem falhar, a contagem de caracteres denuncia na
  // hora, porque a pessoa sabe o tamanho da própria senha. Era impossível
  // saber isso olhando "recebido: 32" para uma URI de 110.
  console.log("");
  console.log("2) Senha do banco — Project Settings → Database → Database password.");
  console.log("   Se você não a tem, dá para redefinir ali mesmo (Reset).");
  console.log("   Esta NÃO aparece na tela.");
  console.log("");
  const senha = await perguntarOculto("   >>> COLE A SENHA DO BANCO e tecle Enter: ");

  dbUrl = montarConnectionString(uriCrua, senha);
} else {
  console.log("");
  console.log("   A URI colada já vinha com senha — não vou pedir de novo.");
  console.log("   Atenção: ela apareceu na sua tela. Se alguém estava vendo,");
  console.log("   troque a senha do banco no painel depois de terminar.");
}

console.log("");
console.log("3) Service role key — Project Settings → API → service_role");
console.log("   (é a chave secreta, não a anon/publishable)");
console.log("");
console.log("   Ela serve a UMA coisa: baixar os arquivos do storage.");
console.log("   DÁ PARA PULAR — tecle Enter vazio. O backup sai com o banco inteiro,");
console.log("   sem os anexos, e o manifesto declara que é parcial. Banco sem anexo");
console.log("   protege muito; esperar pelos dois segredos costuma virar backup nenhum.");
console.log("");
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
