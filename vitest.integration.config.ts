import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup-env.ts"],
    testTimeout: 20000,
    // Todos os arquivos desta suíte compartilham o mesmo Supabase local —
    // tabelas globais sem namespace por arquivo (ex.: professional_profiles).
    // Rodar arquivos em paralelo (padrão do Vitest) faz dois arquivos
    // contenderem pelo mesmo pool global ao mesmo tempo, produzindo falhas
    // não determinísticas alheias ao que cada teste individualmente
    // verifica. Execução serial entre arquivos é uma propriedade necessária
    // desta suíte, não uma otimização — nunca desativar sem antes dar a
    // cada recurso global um escopo próprio por arquivo/teste.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // "server-only" resolve para um erro fora do runtime do Next.js
      // (condição "react-server" do package.json não é aplicada pelo
      // Vitest) — aqui, um stub vazio, mesmo comportamento do
      // node_modules/server-only/empty.js que o próprio Next.js usa.
      // Só afeta esta config de teste, nenhum código de produção.
      "server-only": path.resolve(__dirname, "./tests/integration/stubs/server-only-stub.js"),
    },
  },
});
