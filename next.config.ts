import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { NextConfig } from "next";

// -----------------------------------------------------------------------------
// AMBIENTE DETERMINÍSTICO (Release de Reconstrução, ETAPA 1)
//
// Este bloco roda em `next build`, `next start` e `next dev` — é a única
// autoridade sobre "para qual backend este processo aponta". A regra que o
// motivou: um `next build` feito sem o wrapper local embutiu a URL do projeto
// remoto no bundle e o login local passou a falhar com "Credenciais
// inválidas", sem nenhum aviso. Nunca mais silenciosamente.
// -----------------------------------------------------------------------------

function resolverAmbienteDoBackend(): { ambiente: "local" | "remoto"; host: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ausente. Nenhum build ou execução acontece sem backend declarado.\n" +
        "- Local: use `npm run build:local` / `npm run dev:local` (o wrapper injeta a stack local).\n" +
        "- Remoto: defina as variáveis do projeto hospedado (Vercel já as define).",
    );
  }

  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL inválida: "${url}" não é uma URL.`);
  }

  const ehLocal = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host);
  const declarado = process.env.ALIVIAR_AMBIENTE; // "local" é gravado pelo wrapper

  if (declarado === "local" && !ehLocal) {
    throw new Error(
      `Contradição de ambiente: ALIVIAR_AMBIENTE=local, mas o backend é remoto (${host}). ` +
        "O wrapper não conseguiu injetar a stack local — verifique `npx supabase status`.",
    );
  }

  // Anti-acidente: numa máquina de desenvolvimento (fora de CI/Vercel), builds
  // e execuções contra o backend remoto exigem intenção explícita.
  const emCI = Boolean(process.env.VERCEL || process.env.CI);
  if (!ehLocal && !emCI && declarado !== "remoto") {
    throw new Error(
      `Backend remoto (${host}) numa máquina local sem intenção declarada.\n` +
        "- Para trabalhar local: `npm run dev:local`, `npm run build:local`, `npm run test:e2e`.\n" +
        "- Para apontar ao remoto de propósito: rode com ALIVIAR_AMBIENTE=remoto.",
    );
  }

  return { ambiente: ehLocal ? "local" : "remoto", host };
}

function commitDoBuild(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "desconhecido";
  }
}

const backend = resolverAmbienteDoBackend();

/**
 * Identidade única desta construção. Vira o `BUILD_ID` em disco E vai embutido
 * no bundle — se os dois divergirem em `/api/build-info`, o processo em
 * execução está servindo um build que foi substituído embaixo dele.
 *
 * NÃO pode derivar de `Date.now()`: o `next build` avalia este arquivo mais de
 * uma vez (processo principal e worker de compilação), e cada avaliação
 * produziria um id diferente **na mesma construção** — o contrato acusaria
 * contaminação onde não há. O valor vem do ambiente quando o runner o define,
 * e só então cai para um relógio, gravado num arquivo para as avaliações
 * seguintes reaproveitarem.
 */
function identidadeDaConstrucao(): string {
  if (process.env.ALIVIAR_BUILD_ID) return process.env.ALIVIAR_BUILD_ID;

  // Escrito por `scripts/new-build-id.mjs` no início do build. Todas as
  // avaliações deste arquivo — principal e worker — leem o mesmo valor.
  try {
    return readFileSync(path.join(process.cwd(), ".build-id"), "utf-8").trim();
  } catch {
    return `${commitDoBuild().slice(0, 7)}-sem-marcador`;
  }
}

const buildId = identidadeDaConstrucao();

// GO LIVE — endurecimento mínimo indispensável antes de produção real:
// nenhum cabeçalho de segurança HTTP existia até aqui. CSP fica de fora de
// propósito (exigiria allowlist cuidadosa de Supabase/Vercel Analytics e
// teste ponta a ponta antes de arriscar quebrar a aplicação em produção —
// registrado como backlog, não bloqueia o lançamento).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // V-1 (D-12.3) · O FRAMEWORK DEIXA DE CORTAR ANTES DA REGRA.
  //
  // A ADR-054 fixa 20 MB por arquivo. O framework cortava antes disso em DOIS
  // pontos independentes, e corrigir só um não resolvia nada:
  //
  // 1 · `serverActions.bodySizeLimit` — default **1 MB**. Era o que o
  //     Verificador apontou: qualquer exame escaneado morria aqui, com erro
  //     genérico, antes de a nossa validação rodar.
  //
  // 2 · `middlewareClientMaxBodySize` — default **10 MB**, e só vale porque
  //     este projeto TEM middleware. Descoberto depois de corrigir o (1): um
  //     arquivo de 19,5 MB continuava falhando, e o log do servidor dizia o
  //     motivo — "Request body exceeded 10MB ... Only the first 10MB will be
  //     available". O corpo chegava TRUNCADO à action, que então estourava com
  //     "Unexpected end of form". Nada nisso se parece com um limite de
  //     tamanho do ponto de vista de quem lê o erro.
  //
  // Os dois tetos ficam ACIMA dos 20 MB de propósito: o corpo carrega o arquivo
  // MAIS o overhead do multipart, e quem deve recusar "20 MB + 1 byte" é a
  // nossa regra — com a frase que diz o motivo —, não um corte mudo. A folga
  // não amplia o que se aceita: `validarArquivoDeDocumento` e o próprio bucket
  // continuam sendo o teto real, e a prova material (e2e) fixa as duas pontas.
  // ---------------------------------------------------------------------------
  experimental: {
    serverActions: {
      bodySizeLimit: "22mb",
    },
    middlewareClientMaxBodySize: "22mb",
  },
  // Identidade do build, disponível em runtime e no cliente (/api/build-info).
  generateBuildId: () => buildId,
  env: {
    NEXT_PUBLIC_ALIVIAR_AMBIENTE: backend.ambiente,
    NEXT_PUBLIC_BACKEND_HOST: backend.host,
    NEXT_PUBLIC_BUILD_COMMIT: commitDoBuild(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  async rewrites() {
    return [
      { source: "/coa/curadoria", destination: "/portal-curador" },
      { source: "/coa/curadoria/:path*", destination: "/portal-curador/:path*" },
    ];
  },
  async redirects() {
    return [
      { source: "/portal-curador", destination: "/coa/curadoria", permanent: false },
      { source: "/portal-curador/:path*", destination: "/coa/curadoria/:path*", permanent: false },
      { source: "/curador", destination: "/coa/curadoria", permanent: false },
      { source: "/curador/:path*", destination: "/coa/curadoria/:path*", permanent: false },
      // ADR-075 executada: o dashboard do CRM, o Funil, Tarefas e Agenda
      // saíram — ferramentas de volume com volume zero. Endereço salvo não
      // vira 404: cai no registro (Contatos), que é o que restou e basta.
      { source: "/admin/crm", destination: "/admin/crm/contatos", permanent: false },
      { source: "/admin/crm/funil", destination: "/admin/crm/contatos", permanent: false },
      { source: "/admin/crm/tarefas", destination: "/admin/crm/contatos", permanent: false },
      { source: "/admin/crm/agenda", destination: "/admin/crm/contatos", permanent: false },
      // Painéis da camada 2.0 congelada, órfãos de link (zero entradas no
      // produto): a mecânica e os testes dela ficam; as telas voltam — se
      // voltarem — na forma que o descongelamento pedir.
      { source: "/portal-curador/discordancia", destination: "/coa/curadoria", permanent: false },
      { source: "/admin/fronteira-do-mapa", destination: "/admin", permanent: false },
      // `/admin/ace` era o painel de um motor que não executa mais. O item 1.7
      // (DP-2) removeu a tela; os links saíram do menu e da paleta depois. Quem
      // ainda tiver o endereço salvo cairia num 404 — vai para a visão geral,
      // que é onde a observabilidade que sobrou de fato está.
      { source: "/admin/ace", destination: "/admin", permanent: false },
      { source: "/admin/ace/:path*", destination: "/admin", permanent: false },
      // DECISÃO A (ONE ALIVIAR, 2026-07-25): existe UMA home do paciente —
      // /paciente. /portal-paciente vira compatibilidade permanente.
      { source: "/portal-paciente", destination: "/paciente", permanent: true },
      { source: "/portal-paciente/:path*", destination: "/paciente", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
