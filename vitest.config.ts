import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "src/modules/**/tests/**/*.test.ts",
      "api/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/alicia/infrastructure/import/**/*.ts",
        "src/alicia/infrastructure/adapters/mock/**/*.ts",
        "src/alicia/infrastructure/mappers/**/*.ts",
        "src/alicia/catalog/**/*.ts",
        "src/alicia/application/verification/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "src/alicia/infrastructure/import/import-types.ts",
        "src/alicia/infrastructure/seed/**",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      api: path.resolve(__dirname, "./api"),
    },
  },
});
