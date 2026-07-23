import { describe, expect, it } from "vitest";

import { validateProductionConfig } from "./production-config";

describe("production-config", () => {
  it("reporta variáveis obrigatórias ausentes", () => {
    const report = validateProductionConfig();
    expect(report.checks.some((c) => c.key === "NEXT_PUBLIC_SUPABASE_URL")).toBe(true);
    expect(Array.isArray(report.missingRequired)).toBe(true);
  });
});
