import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup-env.ts"],
    testTimeout: 20000,
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
