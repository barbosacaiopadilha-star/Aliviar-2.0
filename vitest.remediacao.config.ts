import path from "path";
import { defineConfig } from "vitest/config";

/**
 * SUÍTE DE GATES DE REMEDIAÇÃO (BLOCO G1 do MASTER_REMEDIATION_PLAN).
 *
 * Cada teste desta suíte certifica o comportamento CORRETO pós-remediação e,
 * por isso, DEVE FALHAR HOJE — o vermelho é a prova reproduzível do defeito
 * que os Blocos B (atomicidade), C (imutabilidade) e D (falso sucesso)
 * corrigirão. Quando um gate ficar verde, o defeito correspondente morreu.
 *
 * Espelha `vitest.integration.config.ts` no que importa (mesmo setup de env,
 * execução serial entre arquivos, stub de "server-only"), mas NÃO usa o
 * `globalSetup` de baseline/sentinela da integração: aquela dupla
 * snapshot-global + teste sentinela pertence àquela suíte. Aqui a limpeza é
 * por arquivo (`setup-limpeza-remediacao.ts`, mesmo inventário/limpar da
 * casa) e a exclusão mútua com o E2E é garantida por `trava-global.ts`, que
 * adquire a MESMA trava "integracao" de `tests/execucao-exclusiva.ts` — as
 * duas suítes compartilham o mesmo Supabase local e não podem coexistir com
 * um E2E em voo.
 *
 * Execução:
 *   node scripts/with-local-supabase.mjs npx vitest run --config vitest.remediacao.config.ts
 */
export default defineConfig({
  esbuild: {
    // O arquivo de gates de componentes é .tsx (jsdom via docblock).
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["tests/remediacao/**/*.test.ts", "tests/remediacao/**/*.test.tsx"],
    setupFiles: [
      "./tests/integration/setup-env.ts",
      "./tests/remediacao/setup-limpeza-remediacao.ts",
      // jest-dom para o arquivo de componentes; inofensivo nos demais.
      "./tests/components/setup.ts",
    ],
    globalSetup: ["./tests/remediacao/trava-global.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Mesma propriedade necessária da suíte de integração: os arquivos
    // compartilham o mesmo Supabase local; paralelismo entre arquivos
    // produziria falha não determinística alheia ao que cada gate verifica.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // "server-only" resolve para erro fora do runtime do Next.js — mesmo
      // stub das demais configs de teste deste repositório.
      "server-only": path.resolve(__dirname, "./tests/integration/stubs/server-only-stub.js"),
    },
  },
});
