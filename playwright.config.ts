import { defineConfig, devices } from "@playwright/test";

// server-only stub — ver tests/e2e/stubs/server-only-register.cjs para o
// raciocínio completo (mesmo padrão já usado por
// vitest.integration.config.ts: alias de "server-only" para um módulo
// vazio, idêntico ao próprio node_modules/server-only/empty.js).
//
// require() direto, não NODE_OPTIONS: uma tentativa anterior mutando
// process.env.NODE_OPTIONS em tempo de execução não funcionou — o Node só
// lê NODE_OPTIONS/--require na inicialização do processo, então mutar a
// variável depois que o processo já iniciou não tem efeito nenhum sobre
// ele mesmo. Um require() síncrono aqui, no topo do arquivo de config,
// aplica o patch imediatamente no processo atual — e como o Playwright
// recarrega este mesmo playwright.config.ts em cada worker que spawna,
// o patch se reaplica automaticamente em todos eles, sem depender de
// herança de variável de ambiente entre processos.
//
// Nunca afeta o servidor real: `next start` (webServer abaixo) é um
// processo de shell totalmente separado (`npx next start`), que nunca
// carrega playwright.config.ts — a fronteira server-only/Client Component
// já foi validada de verdade em tempo de build (`npm run build`, webpack,
// condição "react-server" real); `next start` só serve esse output já
// construído.
require("./tests/e2e/stubs/server-only-register.cjs");

// ALVO DO E2E — uma fonte só, verificada antes de qualquer coisa acontecer.
//
// O `.env.local` deste repositório aponta para PRODUÇÃO. O runner e as
// fixtures recebem as variáveis locais por injeção no comando, mas o
// `webServer` é um processo de shell separado (`npx next start`) que carrega
// `.env.local` por conta própria — e passava a autenticar contra o banco
// remoto, onde o paciente criado pela fixture não existe.
//
// Duas consequências tratadas aqui:
//  1. `env` abaixo repassa o alvo local ao servidor;
//  2. a guarda impede que uma execução sem injeção toque produção em silêncio.
//
// ATENÇÃO — variáveis `NEXT_PUBLIC_*` são embutidas no bundle em tempo de
// BUILD. Passá-las ao `next start` alinha o código de servidor, mas o cliente
// que roda no browser carrega o que estava presente durante `npm run build`.
// Por isso o build do E2E precisa ser feito com as MESMAS variáveis locais.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const LOCAL_HOSTS = ["127.0.0.1", "localhost", "[::1]"];

function assertLocalSupabase(): void {
  if (!SUPABASE_URL) {
    throw new Error(
      "E2E bloqueado: NEXT_PUBLIC_SUPABASE_URL ausente. Injete as variáveis do Supabase local antes de rodar o Playwright.",
    );
  }
  const { hostname } = new URL(SUPABASE_URL);
  if (!LOCAL_HOSTS.includes(hostname)) {
    throw new Error(
      `E2E bloqueado: Supabase remoto detectado (${hostname}). O E2E cria e apaga contas — nunca deve apontar para um ambiente que não seja local.`,
    );
  }
}

assertLocalSupabase();

export default defineConfig({
  testDir: "./tests/e2e",
  // Exclusão mútua com a suíte de integração (cuja limpeza restaura a
  // baseline e apagaria um fluxo E2E em voo). A trava é adquirida aqui e
  // devolvida no teardown — inclusive quando a execução quebra no meio.
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    // G1/ETAPA-6: evidência preservada em falha (antes: trace só on-first-retry
    // com retries:0 = nunca; screenshot/video off — o buraco dos 10 minutos).
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // G1/ETAPA-6: uma ação travada não pode mais consumir os 600s do teste
    // inteiro (era o modo de falha das certificações: 10min por rótulo errado).
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      // G1/ETAPA-6: o porteiro de ambiente (buildId do bundle × disco ×
      // servidor) existia e NUNCA executava — `.setup.ts` não casa o
      // testMatch default e nenhum project o declarava (achado TST-03).
      // Agora é dependência real: nenhum spec roda sem ele passar.
      name: "porteiro-ambiente",
      testMatch: /ambiente-integro\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["porteiro-ambiente"],
    },
  ],
  webServer: {
    command: "npx next start -p 3001",
    url: "http://127.0.0.1:3001",
    // G1/ETAPA-6: reaproveitar um servidor já de pé podia herdar um processo
    // apontado para produção ou um build obsoleto (achados P1-05/TST-03).
    // O custo é subir servidor a cada execução; a cadeia test:e2e builda antes.
    reuseExistingServer: false,
    timeout: 120_000,
    // ETAPA 2 (erros rastreáveis): o log estruturado do servidor — onde vivem
    // as referências ERR-XXXX — precisa aparecer na saída do runner, senão a
    // causa real de uma falha de E2E continua invisível.
    stdout: "pipe",
    stderr: "pipe",
    // Herda o ambiente e sobrescreve explicitamente o alvo do Supabase, para
    // que o servidor nunca caia no `.env.local` de produção.
    env: {
      ...(process.env as Record<string, string>),
      NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_URL: process.env.SUPABASE_URL ?? SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
  },
});
