import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    include: ["tests/components/**/*.test.tsx"],
    setupFiles: ["./tests/components/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mesmo stub da config de integração: "server-only" resolve para erro
      // fora do runtime do Next.js (a condição "react-server" não é aplicada
      // pelo Vitest). Necessário desde que componentes client importam Server
      // Actions (ace-artifacts-list → decision-case-panel → action).
      "server-only": path.resolve(__dirname, "./tests/integration/stubs/server-only-stub.js"),
    },
  },
});
