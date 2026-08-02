#!/usr/bin/env node
/**
 * Derruba o servidor de E2E deixado para trás — e só ele.
 *
 * Por que existe: `playwright.config.ts` usa `reuseExistingServer` fora de CI,
 * e `build:local` apaga `.next` inteiro antes de reconstruir. A combinação
 * produz um servidor vivo servindo um build que não existe mais — os chunks
 * respondem 404, a página re-renderiza sem parar, e o Playwright fica
 * eternamente com "element was detached from the DOM, retrying". Foi
 * exatamente isso que consumiu 10 minutos de uma execução.
 *
 * Por que NÃO é um `kill` por porta: a porta 3001 não pertence a este
 * projeto. Encerrar cegamente quem estiver nela pode derrubar o trabalho de
 * outra pessoa na mesma máquina. A ordem abaixo estabelece identidade antes
 * de qualquer encerramento — e, na dúvida, PARA em vez de matar.
 *
 *   1. PID registrado pelo próprio runner (.e2e-server.pid) — o caso normal.
 *   2. Sem PID registrado: inspeciona a porta.
 *   3. Confirma que é servidor DESTE projeto — por /api/build-info e pela
 *      linha de comando do processo.
 *   4. Só então encerra.
 *   5. Processo desconhecido na porta: falha com mensagem clara.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORTA = Number(process.env.E2E_PORT ?? 3001);
const ARQUIVO_PID = resolve(projectRoot, ".e2e-server.pid");

function pidsNaPorta(porta) {
  let saida = "";
  try {
    saida = execFileSync("netstat", ["-ano"], { encoding: "utf-8" });
  } catch {
    return [];
  }

  const pids = new Set();
  for (const linha of saida.split(/\r?\n/)) {
    if (!linha.includes("LISTENING")) continue;
    const colunas = linha.trim().split(/\s+/);
    if (!(colunas[1] ?? "").endsWith(`:${porta}`)) continue;
    const pid = Number(colunas[colunas.length - 1]);
    if (Number.isInteger(pid) && pid > 0) pids.add(pid);
  }
  return [...pids];
}

function linhaDeComando(pid) {
  try {
    const saida = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`,
      ],
      { encoding: "utf-8" },
    );
    return saida.trim();
  } catch {
    return "";
  }
}

/** É um `next start` deste repositório? */
function pareceServidorDoProjeto(pid) {
  const cmd = linhaDeComando(pid);
  if (!cmd) return false;
  const ehNext = /next[\\/](dist[\\/])?bin[\\/]next|next["']?\s+start|npx-cli\.js"?\s+next\s+start/i.test(cmd);
  const desteRepo = cmd.includes(projectRoot) || cmd.includes("aliviar-conexao");
  return ehNext && desteRepo;
}

/** O servidor se identifica como sendo deste produto? */
async function respondeComoNosso() {
  try {
    const resposta = await fetch(`http://127.0.0.1:${PORTA}/api/build-info`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!resposta.ok) return false;
    const info = await resposta.json();
    return typeof info?.backendHost === "string" && typeof info?.commit === "string";
  } catch {
    return false;
  }
}

function encerrar(pid, motivo) {
  try {
    execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    console.log(`Servidor de E2E encerrado (PID ${pid}) — ${motivo}.`);
  } catch {
    console.log(`PID ${pid} já não estava ativo.`);
  }
}

// ---------------------------------------------------------------------------
// 1. PID registrado pelo próprio runner
// ---------------------------------------------------------------------------
if (existsSync(ARQUIVO_PID)) {
  const registrado = Number(readFileSync(ARQUIVO_PID, "utf-8").trim());
  if (Number.isInteger(registrado) && registrado > 0) {
    encerrar(registrado, "PID registrado pelo runner");
  }
  rmSync(ARQUIVO_PID, { force: true });
}

// ---------------------------------------------------------------------------
// 2–5. O que sobrou na porta
// ---------------------------------------------------------------------------
const pids = pidsNaPorta(PORTA);

if (pids.length === 0) {
  console.log(`Porta ${PORTA} livre.`);
  process.exit(0);
}

const nosso = await respondeComoNosso();
const desconhecidos = [];

for (const pid of pids) {
  if (pareceServidorDoProjeto(pid)) {
    encerrar(pid, "servidor deste projeto identificado pela linha de comando");
  } else if (nosso) {
    encerrar(pid, "porta responde /api/build-info deste produto");
  } else {
    desconhecidos.push(pid);
  }
}

if (desconhecidos.length > 0) {
  console.error(
    `\nPorta ${PORTA} ocupada por processo(s) que NÃO são o servidor deste projeto: ` +
      `${desconhecidos.join(", ")}.\n` +
      "Nada foi encerrado — matar um processo alheio é pior que falhar aqui.\n" +
      `Libere a porta manualmente, ou aponte o E2E para outra com E2E_PORT.`,
  );
  process.exit(1);
}
