import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { devolverTrava } from "../execucao-exclusiva";

/**
 * GATE DE ERROS ESTRUTURADOS DO SERVIDOR — Release Gate 4, Parte 3.
 *
 * O servidor do E2E grava cada erro estruturado (`registrarErro`) como JSON
 * com `nivel:"error"` no stdout, e o wrapper `scripts/e2e-server-com-log.mjs`
 * espelha esse fluxo em `.e2e-server.log`. Aqui, ao final da execução, o
 * arquivo inteiro é lido: qualquer erro fora da allowlist DERRUBA a execução,
 * nomeando escopo, referência e causa — um painel que degrada em silêncio
 * nunca mais atravessa a suíte verde.
 *
 * Granularidade: por EXECUÇÃO integral, deliberadamente. Associar erro a spec
 * exigiria sincronizar o relógio do runner com o do servidor e repartir o log
 * por janelas — frágil demais para valer neste release. Cada linha carrega
 * `quando`; a correlação manual é imediata. Granularidade por spec: 1.1.
 *
 * COMO ADICIONAR UMA EXCEÇÃO LEGÍTIMA (sem enfraquecer o gate):
 *  - só entra aqui erro que um teste NEGATIVO provoca DE PROPÓSITO;
 *  - a entrada exige `escopo` exato E regex da `mensagem` — nunca só o
 *    escopo, senão a exceção engole os erros reais do mesmo módulo;
 *  - toda entrada nomeia o spec que a provoca, para morrer junto com ele.
 * `console.error` genérico não é filtrado nem contado: o gate só olha para o
 * JSON estruturado da aplicação — 404 de terceiros (ex.: _vercel/insights)
 * nem chega aqui, porque não é linha `nivel:"error"` do servidor.
 */
const ALLOWLIST: readonly { escopo: string; mensagem: RegExp; provocadoPor: string }[] = [
  {
    // reconstrucao-fluxo-completo.spec.ts (teste 11): o clique em "Gerar
    // rascunho assistido" sobre Relatório já revisado É o caminho negativo —
    // a recusa explícita ("regeneração precisa ser explícita") é o
    // comportamento certificado, e o servidor a registra como erro.
    escopo: "curadoria.generateAssistedDraft",
    mensagem: /Regenerar substituiria o texto dele/,
    provocadoPor: "tests/e2e/reconstrucao-fluxo-completo.spec.ts",
  },
];

type ErroEstruturado = {
  nivel?: string;
  referencia?: string;
  escopo?: string;
  tipo?: string;
  mensagem?: string;
  causa?: { message?: string } | null;
  quando?: string;
};

function analisarLogDoServidor(): string[] {
  const arquivo = path.resolve(__dirname, "../../.e2e-server.log");
  if (!existsSync(arquivo)) return [];

  const violacoes: string[] = [];
  for (const linha of readFileSync(arquivo, "utf-8").split(/\r?\n/)) {
    const inicio = linha.indexOf('{"nivel":"error"');
    if (inicio === -1) continue;

    let erro: ErroEstruturado;
    try {
      erro = JSON.parse(linha.slice(inicio));
    } catch {
      // Linha truncada por corrida de flush: reportada crua — o gate nunca
      // descarta em silêncio o que não conseguiu ler.
      violacoes.push(`(ilegível) ${linha.slice(inicio, inicio + 200)}`);
      continue;
    }

    const permitido = ALLOWLIST.some(
      (entrada) => entrada.escopo === erro.escopo && entrada.mensagem.test(erro.mensagem ?? ""),
    );
    if (permitido) continue;

    violacoes.push(
      `[${erro.quando ?? "?"}] escopo=${erro.escopo ?? "?"} ref=${erro.referencia ?? "?"} ` +
        `tipo=${erro.tipo ?? "?"} — ${erro.mensagem ?? "(sem mensagem)"}` +
        (erro.causa?.message ? ` | causa: ${erro.causa.message}` : ""),
    );
  }
  return violacoes;
}

export default function globalTeardown(): void {
  // A trava volta SEMPRE — inclusive quando o gate reprova a execução.
  try {
    devolverTrava("e2e");
  } finally {
    const violacoes = analisarLogDoServidor();
    if (violacoes.length > 0) {
      throw new Error(
        `GATE DE ERROS ESTRUTURADOS: o servidor emitiu ${violacoes.length} erro(s) ` +
          `fora da allowlist durante a execução E2E:\n` +
          violacoes.slice(0, 20).join("\n") +
          (violacoes.length > 20 ? `\n… e mais ${violacoes.length - 20}.` : ""),
      );
    }
  }
}
