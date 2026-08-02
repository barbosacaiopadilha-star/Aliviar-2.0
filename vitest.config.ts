import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mesmo stub das configs de integração/componentes: "server-only"
      // resolve para erro fora do runtime do Next.js.
      "server-only": path.resolve(__dirname, "./tests/integration/stubs/server-only-stub.js"),
    },
  },
});
