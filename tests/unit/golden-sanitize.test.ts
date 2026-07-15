import { describe, expect, it } from "vitest";

import { sanitizeForLog } from "../golden/sanitize-for-log";

describe("sanitizeForLog (observabilidade segura do Golden Set)", () => {
  it("redige campos por nome, independentemente da profundidade", () => {
    const result = sanitizeForLog({
      apiKey: "sk-ant-real-value",
      nested: { token: "abc123", ok: "valor normal" },
      systemPrompt: "instruções completas do sistema",
      authorizationHeader: "Bearer xyz",
    }) as Record<string, unknown>;

    expect(result.apiKey).toBe("[redigido]");
    expect((result.nested as Record<string, unknown>).token).toBe("[redigido]");
    expect((result.nested as Record<string, unknown>).ok).toBe("valor normal");
    expect(result.systemPrompt).toBe("[redigido]");
    expect(result.authorizationHeader).toBe("[redigido]");
  });

  it("trunca strings muito longas", () => {
    const longText = "a".repeat(5000);
    const result = sanitizeForLog(longText) as string;

    expect(result.length).toBeLessThan(5000);
    expect(result.endsWith("…[truncado]")).toBe(true);
  });

  it("limita o número de itens de um array grande", () => {
    const bigArray = Array.from({ length: 200 }, (_, i) => i);
    const result = sanitizeForLog(bigArray) as unknown[];

    expect(result.length).toBeLessThanOrEqual(51);
    expect(result[result.length - 1]).toMatch(/itens omitidos/);
  });

  it("preserva valores primitivos comuns sem alteração", () => {
    expect(sanitizeForLog(42)).toBe(42);
    expect(sanitizeForLog(true)).toBe(true);
    expect(sanitizeForLog(null)).toBeNull();
    expect(sanitizeForLog(undefined)).toBeUndefined();
    expect(sanitizeForLog("texto curto")).toBe("texto curto");
  });

  it("nunca serializa função como está", () => {
    const result = sanitizeForLog({ callback: () => {} }) as Record<string, unknown>;
    expect(typeof result.callback).toBe("string");
    expect(result.callback).toMatch(/não serializável/);
  });

  it("corta recursão em profundidade excessiva sem lançar erro", () => {
    let deep: Record<string, unknown> = { value: "fundo" };
    for (let i = 0; i < 20; i += 1) {
      deep = { child: deep };
    }

    expect(() => sanitizeForLog(deep)).not.toThrow();
  });
});
