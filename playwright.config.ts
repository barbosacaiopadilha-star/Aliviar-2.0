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

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx next start -p 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
