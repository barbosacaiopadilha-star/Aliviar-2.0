import { readFileSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

/**
 * O BUILD_ID do Next — muda a cada construção.
 *
 * É o que distingue "o servidor está de pé" de "o servidor está servindo ESTE
 * build". Um `next start` sobrevivente a um rebuild responde 200 em tudo e
 * ainda assim serve chunks que não existem mais; só o BUILD_ID denuncia isso.
 * Lido do disco em runtime, e não embutido, justamente para revelar quando o
 * processo e o diretório de build discordam.
 */
function buildIdDoDisco(): string {
  try {
    return readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf-8").trim();
  } catch {
    return "indisponivel";
  }
}

// Identidade do processo em execução (ETAPA 1 — ambiente determinístico).
// Só fatos não sensíveis: nenhum segredo, nenhuma chave — o host do backend
// é informação de diagnóstico, não credencial.
export function GET() {
  return NextResponse.json({
    ambiente: process.env.NEXT_PUBLIC_ALIVIAR_AMBIENTE ?? "desconhecido",
    backendHost: process.env.NEXT_PUBLIC_BACKEND_HOST ?? "desconhecido",
    commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "desconhecido",
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "desconhecido",
    // Embutido no bundle no momento do build.
    buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "desconhecido",
    // Lido do disco agora. Divergência entre os dois = servidor servindo um
    // build que foi substituído embaixo dele.
    buildIdEmDisco: buildIdDoDisco(),
  });
}
