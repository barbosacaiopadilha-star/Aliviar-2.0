import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * EXCLUSÃO MÚTUA ENTRE SUÍTES (Release de Reconstrução).
 *
 * A suíte de integração restaura o banco à baseline no teardown — apagando o
 * que outra execução tiver criado no meio. Rodá-la durante um E2E destrói os
 * dados do fluxo em voo; o contrário também contamina. "Lembrar de não rodar
 * as duas juntas" não é proteção: isto aqui é.
 *
 * Cada runner adquire uma trava nomeada no início e a devolve no fim. Antes
 * de adquirir, verifica a trava do outro. Trava órfã (processo morto) é
 * removida — nunca vira bloqueio eterno.
 */

const RAIZ = path.resolve(__dirname, "..");

export type NomeDaTrava = "e2e" | "integracao";

function caminho(nome: NomeDaTrava): string {
  return path.join(RAIZ, `.${nome}-run.lock`);
}

function pidVivo(pid: number): boolean {
  try {
    // signal 0: não envia nada, só pergunta se o processo existe.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

type ConteudoDaTrava = {
  pid: number;
  suite: NomeDaTrava;
  projeto: string;
  inicio: string;
  execucao: string;
};

/**
 * Lê e valida a trava. PID pode ser reutilizado pelo sistema operacional —
 * por isso a trava carrega também suíte, projeto, horário e um id de
 * execução; um PID vivo só conta se o restante do conteúdo for coerente com
 * esta base de código.
 */
function donoDaTrava(nome: NomeDaTrava): ConteudoDaTrava | null {
  if (!existsSync(caminho(nome))) return null;

  let conteudo: ConteudoDaTrava | null = null;
  try {
    conteudo = JSON.parse(readFileSync(caminho(nome), "utf-8")) as ConteudoDaTrava;
  } catch {
    conteudo = null;
  }

  const coerente =
    conteudo !== null &&
    Number.isInteger(conteudo.pid) &&
    conteudo.pid > 0 &&
    conteudo.suite === nome &&
    conteudo.projeto === RAIZ;

  if (!coerente || !pidVivo((conteudo as ConteudoDaTrava).pid)) {
    // Órfã, corrompida ou de outro projeto: remover é seguro e evita
    // bloqueio eterno.
    rmSync(caminho(nome), { force: true });
    return null;
  }
  return conteudo;
}

const RIVAL: Record<NomeDaTrava, NomeDaTrava> = { e2e: "integracao", integracao: "e2e" };

const MENSAGEM: Record<NomeDaTrava, string> = {
  e2e:
    "Há um E2E em execução (PID %PID%). A suíte de integração restaura a baseline no teardown " +
    "e apagaria os dados do fluxo em voo. Aguarde o E2E terminar.",
  integracao:
    "Há uma suíte de integração em execução (PID %PID%). O E2E criaria dados que a limpeza " +
    "dela apagaria no meio do fluxo. Aguarde a suíte terminar.",
};

/** Adquire a trava desta suíte; lança se a rival estiver ativa. */
export function adquirirTrava(minha: NomeDaTrava): void {
  const rival = RIVAL[minha];
  const dona = donoDaTrava(rival);
  if (dona !== null) {
    throw new Error(
      "EXECUÇÃO SIMULTÂNEA INCOMPATÍVEL — " +
        MENSAGEM[rival].replace("%PID%", String(dona.pid)) +
        " (desde " + dona.inicio + ", execução " + dona.execucao + ")",
    );
  }
  const conteudo: ConteudoDaTrava = {
    pid: process.pid,
    suite: minha,
    projeto: RAIZ,
    inicio: new Date().toISOString(),
    execucao: randomUUID().slice(0, 8),
  };
  writeFileSync(caminho(minha), JSON.stringify(conteudo));
}

export function devolverTrava(minha: NomeDaTrava): void {
  rmSync(caminho(minha), { force: true });
}
